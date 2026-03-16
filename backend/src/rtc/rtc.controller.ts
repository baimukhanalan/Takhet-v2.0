import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsObject, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RtcService } from './rtc.service';
import { RtcProviderService } from './rtc-provider.service';

class CreateRtcSessionDto {
  @IsString()
  caseId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  patientId!: string;
}

class SessionRefDto {
  @IsString()
  sessionId!: string;
}

class OfferAnswerDto extends SessionRefDto {
  @IsString()
  sdp!: string;
}

class IceDto extends SessionRefDto {
  @IsIn(['doctor', 'patient'])
  role!: 'doctor' | 'patient';

  @IsObject()
  candidate!: Record<string, any>;
}

class TokenDto {
  @IsString()
  roomName!: string;

  @IsIn(['doctor', 'patient'])
  role!: 'doctor' | 'patient';
}

@Controller('rtc/session')
@UseGuards(AuthGuard)
export class RtcController {
  constructor(
    private readonly rtcService: RtcService,
    private readonly rtcProviderService: RtcProviderService
  ) {}

  @Post('create')
  create(@Req() req: any, @Body() dto: CreateRtcSessionDto) {
    return this.rtcService.createSession(dto.caseId, dto.doctorId, dto.patientId, req.user.id);
  }

  @Post('join')
  join(@Req() req: any, @Body() dto: SessionRefDto) {
    return this.rtcService.joinSession(dto.sessionId, req.user.id);
  }

  @Post('offer')
  offer(@Req() req: any, @Body() dto: OfferAnswerDto) {
    return this.rtcService.saveOffer(dto.sessionId, dto.sdp, req.user.id);
  }

  @Post('answer')
  answer(@Req() req: any, @Body() dto: OfferAnswerDto) {
    return this.rtcService.saveAnswer(dto.sessionId, dto.sdp, req.user.id);
  }

  @Post('ice')
  ice(@Req() req: any, @Body() dto: IceDto) {
    return this.rtcService.saveIce(dto.sessionId, dto.role, dto.candidate, req.user.id);
  }

  @Post('token')
  token(@Req() req: any, @Body() dto: TokenDto) {
    return {
      provider: 'livekit-compatible',
      url: process.env.LIVEKIT_URL || '',
      token: this.rtcProviderService.createAccessToken({ roomName: dto.roomName, userId: req.user.id, role: dto.role })
    };
  }

  @Post('end')
  end(@Req() req: any, @Body() dto: SessionRefDto) {
    return this.rtcService.endSession(dto.sessionId, req.user.id);
  }
}


@Controller('rtc')
@UseGuards(AuthGuard)
export class RtcTokenController {
  constructor(private readonly rtcProviderService: RtcProviderService) {}

  @Post('token')
  token(@Req() req: any, @Body() dto: TokenDto) {
    return {
      provider: 'livekit-compatible',
      url: process.env.LIVEKIT_URL || '',
      token: this.rtcProviderService.createAccessToken({ roomName: dto.roomName, userId: req.user.id, role: dto.role })
    };
  }
}
