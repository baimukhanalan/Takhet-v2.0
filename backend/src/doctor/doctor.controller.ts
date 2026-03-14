import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from '../cases/cases.service';
import { DoctorsService } from '../doctors/doctors.service';
import { PaymentsService } from '../payments/payments.service';

class RespondCaseDto {
  @IsString()
  @MinLength(3)
  response!: string;
}

class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  bio!: string;
}

class SetCaseStatusDto {
  @IsIn(['assigned', 'consultation_started', 'consultation_finished', 'closed'])
  status!: 'assigned' | 'consultation_started' | 'consultation_finished' | 'closed';
}

@Controller('doctor')
@UseGuards(AuthGuard, RolesGuard)
@Roles('doctor')
export class DoctorController {
  constructor(
    private readonly casesService: CasesService,
    private readonly doctorsService: DoctorsService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const [profile, earnings, myCases, queue] = await Promise.all([
      this.doctorsService.getDoctorProfile(req.user.id),
      this.paymentsService.getDoctorEarnings(req.user.id),
      this.casesService.findDoctorCases(req.user.id),
      this.casesService.findDoctorQueue()
    ]);

    return {
      profile,
      earnings,
      myCasesCount: myCases.length,
      queueCount: queue.length
    };
  }

  @Get('cases')
  cases(@Req() req: any) {
    return this.casesService.findDoctorCases(req.user.id);
  }

  @Get('cases/queue')
  queue() {
    return this.casesService.findDoctorQueue();
  }

  @Get('appointments')
  appointments(@Req() req: any) {
    return this.casesService.findDoctorCases(req.user.id);
  }

  @Get('case/:id')
  caseById(@Req() req: any, @Param('id') id: string) {
    return this.casesService.findDoctorCaseById(req.user.id, id);
  }

  @Post('case/:id/respond')
  async respond(@Req() req: any, @Param('id') id: string, @Body() dto: RespondCaseDto) {
    const result = await this.casesService.addDoctorResponse(id, req.user.id, dto.response);
    await this.paymentsService.reconcileCaseEarnings(id);
    return result;
  }

  @Patch('case/:id/status')
  async status(@Req() req: any, @Param('id') id: string, @Body() dto: SetCaseStatusDto) {
    const result = await this.casesService.setDoctorCaseStatus(id, req.user.id, dto.status);
    if (dto.status === 'consultation_finished' || dto.status === 'closed') {
      await this.paymentsService.reconcileCaseEarnings(id);
    }
    return result;
  }

  @Get('profile')
  profile(@Req() req: any) {
    return this.doctorsService.getDoctorProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.doctorsService.updateDoctorProfile(req.user.id, dto.bio);
  }

  @Get('earnings')
  earnings(@Req() req: any) {
    return this.paymentsService.getDoctorEarnings(req.user.id);
  }
}
