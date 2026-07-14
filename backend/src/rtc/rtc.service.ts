import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RtcSession } from './rtc-session.entity';
import { AuditService } from '../audit/audit.service';
import { CasesService } from '../cases/cases.service';

@Injectable()
export class RtcService {
  constructor(
    @InjectRepository(RtcSession) private readonly rtcRepo: Repository<RtcSession>,
    private readonly auditService: AuditService,
    private readonly casesService: CasesService
  ) {}

  async createSession(caseId: string, doctorId: string, patientId: string, actorId: string, actorRole?: string) {
    this.assertCanCreateSession(doctorId, patientId, actorId, actorRole);
    const created = await this.rtcRepo.save(this.rtcRepo.create({ caseId, doctorId, patientId, status: 'waiting' }));
    await this.casesService.setCaseStatus(caseId, 'assigned', actorId);
    await this.auditService.log('consultation.scheduled', actorId, { sessionId: created.id, caseId, doctorId, patientId });
    return created;
  }

  async joinSession(sessionId: string, actorId: string, actorRole?: string) {
    const session = await this.getAuthorizedSession(sessionId, actorId, actorRole);
    session.status = 'active';
    if (!session.startedAt) session.startedAt = new Date();
    const saved = await this.rtcRepo.save(session);
    await this.casesService.setCaseStatus(session.caseId, 'consultation_started', actorId);
    await this.auditService.log('consultation.started', actorId, { sessionId });
    return saved;
  }

  async saveOffer(sessionId: string, sdp: string, actorId: string, actorRole?: string) {
    const session = await this.getAuthorizedSession(sessionId, actorId, actorRole);
    session.offerSdp = sdp;
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.offer', actorId, { sessionId });
    return saved;
  }

  async saveAnswer(sessionId: string, sdp: string, actorId: string, actorRole?: string) {
    const session = await this.getAuthorizedSession(sessionId, actorId, actorRole);
    session.answerSdp = sdp;
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.answer', actorId, { sessionId });
    return saved;
  }

  async saveIce(sessionId: string, role: 'doctor' | 'patient', candidate: any, actorId: string, actorRole?: string) {
    const session = await this.getAuthorizedSession(sessionId, actorId, actorRole);
    if (actorRole !== 'admin') {
      const actorSessionRole = actorId === session.doctorId ? 'doctor' : 'patient';
      if (role !== actorSessionRole) throw new ForbiddenException('RTC role does not match authenticated user');
    }
    session.iceCandidates = [...(session.iceCandidates || []), { role, candidate }];
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.ice', actorId, { sessionId, role });
    return saved;
  }

  async endSession(sessionId: string, actorId: string, actorRole?: string) {
    const session = await this.getAuthorizedSession(sessionId, actorId, actorRole);
    const endTime = new Date();
    session.status = 'ended';
    session.endedAt = endTime;
    if (!session.startedAt) session.startedAt = endTime;
    session.duration = Math.max(0, Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000));
    const saved = await this.rtcRepo.save(session);
    await this.casesService.setCaseStatus(session.caseId, 'consultation_finished', actorId);
    await this.auditService.log('consultation.ended', actorId, { sessionId, duration: saved.duration });
    return saved;
  }

  private assertCanCreateSession(doctorId: string, patientId: string, actorId: string, actorRole?: string) {
    if (actorRole === 'admin') return;
    if (actorId !== doctorId && actorId !== patientId) {
      throw new ForbiddenException('User is not a participant in this RTC session');
    }
  }

  private async getAuthorizedSession(sessionId: string, actorId: string, actorRole?: string) {
    const session = await this.getOrFail(sessionId);
    if (actorRole === 'admin') return session;
    if (actorId !== session.doctorId && actorId !== session.patientId) {
      throw new ForbiddenException('User is not a participant in this RTC session');
    }
    return session;
  }

  private async getOrFail(sessionId: string) {
    const session = await this.rtcRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('RTC session not found');
    return session;
  }
}
