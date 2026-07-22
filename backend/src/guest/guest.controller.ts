import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { GuestService } from './guest.service';
import { DoctorsService } from '../doctors/doctors.service';
import { AuthService } from '../auth/auth.service';

class RequestGuestPhoneOtpDto {
  @IsString()
  @MinLength(5)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class VerifyGuestPhoneOtpDto {
  @IsString()
  @MinLength(5)
  phone!: string;

  @IsString()
  @MinLength(4)
  code!: string;
}

class CreateGuestConsultationDto {
  @IsUUID()
  doctorId!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(5)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredSlot?: string;

  @IsString()
  @MinLength(20)
  phoneVerificationToken!: string;
}

class CreateGuestUrgentConsultationDto {
  @IsString()
  @MinLength(20)
  summary!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(5)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(20)
  phoneVerificationToken!: string;

  @IsBoolean()
  acceptedTerms!: boolean;

  @IsBoolean()
  acceptedPrivacy!: boolean;

  @IsBoolean()
  acceptedTelemedicine!: boolean;
}

@Controller('guest')
export class GuestController {
  constructor(
    private readonly guestService: GuestService,
    private readonly doctorsService: DoctorsService,
    private readonly authService: AuthService
  ) {}

  @Get('doctors')
  doctors() {
    return this.doctorsService.listActive();
  }

  @Post('phone-otp/request')
  requestPhoneOtp(@Body() dto: RequestGuestPhoneOtpDto) {
    return this.guestService.requestPhoneOtp(dto.phone, dto.email);
  }

  @Post('phone-otp/verify')
  verifyPhoneOtp(@Body() dto: VerifyGuestPhoneOtpDto) {
    return this.guestService.verifyPhoneOtp(dto.phone, dto.code);
  }

  @Post('consultations')
  createConsultation(@Body() dto: CreateGuestConsultationDto) {
    return this.guestService.createGuestConsultation(dto);
  }

  @Post('urgent-consultations')
  async createUrgentConsultation(@Body() dto: CreateGuestUrgentConsultationDto, @Res({ passthrough: true }) res: any) {
    const created = await this.guestService.createUrgentConsultation(dto);
    const session = this.authService.issueGuestSession(created.guestUserId, created.guestEmail);
    const cookie = this.authService.buildSessionCookie(session.access_token);
    res.cookie(cookie.name, cookie.value, cookie.options);

    const { guestUserId: _guestUserId, guestEmail: _guestEmail, ...result } = created;
    return { ...result, user: session.user };
  }
}
