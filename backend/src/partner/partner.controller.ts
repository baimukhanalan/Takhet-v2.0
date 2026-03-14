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
    const [analytics, doctorStats, payments] = await Promise.all([
      this.casesService.partnerAnalytics(),
      this.doctorsService.getDoctorStats(),
      this.paymentsService.getPartnerPayments(req.user.id)
    ]);

    return {
      analytics,
      doctorStats,
      paymentCount: payments.length
    };
  }

  @Get('doctors')
  doctors() {
    return this.doctorsService.listAll();
  }

  @Post('doctors')
  createDoctor(@Body() dto: CreatePartnerDoctorDto) {
    return this.doctorsService.createPartnerDoctor(dto.fullName, dto.specialty);
  }

  @Patch('doctors/:id/activate')
  activateDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.setDoctorActive(id, true, req.user.id);
  }

  @Patch('doctors/:id/deactivate')
  deactivateDoctor(@Param('id') id: string, @Req() req: any) {
    return this.doctorsService.setDoctorActive(id, false, req.user.id);
  }

  @Get('patients')
  patients() {
    return this.casesService.listPartnerPatients();
  }

  @Get('analytics')
  analytics() {
    return this.casesService.partnerAnalytics();
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getPartnerPayments(req.user.id);
  }

  @Get('requests')
  async requests() {
    const [pendingDoctors, openCases] = await Promise.all([
      this.doctorsService.listAll().then((list) => list.filter((d) => !d.active)),
      this.casesService.findByStatus('created')
    ]);

    return { pendingDoctors, openCases };
  }
}
