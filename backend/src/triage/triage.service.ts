import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TriageSession } from './triage.entity';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TriageService {
  constructor(
    @InjectRepository(TriageSession) private readonly triageRepo: Repository<TriageSession>,
    private readonly aiService: AiService,
    private readonly auditService: AuditService
  ) {}

  async create(patientId: string, symptoms: string) {
    const aiResult = await this.aiService.analyzeSymptoms(symptoms);
    const triage = this.triageRepo.create({ patientId, symptoms, aiResult });
    const saved = await this.triageRepo.save(triage);
    await this.auditService.log('triage.started', patientId, { triageId: saved.id });
    return saved;
  }
}
