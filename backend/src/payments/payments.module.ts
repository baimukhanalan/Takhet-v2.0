import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { KaspiService } from './kaspi.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { Payment } from './payment.entity';
import { CasesModule } from '../cases/cases.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PayoutSchedulerService } from './payout-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), AuthModule, AuditModule, CasesModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, KaspiService, PayoutSchedulerService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
