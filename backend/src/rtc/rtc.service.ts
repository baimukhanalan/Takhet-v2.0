import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createSession(caseId: string, doctorId: string, patientId: string, actorId: string) {
    const created = await this.rtcRepo.save(this.rtcRepo.create({ caseId, doctorId, patientId, status: 'waiting' }));
    await this.casesService.setCaseStatus(caseId, 'assigned', actorId);
    await this.auditService.log('consultation.scheduled', actorId, { sessionId: created.id, caseId, doctorId, patientId });
    return created;
  }

  async joinSession(sessionId: string, actorId: string) {
    const session = await this.getOrFail(sessionId);
    session.status = 'active';
    if (!session.startedAt) session.startedAt = new Date();
    const saved = await this.rtcRepo.save(session);
    await this.casesService.setCaseStatus(session.caseId, 'consultation_started', actorId);
    await this.auditService.log('consultation.started', actorId, { sessionId });
    return saved;
  }

  async saveOffer(sessionId: string, sdp: string, actorId: string) {
    const session = await this.getOrFail(sessionId);
    session.offerSdp = sdp;
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.offer', actorId, { sessionId });
    return saved;
  }

  async saveAnswer(sessionId: string, sdp: string, actorId: string) {
    const session = await this.getOrFail(sessionId);
    session.answerSdp = sdp;
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.answer', actorId, { sessionId });
    return saved;
  }

  async saveIce(sessionId: string, role: 'doctor' | 'patient', candidate: any, actorId: string) {
    const session = await this.getOrFail(sessionId);
    session.iceCandidates = [...(session.iceCandidates || []), { role, candidate }];
    const saved = await this.rtcRepo.save(session);
    await this.auditService.log('rtc.ice', actorId, { sessionId, role });
    return saved;
  }

  async endSession(sessionId: string, actorId: string) {
    const session = await this.getOrFail(sessionId);
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

  private async getOrFail(sessionId: string) {
    const session = await this.rtcRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('RTC session not found');
    return session;
  }
}
