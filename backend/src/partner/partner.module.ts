import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [DoctorsModule, CasesModule, PaymentsModule],
  controllers: [PartnerController]
})
export class PartnerModule {}
