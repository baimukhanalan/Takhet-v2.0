import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { CasesModule } from '../cases/cases.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [CasesModule, NotificationsModule, PaymentsModule],
  controllers: [PatientController]
})
export class PatientModule {}
