import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { CasesModule } from '../cases/cases.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [CasesModule, DoctorsModule, PaymentsModule, AuthModule, ProfilesModule],
  controllers: [DoctorController],
  providers: [AuthGuard, RolesGuard]
})
export class DoctorModule {}
