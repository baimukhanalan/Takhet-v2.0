import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { EnterpriseAuthGuard } from './enterprise-auth.guard';
import { EnterpriseRole, EnterpriseService } from './enterprise.service';

class EnterpriseLeadDto {
  @IsString()
  @MinLength(2)
  companyName!: string;

  @IsString()
  @MinLength(2)
  contactName!: string;

  @IsString()
  @MinLength(3)
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  employees?: number;

  @IsString()
  @IsOptional()
  message?: string;
}

class EnterpriseLoginDto {
  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsString()
  @IsOptional()
  role?: EnterpriseRole;
}

class EnterpriseRegisterDto extends EnterpriseLoginDto {}

class SubmitCheckDto {
  @IsNumber()
  @IsOptional()
  sleepHours?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  fatigueLevel?: number;

  @IsBoolean()
  @IsOptional()
  dizziness?: boolean;

  @IsBoolean()
  @IsOptional()
  headache?: boolean;

  @IsBoolean()
  @IsOptional()
  nausea?: boolean;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  painLevel?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  stressLevel?: number;

  @IsString()
  @IsOptional()
  medications?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsInt()
  @IsOptional()
  systolic?: number;

  @IsInt()
  @IsOptional()
  diastolic?: number;

  @IsString()
  @IsOptional()
  symptomsToday?: string;

  @IsBoolean()
  @IsOptional()
  fitToWork?: boolean;
}

class ConsultationRequestDto {
  @IsString()
  serviceType!: 'duty_doctor' | 'psychologist' | 'specialist';

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  preferredTime?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  premiumRequested?: boolean;
}

class FeedbackDto {
  @IsString()
  consultationId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

class ProviderNoteDto {
  @IsString()
  consultationId!: string;

  @IsString()
  note!: string;

  @IsString()
  @IsOptional()
  recommendation?: string;
}

class InviteEmployeeDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(2)
  email!: string;

  @IsString()
  @IsOptional()
  department?: string;
}

@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post('leads')
  createLead(@Body() dto: EnterpriseLeadDto) {
    return this.enterpriseService.createLead(dto);
  }

  @Post('auth/login')
  async login(@Body() dto: EnterpriseLoginDto, @Res({ passthrough: true }) res: any) {
    const session = await this.enterpriseService.login(dto.identifier, dto.password, dto.role);
    const cookie = this.enterpriseService.buildSessionCookie(session.token);
    res.cookie(cookie.name, cookie.value, cookie.options);
    return { user: session.user, legal: session.legal };
  }

  @Post('auth/register')
  register(@Body() dto: EnterpriseRegisterDto) {
    return this.enterpriseService.registerAccessRequest(dto.identifier, dto.password, dto.role || 'employee');
  }

  @Get('auth/session')
  async session(@Req() req: any) {
    try {
      const user = await this.enterpriseService.resolveSession(req.headers.cookie);
      return { authenticated: true, user, legal: this.enterpriseService.getLegalPositioning() };
    } catch {
      return { authenticated: false, user: null, legal: this.enterpriseService.getLegalPositioning() };
    }
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) res: any) {
    const cookie = this.enterpriseService.clearSessionCookie();
    res.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  }

  @Get('employee/dashboard')
  @UseGuards(EnterpriseAuthGuard)
  employeeDashboard(@Req() req: any) {
    return this.enterpriseService.employeeDashboard(req.enterpriseUser);
  }

  @Get('employee/benefits')
  @UseGuards(EnterpriseAuthGuard)
  employeeBenefits(@Req() req: any) {
    return this.enterpriseService.employeeBenefits(req.enterpriseUser);
  }

  @Get('employee/history')
  @UseGuards(EnterpriseAuthGuard)
  employeeHistory(@Req() req: any) {
    return this.enterpriseService.employeeHistory(req.enterpriseUser);
  }

  @Get('employee/notifications')
  @UseGuards(EnterpriseAuthGuard)
  employeeNotifications(@Req() req: any) {
    return this.enterpriseService.employeeNotifications(req.enterpriseUser);
  }

  @Get('employee/recommendations')
  @UseGuards(EnterpriseAuthGuard)
  employeeRecommendations(@Req() req: any) {
    return this.enterpriseService.employeeRecommendations(req.enterpriseUser);
  }

  @Get('employee/profile')
  @UseGuards(EnterpriseAuthGuard)
  employeeProfile(@Req() req: any) {
    return this.enterpriseService.employeeProfile(req.enterpriseUser);
  }

  @Post('employee/ai-sessions')
  @UseGuards(EnterpriseAuthGuard)
  startAiSession(@Req() req: any, @Body() dto: any) {
    return this.enterpriseService.startAiSession(req.enterpriseUser, dto);
  }

  @Post('employee/triage')
  @UseGuards(EnterpriseAuthGuard)
  runTriage(@Req() req: any, @Body() dto: any) {
    return this.enterpriseService.runTriage(req.enterpriseUser, dto);
  }

  @Post('employee/consultation-requests')
  @UseGuards(EnterpriseAuthGuard)
  requestConsultation(@Req() req: any, @Body() dto: ConsultationRequestDto) {
    return this.enterpriseService.requestConsultation(req.enterpriseUser, dto);
  }

  @Post('employee/feedback')
  @UseGuards(EnterpriseAuthGuard)
  submitFeedback(@Req() req: any, @Body() dto: FeedbackDto) {
    return this.enterpriseService.submitFeedback(req.enterpriseUser, dto);
  }

  @Post('employee/risk-precheck')
  @UseGuards(EnterpriseAuthGuard)
  riskPrecheck(@Req() req: any, @Body() dto: SubmitCheckDto) {
    return this.enterpriseService.submitRiskPrecheck(req.enterpriseUser, dto);
  }

  @Get('employer/dashboard')
  @UseGuards(EnterpriseAuthGuard)
  employerDashboard(@Req() req: any) {
    return this.enterpriseService.employerDashboard(req.enterpriseUser);
  }

  @Get('employer/employees')
  @UseGuards(EnterpriseAuthGuard)
  employerEmployees(@Req() req: any) {
    return this.enterpriseService.employerEmployees(req.enterpriseUser);
  }

  @Post('employer/invites')
  @UseGuards(EnterpriseAuthGuard)
  inviteEmployee(@Req() req: any, @Body() dto: InviteEmployeeDto) {
    return this.enterpriseService.inviteEmployee(req.enterpriseUser, dto);
  }

  @Get('employer/departments')
  @UseGuards(EnterpriseAuthGuard)
  employerDepartments(@Req() req: any) {
    return this.enterpriseService.employerDepartments(req.enterpriseUser);
  }

  @Get('employer/activation')
  @UseGuards(EnterpriseAuthGuard)
  employerActivation(@Req() req: any) {
    return this.enterpriseService.employerActivation(req.enterpriseUser);
  }

  @Get('employer/utilization')
  @UseGuards(EnterpriseAuthGuard)
  employerUtilization(@Req() req: any) {
    return this.enterpriseService.employerUtilization(req.enterpriseUser);
  }

  @Get('employer/trends')
  @UseGuards(EnterpriseAuthGuard)
  employerTrends(@Req() req: any) {
    return this.enterpriseService.employerTrends(req.enterpriseUser);
  }

  @Get('employer/finance')
  @UseGuards(EnterpriseAuthGuard)
  employerFinance(@Req() req: any) {
    return this.enterpriseService.employerFinance(req.enterpriseUser);
  }

  @Get('employer/plan')
  @UseGuards(EnterpriseAuthGuard)
  employerPlan(@Req() req: any) {
    return this.enterpriseService.employerPlan(req.enterpriseUser);
  }

  @Get('employer/reports')
  @UseGuards(EnterpriseAuthGuard)
  employerReports(@Req() req: any) {
    return this.enterpriseService.employerReports(req.enterpriseUser);
  }

  @Get('employer/privacy')
  @UseGuards(EnterpriseAuthGuard)
  employerPrivacy(@Req() req: any) {
    return this.enterpriseService.employerPrivacy(req.enterpriseUser);
  }

  @Get('employer/settings')
  @UseGuards(EnterpriseAuthGuard)
  employerSettings(@Req() req: any) {
    return this.enterpriseService.employerSettings(req.enterpriseUser);
  }

  @Get('provider/queue')
  @UseGuards(EnterpriseAuthGuard)
  providerQueue(@Req() req: any) {
    return this.enterpriseService.providerQueue(req.enterpriseUser);
  }

  @Get('provider/schedule')
  @UseGuards(EnterpriseAuthGuard)
  providerSchedule(@Req() req: any) {
    return this.enterpriseService.providerSchedule(req.enterpriseUser);
  }

  @Get('provider/patients')
  @UseGuards(EnterpriseAuthGuard)
  providerPatients(@Req() req: any) {
    return this.enterpriseService.providerPatients(req.enterpriseUser);
  }

  @Get('provider/consultations')
  @UseGuards(EnterpriseAuthGuard)
  providerConsultations(@Req() req: any) {
    return this.enterpriseService.providerConsultations(req.enterpriseUser);
  }

  @Get('provider/triage-summary')
  @UseGuards(EnterpriseAuthGuard)
  providerTriageSummary(@Req() req: any) {
    return this.enterpriseService.providerTriageSummary(req.enterpriseUser);
  }

  @Get('provider/notes')
  @UseGuards(EnterpriseAuthGuard)
  providerNotes(@Req() req: any) {
    return this.enterpriseService.providerNotes(req.enterpriseUser);
  }

  @Post('provider/notes')
  @UseGuards(EnterpriseAuthGuard)
  addProviderNote(@Req() req: any, @Body() dto: ProviderNoteDto) {
    return this.enterpriseService.addProviderNote(req.enterpriseUser, dto);
  }

  @Get('provider/payouts')
  @UseGuards(EnterpriseAuthGuard)
  providerPayouts(@Req() req: any) {
    return this.enterpriseService.providerPayouts(req.enterpriseUser);
  }

  @Get('provider/training')
  @UseGuards(EnterpriseAuthGuard)
  providerTraining(@Req() req: any) {
    return this.enterpriseService.providerTraining(req.enterpriseUser);
  }

  @Get('provider/profile')
  @UseGuards(EnterpriseAuthGuard)
  providerProfile(@Req() req: any) {
    return this.enterpriseService.providerProfile(req.enterpriseUser);
  }

  @Get('takhet-admin/companies')
  @UseGuards(EnterpriseAuthGuard)
  adminCompanies(@Req() req: any) {
    return this.enterpriseService.adminCompanies(req.enterpriseUser);
  }

  @Get('takhet-admin/plans')
  @UseGuards(EnterpriseAuthGuard)
  adminPlans(@Req() req: any) {
    return this.enterpriseService.adminPlans(req.enterpriseUser);
  }

  @Get('takhet-admin/employees')
  @UseGuards(EnterpriseAuthGuard)
  adminEmployees(@Req() req: any) {
    return this.enterpriseService.adminEmployees(req.enterpriseUser);
  }

  @Get('takhet-admin/doctors')
  @UseGuards(EnterpriseAuthGuard)
  adminDoctors(@Req() req: any) {
    return this.enterpriseService.adminDoctors(req.enterpriseUser);
  }

  @Get('takhet-admin/verification')
  @UseGuards(EnterpriseAuthGuard)
  adminVerification(@Req() req: any) {
    return this.enterpriseService.adminVerification(req.enterpriseUser);
  }

  @Get('takhet-admin/tariffs')
  @UseGuards(EnterpriseAuthGuard)
  adminTariffs(@Req() req: any) {
    return this.enterpriseService.adminTariffs(req.enterpriseUser);
  }

  @Get('takhet-admin/limits')
  @UseGuards(EnterpriseAuthGuard)
  adminLimits(@Req() req: any) {
    return this.enterpriseService.adminLimits(req.enterpriseUser);
  }

  @Get('takhet-admin/billing')
  @UseGuards(EnterpriseAuthGuard)
  adminBilling(@Req() req: any) {
    return this.enterpriseService.adminBilling(req.enterpriseUser);
  }

  @Get('takhet-admin/payouts')
  @UseGuards(EnterpriseAuthGuard)
  adminPayouts(@Req() req: any) {
    return this.enterpriseService.adminPayouts(req.enterpriseUser);
  }

  @Get('takhet-admin/ai-sessions')
  @UseGuards(EnterpriseAuthGuard)
  adminAiSessions(@Req() req: any) {
    return this.enterpriseService.adminAiSessions(req.enterpriseUser);
  }

  @Get('takhet-admin/reports')
  @UseGuards(EnterpriseAuthGuard)
  adminReports(@Req() req: any) {
    return this.enterpriseService.adminReports(req.enterpriseUser);
  }

  @Get('takhet-admin/audit')
  @UseGuards(EnterpriseAuthGuard)
  adminAudit(@Req() req: any) {
    return this.enterpriseService.adminAudit(req.enterpriseUser);
  }

  @Get('takhet-admin/compliance')
  @UseGuards(EnterpriseAuthGuard)
  adminCompliance(@Req() req: any) {
    return this.enterpriseService.adminCompliance(req.enterpriseUser);
  }

  @Get('takhet-admin/settings')
  @UseGuards(EnterpriseAuthGuard)
  adminSettings(@Req() req: any) {
    return this.enterpriseService.adminSettings(req.enterpriseUser);
  }

  @Get('supervisor/quality-review')
  @UseGuards(EnterpriseAuthGuard)
  supervisorQualityReview(@Req() req: any) {
    return this.enterpriseService.supervisorQualityReview(req.enterpriseUser);
  }

  @Get('supervisor/flagged-cases')
  @UseGuards(EnterpriseAuthGuard)
  supervisorFlaggedCases(@Req() req: any) {
    return this.enterpriseService.supervisorFlaggedCases(req.enterpriseUser);
  }

  @Get('supervisor/escalations')
  @UseGuards(EnterpriseAuthGuard)
  supervisorEscalations(@Req() req: any) {
    return this.enterpriseService.supervisorEscalations(req.enterpriseUser);
  }

  @Get('supervisor/notes-audit')
  @UseGuards(EnterpriseAuthGuard)
  supervisorNotesAudit(@Req() req: any) {
    return this.enterpriseService.supervisorNotesAudit(req.enterpriseUser);
  }

  @Get('supervisor/risk-monitoring')
  @UseGuards(EnterpriseAuthGuard)
  supervisorRiskMonitoring(@Req() req: any) {
    return this.enterpriseService.supervisorRiskMonitoring(req.enterpriseUser);
  }

  @Get('supervisor/protocols')
  @UseGuards(EnterpriseAuthGuard)
  supervisorProtocols(@Req() req: any) {
    return this.enterpriseService.supervisorProtocols(req.enterpriseUser);
  }
}
