import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [DoctorsModule, CasesModule, PaymentsModule, AuthModule, ProfilesModule],
  controllers: [PartnerController],
  providers: [AuthGuard, RolesGuard]
})
export class PartnerModule {}
