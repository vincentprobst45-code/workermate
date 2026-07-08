import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { Session } from './auth.types';
import { EMPTY_SESSION } from './session';

interface AccessTokenPayload {
	user?: {
		id: string;
		firstname: string;
		lastname: string;
		email: string;
	};
	activeTenant?: {
		id: string;
		name: string;
		role: 'OWNER' | 'ADMIN' | 'MEMBER';
	};
}

const ACCESS_TOKEN_COOKIE = 'wm_access_token';
const JWT_COMPAT_SECRETS = [
	process.env.JWT_SECRET,
	'your-super-secret-jwt-key-change-this-in-production',
	'your-secret-key-change-this-in-production',
].filter((value): value is string => Boolean(value));

export async function getSession(): Promise<Session> {
	const cookieStore = await cookies();
	const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

	if (!token) {
		return EMPTY_SESSION;
	}

	for (const secret of JWT_COMPAT_SECRETS) {
		try {
			const decoded = jwt.verify(token, secret) as AccessTokenPayload;
			if (!decoded.user || !decoded.activeTenant) {
				continue;
			}

			return {
				user: {
					id: decoded.user.id,
					email: decoded.user.email,
					firstname: decoded.user.firstname,
					lastname: decoded.user.lastname,
				},
				tenants: [
					{
						tenantId: decoded.activeTenant.id,
						tenantName: decoded.activeTenant.name,
						role: decoded.activeTenant.role,
					},
				],
				activeTenant: {
					tenantId: decoded.activeTenant.id,
					tenantName: decoded.activeTenant.name,
					role: decoded.activeTenant.role,
				},
			};
		} catch {
			// Try next compatible secret
		}
	}

	return EMPTY_SESSION;
}


