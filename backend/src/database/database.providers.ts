import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { env } from '../config/env.config';
import { User } from '../users/user.entity';
import { TriageSession } from '../triage/triage.entity';
import { CaseEntity } from '../cases/case.entity';
import { Doctor } from '../doctors/doctor.entity';
import { AuditLog } from '../audit/audit.entity';
import { Signature } from '../signatures/signature.entity';
import { Payment } from '../payments/payment.entity';
import { NotificationEntity } from '../notifications/notification.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: env.databaseUrl,
  synchronize: false,
  autoLoadEntities: false,
  entities: [User, TriageSession, CaseEntity, Doctor, AuditLog, Signature, Payment, NotificationEntity]
};
