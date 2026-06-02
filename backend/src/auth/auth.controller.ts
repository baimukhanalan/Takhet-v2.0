import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService, LoginRole } from './auth.service';

class LoginDto {
  @IsString()
  @MinLength(1)
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsIn(['patient', 'doctor', 'partner', 'admin'])
  role!: LoginRole;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['patient', 'doctor', 'partner'])
  role!: Exclude<LoginRole, 'admin'>;
}

class AuthEmailActionDto {
  @IsEmail()
  email!: string;

  @IsIn(['patient', 'doctor', 'partner', 'admin'])
  role!: LoginRole;
}

class ConfirmEmailVerificationDto {
  @IsString()
  @MinLength(20)
  token!: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class GoogleAuthStartDto {
  @IsIn(['patient', 'doctor', 'partner'])
  role!: Exclude<LoginRole, 'admin'>;

  @IsOptional()
  @IsIn(['login', 'register'])
  mode?: 'login' | 'register';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const session = await this.authService.login(dto.email, dto.password, dto.role);
    const cookie = this.authService.buildSessionCookie(session.access_token);
    res.cookie(cookie.name, cookie.value, cookie.options);
    return session;
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.role);
  }

  @Post('request-email-verification')
  requestEmailVerification(@Body() dto: AuthEmailActionDto) {
    return this.authService.requestEmailVerification(dto.email, dto.role);
  }

  @Post('confirm-email-verification')
  confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.authService.confirmEmailVerification(dto.token);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: AuthEmailActionDto) {
    return this.authService.requestPasswordReset(dto.email, dto.role);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('google/start')
  googleStart(@Body() dto: GoogleAuthStartDto) {
    return this.authService.createGoogleOAuthStart(dto.role, dto.mode || 'login');
  }

  @Get('session')
  async session(@Req() req: any, @Res({ passthrough: true }) res: any) {
    try {
      const session = await this.authService.resolveSession(req.headers.authorization, req.headers.cookie);
      const authHeader = req.headers.authorization;
      const cookieName = this.authService.getSessionCookieName();

      if (authHeader && !String(req.headers.cookie || '').includes(`${cookieName}=`)) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token) {
          const cookie = this.authService.buildSessionCookie(token);
          res.cookie(cookie.name, cookie.value, cookie.options);
        }
      }

      return session;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return { authenticated: false, user: null };
      }

      throw error;
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: any) {
    const cookie = this.authService.clearSessionCookie();
    res.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  }
}
