import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly auditService: AuditService
  ) {}

  findAll() {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async softDelete(userId: string, actorId: string) {
    await this.usersRepo.update({ id: userId }, { disabled: true });
    await this.auditService.log('user.disabled', actorId, { userId });
    return this.usersRepo.findOne({ where: { id: userId } });
  }
}
