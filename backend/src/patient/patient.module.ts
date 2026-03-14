import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientController } from './patient.controller';
import { CasesModule } from '../cases/cases.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuthModule, CasesModule, NotificationsModule, PaymentsModule],
  controllers: [PatientController]
})
export class PatientModule {}
