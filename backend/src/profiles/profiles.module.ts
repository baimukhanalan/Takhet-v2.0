import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuditModule, AuthModule, NotificationsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, AuthGuard],
  exports: [ProfilesService]
})
export class ProfilesModule {}
