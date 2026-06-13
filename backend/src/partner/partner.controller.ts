import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { DoctorsService } from '../doctors/doctors.service';
import { CasesService } from '../cases/cases.service';
import { PaymentsService } from '../payments/payments.service';
import { ProfilesService } from '../profiles/profiles.service';

class CreatePartnerDoctorDto {
  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsString()
  @MinLength(2)
  specialty!: string;
}

class UpdatePartnerProfileDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsString()
  @IsOptional()
  notificationsMode?: string;

  @IsString()
  @IsOptional()
  preferredChannel?: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsInt()
  @Min(5)
  @Max(30)
  @IsOptional()
  commission?: number;
}

@Controller('partner')
@UseGuards(AuthGuard, RolesGuard)
@Roles('partner')
export class PartnerController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly casesService: CasesService,
    private readonly paymentsService: PaymentsService,
    private readonly profilesService: ProfilesService
  ) {}

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const partnerDoctors = await this.doctorsService.listForPartner(req.user.id);
    const doctorIds = partnerDoctors.map((doctor) => doctor.id);
    const [analytics, doctorStats, payments] = await Promise.all([
      this.casesService.partnerAnalytics(doctorIds),
      Promise.resolve({
        total: partnerDoctors.length,
        active: partnerDoctors.filter((doctor) => doctor.verified).length,
        pending: partnerDoctors.filter((doctor) => !doctor.verified).length
      }),
      this.paymentsService.getPartnerPayments(req.user.id)
    ]);

    return {
      analytics,
      doctorStats,
      paymentCount: payments.length
    };
  }

  @Get('doctors')
  doctors(@Req() req: any) {
    return this.doctorsService.listForPartner(req.user.id);
  }

  @Post('doctors')
  createDoctor(@Req() req: any, @Body() dto: CreatePartnerDoctorDto) {
    return this.doctorsService.createPartnerDoctor(dto.fullName, dto.specialty, req.user.id);
  }

  @Patch('doctors/:id/activate')
  activateDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.setPartnerDoctorActive(req.user.id, id, true);
  }

  @Patch('doctors/:id/deactivate')
  deactivateDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.setPartnerDoctorActive(req.user.id, id, false);
  }

  @Get('patients')
  async patients(@Req() req: any) {
    const doctorIds = (await this.doctorsService.listForPartner(req.user.id)).map((doctor) => doctor.id);
    return this.casesService.listPartnerPatients(doctorIds);
  }

  @Get('analytics')
  async analytics(@Req() req: any) {
    const doctorIds = (await this.doctorsService.listForPartner(req.user.id)).map((doctor) => doctor.id);
    return this.casesService.partnerAnalytics(doctorIds);
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getPartnerPayments(req.user.id);
  }

  @Get('requests')
  async requests(@Req() req: any) {
    const partnerDoctors = await this.doctorsService.listForPartner(req.user.id);
    const doctorIds = partnerDoctors.map((doctor) => doctor.id);
    const [pendingDoctors, openCases] = await Promise.all([
      Promise.resolve(partnerDoctors.filter((d) => !d.verified)),
      this.casesService.findByStatus('open', doctorIds)
    ]);

    return { pendingDoctors, openCases };
  }

  @Get('profile')
  profile(@Req() req: any) {
    return this.profilesService.getPortalProfile(req.user.id, 'partner');
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdatePartnerProfileDto) {
    return this.profilesService.updatePortalProfile(req.user.id, 'partner', dto);
  }
}
