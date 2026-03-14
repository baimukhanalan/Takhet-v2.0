import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, UsersModule, CasesModule, PaymentsModule, DoctorsModule, AuditModule, NotificationsModule],
  controllers: [AdminController]
})
export class AdminModule {}
