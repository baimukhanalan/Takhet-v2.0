import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>
  ) {}

  create(userId: string, title: string, body: string) {
    return this.notificationsRepo.save(this.notificationsRepo.create({ userId, title, body, isRead: false }));
  }

  async broadcast(title: string, body: string) {
    const users = await this.usersRepo.find({ where: { disabled: false } });
    const payload = users.map((u) => this.notificationsRepo.create({ userId: u.id, title, body, isRead: false }));
    return this.notificationsRepo.save(payload);
  }

  listByUser(userId: string) {
    return this.notificationsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
