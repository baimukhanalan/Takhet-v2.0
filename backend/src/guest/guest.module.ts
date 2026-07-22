import { Module } from '@nestjs/common';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, RealtimeModule, DoctorsModule, AuthModule],
  controllers: [GuestController],
  providers: [GuestService]
})
export class GuestModule {}
