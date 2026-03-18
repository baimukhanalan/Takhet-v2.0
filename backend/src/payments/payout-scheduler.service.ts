import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { env } from '../config/env.config';

@Injectable()
export class PayoutSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PayoutSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly paymentsService: PaymentsService) {}

  onModuleInit() {
    if (!env.payoutAutoPrepareEnabled) {
      this.logger.log('Payout auto-prepare scheduler is disabled');
      return;
    }

    this.timer = setInterval(async () => {
      try {
        const result = await this.paymentsService.markReadyForPayouts();
        if (result.moved > 0) {
          this.logger.log(`Payout scheduler moved ${result.moved} earnings to ready_for_payout`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.error(`Payout scheduler failed: ${message}`);
      }
    }, env.payoutAutoPrepareIntervalMs);

    this.logger.log(`Payout auto-prepare scheduler started, interval=${env.payoutAutoPrepareIntervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
