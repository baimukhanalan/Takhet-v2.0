import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly auditService: AuditService
  ) {}

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async softDelete(userId: string, actorId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return null;
    await this.auditService.log('user.disabled', actorId, { userId });
    return this.toPublicUser(user);
  }

  private toPublicUser(user: User): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
