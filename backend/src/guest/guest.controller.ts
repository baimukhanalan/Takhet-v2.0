import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { GuestService } from './guest.service';

class RequestGuestPhoneOtpDto {
  @IsString()
  @MinLength(5)
  phone!: string;
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

@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post('phone-otp/request')
  requestPhoneOtp(@Body() dto: RequestGuestPhoneOtpDto) {
    return this.guestService.requestPhoneOtp(dto.phone);
  }

  @Post('phone-otp/verify')
  verifyPhoneOtp(@Body() dto: VerifyGuestPhoneOtpDto) {
    return this.guestService.verifyPhoneOtp(dto.phone, dto.code);
  }

  @Post('consultations')
  createConsultation(@Body() dto: CreateGuestConsultationDto) {
    return this.guestService.createGuestConsultation(dto);
  }
}
