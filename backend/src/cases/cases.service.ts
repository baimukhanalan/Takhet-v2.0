import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseEntity, CaseStatus } from './case.entity';
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
    const created = await this.casesRepo.save(this.casesRepo.create({ patientId, summary, status: 'created' }));
    await this.auditService.log('case.created', patientId, { caseId: created.id });
    return created;
  }

  findMy(patientId: string) {
    return this.casesRepo.find({ where: { patientId }, order: { createdAt: 'DESC' } });
  }

  findAll() {
    return this.casesRepo.find({ order: { createdAt: 'DESC' } });
  }

  findById(caseId: string) {
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async getDashboardStats() {
    const total = await this.casesRepo.count();
    const created = await this.casesRepo.count({ where: { status: 'created' } });
    const paymentPending = await this.casesRepo.count({ where: { status: 'payment_pending' } });
    const paid = await this.casesRepo.count({ where: { status: 'paid' } });
    const assigned = await this.casesRepo.count({ where: { status: 'assigned' } });
    const consultationStarted = await this.casesRepo.count({ where: { status: 'consultation_started' } });
    const consultationFinished = await this.casesRepo.count({ where: { status: 'consultation_finished' } });
    const closed = await this.casesRepo.count({ where: { status: 'closed' } });
    return { total, created, paymentPending, paid, assigned, consultationStarted, consultationFinished, closed };
  }

  findDoctorCases(doctorId: string) {
    return this.casesRepo.find({ where: [{ doctorId }, { status: 'assigned' }, { status: 'consultation_started' }, { status: 'consultation_finished' }], order: { createdAt: 'DESC' } });
  }

  findDoctorQueue() {
    return this.casesRepo.find({ where: [{ status: 'paid' }, { status: 'assigned' }], order: { createdAt: 'DESC' } });
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
    found.status = 'consultation_finished';
    found.summary = `${found.summary}\n\nDoctor response: ${response}`;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.responded', doctorId, { caseId, response });
    await this.notificationsService.create(found.patientId, 'Ответ врача', 'Врач добавил ответ по вашему кейсу.');
    return updated;
  }

  async setDoctorCaseStatus(caseId: string, doctorId: string, status: 'assigned' | 'consultation_started' | 'consultation_finished' | 'closed') {
    const found = await this.findDoctorCaseById(doctorId, caseId);
    found.doctorId = doctorId;
    found.status = status;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.status.changed', doctorId, { caseId, status });
    return updated;
  }

  async assignDoctor(caseId: string, doctorId: string, actorId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.doctorId = doctorId;
    found.status = 'assigned';
    const saved = await this.casesRepo.save(found);
    await this.auditService.log('case.assigned', actorId, { caseId, doctorId });
    return saved;
  }

  async doctorRespond(caseId: string, doctorId: string, status: 'consultation_finished' | 'closed') {
    await this.casesRepo.update({ id: caseId }, { doctorId, status });
    await this.auditService.log('case.updated', doctorId, { caseId, status });
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async activateCase(caseId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'paid';
    const updated = await this.casesRepo.save(found);
    await this.notificationsService.create(found.patientId, 'Кейс активирован', 'Оплата подтверждена, ваш кейс отправлен в очередь врачу.');
    return updated;
  }

  async closeCase(caseId: string, actorId: string) {
    await this.casesRepo.update({ id: caseId }, { status: 'closed' });
    await this.auditService.log('case.closed', actorId, { caseId });
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async listPartnerPatients(partnerUserId?: string) {
    let cases = await this.casesRepo.find({ order: { createdAt: 'DESC' } });
    if (partnerUserId) {
      const rows = await this.casesRepo.query('select id from clinics where partner_user_id = $1 limit 1', [partnerUserId]);
      const clinicId = rows?.[0]?.id;
      if (clinicId) {
        cases = cases.filter((c) => c.clinicId === clinicId);
      } else {
        cases = [];
      }
    }
    const map = new Map<string, { patientId: string; casesCount: number }>();
    for (const c of cases) {
      map.set(c.patientId, { patientId: c.patientId, casesCount: (map.get(c.patientId)?.casesCount || 0) + 1 });
    }
    return [...map.values()];
  }

  async partnerAnalytics(clinicId?: string | null) {
    const by = clinicId ? { clinicId } : undefined as any;
    const total = await this.casesRepo.count(by ? { where: by } : undefined as any);
    const paid = await this.casesRepo.count(by ? { where: { ...by, status: 'paid' } } : { where: { status: 'paid' } });
    const assigned = await this.casesRepo.count(by ? { where: { ...by, status: 'assigned' } } : { where: { status: 'assigned' } });
    const consultationStarted = await this.casesRepo.count(by ? { where: { ...by, status: 'consultation_started' } } : { where: { status: 'consultation_started' } });
    const consultationFinished = await this.casesRepo.count(by ? { where: { ...by, status: 'consultation_finished' } } : { where: { status: 'consultation_finished' } });
    const closed = await this.casesRepo.count(by ? { where: { ...by, status: 'closed' } } : { where: { status: 'closed' } });
    return { totalCases: total, paidCases: paid, assignedCases: assigned, consultationStartedCases: consultationStarted, consultationFinishedCases: consultationFinished, closedCases: closed };
  }

  findByStatus(status: CaseStatus, clinicId?: string) {
    return this.casesRepo.find({ where: clinicId ? ({ status, clinicId } as any) : { status }, order: { createdAt: 'DESC' } });
  }


  async setPaymentPending(caseId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'payment_pending';
    return this.casesRepo.save(found);
  }

  async setCaseStatus(caseId: string, status: CaseStatus, actorId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = status;
    const saved = await this.casesRepo.save(found);
    await this.auditService.log('case.status.changed', actorId, { caseId, status });
    return saved;
  }
  async reopenCase(caseId: string, actorId: string) {
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'assigned';
    const saved = await this.casesRepo.save(found);
    await this.auditService.log('case.reopened', actorId, { caseId });
    return saved;
  }
}
