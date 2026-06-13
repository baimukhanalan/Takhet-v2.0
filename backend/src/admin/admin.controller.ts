import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UsersService } from '../users/users.service';
import { CasesService } from '../cases/cases.service';
import { PaymentsService } from '../payments/payments.service';
import { DoctorsService } from '../doctors/doctors.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminPortalService } from './admin-portal.service';
import { TelemetryService } from '../telemetry/telemetry.service';

class BroadcastDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  body!: string;
}

class CreateDoctorDto {
  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsString()
  @MinLength(2)
  specialty!: string;

  @IsIn(['doctor', 'mental', 'both'])
  @IsOptional()
  catalogAudience?: 'doctor' | 'mental' | 'both';

  @IsString()
  @IsOptional()
  temporaryLogin?: string;
}

class UpdatePortalConfigDto {
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;

  @IsBoolean()
  @IsOptional()
  aiDiagnosticEnabled?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  serviceFeePercent?: number;

  @IsIn(['light', 'dark'])
  @IsOptional()
  theme?: 'light' | 'dark';
}

class AssistantMessageDto {
  @IsString()
  @MinLength(1)
  role!: 'user' | 'model';

  @IsString()
  @MinLength(1)
  text!: string;

  @IsString()
  @MinLength(1)
  timestamp!: string;
}

class UpdateMedicineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  img?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;
}

class UpdatePartnerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bin?: string;

  @IsIn(['Active', 'Pending'])
  @IsOptional()
  status?: 'Active' | 'Pending';

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission?: number;
}

class UpdateContractDto {
  @IsString()
  @IsOptional()
  partnerName?: string;

  @IsString()
  @IsOptional()
  contractNumber?: string;

  @IsIn(['Draft', 'Active', 'Expired'])
  @IsOptional()
  status?: 'Draft' | 'Active' | 'Expired';

  @IsString()
  @IsOptional()
  signedAt?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission?: number;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly casesService: CasesService,
    private readonly paymentsService: PaymentsService,
    private readonly doctorsService: DoctorsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly adminPortalService: AdminPortalService,
    private readonly telemetryService: TelemetryService
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [users, cases, payments, doctors] = await Promise.all([
      this.usersService.findAll(),
      this.casesService.getDashboardStats(),
      this.paymentsService.revenueSummary(),
      this.doctorsService.getDoctorStats()
    ]);

    return {
      usersTotal: users.length,
      cases,
      payments,
      doctors
    };
  }

  @Get('kpis')
  async kpis() {
    const [cases, payments, doctors] = await Promise.all([
      this.casesService.getDashboardStats(),
      this.paymentsService.revenueSummary(),
      this.doctorsService.getDoctorStats()
    ]);
    return { cases, payments, doctors };
  }

  @Get('users')
  users() {
    return this.usersService.findAll();
  }

  @Get('doctors')
  doctors() {
    return this.doctorsService.listAll();
  }

  @Get('cases')
  cases() {
    return this.casesService.findAll();
  }

  @Get('payments')
  payments() {
    return this.paymentsService.findAllPayments();
  }

  @Get('audit')
  audit() {
    return this.auditService.recent(200);
  }

  @Get('portal-state')
  portalState() {
    return this.adminPortalService.getPortalState();
  }

  @Get('contracts')
  async contracts() {
    const state = await this.adminPortalService.getPortalState();
    return state.contracts;
  }

  @Get('system-health')
  systemHealth() {
    return this.telemetryService.getSystemHealth();
  }

  @Patch('portal-config')
  portalConfig(@Body() dto: UpdatePortalConfigDto) {
    return this.adminPortalService.updateConfig(dto);
  }

  @Post('assistant-message')
  assistantMessage(@Body() dto: AssistantMessageDto) {
    return this.adminPortalService.appendAssistantMessage(dto);
  }

  @Delete('assistant-history')
  clearAssistantHistory() {
    return this.adminPortalService.clearAssistantHistory();
  }

  @Post('medicines')
  addMedicine() {
    return this.adminPortalService.addMedicine();
  }

  @Patch('medicine/:id')
  updateMedicine(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.adminPortalService.updateMedicine(id, dto);
  }

  @Delete('medicine/:id')
  deleteMedicine(@Param('id') id: string) {
    return this.adminPortalService.deleteMedicine(id);
  }

  @Post('partners')
  async addPartnerDraft() {
    const config = await this.adminPortalService.getPortalState();
    return this.adminPortalService.addPartnerDraft(config.config?.serviceFeePercent || 15);
  }

  @Post('contracts')
  async addPartnerContract() {
    const config = await this.adminPortalService.getPortalState();
    return this.adminPortalService.addPartnerContract(config.config?.serviceFeePercent || 15);
  }

  @Patch('partner/:id/toggle')
  togglePartnerDraft(@Param('id') id: string) {
    return this.adminPortalService.togglePartnerDraft(id);
  }

  @Patch('partner/:id')
  updatePartnerDraft(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.adminPortalService.updatePartnerDraft(id, dto);
  }

  @Delete('partner/:id')
  deletePartnerDraft(@Param('id') id: string) {
    return this.adminPortalService.deletePartnerDraft(id);
  }

  @Patch('contract/:id/toggle')
  togglePartnerContract(@Param('id') id: string) {
    return this.adminPortalService.togglePartnerContract(id);
  }

  @Patch('contract/:id')
  updatePartnerContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.adminPortalService.updatePartnerContract(id, dto);
  }

  @Delete('contract/:id')
  deletePartnerContract(@Param('id') id: string) {
    return this.adminPortalService.deletePartnerContract(id);
  }

  @Delete('review/:id')
  hideReview(@Param('id') id: string) {
    return this.adminPortalService.hideReview(id);
  }

  @Delete('complaint/:id')
  deleteComplaint(@Param('id') id: string) {
    return this.adminPortalService.deleteComplaint(id);
  }

  @Patch('doctor/:id/approve')
  approveDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.approveDoctor(id, req.user.id, 'Takhet+ Network');
  }

  @Patch('doctor/:id/deactivate')
  deactivateDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.setDoctorActive(id, false, req.user.id);
  }

  @Post('doctors')
  createDoctor(@Body() dto: CreateDoctorDto, @Req() req: any) {
    return this.doctorsService.createAdminDoctor(dto.fullName, dto.specialty, req.user.id, {
      catalogAudience: dto.catalogAudience,
      temporaryLogin: dto.temporaryLogin
    });
  }

  @Delete('doctor/:id')
  deleteDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.deleteDoctor(id, req.user.id);
  }

  @Patch('case/:id/assign/:doctorId')
  assignCase(@Param('id') id: string, @Param('doctorId') doctorId: string, @Req() req: any) {
    return this.casesService.assignDoctor(id, doctorId, req.user.id);
  }

  @Patch('case/:id/reopen')
  reopenCase(@Param('id') id: string, @Req() req: any) {
    return this.casesService.reopenCase(id, req.user.id);
  }

  @Delete('user/:id')
  deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.softDelete(id, req.user.id);
  }

  @Post('notifications/broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.notificationsService.broadcast(dto.title, dto.body);
  }
}
