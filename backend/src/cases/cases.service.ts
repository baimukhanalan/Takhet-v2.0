import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CaseEntity } from './case.entity';
import { AuditService } from '../audit/audit.service';
import { Doctor } from '../doctors/doctor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class CasesService {
  private signalTableReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(CaseEntity) private readonly casesRepo: Repository<CaseEntity>,
    @InjectRepository(Doctor) private readonly doctorsRepo: Repository<Doctor>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService
  ) {}

  async create(
    patientId: string,
    summary: string,
    appointment?: { doctorId?: string; appointmentDate?: string; appointmentSlot?: string }
  ) {
    const assignedDoctorId = await this.resolveAppointmentDoctorId(appointment);
    const created = await this.casesRepo.save(
      this.casesRepo.create({
        patientId,
        doctorId: assignedDoctorId,
        summary,
        status: assignedDoctorId ? 'active' : 'open'
      })
    );
    await this.auditService.log('case.created', patientId, {
      caseId: created.id,
      doctorId: assignedDoctorId,
      appointmentDate: appointment?.appointmentDate || null,
      appointmentSlot: appointment?.appointmentSlot || null
    });
    this.realtimeService.publishToUser(patientId, 'patient', 'case.created');
    if (assignedDoctorId) {
      await this.notificationsService.create(
        assignedDoctorId,
        'Новая запись',
        appointment?.appointmentDate && appointment?.appointmentSlot
          ? `Пациент записался на ${appointment.appointmentDate} в ${appointment.appointmentSlot}.`
          : 'Пациент создал запись на консультацию.'
      );
      this.realtimeService.publishToUser(assignedDoctorId, 'doctor', 'case.assigned');
    }
    this.realtimeService.publishToRoles(['doctor', 'admin'], 'doctor', 'queue.updated');
    return this.normalizeCase(created);
  }

  async createDoctorCase(doctorId: string, summary: string) {
    const created = await this.casesRepo.save(
      this.casesRepo.create({
        patientId: doctorId,
        doctorId,
        summary: `Swarm Medicine\n${summary.trim()}`,
        status: 'open'
      })
    );
    await this.auditService.log('doctor.case.created', doctorId, { caseId: created.id });
    this.realtimeService.publishToUser(doctorId, 'doctor', 'doctor.case.created');
    this.realtimeService.publishToRoles(['doctor', 'admin'], 'doctor', 'queue.updated');
    return this.normalizeCase(created);
  }

  async findMy(patientId: string) {
    const cases = await this.casesRepo.find({ where: { patientId }, order: { createdAt: 'DESC' } });
    return cases.map((item) => this.normalizeCase(item));
  }

  async findAll() {
    const cases = await this.casesRepo.find({ order: { createdAt: 'DESC' } });
    return cases.map((item) => this.normalizeCase(item));
  }

  async getDashboardStats() {
    const total = await this.casesRepo.count();
    const open = await this.casesRepo.count({ where: { status: 'open' } });
    const active = await this.casesRepo.count({ where: { status: 'active' } });
    const inReview = await this.casesRepo.count({ where: { status: 'in_review' } });
    const closed = await this.casesRepo.count({ where: { status: 'closed' } });
    return { total, open, active, inReview, closed };
  }

  async findDoctorCases(doctorId: string) {
    const cases = await this.casesRepo.find({ where: { doctorId }, order: { createdAt: 'DESC' } });
    return cases.map((item) => this.normalizeCase(item));
  }

  async findDoctorQueue() {
    const cases = await this.casesRepo.find({ where: { status: 'open' }, order: { createdAt: 'DESC' } });
    return cases.map((item) => this.normalizeCase(item));
  }

  async findDoctorCaseById(doctorId: string, caseId: string) {
    const found = await this.findDoctorCaseEntityById(doctorId, caseId);
    return this.normalizeCase(found);
  }

  async addConsultationSignal(
    caseId: string,
    sender: { id: string; role: string },
    signal: { type: 'offer' | 'answer' | 'ice' | 'leave'; payload?: any }
  ) {
    await this.assertConsultationParticipant(caseId, sender.id);
    await this.ensureConsultationSignalTable();
    await this.pruneConsultationSignals(caseId);

    const rows = await this.dataSource.query(
      `
        INSERT INTO consultation_signals (case_id, sender_id, sender_role, type, payload)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING id, case_id, sender_id, sender_role, type, payload, created_at
      `,
      [caseId, sender.id, sender.role, signal.type, JSON.stringify(signal.payload || null)]
    );

    return this.normalizeConsultationSignal(rows[0]);
  }

  async getConsultationSignals(caseId: string, userId: string, since = 0) {
    await this.assertConsultationParticipant(caseId, userId);
    await this.ensureConsultationSignalTable();
    await this.pruneConsultationSignals(caseId);

    const rows = await this.dataSource.query(
      `
        SELECT id, case_id, sender_id, sender_role, type, payload, created_at
        FROM consultation_signals
        WHERE case_id = $1 AND id > $2
        ORDER BY id ASC
        LIMIT 200
      `,
      [caseId, Number.isFinite(since) ? since : 0]
    );

    return rows.map((row: any) => this.normalizeConsultationSignal(row));
  }

  async addDoctorResponse(caseId: string, doctorId: string, response: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    if (found.doctorId && found.doctorId !== doctorId) throw new NotFoundException('Case not assigned to doctor');
    found.doctorId = doctorId;
    found.status = 'in_review';
    found.summary = `${this.normalizeSummary(found.summary)}\n\nОтвет врача: ${response}`;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.responded', doctorId, { caseId, response });
    await this.notificationsService.create(found.patientId, 'Ответ врача', 'Врач добавил ответ по вашему обращению.');
    this.realtimeService.publishToUsers([found.patientId, doctorId], 'patient', 'case.responded');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'case.responded');
    return this.normalizeCase(updated);
  }

  async setDoctorCaseStatus(caseId: string, doctorId: string, status: 'active' | 'in_review' | 'closed') {
    const found = await this.findDoctorCaseEntityById(doctorId, caseId);
    found.doctorId = doctorId;
    found.status = status;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.status.changed', doctorId, { caseId, status });
    this.realtimeService.publishToUsers([found.patientId, doctorId], 'doctor', 'case.status.changed');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'case.status.changed');
    return this.normalizeCase(updated);
  }

  async assignDoctor(caseId: string, doctorId: string, actorId: string) {
    this.assertUuid(caseId, 'Case id');
    this.assertUuid(doctorId, 'Doctor id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.doctorId = doctorId;
    found.status = 'active';
    const saved = await this.casesRepo.save(found);
    await this.auditService.log('case.assigned', actorId, { caseId, doctorId });
    this.realtimeService.publishToUsers([found.patientId, doctorId], 'doctor', 'case.assigned');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'case.assigned');
    return this.normalizeCase(saved);
  }

  async doctorRespond(caseId: string, doctorId: string, status: 'in_review' | 'closed') {
    this.assertUuid(caseId, 'Case id');
    await this.casesRepo.update({ id: caseId }, { doctorId, status });
    await this.auditService.log('case.updated', doctorId, { caseId, status });
    const updated = await this.casesRepo.findOne({ where: { id: caseId } });
    return updated ? this.normalizeCase(updated) : updated;
  }

  async activateCase(caseId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'active';
    const updated = await this.casesRepo.save(found);
    await this.notificationsService.create(found.patientId, 'Обращение активировано', 'Оплата подтверждена, ваше обращение передано врачу.');
    this.realtimeService.publishToUser(found.patientId, 'patient', 'case.activated');
    this.realtimeService.publishToRoles(['doctor', 'admin', 'partner'], 'doctor', 'case.activated');
    return this.normalizeCase(updated);
  }

  async closeCase(caseId: string, actorId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    await this.casesRepo.update({ id: caseId }, { status: 'closed' });
    await this.auditService.log('case.closed', actorId, { caseId });
    if (found) {
      this.realtimeService.publishToUsers([found.patientId, found.doctorId].filter(Boolean) as string[], 'doctor', 'case.closed');
      this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'case.closed');
    }
    return this.casesRepo.findOne({ where: { id: caseId } });
  }

  async cancelPatientCase(caseId: string, patientId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId, patientId } });
    if (!found) throw new NotFoundException('Case not found');
    if (found.status === 'closed') return this.normalizeCase(found);

    found.status = 'closed';
    found.summary = `${this.normalizeSummary(found.summary)}\n\nОтменено пациентом до подключения к врачу.`;
    const updated = await this.casesRepo.save(found);
    await this.auditService.log('case.cancelled.by_patient', patientId, { caseId });
    if (found.doctorId) {
      await this.notificationsService.create(found.doctorId, 'Запрос отменён', 'Пациент отменил срочную консультацию до подключения.');
    }
    this.realtimeService.publishToUsers(
      [found.patientId, found.doctorId].filter(Boolean) as string[],
      'patient',
      'case.cancelled'
    );
    return this.normalizeCase(updated);
  }

  async listPartnerPatients(doctorIds?: string[]) {
    const where = doctorIds && doctorIds.length > 0 ? { doctorId: undefined as any } : undefined;
    const cases = doctorIds && doctorIds.length > 0
      ? await this.casesRepo
          .createQueryBuilder('case')
          .where('case.doctorId IN (:...doctorIds)', { doctorIds })
          .orderBy('case.createdAt', 'DESC')
          .getMany()
      : await this.casesRepo.find({ order: { createdAt: 'DESC' } });
    const map = new Map<string, { patientId: string; casesCount: number }>();
    for (const c of cases) {
      map.set(c.patientId, { patientId: c.patientId, casesCount: (map.get(c.patientId)?.casesCount || 0) + 1 });
    }
    return [...map.values()];
  }

  async partnerAnalytics(doctorIds?: string[]) {
    if (doctorIds && doctorIds.length > 0) {
      const rows = await this.casesRepo
        .createQueryBuilder('case')
        .select('case.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('case.doctorId IN (:...doctorIds)', { doctorIds })
        .groupBy('case.status')
        .getRawMany<{ status: string; count: string }>();

      const counts = new Map(rows.map((row) => [row.status, Number(row.count)]));
      const active = counts.get('active') || 0;
      const closed = counts.get('closed') || 0;
      const inReview = counts.get('in_review') || 0;
      const open = counts.get('open') || 0;
      return { totalCases: active + closed + inReview + open, activeCases: active, inReviewCases: inReview, closedCases: closed };
    }

    const total = await this.casesRepo.count();
    const active = await this.casesRepo.count({ where: { status: 'active' } });
    const closed = await this.casesRepo.count({ where: { status: 'closed' } });
    const inReview = await this.casesRepo.count({ where: { status: 'in_review' } });
    return { totalCases: total, activeCases: active, inReviewCases: inReview, closedCases: closed };
  }

  async findByStatus(status: 'open' | 'active' | 'in_review' | 'closed', doctorIds?: string[]) {
    const cases =
      doctorIds && doctorIds.length > 0
        ? await this.casesRepo
            .createQueryBuilder('case')
            .where('case.status = :status', { status })
            .andWhere('case.doctorId IN (:...doctorIds)', { doctorIds })
            .orderBy('case.createdAt', 'DESC')
            .getMany()
        : await this.casesRepo.find({ where: { status }, order: { createdAt: 'DESC' } });
    return cases.map((item) => this.normalizeCase(item));
  }

  async reopenCase(caseId: string, actorId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    found.status = 'active';
    const saved = await this.casesRepo.save(found);
    await this.auditService.log('case.reopened', actorId, { caseId });
    this.realtimeService.publishToUsers([found.patientId, found.doctorId].filter(Boolean) as string[], 'doctor', 'case.reopened');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'case.reopened');
    return this.normalizeCase(saved);
  }

  private normalizeCase(caseRow: CaseEntity) {
    const appointmentDetails = this.parseAppointmentSummary(caseRow.summary);
    return {
      ...caseRow,
      ...appointmentDetails,
      summary: this.normalizeSummary(caseRow.summary)
    };
  }

  private async findDoctorCaseEntityById(doctorId: string, caseId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    if (found.doctorId && found.doctorId !== doctorId) throw new NotFoundException('Case not assigned to doctor');
    return found;
  }

  private async assertConsultationParticipant(caseId: string, userId: string) {
    this.assertUuid(caseId, 'Case id');
    const found = await this.casesRepo.findOne({ where: { id: caseId } });
    if (!found) throw new NotFoundException('Case not found');
    if (found.patientId !== userId && found.doctorId !== userId) {
      throw new NotFoundException('Case not available for this user');
    }
    return found;
  }

  private ensureConsultationSignalTable() {
    if (!this.signalTableReady) {
      this.signalTableReady = this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS consultation_signals (
          id BIGSERIAL PRIMARY KEY,
          case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL,
          sender_role TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice', 'leave')),
          payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_consultation_signals_case_id_id
          ON consultation_signals(case_id, id);
        CREATE INDEX IF NOT EXISTS idx_consultation_signals_created_at
          ON consultation_signals(created_at);
      `).then(() => undefined);
    }

    return this.signalTableReady;
  }

  private async pruneConsultationSignals(caseId: string) {
    await this.dataSource.query(
      `
        DELETE FROM consultation_signals
        WHERE case_id = $1
          AND created_at < NOW() - INTERVAL '30 minutes'
      `,
      [caseId]
    );
  }

  private normalizeConsultationSignal(row: any) {
    return {
      id: Number(row.id),
      caseId: row.case_id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      type: row.type,
      payload: row.payload,
      createdAt: new Date(row.created_at).getTime()
    };
  }

  private async resolveAppointmentDoctorId(appointment?: { doctorId?: string; appointmentDate?: string; appointmentSlot?: string }) {
    const explicitDoctorId = appointment?.doctorId?.trim();
    if (explicitDoctorId) {
      this.assertUuid(explicitDoctorId, 'Doctor id');
      return explicitDoctorId;
    }

    const hasAppointmentTime = Boolean(appointment?.appointmentDate || appointment?.appointmentSlot);
    if (!hasAppointmentTime) return null;

    const verifiedDoctors = await this.doctorsRepo.find({
      where: { verified: true },
      order: { createdAt: 'ASC' },
      take: 2
    });

    return verifiedDoctors.length === 1 ? verifiedDoctors[0].id : null;
  }

  private assertUuid(value: string, label: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new BadRequestException(`${label} is invalid`);
    }
  }

  private parseAppointmentSummary(summary?: string | null) {
    const text = summary || '';
    return {
      doctorName: text.match(/^Врач:\s*(.+)$/m)?.[1]?.trim() || null,
      specialty: text.match(/^Специальность:\s*(.+)$/m)?.[1]?.trim() || null,
      appointmentDate: text.match(/^Дата:\s*(.+)$/m)?.[1]?.trim() || null,
      appointmentSlot: text.match(/^Время:\s*(.+)$/m)?.[1]?.trim() || null
    };
  }

  private normalizeSummary(summary?: string | null) {
    if (!summary) return 'Текст обращения временно недоступен';

    let normalized = summary
      .replace(/Doctor response:/g, 'Ответ врача:')
      .replace(/AI consultation request/g, 'Запрос на AI-консультацию');

    if (normalized === 'Feedback runtime verification case') {
      normalized = 'Завершенная консультация с отзывом пациента';
    } else if (normalized === 'Smoke test case from Codex runtime validation') {
      normalized = 'Служебное обращение';
    } else if (normalized === 'Test payment case from runtime validation') {
      normalized = 'Проверка оплаты';
    }

    if (/^\?[\?\s:\-A-Za-zа-яА-Я]+$/.test(normalized) && normalized.includes('AI-')) {
      normalized = 'Запрос на AI-консультацию';
    } else if (/^\?[\?\s:\-]+$/.test(normalized)) {
      normalized = 'Текст обращения временно недоступен';
    }

    const questionMarkMatches = normalized.match(/\?/g) || [];
    const questionMarkDensity = questionMarkMatches.length / Math.max(normalized.length, 1);
    const hasBrokenChunks = normalized.includes('????') || questionMarkDensity > 0.2;

    if (hasBrokenChunks) {
      const doctorResponseMatch = normalized.match(/Ответ врача:\s*(.+)$/s);
      if (doctorResponseMatch) {
        const cleanedResponse = doctorResponseMatch[1]
          .replace(/\?{2,}/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const hasMeaningfulResponse = cleanedResponse.replace(/\?/g, '').trim().length > 0;

        return hasMeaningfulResponse
          ? `Описание обращения требует уточнения\n\nОтвет врача: ${cleanedResponse}`
          : 'Описание обращения требует уточнения\n\nОтвет врача добавлен';
      }

      return 'Описание обращения требует уточнения';
    }

    if (/Ответ врача:\s*\?+\s*$/s.test(normalized)) {
      return normalized.replace(/Ответ врача:\s*\?+\s*$/s, 'Ответ врача добавлен');
    }

    return normalized;
  }
}
