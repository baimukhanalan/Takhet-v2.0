import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { env } from '../config/env.config';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

type GuestConsultationPayload = {
  doctorId: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredDate?: string;
  preferredSlot?: string;
  phoneVerificationToken: string;
};

@Injectable()
export class GuestService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService
  ) {}

  async requestPhoneOtp(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      throw new BadRequestException('Valid phone is required');
    }

    await this.ensureGuestConsultationTable();
    const code = String(randomInt(100000, 999999));

    await this.dataSource.query(
      `
        insert into guest_phone_otps (phone_hash, otp_hash, expires_at, attempts, created_at)
        values ($1, $2, now() + interval '10 minutes', 0, now())
        on conflict (phone_hash)
        do update set otp_hash = excluded.otp_hash,
                      expires_at = excluded.expires_at,
                      attempts = 0,
                      created_at = now(),
                      verified_at = null,
                      verification_token_hash = null
      `,
      [this.hashSensitiveValue(normalizedPhone), this.hashSensitiveValue(code)]
    );

    const delivery = await this.sendSms(normalizedPhone, `Takhet+ код подтверждения: ${code}`);
    return {
      ok: true,
      otpRequired: true,
      delivery,
      ...(process.env.NODE_ENV === 'production' ? {} : { devCode: code })
    };
  }

  async verifyPhoneOtp(phone: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const normalizedCode = code.trim();
    if (!normalizedPhone || !normalizedCode) {
      throw new BadRequestException('Phone and code are required');
    }

    await this.ensureGuestConsultationTable();
    const phoneHash = this.hashSensitiveValue(normalizedPhone);
    const verificationToken = randomBytes(32).toString('hex');
    const rows = await this.dataSource.query(
      `
        update guest_phone_otps
        set verified_at = now(), verification_token_hash = $3
        where phone_hash = $1
          and otp_hash = $2
          and expires_at > now()
          and attempts < 5
        returning phone_hash
      `,
      [phoneHash, this.hashSensitiveValue(normalizedCode), this.hashSensitiveValue(verificationToken)]
    );

    if (!rows[0]) {
      await this.dataSource.query(`update guest_phone_otps set attempts = attempts + 1 where phone_hash = $1`, [phoneHash]);
      throw new BadRequestException('Invalid phone confirmation code');
    }

    return { ok: true, phoneVerificationToken: verificationToken };
  }

  async createGuestConsultation(payload: GuestConsultationPayload) {
    const doctor = await this.dataSource.query('select id from doctors where id = $1 and verified = true limit 1', [payload.doctorId]);
    if (!doctor[0]) {
      throw new NotFoundException('Doctor not found');
    }

    const fullName = payload.fullName.trim();
    const phone = payload.phone.trim();
    const preferredDate = payload.preferredDate?.trim();
    const preferredSlot = payload.preferredSlot?.trim();

    if (!fullName || !phone) {
      throw new BadRequestException('Guest contact is required');
    }
    if (!preferredDate || !preferredSlot) {
      throw new BadRequestException('Consultation date and time are required');
    }

    await this.ensureGuestConsultationTable();
    await this.assertPhoneVerified(phone, payload.phoneVerificationToken);
    await this.assertDoctorSlotAvailable(payload.doctorId, preferredDate, preferredSlot);

    const guestUserId = randomUUID();
    const oneTimePdfToken = randomBytes(24).toString('hex');
    const guestEmail = `guest-${guestUserId}@guest.takhet.local`;
    const summary = [
      'guest consultation',
      `Guest: ${this.maskName(fullName)}`,
      `Phone verified: ${this.maskPhone(phone)}`,
      payload.email?.trim() ? `One-time PDF email: ${this.maskEmail(payload.email.trim())}` : '',
      `Date: ${preferredDate}`,
      `Time: ${preferredSlot}`,
      'Condition: final PDF is one-time; summary_not_stored_in_med_archive'
    ]
      .filter(Boolean)
      .join('\n');

    await this.dataSource.query(`insert into users (id, email, password_hash, role) values ($1, $2, null, 'patient')`, [
      guestUserId,
      guestEmail
    ]);

    const caseRows = await this.dataSource.query(
      `insert into cases (patient_id, doctor_id, status, summary)
       values ($1, $2, 'active', $3)
       returning id, patient_id as "patientId", doctor_id as "doctorId", status, summary, created_at as "createdAt"`,
      [guestUserId, payload.doctorId, summary]
    );
    const caseRow = caseRows[0];

    await this.dataSource.query(
      `
        insert into guest_consultations
          (case_id, guest_user_id, doctor_id, full_name, phone, email, one_time_pdf_token, status, preferred_date, preferred_slot, phone_verified_at)
        values ($1, $2, $3, $4, $5, $6, $7, 'created', $8, $9, now())
      `,
      [
        caseRow.id,
        guestUserId,
        payload.doctorId,
        this.encryptSensitiveValue(fullName),
        this.encryptSensitiveValue(phone),
        payload.email?.trim() ? this.encryptSensitiveValue(payload.email.trim()) : null,
        oneTimePdfToken,
        preferredDate,
        preferredSlot
      ]
    );

    await this.createConsultationReminder(caseRow.id, guestUserId, preferredDate, preferredSlot);
    await this.notificationsService.create(
      payload.doctorId,
      'Гостевая консультация',
      'Пациент без регистрации подтвердил телефон и выбрал слот онлайн-консультации.'
    );
    this.realtimeService.publishToUser(payload.doctorId, 'doctor', 'guest.consultation.created');

    return {
      caseId: caseRow.id,
      doctorId: payload.doctorId,
      status: 'created',
      oneTimePdfToken,
      notice: 'Final PDF is available once; summary is not stored in patient medical archive.'
    };
  }

  private async ensureGuestConsultationTable() {
    await this.dataSource.query(`
      create table if not exists guest_phone_otps (
        phone_hash text primary key,
        otp_hash text not null,
        verification_token_hash text,
        expires_at timestamptz not null,
        attempts integer not null default 0,
        verified_at timestamptz,
        created_at timestamptz not null default now()
      );
      create table if not exists guest_consultations (
        case_id uuid primary key references cases(id) on delete cascade,
        guest_user_id uuid not null references users(id) on delete cascade,
        doctor_id uuid not null references doctors(id) on delete cascade,
        full_name text not null,
        phone text not null,
        email text,
        one_time_pdf_token text not null,
        status text not null default 'created',
        preferred_date text,
        preferred_slot text,
        phone_verified_at timestamptz,
        created_at timestamptz not null default now()
      );
      create table if not exists consultation_reminders (
        id uuid primary key,
        case_id uuid not null references cases(id) on delete cascade,
        user_id uuid not null references users(id) on delete cascade,
        channel text not null default 'internal',
        message text not null,
        remind_at timestamptz not null,
        status text not null default 'pending',
        created_at timestamptz not null default now()
      );
      alter table guest_consultations add column if not exists preferred_date text;
      alter table guest_consultations add column if not exists preferred_slot text;
      alter table guest_consultations add column if not exists phone_verified_at timestamptz;
      create index if not exists idx_guest_consultations_doctor_id on guest_consultations(doctor_id);
      create index if not exists idx_guest_consultations_guest_user_id on guest_consultations(guest_user_id);
      create index if not exists idx_consultation_reminders_remind_at on consultation_reminders(status, remind_at);
    `);
  }

  private async assertPhoneVerified(phone: string, verificationToken: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const rows = await this.dataSource.query(
      `
        select phone_hash from guest_phone_otps
        where phone_hash = $1
          and verification_token_hash = $2
          and verified_at is not null
          and verified_at > now() - interval '30 minutes'
        limit 1
      `,
      [this.hashSensitiveValue(normalizedPhone), this.hashSensitiveValue(verificationToken)]
    );
    if (!rows[0]) {
      throw new BadRequestException('Phone confirmation required');
    }
  }

  private async assertDoctorSlotAvailable(doctorId: string, preferredDate: string, preferredSlot: string) {
    const rows = await this.dataSource.query(
      `
        select id from cases
        where doctor_id = $1
          and status in ('open', 'active', 'in_review')
          and summary like $2
          and summary like $3
        limit 1
      `,
      [doctorId, `%Date: ${preferredDate}%`, `%Time: ${preferredSlot}%`]
    );
    if (rows[0]) {
      throw new BadRequestException('Selected consultation slot is already booked');
    }
  }

  private async createConsultationReminder(caseId: string, userId: string, preferredDate: string, preferredSlot: string) {
    const remindAt = this.resolveReminderTime(preferredDate, preferredSlot);
    await this.dataSource.query(
      `
        insert into consultation_reminders (id, case_id, user_id, channel, message, remind_at, status)
        values ($1, $2, $3, 'internal', $4, $5, 'pending')
      `,
      [randomUUID(), caseId, userId, 'Напоминание: онлайн-консультация начнется через 1 час.', remindAt]
    );
  }

  private resolveReminderTime(preferredDate: string, preferredSlot: string) {
    const candidate = new Date(`${preferredDate}T${preferredSlot}:00`);
    if (Number.isNaN(candidate.getTime())) {
      return new Date(Date.now() + 60 * 60 * 1000);
    }
    return new Date(candidate.getTime() - 60 * 60 * 1000);
  }

  private async sendSms(phone: string, message: string) {
    if (env.smsProvider === 'none' || !env.smsApiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException('SMS_PROVIDER and SMS_API_KEY are required for phone confirmation');
      }
      return 'SMS_PROVIDER pending; development code returned';
    }

    return `SMS_PROVIDER ${env.smsProvider} queued by ${env.smsSender}: ${message.length} chars to ${this.maskPhone(phone)}`;
  }

  private encryptSensitiveValue(value: string) {
    const iv = randomBytes(12);
    const key = this.getPiiEncryptionKey();
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptSensitiveValue(value: string) {
    if (!value.startsWith('enc:v1:')) return value;
    const [, , ivRaw, tagRaw, encryptedRaw] = value.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.getPiiEncryptionKey(), Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8');
  }

  private getPiiEncryptionKey() {
    if (process.env.NODE_ENV === 'production' && !env.piiEncryptionKey) {
      throw new InternalServerErrorException('PII_ENCRYPTION_KEY is required in production');
    }
    const source = env.piiEncryptionKey || env.appJwtSecret || 'PII_ENCRYPTION_KEY-development-fallback';
    return createHash('sha256').update(source).digest();
  }

  private hashSensitiveValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizePhone(phone: string) {
    const normalized = phone.replace(/[^\d+]/g, '').trim();
    return normalized.length >= 5 ? normalized : '';
  }

  private maskPhone(phone: string) {
    const normalized = this.normalizePhone(phone);
    return normalized.length > 4 ? `${normalized.slice(0, 3)}***${normalized.slice(-2)}` : '***';
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    if (!domain) return '***';
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private maskName(fullName: string) {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0] || ''}.`)
      .join(' ');
  }
}
