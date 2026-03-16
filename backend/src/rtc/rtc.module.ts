import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CasesModule } from '../cases/cases.module';
import { RtcSession } from './rtc-session.entity';
import { RtcService } from './rtc.service';
import { RtcController, RtcTokenController } from './rtc.controller';
import { RtcProviderService } from './rtc-provider.service';

@Module({
  imports: [AuthModule, AuditModule, CasesModule, TypeOrmModule.forFeature([RtcSession])],
  providers: [RtcService, RtcProviderService],
  controllers: [RtcController, RtcTokenController]
})
export class RtcModule {}
