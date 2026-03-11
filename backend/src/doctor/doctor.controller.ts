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
  @IsIn(['active', 'in_review', 'closed'])
  status!: 'active' | 'in_review' | 'closed';
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

  @Get('case/:id')
  caseById(@Req() req: any, @Param('id') id: string) {
    return this.casesService.findDoctorCaseById(req.user.id, id);
  }

  @Post('case/:id/respond')
  respond(@Req() req: any, @Param('id') id: string, @Body() dto: RespondCaseDto) {
    return this.casesService.addDoctorResponse(id, req.user.id, dto.response);
  }

  @Patch('case/:id/status')
  status(@Req() req: any, @Param('id') id: string, @Body() dto: SetCaseStatusDto) {
    return this.casesService.setDoctorCaseStatus(id, req.user.id, dto.status);
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
