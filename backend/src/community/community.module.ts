import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditModule, DoctorsModule, AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService, AuthGuard, RolesGuard]
})
export class CommunityModule {}
