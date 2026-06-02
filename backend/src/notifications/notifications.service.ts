import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { User } from '../users/user.entity';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly realtimeService: RealtimeService
  ) {}

  create(userId: string, title: string, body: string) {
    this.realtimeService.publishToUser(userId, 'patient', 'notification.created');
    return this.notificationsRepo.save(this.notificationsRepo.create({ userId, message: `${title}: ${body}`, read: false }));
  }

  async broadcast(title: string, body: string) {
    const users = await this.usersRepo.find();
    const payload = users.map((u) => this.notificationsRepo.create({ userId: u.id, message: `${title}: ${body}`, read: false }));
    this.realtimeService.publishPlatform('notification.broadcast');
    return this.notificationsRepo.save(payload);
  }

  listByUser(userId: string) {
    return this.notificationsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
