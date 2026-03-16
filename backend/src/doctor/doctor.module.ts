import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DoctorController } from './doctor.controller';
import { CasesModule } from '../cases/cases.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuthModule, CasesModule, DoctorsModule, PaymentsModule],
  controllers: [DoctorController]
})
export class DoctorModule {}
