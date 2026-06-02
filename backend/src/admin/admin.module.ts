import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AdminPortalService } from './admin-portal.service';

@Module({
  imports: [UsersModule, CasesModule, PaymentsModule, DoctorsModule, AuthModule, AuditModule, NotificationsModule, ProfilesModule],
  controllers: [AdminController],
  providers: [AuthGuard, RolesGuard, AdminPortalService]
})
export class AdminModule {}
