import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, User]), AuthModule],
  providers: [NotificationsService, AuthGuard],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
