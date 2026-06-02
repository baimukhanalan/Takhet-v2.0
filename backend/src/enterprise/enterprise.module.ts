import { Module } from '@nestjs/common';
import { EnterpriseAuthGuard } from './enterprise-auth.guard';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

@Module({
  controllers: [EnterpriseController],
  providers: [EnterpriseService, EnterpriseAuthGuard],
  exports: [EnterpriseService]
})
export class EnterpriseModule {}
