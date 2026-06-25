import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

type PortalRole = 'doctor' | 'patient' | 'partner';

type DoctorProfilePayload = {
  avatar?: string;
  fullName?: string;
  specialty?: string;
  catalogAudience?: 'doctor' | 'mental' | 'both';
  bio?: string;
  headline?: string;
  languages?: string[];
  consultationModes?: string[];
  focusAreas?: string[];
  education?: string[];
  city?: string;
  clinicName?: string;
  responseTargetHours?: number;
  pricePrimary?: number;
  experienceYears?: number;
  accepts?: string;
  availability?: { date: string; slots: string[] }[];
};

type DoctorAvailabilityEntry = { date: string; slots: string[] };

type GenericPortalProfilePayload = {
  phone?: string;
  city?: string;
  organizationName?: string;
  emergencyContact?: string;
  notificationsMode?: string;
  preferredChannel?: string;
  about?: string;
  commission?: number;
};

type StoredFeedback = {
  caseId: string;
  doctorId: string;
  patientUserId: string;
  score: number;
  review: string;
  createdAt: string;
};

type ConsultationTranscriptEntry = {
  speaker: 'patient' | 'doctor' | 'ai' | 'system';
  text: string;
  createdAt: string;
};

type ConsultationUploadedDoc = {
  name: string;
  analysis: string;
};

type StoredConsultationReport = {
  caseId: string;
  patientUserId: string;
  doctorId: string | null;
  status: 'draft' | 'awaiting_doctor' | 'confirmed';
  transcript: ConsultationTranscriptEntry[];
  uploadedDocs: ConsultationUploadedDoc[];
  aiSummary: string;
  doctorRecommendations: string;
  finalReport: string;
  pdfBase64: string | null;
  updatedAt: string;
  confirmedAt: string | null;
};

type StoredAppState = {
  aiBrowserHistory: string[];
  aiBrowserCache: Record<string, unknown>;
  takhetAiChatArchive: unknown[];
  updatedAt: string | null;
};

const DEFAULT_CLINIC_NAME = 'Takhet+ Network';
const LEGACY_PARTNER_ORGANIZATION_NAME = 'Takhet+ Partner Clinic';
const APP_STATE_KEY = 'app_state';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService
  ) {}

  async getDoctorProfile(userId: string, fallback: { specialty: string; verified: boolean; experienceYears: number; fullName: string }) {
    const stored = await this.getSettingsValue<DoctorProfilePayload>(userId, 'doctor_profile');
    const rating = await this.getDoctorRatingSummary(userId);

    return {
      id: userId,
      avatar: stored?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(stored?.fullName || fallback.fullName)}&background=0D47A1&color=fff`,
      fullName: this.normalizeDoctorFullName(stored?.fullName || fallback.fullName, fallback.fullName),
      specialty: this.normalizeDoctorSpecialty(stored?.specialty || fallback.specialty, fallback.specialty),
      catalogAudience: stored?.catalogAudience || 'doctor',
      bio: stored?.bio || '',
      headline: this.normalizeLegacyDoctorLabel(stored?.headline || 'Специалист цифровой медицины'),
      languages: stored?.languages || ['Русский', 'Қазақша'],
      consultationModes: stored?.consultationModes || ['AI triage', 'Chat', 'Video'],
      focusAreas: (stored?.focusAreas || [fallback.specialty, 'Повторное наблюдение']).map((item) =>
        this.normalizeLegacyDoctorLabel(item)
      ),
      education: (stored?.education || ['Клиническая практика']).map((item) => this.normalizeLegacyDoctorLabel(item)),
      city: stored?.city || 'Almaty',
      clinicName: stored?.clinicName || DEFAULT_CLINIC_NAME,
      responseTargetHours: stored?.responseTargetHours || 2,
      pricePrimary: stored?.pricePrimary || 15000,
      accepts: stored?.accepts || 'Взрослых',
      availability: this.expandAvailability(stored?.availability || []),
      availabilityRules: stored?.availability || [],
      active: fallback.verified,
      verified: fallback.verified,
      experienceYears: this.normalizeNumber(stored?.experienceYears, fallback.experienceYears, fallback.experienceYears),
      rating: rating.rating,
      reviewsCount: rating.reviewsCount,
      recentReviews: rating.recentReviews
    };
  }

  async getDoctorProfileSetupState(userId: string) {
    const stored = await this.getSettingsValue<DoctorProfilePayload>(userId, 'doctor_profile');
    const availability = this.expandAvailability(stored?.availability || []);
    const hasRequiredText =
      Boolean(stored?.fullName?.trim()) &&
      Boolean(stored?.specialty?.trim()) &&
      Boolean((stored?.bio || stored?.headline || '').trim()) &&
      Boolean(stored?.city?.trim()) &&
      Boolean(stored?.clinicName?.trim());

    const hasProfessionalDetails =
      this.normalizeNumber(stored?.experienceYears, undefined, 0) > 0 &&
      this.normalizeNumber(stored?.pricePrimary, undefined, 0) > 0 &&
      this.normalizeStringArray(stored?.education, undefined, []).length > 0;

    const hasAvailability = availability.some((entry) => entry.slots.length > 0);

    return {
      complete: Boolean(stored && hasRequiredText && hasProfessionalDetails && hasAvailability),
      availability
    };
  }

  async updateDoctorProfile(userId: string, payload: DoctorProfilePayload) {
    const current = (await this.getSettingsValue<DoctorProfilePayload>(userId, 'doctor_profile')) || {};
    const next = {
      ...current,
      ...payload,
      avatar: payload.avatar?.trim() || current.avatar || '',
      fullName: payload.fullName?.trim() || current.fullName || '',
      specialty: payload.specialty?.trim() || current.specialty || '',
      catalogAudience: payload.catalogAudience || current.catalogAudience || 'doctor',
      bio: payload.bio?.trim() || current.bio || '',
      headline: payload.headline?.trim() || current.headline || 'Специалист цифровой медицины',
      languages: this.normalizeStringArray(payload.languages, current.languages, ['Русский', 'Қазақша']),
      consultationModes: this.normalizeStringArray(payload.consultationModes, current.consultationModes, ['AI triage', 'Chat', 'Video']),
      focusAreas: this.normalizeStringArray(payload.focusAreas, current.focusAreas, []),
      education: this.normalizeStringArray(payload.education, current.education, []),
      city: payload.city?.trim() || current.city || 'Almaty',
      clinicName: payload.clinicName?.trim() || current.clinicName || DEFAULT_CLINIC_NAME,
      responseTargetHours: this.normalizeNumber(payload.responseTargetHours, current.responseTargetHours, 2),
      pricePrimary: this.normalizeNumber(payload.pricePrimary, current.pricePrimary, 15000),
      experienceYears: this.normalizeNumber(payload.experienceYears, current.experienceYears, 0),
      accepts: payload.accepts?.trim() || current.accepts || 'Взрослых',
      availability: this.normalizeAvailability(payload.availability, current.availability)
    };

    await this.upsertSettingsValue(userId, 'doctor_profile', next);
    await this.auditService.log('doctor.profile.updated', userId, next);
  }

  async assignDoctorClinic(userId: string, clinicName: string) {
    const current = (await this.getSettingsValue<DoctorProfilePayload>(userId, 'doctor_profile')) || {};
    const next = {
      ...current,
      clinicName: clinicName.trim() || current.clinicName || DEFAULT_CLINIC_NAME
    };

    await this.upsertSettingsValue(userId, 'doctor_profile', next);
    await this.auditService.log('doctor.clinic.assigned', userId, { clinicName: next.clinicName });
    return next;
  }

  async getPortalProfile(userId: string, role: PortalRole) {
    const stored = await this.getSettingsValue<GenericPortalProfilePayload>(userId, `${role}_portal_profile`);
    const defaults =
      role === 'patient'
        ? {
            phone: '',
            city: 'Almaty',
            emergencyContact: '',
            notificationsMode: 'instant',
            preferredChannel: 'app',
            about: ''
          }
        : {
            phone: '',
            city: 'Almaty',
            organizationName: role === 'partner' ? DEFAULT_CLINIC_NAME : '',
            commission: role === 'partner' ? 15 : undefined,
            notificationsMode: 'instant',
            preferredChannel: 'app',
            about: ''
          };

    return {
      role,
      ...defaults,
      ...(stored || {})
    };
  }

  async updatePortalProfile(userId: string, role: PortalRole, payload: GenericPortalProfilePayload) {
    const current = (await this.getSettingsValue<GenericPortalProfilePayload>(userId, `${role}_portal_profile`)) || {};
    const next = {
      ...current,
      ...payload,
      phone: payload.phone?.trim() || current.phone || '',
      city: payload.city?.trim() || current.city || 'Almaty',
      organizationName:
        role === 'partner'
          ? this.normalizePartnerOrganizationName(payload.organizationName?.trim() || current.organizationName || '')
          : payload.organizationName?.trim() || current.organizationName || '',
      emergencyContact: payload.emergencyContact?.trim() || current.emergencyContact || '',
      notificationsMode: payload.notificationsMode?.trim() || current.notificationsMode || 'instant',
      preferredChannel: payload.preferredChannel?.trim() || current.preferredChannel || 'app',
      about: payload.about?.trim() || current.about || '',
      commission:
        role === 'partner'
          ? Math.min(30, Math.max(5, this.normalizeNumber(payload.commission, current.commission, 15)))
          : current.commission
    };

    await this.upsertSettingsValue(userId, `${role}_portal_profile`, next);
    await this.auditService.log(`${role}.profile.updated`, userId, next);
    return next;
  }

  async getAppState(userId: string): Promise<StoredAppState> {
    const stored = await this.getSettingsValue<Partial<StoredAppState>>(userId, APP_STATE_KEY);

    return {
      aiBrowserHistory: Array.isArray(stored?.aiBrowserHistory)
        ? stored.aiBrowserHistory.filter((item): item is string => typeof item === 'string').slice(0, 10)
        : [],
      aiBrowserCache:
        stored?.aiBrowserCache && typeof stored.aiBrowserCache === 'object' && !Array.isArray(stored.aiBrowserCache)
          ? stored.aiBrowserCache
          : {},
      takhetAiChatArchive: Array.isArray(stored?.takhetAiChatArchive) ? stored.takhetAiChatArchive.slice(0, 12) : [],
      updatedAt: stored?.updatedAt || null
    };
  }

  async updateAppState(userId: string, payload: Partial<StoredAppState>) {
    const current = await this.getAppState(userId);
    const next: StoredAppState = {
      aiBrowserHistory: Array.isArray(payload.aiBrowserHistory)
        ? payload.aiBrowserHistory.filter((item): item is string => typeof item === 'string').slice(0, 10)
        : current.aiBrowserHistory,
      aiBrowserCache:
        payload.aiBrowserCache && typeof payload.aiBrowserCache === 'object' && !Array.isArray(payload.aiBrowserCache)
          ? payload.aiBrowserCache
          : current.aiBrowserCache,
      takhetAiChatArchive: Array.isArray(payload.takhetAiChatArchive)
        ? payload.takhetAiChatArchive.slice(0, 12)
        : current.takhetAiChatArchive,
      updatedAt: new Date().toISOString()
    };

    await this.upsertSettingsValue(userId, APP_STATE_KEY, next);
    await this.auditService.log('profiles.app_state.updated', userId, {
      aiBrowserHistory: next.aiBrowserHistory.length,
      aiBrowserCache: Object.keys(next.aiBrowserCache).length,
      takhetAiChatArchive: next.takhetAiChatArchive.length
    });

    return next;
  }

  async exportPatientContext(patientUserId: string) {
    const [profile, caseRows, paymentRows, reportRows] = await Promise.all([
      this.getPortalProfile(patientUserId, 'patient'),
      this.dataSource.query(
        `select id, patient_id as "patientId", doctor_id as "doctorId", status, summary, created_at as "createdAt"
         from cases
         where patient_id = $1
         order by created_at desc
         limit 100`,
        [patientUserId]
      ),
      this.safeQuery(
        `select id, case_id as "caseId", amount, currency, status, created_at as "createdAt"
         from payments
         where patient_id = $1
         order by created_at desc
         limit 100`,
        [patientUserId]
      ),
      this.dataSource.query(
        `select key, value
         from settings
         where user_id = $1 and key like 'consultation_report:%'
         order by key desc
         limit 100`,
        [patientUserId]
      )
    ]);

    const reports = reportRows.map((row: { key: string; value: StoredConsultationReport }) => ({
      caseId: row.key.replace('consultation_report:', ''),
      status: row.value?.status || 'draft',
      aiSummary: row.value?.aiSummary || '',
      doctorRecommendations: row.value?.doctorRecommendations || '',
      finalReport: row.value?.finalReport || '',
      uploadedDocs: row.value?.uploadedDocs || [],
      transcript: (row.value?.transcript || []).slice(-20),
      updatedAt: row.value?.updatedAt || null
    }));

    const payload = {
      generatedAt: new Date().toISOString(),
      patient: {
        id: patientUserId,
        city: profile.city || '',
        phone: profile.phone || '',
        emergencyContact: profile.emergencyContact || '',
        preferredChannel: profile.preferredChannel || '',
        importantNotes: profile.about || ''
      },
      sections: {
        'Хронические и важные особенности': profile.about || 'Пациент пока не добавил хронические заболевания или важные особенности.',
        'Медицинский архив': reports,
        'История обращений': caseRows,
        'Платежи и статусы': paymentRows
      },
      text: ''
    };

    return {
      ...payload,
      text: this.formatPatientContextText(payload)
    };
  }

  async exportPatientCaseContext(caseId: string, patientUserId: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }

    const report = await this.getSettingsValue<StoredConsultationReport>(patientUserId, `consultation_report:${caseId}`);
    const payload = {
      generatedAt: new Date().toISOString(),
      case: caseRow,
      report,
      text: [
        `Кейс: ${caseId}`,
        `Статус: ${caseRow.status}`,
        `Описание: ${caseRow.summary || 'Описание не добавлено'}`,
        report?.aiSummary ? `Краткий отчет: ${report.aiSummary}` : '',
        report?.doctorRecommendations ? `Рекомендации врача: ${report.doctorRecommendations}` : '',
        report?.uploadedDocs?.length ? `Документы:\n${report.uploadedDocs.map((doc) => `- ${doc.name}: ${doc.analysis}`).join('\n')}` : '',
        report?.transcript?.length ? `Ход консультации:\n${report.transcript.map((entry) => `${this.formatSpeaker(entry.speaker)}: ${entry.text}`).join('\n')}` : ''
      ]
        .filter(Boolean)
        .join('\n\n')
    };

    return payload;
  }

  async sharePatientContextToCase(caseId: string, patientUserId: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }

    const context = await this.exportPatientContext(patientUserId);
    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(patientUserId, key);
    const existingTranscript = existing?.transcript || [];
    const alreadyShared = existingTranscript.some((entry) => entry.speaker === 'system' && entry.text.startsWith('Контекст пациента для врача'));
    if (alreadyShared && existing) {
      return existing;
    }

    const contextEntry: ConsultationTranscriptEntry = {
      speaker: 'system',
      text: `Контекст пациента для врача\n\n${context.text}`,
      createdAt: new Date().toISOString()
    };

    const next: StoredConsultationReport = {
      caseId,
      patientUserId,
      doctorId: caseRow.doctorId || existing?.doctorId || null,
      status: existing?.status || 'awaiting_doctor',
      transcript: [contextEntry, ...existingTranscript],
      uploadedDocs: existing?.uploadedDocs || [],
      aiSummary: existing?.aiSummary || '',
      doctorRecommendations: existing?.doctorRecommendations || '',
      finalReport: existing?.finalReport || '',
      pdfBase64: existing?.pdfBase64 || null,
      updatedAt: new Date().toISOString(),
      confirmedAt: existing?.confirmedAt || null
    };

    await this.upsertSettingsValue(patientUserId, key, next);
    await this.auditService.log('patient.context.shared_to_case', patientUserId, { caseId });
    if (caseRow.doctorId) {
      await this.notificationsService.create(caseRow.doctorId, 'Контекст пациента', 'Пациентский контекст автоматически добавлен в чат консультации.');
      this.realtimeService.publishToUsers([caseRow.doctorId], 'doctor', 'patient.context.shared_to_case');
    }
    this.realtimeService.publishToUser(patientUserId, 'patient', 'patient.context.shared_to_case');

    return next;
  }

  async submitDoctorFeedback(caseId: string, patientUserId: string, score: number, review: string) {
    const caseRows = await this.dataSource.query(
      `select id, patient_id as "patientId", doctor_id as "doctorId", status
       from cases
       where id = $1`,
      [caseId]
    );

    const caseRow = caseRows[0];
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }
    if (caseRow.status !== 'closed') {
      throw new BadRequestException('Feedback is available only for closed cases');
    }
    if (!caseRow.doctorId) {
      throw new BadRequestException('Doctor is not assigned for this case');
    }

    const existing = await this.getSettingsValue<StoredFeedback>(patientUserId, `case_feedback:${caseId}`);
    if (existing) {
      throw new BadRequestException('Feedback already submitted for this case');
    }

    const feedback: StoredFeedback = {
      caseId,
      doctorId: caseRow.doctorId,
      patientUserId,
      score,
      review: review.trim(),
      createdAt: new Date().toISOString()
    };

    await this.ensurePatientRecord(patientUserId);
    await this.upsertSettingsValue(patientUserId, `case_feedback:${caseId}`, feedback);

    await this.dataSource.query(
      'insert into doctor_ratings (doctor_id, score, source) values ($1, $2, $3)',
      [caseRow.doctorId, score, 'patient_case_feedback']
    );

    const patientId = await this.lookupPatientId(patientUserId);
    if (patientId && review.trim()) {
      await this.dataSource.query(
        'insert into doctor_reviews (doctor_id, patient_id, review) values ($1, $2, $3)',
        [caseRow.doctorId, patientId, review.trim()]
      );
    }

    await this.auditService.log('doctor.feedback.submitted', patientUserId, feedback);
    this.realtimeService.publishToUsers([patientUserId, caseRow.doctorId], 'patient', 'feedback.submitted');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'feedback.submitted');

    return this.getDoctorRatingSummary(caseRow.doctorId);
  }

  async getDoctorRatingSummary(doctorId: string) {
    const rows = await this.dataSource.query(
      `select value
       from settings
       where key like 'case_feedback:%'
         and value ? 'doctorId'
         and value->>'doctorId' = $1`,
      [doctorId]
    );

    const feedback: StoredFeedback[] = rows
      .map((row: { value: StoredFeedback }) => row.value)
      .filter((item: StoredFeedback | undefined | null): item is StoredFeedback => item != null && typeof item.score === 'number');

    const reviewsCount = feedback.length;
    const rating = reviewsCount > 0 ? Number((feedback.reduce((sum: number, item: StoredFeedback) => sum + item.score, 0) / reviewsCount).toFixed(1)) : 4.8;
    const recentReviews = feedback
      .filter((item: StoredFeedback) => Boolean(item.review))
      .sort((a: StoredFeedback, b: StoredFeedback) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 3)
      .map((item: StoredFeedback) => ({
        caseId: item.caseId,
        score: item.score,
        review: item.review,
        createdAt: item.createdAt
      }));

    return { rating, reviewsCount, recentReviews };
  }

  async saveConsultationDraft(
    caseId: string,
    patientUserId: string,
    payload: {
      transcript: ConsultationTranscriptEntry[];
      uploadedDocs?: ConsultationUploadedDoc[];
      aiSummary?: string;
    }
  ) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(patientUserId, key);
    if (existing?.status === 'confirmed') {
      return existing;
    }

    const incomingTranscript = (payload.transcript || [])
      .map((entry) => ({
        speaker: entry.speaker,
        text: entry.text.trim(),
        createdAt: entry.createdAt || new Date().toISOString()
      }))
      .filter((entry) => Boolean(entry.text));
    const preservedContextEntries = (existing?.transcript || []).filter(
      (entry) => entry.speaker === 'system' && entry.text.startsWith('Контекст пациента для врача')
    );
    const transcript = incomingTranscript.some((entry) => entry.speaker === 'system' && entry.text.startsWith('Контекст пациента для врача'))
      ? incomingTranscript
      : [...preservedContextEntries, ...incomingTranscript];

    const uploadedDocs = (payload.uploadedDocs || [])
      .map((item) => ({
        name: item.name.trim(),
        analysis: item.analysis.trim()
      }))
      .filter((item) => item.name && item.analysis);

    const aiSummary =
      payload.aiSummary?.trim() ||
      (await this.generateStructuredSummary(transcript, uploadedDocs));

    const next: StoredConsultationReport = {
      caseId,
      patientUserId,
      doctorId: caseRow.doctorId || existing?.doctorId || null,
      status: 'awaiting_doctor',
      transcript,
      uploadedDocs,
      aiSummary,
      doctorRecommendations: existing?.doctorRecommendations || '',
      finalReport: existing?.finalReport || '',
      pdfBase64: existing?.pdfBase64 || null,
      updatedAt: new Date().toISOString(),
      confirmedAt: existing?.confirmedAt || null
    };

    await this.upsertSettingsValue(patientUserId, key, next);
    await this.auditService.log('consultation.draft.saved', patientUserId, {
      caseId,
      transcriptEntries: transcript.length,
      uploadedDocs: uploadedDocs.length
    });
    this.realtimeService.publishToUser(patientUserId, 'patient', 'consultation.draft.saved');
    if (caseRow.doctorId) {
      this.realtimeService.publishToUsers([caseRow.doctorId], 'doctor', 'consultation.draft.saved');
    }
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'consultation.draft.saved');

    return next;
  }

  async getConsultationReportForPatient(caseId: string, patientUserId: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }

    return this.getSettingsValue<StoredConsultationReport>(patientUserId, `consultation_report:${caseId}`);
  }

  async getConsultationReportForDoctor(caseId: string, doctorUserId: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.doctorId && caseRow.doctorId !== doctorUserId) {
      throw new BadRequestException('Case is assigned to another doctor');
    }

    const report = await this.getSettingsValue<StoredConsultationReport>(caseRow.patientId, `consultation_report:${caseId}`);
    if (!report) {
      return null;
    }

    return {
      ...report,
      doctorId: caseRow.doctorId || report.doctorId || null
    };
  }

  async appendDoctorConsultationMessage(caseId: string, doctorUserId: string, response: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.doctorId && caseRow.doctorId !== doctorUserId) {
      throw new BadRequestException('Case is assigned to another doctor');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(caseRow.patientId, key);
    const nextTranscript = [
      ...(existing?.transcript || []),
      {
        speaker: 'doctor' as const,
        text: response.trim(),
        createdAt: new Date().toISOString()
      }
    ];
    const nextUploadedDocs = existing?.uploadedDocs || [];
    const nextAiSummary =
      existing?.aiSummary ||
      (await this.generateStructuredSummary(nextTranscript, nextUploadedDocs));

    const next: StoredConsultationReport = {
      caseId,
      patientUserId: caseRow.patientId,
      doctorId: doctorUserId,
      status: existing?.status === 'confirmed' ? 'confirmed' : 'awaiting_doctor',
      transcript: nextTranscript,
      uploadedDocs: nextUploadedDocs,
      aiSummary: nextAiSummary,
      doctorRecommendations: existing?.doctorRecommendations || '',
      finalReport: existing?.finalReport || '',
      pdfBase64: existing?.pdfBase64 || null,
      updatedAt: new Date().toISOString(),
      confirmedAt: existing?.confirmedAt || null
    };

    await this.upsertSettingsValue(caseRow.patientId, key, next);
    await this.auditService.log('consultation.doctor_message.appended', doctorUserId, { caseId });
    this.realtimeService.publishToUsers([caseRow.patientId, doctorUserId], 'doctor', 'consultation.doctor_message.appended');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'consultation.doctor_message.appended');

    return next;
  }

  async saveDoctorConsultationDraft(
    caseId: string,
    doctorUserId: string,
    payload: { aiSummary?: string; doctorRecommendations?: string }
  ) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.doctorId && caseRow.doctorId !== doctorUserId) {
      throw new BadRequestException('Case is assigned to another doctor');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(caseRow.patientId, key);
    if (!existing) {
      throw new NotFoundException('Consultation draft not found');
    }
    if (existing.status === 'confirmed') {
      return existing;
    }

    const next: StoredConsultationReport = {
      ...existing,
      doctorId: doctorUserId,
      status: 'awaiting_doctor',
      aiSummary: payload.aiSummary?.trim() || existing.aiSummary,
      doctorRecommendations: payload.doctorRecommendations?.trim() || existing.doctorRecommendations,
      updatedAt: new Date().toISOString()
    };

    await this.upsertSettingsValue(caseRow.patientId, key, next);
    await this.auditService.log('consultation.doctor_draft.saved', doctorUserId, { caseId });
    this.realtimeService.publishToUsers([caseRow.patientId, doctorUserId], 'doctor', 'consultation.doctor_draft.saved');
    return next;
  }

  async confirmConsultationReport(caseId: string, doctorUserId: string, doctorRecommendations: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.doctorId && caseRow.doctorId !== doctorUserId) {
      throw new BadRequestException('Case is assigned to another doctor');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(caseRow.patientId, key);
    if (!existing) {
      throw new NotFoundException('Consultation draft not found');
    }

    const finalReport = await this.composeFinalConsultationReport(existing, doctorRecommendations);
    const pdfBase64 = await this.generateConsultationPdfBase64(caseId, finalReport);

    const next: StoredConsultationReport = {
      ...existing,
      doctorId: doctorUserId,
      status: 'confirmed',
      doctorRecommendations: doctorRecommendations.trim(),
      finalReport,
      pdfBase64,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.upsertSettingsValue(caseRow.patientId, key, next);
    await this.dataSource.query('update cases set doctor_id = $2, status = $3 where id = $1', [caseId, doctorUserId, 'in_review']);
    await this.auditService.log('consultation.report.confirmed', doctorUserId, { caseId });
    this.realtimeService.publishToUsers([caseRow.patientId, doctorUserId], 'doctor', 'consultation.report.confirmed');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'consultation.report.confirmed');

    return next;
  }

  async finalizeConsultationReportOnClose(caseId: string, doctorUserId: string) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.doctorId && caseRow.doctorId !== doctorUserId) {
      throw new BadRequestException('Case is assigned to another doctor');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(caseRow.patientId, key);
    if (existing?.status === 'confirmed' && existing.pdfBase64) {
      return existing;
    }

    const doctorRecommendations =
      existing?.doctorRecommendations?.trim() ||
      'Консультация завершена. Итоговые рекомендации врача сохранены в медицинском архиве.';
    const baseReport: StoredConsultationReport = existing || {
      caseId,
      patientUserId: caseRow.patientId,
      doctorId: doctorUserId,
      status: 'awaiting_doctor',
      transcript: [],
      uploadedDocs: [],
      aiSummary: caseRow.summary || 'Онлайн-консультация завершена врачом.',
      doctorRecommendations: '',
      finalReport: '',
      pdfBase64: null,
      updatedAt: new Date().toISOString(),
      confirmedAt: null
    };
    const finalReport = await this.composeFinalConsultationReport(baseReport, doctorRecommendations);
    const pdfBase64 = await this.generateConsultationPdfBase64(caseId, finalReport);
    const next: StoredConsultationReport = {
      ...baseReport,
      doctorId: doctorUserId,
      status: 'confirmed',
      doctorRecommendations,
      finalReport,
      pdfBase64,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.upsertSettingsValue(caseRow.patientId, key, next);
    await this.auditService.log('consultation.report.auto_confirmed_on_close', doctorUserId, { caseId });
    this.realtimeService.publishToUsers([caseRow.patientId, doctorUserId], 'doctor', 'consultation.report.confirmed');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'consultation.report.confirmed');

    return next;
  }

  async finalizeAiConsultationReport(
    caseId: string,
    patientUserId: string,
    payload: { aiSummary?: string } = {}
  ) {
    const caseRow = await this.lookupCase(caseId);
    if (!caseRow) {
      throw new NotFoundException('Case not found');
    }
    if (caseRow.patientId !== patientUserId) {
      throw new BadRequestException('Case does not belong to patient');
    }

    const key = `consultation_report:${caseId}`;
    const existing = await this.getSettingsValue<StoredConsultationReport>(patientUserId, key);
    const baseReport: StoredConsultationReport = existing ?? {
      caseId,
      patientUserId,
      doctorId: caseRow.doctorId || null,
      status: 'draft',
      transcript: [],
      uploadedDocs: [],
      aiSummary: payload.aiSummary?.trim() || 'ИИ-консультация завершена. Подробный транскрипт не был сохранен до завершения сессии.',
      doctorRecommendations: '',
      finalReport: '',
      pdfBase64: null,
      updatedAt: new Date().toISOString(),
      confirmedAt: null
    };

    const nextSummary =
      payload.aiSummary?.trim() ||
      baseReport.aiSummary?.trim() ||
      (await this.generateStructuredSummary(baseReport.transcript, baseReport.uploadedDocs));
    const aiRecommendations = await this.generateAiConsultationRecommendations({
      ...baseReport,
      aiSummary: nextSummary
    });
    const finalReport = await this.composeAiConsultationFinalReport(
      {
        ...baseReport,
        aiSummary: nextSummary
      },
      aiRecommendations
    );
    const pdfBase64 = await this.generateConsultationPdfBase64(caseId, finalReport);

    const next: StoredConsultationReport = {
      ...baseReport,
      doctorId: baseReport.doctorId || null,
      status: 'confirmed',
      aiSummary: nextSummary,
      doctorRecommendations: aiRecommendations,
      finalReport,
      pdfBase64,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.upsertSettingsValue(patientUserId, key, next);
    await this.dataSource.query('update cases set status = $2 where id = $1', [caseId, 'closed']);
    await this.notificationsService.create(
      patientUserId,
      'Отчет ИИ-консультации готов',
      'Итоговый отчет сформирован и сохранен в медицинский архив.'
    );
    await this.auditService.log('consultation.ai_report.confirmed', patientUserId, { caseId });
    this.realtimeService.publishToUser(patientUserId, 'patient', 'consultation.ai_report.confirmed');
    this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'consultation.ai_report.confirmed');

    return next;
  }

  private async getSettingsValue<T>(userId: string, key: string): Promise<T | null> {
    const rows = await this.dataSource.query('select value from settings where user_id = $1 and key = $2 limit 1', [userId, key]);
    return rows[0]?.value ?? null;
  }

  private async safeQuery(sql: string, params: unknown[]) {
    try {
      return await this.dataSource.query(sql, params);
    } catch {
      return [];
    }
  }

  private formatPatientContextText(payload: {
    generatedAt: string;
    patient: { city: string; phone: string; emergencyContact: string; preferredChannel: string; importantNotes: string };
    sections: Record<string, unknown>;
  }) {
    const cases = Array.isArray(payload.sections['История обращений']) ? (payload.sections['История обращений'] as any[]) : [];
    const reports = Array.isArray(payload.sections['Медицинский архив']) ? (payload.sections['Медицинский архив'] as any[]) : [];

    return [
      'Контекст пациента для врача',
      `Сформировано: ${payload.generatedAt}`,
      '',
      'Профиль',
      `Город: ${payload.patient.city || 'не указан'}`,
      `Телефон: ${payload.patient.phone || 'не указан'}`,
      `Экстренный контакт: ${payload.patient.emergencyContact || 'не указан'}`,
      `Предпочтительный канал: ${payload.patient.preferredChannel || 'не указан'}`,
      '',
      'Хронические и важные особенности',
      payload.patient.importantNotes || 'Пациент пока не добавил хронические заболевания или важные особенности.',
      '',
      'История обращений',
      cases.length
        ? cases.slice(0, 12).map((item) => `- ${item.createdAt || ''}: ${item.status || ''}; ${item.summary || 'без описания'}`).join('\n')
        : 'Обращения пока не найдены.',
      '',
      'Медицинский архив',
      reports.length
        ? reports.slice(0, 8).map((item) => {
            const docs = Array.isArray(item.uploadedDocs) && item.uploadedDocs.length > 0
              ? `; документы: ${item.uploadedDocs.map((doc: ConsultationUploadedDoc) => doc.name).join(', ')}`
              : '';
            const summary = item.finalReport || item.aiSummary || item.doctorRecommendations || 'отчет без текста';
            return `- Кейс ${item.caseId}: ${summary.slice(0, 700)}${docs}`;
          }).join('\n')
        : 'Материалы архива пока не найдены.',
      '',
      'Примечание',
      'Этот экспорт помогает врачу быстрее понять историю пациента. Он не заменяет очную консультацию и медицинские документы.'
    ].join('\n');
  }

  private async upsertSettingsValue(userId: string, key: string, value: unknown) {
    const existing = await this.dataSource.query('select id from settings where user_id = $1 and key = $2 limit 1', [userId, key]);
    if (existing[0]?.id) {
      await this.dataSource.query('update settings set value = $3::jsonb where id = $1 and user_id = $2', [existing[0].id, userId, JSON.stringify(value)]);
      return;
    }

    await this.dataSource.query('insert into settings (user_id, key, value) values ($1, $2, $3::jsonb)', [userId, key, JSON.stringify(value)]);
  }

  private normalizeStringArray(next?: string[], current?: string[], fallback: string[] = []) {
    const value = next && next.length > 0 ? next : current && current.length > 0 ? current : fallback;
    return value.map((item) => item.trim()).filter(Boolean);
  }

  private normalizeNumber(next?: number, current?: number, fallback = 0) {
    if (typeof next === 'number' && Number.isFinite(next)) return next;
    if (typeof current === 'number' && Number.isFinite(current)) return current;
    return fallback;
  }

  private normalizePartnerOrganizationName(value: string) {
    const normalized = value.trim();
    if (!normalized || normalized === LEGACY_PARTNER_ORGANIZATION_NAME) {
      return DEFAULT_CLINIC_NAME;
    }
    return normalized;
  }

  private normalizeAvailability(next?: DoctorAvailabilityEntry[], current?: DoctorAvailabilityEntry[]) {
    const value = next && next.length > 0 ? next : current && current.length > 0 ? current : [];
    return value
      .map((item) => ({
        date: String(item.date || '').trim(),
        slots: Array.from(new Set((item.slots || []).map((slot) => slot.trim()).filter(Boolean)))
      }))
      .filter((item) => item.date && item.slots.length > 0);
  }

  private expandAvailability(entries: DoctorAvailabilityEntry[], daysAhead = 60) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDate = new Map<string, Set<string>>();
    const hasWeeklyRules = entries.some((entry) => /^weekly:\d$/.test(entry.date));

    const addSlots = (date: string, slots: string[]) => {
      if (!byDate.has(date)) byDate.set(date, new Set<string>());
      const bucket = byDate.get(date)!;
      slots.forEach((slot) => bucket.add(slot));
    };

    entries.forEach((entry) => {
      const slots = Array.from(new Set((entry.slots || []).map((slot) => slot.trim()).filter(Boolean))).sort();
      if (slots.length === 0) return;

      const weeklyMatch = /^weekly:(\d)$/.exec(entry.date);
      if (weeklyMatch) {
        const weekday = Number(weeklyMatch[1]);
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return;

        for (let offset = 0; offset <= daysAhead; offset += 1) {
          const date = new Date(today);
          date.setDate(today.getDate() + offset);
          if (date.getDay() === weekday) {
            addSlots(date.toISOString().slice(0, 10), slots);
          }
        }
        return;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        const date = new Date(`${entry.date}T00:00:00`);
        if (Number.isNaN(date.getTime())) return;

        if (!hasWeeklyRules) {
          const weekday = date.getDay();
          for (let offset = 0; offset <= daysAhead; offset += 1) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + offset);
            if (nextDate.getDay() === weekday) {
              addSlots(nextDate.toISOString().slice(0, 10), slots);
            }
          }
          return;
        }

        if (date >= today) {
          addSlots(entry.date, slots);
        }
      }
    });

    return Array.from(byDate.entries())
      .map(([date, slots]) => ({ date, slots: Array.from(slots).sort() }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private normalizeLegacyDoctorLabel(value: string) {
    if (this.looksCorrupted(value)) {
      return '';
    }

    switch (value) {
      case 'General Practice':
        return 'Общая практика';
      case 'Digital care specialist':
        return 'Специалист цифровой медицины';
      case 'Follow-up care':
        return 'Повторное наблюдение';
      case 'Clinical practice':
        return 'Клиническая практика';
      default:
        return value;
    }
  }

  private normalizeDoctorFullName(value: string, fallback: string) {
    const normalized = value?.trim() || fallback;
    if (this.looksCorrupted(normalized)) {
      return fallback;
    }

    return normalized;
  }

  private normalizeDoctorSpecialty(value: string, fallback: string) {
    const normalized = this.normalizeLegacyDoctorLabel(value?.trim() || fallback);
    const normalizedFallback = this.normalizeLegacyDoctorLabel(fallback?.trim() || 'Общая практика') || 'Общая практика';
    if (!normalized || this.looksCorrupted(normalized)) {
      return !this.looksCorrupted(normalizedFallback) ? normalizedFallback : 'Общая практика';
    }

    return normalized;
  }

  private looksCorrupted(value?: string | null) {
    if (!value) return true;

    const text = value.trim();
    if (!text) return true;
    if (text.includes('????')) return true;
    if (/[\ufffd]/.test(text)) return true;
    if (/\u0420\u045f|\u0420\u2019|\u0420\u040e|\u0420\u045c|\u0421\u0403|\u0421\u201a|\u0420\x98|\u0432\u0402|\u0432\u201e\u2013/.test(text)) return true;

    const questionMarks = (text.match(/\?/g) || []).length;
    return questionMarks > 0 && questionMarks / Math.max(text.length, 1) > 0.2;
  }

  private async ensurePatientRecord(userId: string) {
    const existing = await this.lookupPatientId(userId);
    if (existing) return existing;

    const rows = await this.dataSource.query(
      `insert into patients (id, first_name, last_name, birth_date)
       values ($1, 'Takhet', 'Patient', current_date)
       returning id`,
      [userId]
    );

    return rows[0]?.id ?? null;
  }

  private async lookupPatientId(userId: string) {
    const rows = await this.dataSource.query('select id from patients where id = $1 limit 1', [userId]);
    return rows[0]?.id ?? null;
  }

  private async lookupCase(caseId: string) {
    const rows = await this.dataSource.query(
      `select id, patient_id as "patientId", doctor_id as "doctorId", status, summary
       from cases
       where id = $1
       limit 1`,
      [caseId]
    );

    return rows[0] || null;
  }

  private async generateStructuredSummary(transcript: ConsultationTranscriptEntry[], uploadedDocs: ConsultationUploadedDoc[]) {
    const transcriptText = transcript
      .slice(-20)
      .map((entry) => `${this.formatSpeaker(entry.speaker)}: ${entry.text}`)
      .join('\n');

    const docsText = uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n');
    const fallback = [
      'Краткий разбор',
      transcriptText ? transcriptText : 'Пациент еще не оставил подробное описание.',
      '',
      'Что уточнить',
      'Нужно уточнить длительность симптомов, выраженность, что усиливает или облегчает состояние, температуру и сопутствующие заболевания.',
      '',
      'Красные флаги',
      'Одышка, боль в груди, потеря сознания, кровь, резкое ухудшение состояния.',
      docsText ? `\nРазобранные документы\n${docsText}` : ''
    ]
      .filter(Boolean)
      .join('\n\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || transcript.length === 0) {
      return fallback;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash' });
      const result = await model.generateContent(
        `Сделай строгий русский черновик отчета по консультации.
Никакой воды, никаких вступлений, никакого markdown.
Структура строго:
Краткий разбор
Что уточнить
Красные флаги
Предварительные рекомендации
Разобранные документы

Транскрипт:
${transcriptText || 'Нет данных'}

Документы:
${docsText || 'Нет документов'}`
      );

      const text = result.response.text()?.trim();
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  private async generateAiConsultationRecommendations(report: StoredConsultationReport) {
    const transcriptText = report.transcript
      .map((entry) => `${this.formatSpeaker(entry.speaker)}: ${entry.text}`)
      .join('\n');
    const docsText = report.uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n');
    const fallback = this.normalizePdfText(
      [
        'Предварительные рекомендации ИИ',
        'Наблюдать за динамикой симптомов и следовать описанным безопасным шагам.',
        'Если состояние ухудшается или появляются красные флаги, прекратить самостоятельное ожидание и обратиться за очной или срочной помощью.',
        'Прикрепленные материалы сохранить и показать врачу на следующей консультации.'
      ].join('\n')
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fallback;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro' });
      const result = await model.generateContent(
        `Сформируй финальные рекомендации ИИ по итогам медицинской AI-консультации.
Требования:
- русский язык
- чистый текст без markdown
- конкретно и по делу
- структура строго:
Предварительные рекомендации
Следующие шаги
Когда срочно обращаться за помощью

Транскрипт:
${transcriptText || 'Нет данных'}

Черновик отчета:
${report.aiSummary || 'Нет данных'}

Документы:
${docsText || 'Нет документов'}`
      );

      const text = this.normalizePdfText(result.response.text()?.trim() || '');
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  private async composeFinalConsultationReport(report: StoredConsultationReport, doctorRecommendations: string) {
    const transcriptText = report.transcript
      .map((entry) => `${this.formatSpeaker(entry.speaker)}: ${entry.text}`)
      .join('\n');
    const docsText = report.uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n');
    const fallback = this.normalizePdfText(
      [
        'Отчет по консультации Takhet+',
        '',
        'Жалобы',
        this.extractTranscriptSection(report.transcript, 'patient') || 'Пациент не добавил подробное описание жалоб.',
        '',
        'Ход консультации',
        transcriptText || 'Нет данных по переписке консультации.',
        '',
        'Разбор ИИ',
        report.aiSummary || 'ИИ-разбор пока не сформирован.',
        '',
        'Разобранные документы',
        docsText || 'Документы не прикладывались.',
        '',
        'Рекомендации по консультации',
        doctorRecommendations.trim() || 'Врач подтвердил отчет без дополнительных комментариев.',
        '',
        'Следующие шаги',
        'Ориентироваться на рекомендации врача, сохранить PDF в медицинском архиве и при ухудшении состояния обратиться за повторной консультацией.'
      ].join('\n')
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fallback;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro' });
      const result = await model.generateContent(
        `Подготовь профессиональный отчет консультации на русском языке.
Строго структурируй по разделам:
- Жалобы
- Ход консультации
- Разбор документов
- Рекомендации по консультации
- Следующие шаги

Транскрипт:
${transcriptText || 'Нет данных'}

Черновой AI-разбор:
${report.aiSummary || 'Нет данных'}

Документы:
${docsText || 'Нет документов'}

Подтвержденные рекомендации:
${doctorRecommendations || 'Подтверждено без дополнительных замечаний'}`
      );

      const text = this.normalizePdfText(result.response.text()?.trim() || '');
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  private async composeAiConsultationFinalReport(report: StoredConsultationReport, aiRecommendations: string) {
    const transcriptText = report.transcript
      .map((entry) => `${this.formatSpeaker(entry.speaker)}: ${entry.text}`)
      .join('\n');
    const docsText = report.uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n');
    const fallback = this.normalizePdfText(
      [
        'Отчет по консультации Takhet+',
        '',
        'Жалобы',
        this.extractTranscriptSection(report.transcript, 'patient') || 'Пациент не добавил подробное описание жалоб.',
        '',
        'Ход консультации',
        transcriptText || 'Нет данных по консультации.',
        '',
        'Разбор ИИ',
        report.aiSummary || 'ИИ-разбор пока не сформирован.',
        '',
        'Разобранные документы',
        docsText || 'Документы не прикладывались.',
        '',
        'Рекомендации по консультации',
        aiRecommendations.trim() || 'ИИ завершил консультацию без дополнительных рекомендаций.',
        '',
        'Следующие шаги',
        'Сохранить отчет в медицинском архиве, при необходимости перейти к очной или онлайн консультации врача.'
      ].join('\n')
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fallback;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro' });
      const result = await model.generateContent(
        `Подготовь итоговый структурированный отчет по AI-консультации.
Строго разделы:
- Жалобы
- Ход консультации
- Разбор ИИ
- Разобранные документы
- Рекомендации по консультации
- Следующие шаги

Пиши на русском, чистым текстом, без markdown, без воды.

Транскрипт:
${transcriptText || 'Нет данных'}

Черновик отчета:
${report.aiSummary || 'Нет данных'}

Документы:
${docsText || 'Нет документов'}

Финальные рекомендации по консультации:
${aiRecommendations || 'Нет данных'}`
      );

      const text = this.normalizePdfText(result.response.text()?.trim() || '');
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  private async generateConsultationPdfBase64(caseId: string, content: string) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = join(process.cwd(), 'assets', 'arial.ttf');
    const fontBytes = readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes, { subset: false });

    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const margin = 40;
    const bodyFontSize = 11;
    const bodyLineHeight = 16;
    const sectionTitleSize = 13;
    const sectionWidth = width - margin * 2;
    let cursorY = height - margin;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY - requiredHeight >= margin) {
        return;
      }

      page = pdfDoc.addPage([595, 842]);
      cursorY = height - margin;
    };

    page.drawText('Отчет по консультации Takhet+', {
      x: margin,
      y: cursorY,
      size: 20,
      font: customFont,
      color: rgb(0.05, 0.28, 0.63)
    });
    cursorY -= 24;

    page.drawText(`Кейс: ${caseId}`, {
      x: margin,
      y: cursorY,
      size: 10,
      font: customFont,
      color: rgb(0.32, 0.39, 0.48)
    });
    cursorY -= 10;

    const generatedAt = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    page.drawText(`Сформировано: ${generatedAt}`, {
      x: margin,
      y: cursorY,
      size: 10,
      font: customFont,
      color: rgb(0.32, 0.39, 0.48)
    });
    cursorY -= 26;

    const sections = this.parseConsultationSections(this.normalizePdfText(content));

    for (const section of sections) {
      const wrappedBody = section.body.flatMap((line) => this.wrapText(line, customFont, bodyFontSize, sectionWidth - 24));
      const sectionHeight = Math.max(64, 28 + wrappedBody.length * bodyLineHeight + 20);
      ensureSpace(sectionHeight + 12);

      page.drawRectangle({
        x: margin,
        y: cursorY - sectionHeight + 8,
        width: sectionWidth,
        height: sectionHeight,
        color: rgb(0.98, 0.99, 1),
        borderColor: rgb(0.86, 0.9, 0.95),
        borderWidth: 1
      });

      page.drawText(section.title, {
        x: margin + 12,
        y: cursorY - 16,
        size: sectionTitleSize,
        font: customFont,
        color: rgb(0.05, 0.28, 0.63)
      });

      let sectionCursorY = cursorY - 38;
      for (const line of wrappedBody) {
        page.drawText(line || ' ', {
          x: margin + 12,
          y: sectionCursorY,
          size: bodyFontSize,
          font: customFont,
          color: rgb(0.07, 0.17, 0.27)
        });
        sectionCursorY -= bodyLineHeight;
      }

      cursorY -= sectionHeight + 12;
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes).toString('base64');
  }

  private parseConsultationSections(content: string) {
    const sectionNames = new Set([
      'Жалобы',
      'Ход консультации',
      'Разбор ИИ',
      'Разбор документов',
      'Разобранные документы',
      'Рекомендации врача',
      'Рекомендации по консультации',
      'Когда срочно обращаться за помощью',
      'Следующие шаги'
    ]);

    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line !== 'Отчет по консультации Takhet+');

    const sections: { title: string; body: string[] }[] = [];
    let current: { title: string; body: string[] } | null = null;

    for (const line of lines) {
      if (sectionNames.has(line)) {
        if (current) {
          sections.push(current);
        }
        current = { title: line, body: [] };
        continue;
      }

      if (!current) {
        current = { title: 'Общий итог', body: [] };
      }

      current.body.push(line);
    }

    if (current) {
      sections.push(current);
    }

    return sections.length > 0
      ? sections
      : [
          {
            title: 'Отчет',
            body: [content]
          }
        ];
  }

  private wrapText(text: string, font: any, fontSize: number, maxWidth: number) {
    if (!text.trim()) {
      return [''];
    }

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
        current = next;
        continue;
      }

      if (current) {
        lines.push(current);
      }
      current = word;
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  private extractTranscriptSection(transcript: ConsultationTranscriptEntry[], speaker: ConsultationTranscriptEntry['speaker']) {
    return transcript
      .filter((entry) => entry.speaker === speaker)
      .map((entry) => this.normalizePdfText(entry.text))
      .filter(Boolean)
      .join('\n');
  }

  private normalizePdfText(value: string) {
    const replacements: Array<[string, string]> = [
      ['\u0420\u2014\u0420\u0491\u0421\u0402\u0420\xb0\u0420\u0406\u0421\u0403\u0421\u201a\u0420\u0406\u0421\u0453\u0420\u2116\u0421\u201a\u0420\xb5', '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435'],
      ['\u0420\u045b\u0420\u0457\u0420\u0451\u0421\u20ac\u0420\u0451\u0421\u201a\u0420\xb5', '\u041e\u043f\u0438\u0448\u0438\u0442\u0435'],
      ['\u0420\u0454\u0420\u0455\u0420\u0405\u0421\u0403\u0421\u0453\u0420\xbb\u0421\u040a\u0421\u201a\u0420\xb0\u0421\u2020\u0420\u0451\u0420\u0451', '\u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0438\u0438'],
      ['\u0420\u0456\u0420\u0455\u0421\u0403\u0421\u201a\u0420\xb5\u0420\u0406\u0420\u0455\u0420\u2116', '\u0433\u043e\u0441\u0442\u0435\u0432\u043e\u0439'],
      ['\u0420\x98\u0420\x98', '\u0418\u0418'],
      ['\u0420\u045f\u0420\xb0\u0421\u2020\u0420\u0451\u0420\xb5\u0420\u0405\u0421\u201a', '\u041f\u0430\u0446\u0438\u0435\u043d\u0442'],
      ['\u0420\u2019\u0421\u0402\u0420\xb0\u0421\u2021', '\u0412\u0440\u0430\u0447'],
      ['\u0420\u040e\u0420\u0451\u0421\u0403\u0421\u201a\u0420\xb5\u0420\u0458\u0420\xb0', '\u0421\u0438\u0441\u0442\u0435\u043c\u0430'],
      ['\u0432\u0402\u045e', '\u2022'],
      ['\u0432\u0402\u201d', '\u2014'],
      ['\u0432\u0402\u045a', '"'],
      ['\u0432\u0402\u045c', '"'],
      ['\u0432\u0402\xa6', '...']
    ];

    let normalized = value;
    for (const [broken, readable] of replacements) {
      normalized = normalized.split(broken).join(readable);
    }

    return normalized
      .replace(/[^\x09\x0A\x0D\x20-\uFFFF]/g, '')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/[^\S\n]+/g, ' ')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }

  private formatSpeaker(speaker: ConsultationTranscriptEntry['speaker']) {
    switch (speaker) {
      case 'patient':
        return 'Пациент';
      case 'doctor':
        return 'Врач';
      case 'ai':
        return 'ИИ';
      default:
        return 'Система';
    }
  }
}
