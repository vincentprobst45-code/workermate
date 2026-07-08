import { Body, Controller, Post, HttpException, HttpStatus, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { SessionData } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string, accessTokenMaxAge: number, refreshTokenMaxAge: number) {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: accessTokenMaxAge * 1000,
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    const secure = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
    res.clearCookie('vm_refresh_token', cookieOptions);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<SessionData> {
    try {
      const result = await this.authService.register(dto);
      this.setAuthCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken,
        result.tokens.accessTokenMaxAge,
        result.tokens.refreshTokenMaxAge,
      );
      return result.session;
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      else if (typeof err === 'string') message = err;
      throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<SessionData> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user)
      throw new HttpException({ message: 'Invalid credentials' }, HttpStatus.UNAUTHORIZED);

    const result = await this.authService.login(user);
    this.setAuthCookies(
      res,
      result.tokens.accessToken,
      result.tokens.refreshToken,
      result.tokens.accessTokenMaxAge,
      result.tokens.refreshTokenMaxAge,
    );

    return result.session;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionData> {
    try {
      const refreshTokenFromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
      const refreshToken = refreshTokenFromCookie ?? body.refreshToken;

      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
      this.setAuthCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken,
        result.tokens.accessTokenMaxAge,
        result.tokens.refreshTokenMaxAge,
      );

      return result.session;
    } catch (err: unknown) {
      let message = 'Invalid token';
      if (err instanceof Error) message = err.message;
      throw new HttpException({ message }, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { success: true };
  }
}
