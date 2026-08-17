import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const ACCESS_TOKEN_COOKIE = 'wm_access_token';
const REFRESH_TOKEN_COOKIE = 'wm_refresh_token';

type JwtPayload = {
  exp?: number;
};

function decodePayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isAccessTokenValid(token?: string): boolean {
  if (!token) return false;
  const payload = decodePayload(token);
  return Boolean(payload?.exp && payload.exp * 1000 > Date.now());
}

function readSetCookies(source: Response) {
  const setCookies = source.headers.getSetCookie?.() ?? [];
  const parsedCookies: Array<{
    name: string;
    value: string;
    options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      path?: string;
      maxAge?: number;
    };
  }> = [];

  for (const cookie of setCookies) {
    const [nameValue, ...attributes] = cookie.split(';');
    const separatorIndex = nameValue.indexOf('=');
    if (separatorIndex <= 0) continue;

    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();
    const options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      path?: string;
      maxAge?: number;
    } = {};

    for (const rawAttribute of attributes) {
      const attribute = rawAttribute.trim();
      const [key, rawValue] = attribute.split('=', 2);
      const normalizedKey = key.toLowerCase();

      if (normalizedKey === 'httponly') options.httpOnly = true;
      if (normalizedKey === 'secure') options.secure = true;
      if (normalizedKey === 'path' && rawValue) options.path = rawValue;
      if (normalizedKey === 'samesite' && rawValue) {
        const sameSite = rawValue.toLowerCase();
        if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') {
          options.sameSite = sameSite;
        }
      }
      if (normalizedKey === 'max-age' && rawValue) {
        const maxAge = Number(rawValue);
        if (Number.isFinite(maxAge)) options.maxAge = maxAge;
      }
    }

    parsedCookies.push({ name, value, options });
  }

  return parsedCookies;
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (isAccessTokenValid(accessToken) || !refreshToken) {
    return NextResponse.next();
  }

  try {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!refreshResponse.ok) {
      return NextResponse.next();
    }

    const refreshedCookies = readSetCookies(refreshResponse);
    const requestHeaders = new Headers(request.headers);

    for (const cookie of refreshedCookies) {
      request.cookies.set(cookie.name, cookie.value);
    }

    requestHeaders.set('cookie', request.cookies.toString());
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    for (const cookie of refreshedCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/projects/:path*',
    '/tenant/:path*',
    '/customers/:path*',
    '/workorders/:path*',
    '/quotes/:path*',
    '/invoices/:path*',
    '/catalogitem/:path*',
    '/calendar/:path*',
  ],
};
