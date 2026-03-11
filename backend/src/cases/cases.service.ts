import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseEntity } from './case.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseEntity) private readonly casesRepo: Repository<CaseEntity>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(patientId: string, summary: string) {
    const created = await this.casesRepo.save(this.casesRepo.create({ patientId, summary, status: 'open' }));
    await this.auditService.log('case.created', patientId, { caseId: created.id });
    return created;
  }

  findMy(patientId: string) {
    return this.casesRepo.find({ where: { patientId }, order: { createdAt: 'DESC' } });
  }

  findAll() {
    return this.casesRepo.find({ order: { createdAt: 'DESC' } });
  }

  findDoctorCases(doctorId: string) {
    return this.casesRepo.find({ where: [{ doctorId }, { status: 'active' }], order: { createdAt: 'DESC' } });
  }

  async findDoctorCaseById(doctorId: string, caseId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    if (found.doctorId && found.doctorId !== doctorId) throw new NotFoundException('Case not assigned to doctor');
    return found;
  }

  async addDoctorResponse(caseId: string, doctorId: string, response: string) {
    const found = await this.findDoctorCaseById(doctorId, caseId);
    found.doctorId = doctorId;
    found.status = 'in_review';
    found.summary = `${found.summary}\n\nDoctor response: ${response}`;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.responded', doctorId, { caseId, response });
    await this.notificationsService.create(found.patientId, 'Ответ врача', 'Врач добавил ответ по вашему кейсу.');
    return updated;
  }

  async doctorRespond(caseId: string, doctorId: string, status: 'in_review' | 'closed') {
    await this.casesRepo.update({ id: caseId }, { doctorId, status });
    await this.auditService.log('case.updated', doctorId, { caseId, status });
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async activateCase(caseId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'active';
    const updated = await this.casesRepo.save(found);
    await this.notificationsService.create(found.patientId, 'Кейс активирован', 'Оплата подтверждена, ваш кейс отправлен в очередь врачу.');
    return updated;
  }

  async closeCase(caseId: string, actorId: string) {
    await this.casesRepo.update({ id: caseId }, { status: 'closed' });
    await this.auditService.log('case.closed', actorId, { caseId });
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async listPartnerPatients() {
    const cases = await this.casesRepo.find({ order: { createdAt: 'DESC' } });
    const map = new Map<string, { patientId: string; casesCount: number }>();
    for (const c of cases) {
      map.set(c.patientId, { patientId: c.patientId, casesCount: (map.get(c.patientId)?.casesCount || 0) + 1 });
    }
    return [...map.values()];
  }

  async partnerAnalytics() {
    const total = await this.casesRepo.count();
    const active = await this.casesRepo.count({ where: { status: 'active' } });
    const closed = await this.casesRepo.count({ where: { status: 'closed' } });
    return { totalCases: total, activeCases: active, closedCases: closed };
  }
}
