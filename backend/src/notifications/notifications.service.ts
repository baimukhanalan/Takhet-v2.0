import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(NotificationEntity) private readonly notificationsRepo: Repository<NotificationEntity>) {}

  create(userId: string, title: string, body: string) {
    return this.notificationsRepo.save(this.notificationsRepo.create({ userId, title, body, isRead: false }));
  }

  listByUser(userId: string) {
    return this.notificationsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
