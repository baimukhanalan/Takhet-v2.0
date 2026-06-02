import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from '../cases/cases.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { ProfilesService } from '../profiles/profiles.service';

class CreateCaseDto {
  @IsString()
  @MinLength(5)
  summary!: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  appointmentDate?: string;

  @IsString()
  @IsOptional()
  appointmentSlot?: string;
}

class SubmitFeedbackDto {
  @IsString()
  caseId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsString()
  @IsOptional()
  review?: string;
}

class UpdatePatientProfileDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  notificationsMode?: string;

  @IsString()
  @IsOptional()
  preferredChannel?: string;

  @IsString()
  @IsOptional()
  about?: string;
}

class ConsultationTranscriptEntryDto {
  @IsIn(['patient', 'doctor', 'ai', 'system'])
  speaker!: 'patient' | 'doctor' | 'ai' | 'system';

  @IsString()
  @MinLength(1)
  text!: string;

  @IsString()
  createdAt!: string;
}

class ConsultationUploadedDocDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  analysis!: string;
}

class SaveConsultationDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultationTranscriptEntryDto)
  transcript!: ConsultationTranscriptEntryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultationUploadedDocDto)
  uploadedDocs?: ConsultationUploadedDocDto[];

  @IsString()
  @IsOptional()
  aiSummary?: string;
}

class FinalizeAiConsultationReportDto {
  @IsString()
  @IsOptional()
  aiSummary?: string;
}

@Controller('patient')
@UseGuards(AuthGuard, RolesGuard)
@Roles('patient')
export class PatientController {
  constructor(
    private readonly casesService: CasesService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly profilesService: ProfilesService
  ) {}

  @Get('cases')
  myCases(@Req() req: any) {
    return this.casesService.findMy(req.user.id);
  }

  @Post('cases')
  createCase(@Req() req: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(req.user.id, dto.summary, {
      doctorId: dto.doctorId,
      appointmentDate: dto.appointmentDate,
      appointmentSlot: dto.appointmentSlot
    });
  }

  @Get('notifications')
  notifications(@Req() req: any) {
    return this.notificationsService.listByUser(req.user.id);
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getMyPayments(req.user.id);
  }

  @Get('context-export')
  contextExport(@Req() req: any) {
    return this.profilesService.exportPatientContext(req.user.id);
  }

  @Get('profile')
  profile(@Req() req: any) {
    return this.profilesService.getPortalProfile(req.user.id, 'patient');
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdatePatientProfileDto) {
    return this.profilesService.updatePortalProfile(req.user.id, 'patient', dto);
  }

  @Post('feedback')
  feedback(@Req() req: any, @Body() dto: SubmitFeedbackDto) {
    return this.profilesService.submitDoctorFeedback(dto.caseId, req.user.id, dto.score, dto.review || '');
  }

  @Post('case/:id/consultation-draft')
  saveConsultationDraft(@Req() req: any, @Param('id') id: string, @Body() dto: SaveConsultationDraftDto) {
    return this.profilesService.saveConsultationDraft(id, req.user.id, dto);
  }

  @Get('case/:id/export-context')
  exportCaseContext(@Req() req: any, @Param('id') id: string) {
    return this.profilesService.exportPatientCaseContext(id, req.user.id);
  }

  @Post('case/:id/share-context')
  shareContext(@Req() req: any, @Param('id') id: string) {
    return this.profilesService.sharePatientContextToCase(id, req.user.id);
  }

  @Get('case/:id/consultation-report')
  consultationReport(@Req() req: any, @Param('id') id: string) {
    return this.profilesService.getConsultationReportForPatient(id, req.user.id);
  }

  @Patch('case/:id/consultation-report/finalize-ai')
  finalizeAiConsultationReport(@Req() req: any, @Param('id') id: string, @Body() dto: FinalizeAiConsultationReportDto) {
    return this.profilesService.finalizeAiConsultationReport(id, req.user.id, dto);
  }
}
