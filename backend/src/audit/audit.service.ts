import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  log(event: string, actorId: string, payload: Record<string, unknown>) {
    return this.auditRepo.save(this.auditRepo.create({ event, actorId, payload }));
  }

  recent(limit = 100) {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
