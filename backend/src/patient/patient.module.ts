import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { CasesModule } from '../cases/cases.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [CasesModule, NotificationsModule, PaymentsModule, AuthModule, ProfilesModule],
  controllers: [PatientController],
  providers: [AuthGuard, RolesGuard]
})
export class PatientModule {}
