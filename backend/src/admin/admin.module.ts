import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { CasesModule } from '../cases/cases.module';
import { PaymentsModule } from '../payments/payments.module';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [UsersModule, CasesModule, PaymentsModule, DoctorsModule],
  controllers: [AdminController]
})
export class AdminModule {}
