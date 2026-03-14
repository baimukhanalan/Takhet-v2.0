import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CasesService } from '../cases/cases.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { PiiCryptoService } from '../common/pii-crypto.service';
import { DataSource } from 'typeorm';

class CreateCaseDto {
  @IsString()
  @MinLength(5)
  summary!: string;
}


class SavePiiDto {
  @IsString()
  phone!: string;

  @IsString()
  insurance!: string;

  @IsString()
  policyNumber!: string;
}

@Controller('patient')
@UseGuards(AuthGuard, RolesGuard)
@Roles('patient')
export class PatientController {
  constructor(
    private readonly casesService: CasesService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly piiCrypto: PiiCryptoService,
    private readonly dataSource: DataSource
  ) {}

  @Get('cases')
  myCases(@Req() req: any) {
    return this.casesService.findMy(req.user.id);
  }

  @Post('cases')
  createCase(@Req() req: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(req.user.id, dto.summary);
  }

  @Get('notifications')
  notifications(@Req() req: any) {
    return this.notificationsService.listByUser(req.user.id);
  }

  @Get('payments')
  payments(@Req() req: any) {
    return this.paymentsService.getMyPayments(req.user.id);
  }

  @Post('pii')
  async savePii(@Req() req: any, @Body() dto: SavePiiDto) {
    const patient = await this.dataSource.query('select id from patients where user_id = $1 limit 1', [req.user.id]);
    const patientId = patient?.[0]?.id || req.user.id;

    const encryptedPhone = this.piiCrypto.encrypt(dto.phone);
    const encryptedInsurance = this.piiCrypto.encrypt(dto.insurance);
    const encryptedPolicy = this.piiCrypto.encrypt(dto.policyNumber);

    await this.dataSource.query(
      'insert into patient_contacts (patient_id, phone) values ($1, $2) on conflict do nothing',
      [patientId, encryptedPhone]
    );

    await this.dataSource.query(
      'insert into patient_insurance (patient_id, provider, policy_number) values ($1, $2, $3) on conflict do nothing',
      [patientId, encryptedInsurance, encryptedPolicy]
    );

    return { saved: true };
  }

  @Get('pii')
  async getPii(@Req() req: any) {
    const patient = await this.dataSource.query('select id from patients where user_id = $1 limit 1', [req.user.id]);
    const patientId = patient?.[0]?.id || req.user.id;

    const contacts = await this.dataSource.query('select phone from patient_contacts where patient_id = $1 order by id desc limit 1', [patientId]);
    const insurance = await this.dataSource.query('select provider, policy_number from patient_insurance where patient_id = $1 order by id desc limit 1', [patientId]);

    return {
      phone: contacts[0]?.phone ? this.piiCrypto.decrypt(contacts[0].phone) : null,
      insurance: insurance[0]?.provider ? this.piiCrypto.decrypt(insurance[0].provider) : null,
      policyNumber: insurance[0]?.policy_number ? this.piiCrypto.decrypt(insurance[0].policy_number) : null
    };
  }
}

