import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from '../cases/cases.service';
import { DoctorsService } from '../doctors/doctors.service';
import { PaymentsService } from '../payments/payments.service';
import { ProfilesService } from '../profiles/profiles.service';

class RespondCaseDto {
  @IsString()
  @MinLength(3)
  response!: string;
}

class CreateDoctorCaseDto {
  @IsString()
  @MinLength(5)
  summary!: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsString()
  @MinLength(2)
  bio!: string;

  @IsString()
  headline!: string;

  @IsString({ each: true })
  languages!: string[];

  @IsString({ each: true })
  consultationModes!: string[];

  @IsString({ each: true })
  focusAreas!: string[];

  @IsString({ each: true })
  education!: string[];

  @IsString()
  city!: string;

  @IsString()
  clinicName!: string;

  @IsOptional()
  responseTargetHours!: number;

  @IsOptional()
  pricePrimary!: number;

  @IsOptional()
  experienceYears?: number;

  @IsString()
  accepts!: string;

  @IsOptional()
  availability!: { date: string; slots: string[] }[];
}

class SetCaseStatusDto {
  @IsIn(['active', 'in_review', 'closed'])
  status!: 'active' | 'in_review' | 'closed';
}

class ConfirmConsultationReportDto {
  @IsString()
  @MinLength(3)
  doctorRecommendations!: string;
}

class SaveConsultationReportDraftDto {
  @IsString()
  @IsOptional()
  aiSummary?: string;

  @IsString()
  @IsOptional()
  doctorRecommendations?: string;
}

@Controller('doctor')
@UseGuards(AuthGuard, RolesGuard)
@Roles('doctor')
export class DoctorController {
  constructor(
    private readonly casesService: CasesService,
    private readonly doctorsService: DoctorsService,
    private readonly paymentsService: PaymentsService,
    private readonly profilesService: ProfilesService
  ) {}

  private resolveDoctorId(userId: string) {
    return this.doctorsService.resolvePortalDoctorId(userId);
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    const [profile, earnings, myCases, queue] = await Promise.all([
      this.doctorsService.getDoctorProfile(doctorId),
      this.paymentsService.getDoctorEarnings(doctorId),
      this.casesService.findDoctorCases(doctorId),
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
  async cases(@Req() req: any) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.casesService.findDoctorCases(doctorId);
  }

  @Post('cases')
  async createCase(@Req() req: any, @Body() dto: CreateDoctorCaseDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.casesService.createDoctorCase(doctorId, dto.summary);
  }

  @Get('cases/queue')
  queue() {
    return this.casesService.findDoctorQueue();
  }

  @Get('appointments')
  async appointments(@Req() req: any) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.casesService.findDoctorCases(doctorId);
  }

  @Get('case/:id')
  async caseById(@Req() req: any, @Param('id') id: string) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.casesService.findDoctorCaseById(doctorId, id);
  }

  @Get('case/:id/report')
  async consultationReport(@Req() req: any, @Param('id') id: string) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.profilesService.getConsultationReportForDoctor(id, doctorId);
  }

  @Post('case/:id/respond')
  async respond(@Req() req: any, @Param('id') id: string, @Body() dto: RespondCaseDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.casesService.addDoctorResponse(id, doctorId, dto.response);
  }

  @Post('case/:id/consultation-message')
  async appendConsultationMessage(@Req() req: any, @Param('id') id: string, @Body() dto: RespondCaseDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    await this.casesService.addDoctorResponse(id, doctorId, dto.response);
    return this.profilesService.appendDoctorConsultationMessage(id, doctorId, dto.response);
  }

  @Patch('case/:id/status')
  async status(@Req() req: any, @Param('id') id: string, @Body() dto: SetCaseStatusDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    if (dto.status === 'closed') {
      await this.profilesService.finalizeConsultationReportOnClose(id, doctorId);
    }
    return this.casesService.setDoctorCaseStatus(id, doctorId, dto.status);
  }

  @Patch('case/:id/report/confirm')
  async confirmConsultationReport(@Req() req: any, @Param('id') id: string, @Body() dto: ConfirmConsultationReportDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.profilesService.confirmConsultationReport(id, doctorId, dto.doctorRecommendations);
  }

  @Patch('case/:id/report/draft')
  async saveConsultationReportDraft(@Req() req: any, @Param('id') id: string, @Body() dto: SaveConsultationReportDraftDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.profilesService.saveDoctorConsultationDraft(id, doctorId, dto);
  }

  @Get('profile')
  async profile(@Req() req: any) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.doctorsService.getDoctorProfile(doctorId);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    await this.profilesService.updateDoctorProfile(doctorId, dto);
    return this.doctorsService.getDoctorProfile(doctorId);
  }

  @Get('earnings')
  async earnings(@Req() req: any) {
    const doctorId = await this.resolveDoctorId(req.user.id);
    return this.paymentsService.getDoctorEarnings(doctorId);
  }
}
