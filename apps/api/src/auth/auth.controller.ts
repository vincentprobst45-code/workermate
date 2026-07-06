import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<any> {
    try {
      return await this.authService.register(dto);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      else if (typeof err === 'string') message = err;
      throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<any> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user)
      throw new HttpException({ message: 'Invalid credentials' }, HttpStatus.UNAUTHORIZED);
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }): Promise<any> {
    try {
      return await this.authService.refreshAccessToken(body.refreshToken);
    } catch (err: unknown) {
      let message = 'Invalid token';
      if (err instanceof Error) message = err.message;
      throw new HttpException({ message }, HttpStatus.UNAUTHORIZED);
    }
  }
}
