import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { DoctorsService } from '../doctors/doctors.service';
import { CasesService } from '../cases/cases.service';
import { PaymentsService } from '../payments/payments.service';

class CreatePartnerDoctorDto {
  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsString()
  @MinLength(2)
  specialty!: string;
}

@Controller('partner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('partner')
export class PartnerController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly casesService: CasesService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    const [analytics, doctorStats, payments] = await Promise.all([
      this.casesService.partnerAnalytics(clinicId),
      this.doctorsService.getDoctorStats(clinicId || undefined),
      this.paymentsService.getPartnerPayments(req.user.id)
    ]);

    return {
      analytics,
      doctorStats,
      paymentCount: payments.length
    };
  }

  @Get('doctors')
  async doctors(@Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    if (!clinicId) return [];
    return this.doctorsService.listByClinic(clinicId);
  }

  @Post('doctors')
  async createDoctor(@Req() req: any, @Body() dto: CreatePartnerDoctorDto) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    if (!clinicId) return { error: 'Partner clinic mapping not found' };
    return this.doctorsService.createPartnerDoctor(dto.fullName, dto.specialty, clinicId);
  }

  @Patch('doctors/:id/activate')
  async activateDoctor(@Param('id') id: string, @Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    return this.doctorsService.setDoctorActive(id, true, req.user.id, clinicId || undefined);
  }

  @Patch('doctors/:id/deactivate')
  async deactivateDoctor(@Param('id') id: string, @Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    return this.doctorsService.setDoctorActive(id, false, req.user.id, clinicId || undefined);
  }

  @Get('patients')
  patients(@Req() req: any) {
    return this.casesService.listPartnerPatients(req.user.id);
  }

  @Get('analytics')
  async analytics(@Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    return this.casesService.partnerAnalytics(clinicId);
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getPartnerPayments(req.user.id);
  }

  @Get('commissions')
  commissions(@Req() req: any) {
    return this.paymentsService.getPartnerClinicCommissionSummary(req.user.id);
  }

  @Get('payout-backlog')
  payoutBacklog(@Req() req: any) {
    return this.paymentsService.getPartnerPayoutBacklog(req.user.id);
  }

  @Get('requests')
  async requests(@Req() req: any) {
    const clinicId = await this.doctorsService.getClinicByPartnerUser(req.user.id);
    const [pendingDoctors, openCases] = await Promise.all([
      clinicId ? this.doctorsService.listByClinic(clinicId).then((list) => list.filter((d) => !d.active)) : Promise.resolve([]),
      this.casesService.findByStatus('created', clinicId || undefined)
    ]);

    return { pendingDoctors, openCases };
  }
}
