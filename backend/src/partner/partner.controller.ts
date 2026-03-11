import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('doctors')
  doctors() {
    return this.doctorsService.listActive();
  }

  @Post('doctors')
  createDoctor(@Body() dto: CreatePartnerDoctorDto) {
    return this.doctorsService.createPartnerDoctor(dto.fullName, dto.specialty);
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
}
