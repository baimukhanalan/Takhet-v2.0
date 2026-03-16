import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerController } from './partner.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuthModule, DoctorsModule, CasesModule, PaymentsModule],
  controllers: [PartnerController]
})
export class PartnerModule {}
