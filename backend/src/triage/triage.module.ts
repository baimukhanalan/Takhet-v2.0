import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriageSession } from './triage.entity';
import { TriageController } from './triage.controller';
import { TriageService } from './triage.service';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TriageSession]), AiModule, AuditModule, AuthModule],
  controllers: [TriageController],
  providers: [TriageService],
  exports: [TriageService]
})
export class TriageModule {}
