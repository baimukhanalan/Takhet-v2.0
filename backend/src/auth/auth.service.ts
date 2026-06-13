import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sign, verify } from 'jsonwebtoken';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { env } from '../config/env.config';
import { User } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { AuditLog } from '../audit/audit.entity';

export type LoginRole = 'patient' | 'doctor' | 'partner' | 'admin';

@Injectable()
export class AuthService {
  private readonly hashPrefix = 'scrypt';
  private readonly sessionCookieName = 'takhet_session';
  private readonly tempPortalCredentials = {
    login: 'baimukhanalan1@gmail.com',
    password: 'baimukhanalan1@gmail.com'
  } as const;

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Doctor) private readonly doctorsRepo: Repository<Doctor>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource
  ) {}

  verifyToken(authorization?: string, cookieHeader?: string) {
    const token = this.extractToken(authorization, cookieHeader);

    try {
      const payload = verify(token, env.supabaseJwtSecret || env.appJwtSecret) as { sub: string; email: string; role: LoginRole };
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid JWT');
    }
  }

  async login(email: string, password: string, role: LoginRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const isDemoPortalLogin = env.enableDemoPortalLogin && this.isTempPortalLogin(normalizedEmail, password);
    if (!isDemoPortalLogin && !this.isValidEmail(normalizedEmail)) {
      throw new UnauthorizedException('Invalid email format');
    }

    const credentials: Record<LoginRole, { email: string; password: string; userId: string }> = {
      admin: { email: env.appAdminEmail, password: env.appAdminPassword, userId: '11111111-1111-1111-1111-111111111111' },
      doctor: { email: env.appDoctorEmail, password: env.appDoctorPassword, userId: '22222222-2222-2222-2222-222222222222' },
      partner: { email: env.appPartnerEmail, password: env.appPartnerPassword, userId: '33333333-3333-3333-3333-333333333333' },
      patient: { email: env.appPatientEmail, password: env.appPatientPassword, userId: '44444444-4444-4444-4444-444444444444' }
    };

    if (isDemoPortalLogin) {
      const tempAccount = await this.ensureTempPortalAccount(role);
      await this.ensureAccountIsActive(tempAccount.id);
      await this.markEmailVerified(tempAccount.id, tempAccount.email, role);
      await this.markPortalApplicationApproved(tempAccount.id, role, 'temp_portal_login');
      const verified = await this.resolveVerifiedStatus(tempAccount.id, role);
      return this.issueToken(tempAccount.id, this.tempPortalCredentials.login, role, verified);
    }

    const allowed = credentials[role];

    if (normalizedEmail === allowed.email && password === allowed.password) {
      await this.ensureAccountIsActive(allowed.userId);
      await this.ensureCoreAccount(allowed.userId, normalizedEmail, role);
      await this.markEmailVerified(allowed.userId, normalizedEmail, role);
      await this.markPortalApplicationApproved(allowed.userId, role, 'configured_account');
      const verified = await this.resolveVerifiedStatus(allowed.userId, role);
      return this.issueToken(allowed.userId, normalizedEmail, role, verified);
    }

    const user = await this.usersRepo.findOne({ where: { email: normalizedEmail, role } });
    if (!user?.passwordHash || !this.verifyPassword(user.passwordHash, password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.isHashedPassword(user.passwordHash)) {
      user.passwordHash = this.hashPassword(password);
      await this.usersRepo.save(user);
    }

    await this.ensureAccountIsActive(user.id);
    await this.assertEmailVerifiedBeforePortalAccess(user.id, user.email, role);
    await this.assertPortalApplicationApproved(user.id, user.email, role);
    const verified = await this.resolveVerifiedStatus(user.id, role);
    return this.issueToken(user.id, normalizedEmail, role, verified);
  }

  async register(email: string, password: string, role: Exclude<LoginRole, 'admin'>) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!this.isValidEmail(normalizedEmail) || normalizedEmail.endsWith('@takhet.local')) {
      throw new BadRequestException('Valid email is required');
    }
    await this.assertPasswordSafe(password);

    const existingUser = await this.usersRepo.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email: normalizedEmail,
        passwordHash: this.hashPassword(password),
        role
      })
    );

    if (role === 'doctor') {
      await this.doctorsRepo.save(
        this.doctorsRepo.create({
          id: user.id,
          specialization: 'Общая практика',
          licenseNumber: `PENDING-${Date.now()}`,
          experienceYears: 0,
          verified: false
        })
      );
    }

    if (role === 'doctor' || role === 'partner') {
      await this.createPortalApplication(user.id, normalizedEmail, role);
      await this.requestEmailVerification(normalizedEmail, role);
      return {
        ok: true,
        status: 'pending_admin_approval',
        verification: 'verification_required',
        message: 'Application was submitted. Email confirmation and admin approval are required before portal access.'
      };
    }

    await this.requestEmailVerification(normalizedEmail, role);
    return {
      ok: true,
      status: 'verification_required',
      verification: 'verification_required',
      message: 'Email confirmation is required before portal access.'
    };
  }

  async requestEmailVerification(email: string, role: LoginRole) {
    const user = await this.findUserForAuthAction(email, role);
    if (user) {
      const token = await this.createAuthToken(user.id, user.email, role, 'email_verification', 24 * 60);
      const verificationUrl = this.buildEmailVerificationUrl(token);
      const delivery = await this.sendAuthEmail({
        userId: user.id,
        role,
        to: user.email,
        subject: 'Подтверждение почты Takhet+',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2>Подтверждение почты Takhet+</h2>
            <p>Нажмите кнопку ниже, чтобы подтвердить почту аккаунта.</p>
            <p><a href="${verificationUrl}" style="display:inline-block;background:#1554b8;color:#fff;padding:14px 22px;border-radius:16px;text-decoration:none;font-weight:700">Подтвердить почту</a></p>
            <p style="color:#64748b;font-size:13px">Ссылка действует 24 часа. Если вы не запрашивали письмо, просто проигнорируйте его.</p>
          </div>
        `
      });
      await this.auditRepo.save(this.auditRepo.create({ event: 'auth.email_verification.requested', actorId: user.id, payload: { role } }));
      return this.buildTokenDeliveryResponse(token, delivery);
    }

    return this.buildTokenDeliveryResponse(null, { ok: false, reason: 'unknown_account' });
  }

  async confirmEmailVerification(token: string) {
    const row = await this.consumeAuthToken(token, 'email_verification');
    await this.markEmailVerified(row.user_id, row.email, row.role);
    await this.auditRepo.save(this.auditRepo.create({ event: 'auth.email_verified', actorId: row.user_id, payload: { role: row.role } }));
    return { ok: true };
  }

  async requestPasswordReset(email: string, role: LoginRole) {
    const user = await this.findUserForAuthAction(email, role);
    if (user) {
      const token = await this.createAuthToken(user.id, user.email, role, 'password_reset', 60);
      const resetUrl = this.buildPasswordResetUrl(token);
      const delivery = await this.sendAuthEmail({
        userId: user.id,
        role,
        to: user.email,
        subject: 'Восстановление доступа Takhet+',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2>Восстановление доступа Takhet+</h2>
            <p>Нажмите кнопку ниже, чтобы задать новый пароль.</p>
            <p><a href="${resetUrl}" style="display:inline-block;background:#1554b8;color:#fff;padding:14px 22px;border-radius:16px;text-decoration:none;font-weight:700">Восстановить доступ</a></p>
            <p style="color:#64748b;font-size:13px">Ссылка действует 60 минут. Если вы не запрашивали восстановление, просто проигнорируйте письмо.</p>
          </div>
        `
      });
      await this.auditRepo.save(this.auditRepo.create({ event: 'auth.password_reset.requested', actorId: user.id, payload: { role } }));
      return this.buildTokenDeliveryResponse(token, delivery);
    }

    return this.buildTokenDeliveryResponse(null, { ok: false, reason: 'unknown_account' });
  }

  async resetPassword(token: string, password: string) {
    await this.assertPasswordSafe(password);

    const row = await this.consumeAuthToken(token, 'password_reset');
    const user = await this.usersRepo.findOne({ where: { id: row.user_id } });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    user.passwordHash = this.hashPassword(password);
    await this.usersRepo.save(user);
    await this.auditRepo.save(this.auditRepo.create({ event: 'auth.password_reset.completed', actorId: user.id, payload: { role: row.role } }));
    return { ok: true };
  }

  createGoogleOAuthStart(role: Exclude<LoginRole, 'admin'>, mode: 'login' | 'register' = 'login') {
    if (!env.googleOAuthClientId || !env.googleOAuthClientSecret || !env.googleOAuthRedirectUrl) {
      return {
        ok: false,
        configured: false,
        message: 'Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URL.'
      };
    }

    const state = Buffer.from(JSON.stringify({ role, mode, createdAt: Date.now() })).toString('base64url');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', env.googleOAuthClientId);
    url.searchParams.set('redirect_uri', env.googleOAuthRedirectUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('state', state);

    return {
      ok: true,
      configured: true,
      provider: 'google',
      authUrl: url.toString()
    };
  }

  getSessionCookieName() {
    return this.sessionCookieName;
  }

  buildSessionCookie(token: string) {
    const appBaseUrl = env.appBaseUrl || '';
    const isLocal =
      appBaseUrl.includes('localhost') ||
      appBaseUrl.includes('127.0.0.1') ||
      process.env.NODE_ENV === 'development';

    return {
      name: this.sessionCookieName,
      value: token,
      options: {
        httpOnly: true,
        secure: !isLocal,
        sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
        domain: isLocal ? undefined : '.takhet.com',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
      }
    };
  }

  clearSessionCookie() {
    const cookie = this.buildSessionCookie('');
    return {
      name: cookie.name,
      options: {
        ...cookie.options,
        maxAge: 0,
        expires: new Date(0)
      }
    };
  }

  async resolveSession(authorization?: string, cookieHeader?: string) {
    const user = this.verifyToken(authorization, cookieHeader);
    await this.assertEmailVerifiedBeforePortalAccess(user.id, user.email, user.role);
    await this.assertPortalApplicationApproved(user.id, user.email, user.role);
    const verified = await this.resolveVerifiedStatus(user.id, user.role);
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified
      }
    };
  }

  private issueToken(userId: string, email: string, role: LoginRole, verified: boolean) {
    const token = sign(
      {
        sub: userId,
        email,
        role
      },
      env.supabaseJwtSecret || env.appJwtSecret,
      { expiresIn: '24h' }
    );

    return {
      access_token: token,
      user: {
        id: userId,
        email,
        role,
        verified
      }
    };
  }

  private async ensureAccountIsActive(userId: string) {
    const latestDisableLog = await this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.event = :event', { event: 'user.disabled' })
      .andWhere(`audit.payload ->> 'userId' = :userId`, { userId })
      .orderBy('audit.createdAt', 'DESC')
      .getOne();

    if (latestDisableLog) {
      throw new UnauthorizedException('Account disabled');
    }
  }

  private async findUserForAuthAction(email: string, role: LoginRole) {
    const normalizedEmail = email.trim();
    const configured = this.getConfiguredUserSeed(role);
    if (configured && normalizedEmail === configured.email) {
      await this.ensureCoreAccount(configured.userId, configured.email, role);
      return this.usersRepo.findOne({ where: { id: configured.userId } });
    }

    const directUser = await this.usersRepo.findOne({ where: { email: normalizedEmail, role } });
    if (directUser) return directUser;

    const storageEmail = this.toStorageEmail(normalizedEmail, role);
    return this.usersRepo.findOne({ where: { email: storageEmail, role } });
  }

  private getConfiguredUserSeed(role: LoginRole) {
    const seeds: Record<LoginRole, { email: string; userId: string }> = {
      admin: { email: env.appAdminEmail, userId: '11111111-1111-1111-1111-111111111111' },
      doctor: { email: env.appDoctorEmail, userId: '22222222-2222-2222-2222-222222222222' },
      partner: { email: env.appPartnerEmail, userId: '33333333-3333-3333-3333-333333333333' },
      patient: { email: env.appPatientEmail, userId: '44444444-4444-4444-4444-444444444444' }
    };

    return seeds[role];
  }

  private async ensureAuthRecoveryTables() {
    await this.dataSource.query(`
      create table if not exists auth_tokens (
        token_hash text primary key,
        user_id uuid not null references users(id) on delete cascade,
        email text not null,
        role text not null,
        type text not null,
        expires_at timestamptz not null,
        consumed_at timestamptz,
        created_at timestamptz not null default now()
      );
      create index if not exists idx_auth_tokens_user_type on auth_tokens(user_id, type);
      create table if not exists auth_email_status (
        user_id uuid primary key references users(id) on delete cascade,
        email text not null,
        role text not null,
        verified_at timestamptz not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists portal_applications (
        user_id uuid primary key references users(id) on delete cascade,
        email text not null,
        role text not null,
        status text not null default 'pending_admin_approval',
        source text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists idx_portal_applications_role_status on portal_applications(role, status);
    `);
  }

  private async markEmailVerified(userId: string, email: string, role: LoginRole) {
    await this.ensureAuthRecoveryTables();
    await this.dataSource.query(
      `
        insert into auth_email_status (user_id, email, role, verified_at, updated_at)
        values ($1, $2, $3, now(), now())
        on conflict (user_id)
        do update set email = excluded.email, role = excluded.role, verified_at = excluded.verified_at, updated_at = now()
      `,
      [userId, email, role]
    );
  }

  private async createPortalApplication(userId: string, email: string, role: LoginRole) {
    await this.ensureAuthRecoveryTables();
    await this.dataSource.query(
      `
        insert into portal_applications (user_id, email, role, status, source, updated_at)
        values ($1, $2, $3, 'pending_admin_approval', 'public_registration', now())
        on conflict (user_id)
        do update set email = excluded.email, role = excluded.role, status = 'pending_admin_approval', updated_at = now()
      `,
      [userId, email, role]
    );
    await this.auditRepo.save(this.auditRepo.create({ event: 'auth.application.pending', actorId: userId, payload: { role, status: 'pending_admin_approval' } }));
  }

  private async markPortalApplicationApproved(userId: string, role: LoginRole, source: string) {
    if (role === 'patient') return;
    await this.ensureAuthRecoveryTables();
    await this.dataSource.query(
      `
        insert into portal_applications (user_id, email, role, status, source, updated_at)
        values ($1, $2, $3, 'approved', $4, now())
        on conflict (user_id)
        do update set role = excluded.role, status = 'approved', source = excluded.source, updated_at = now()
      `,
      [userId, `${role}-${userId}@takhet.local`, role, source]
    );
  }

  private async assertEmailVerifiedBeforePortalAccess(userId: string, email: string, role: LoginRole) {
    if (this.isInternalSystemEmail(email)) return;
    await this.ensureAuthRecoveryTables();
    const rows = await this.dataSource.query(
      `select verified_at from auth_email_status where user_id = $1 and role = $2 and verified_at is not null limit 1`,
      [userId, role]
    );
    if (!rows[0]) {
      await this.auditRepo.save(this.auditRepo.create({ event: 'auth.email_verification.required', actorId: userId, payload: { role } }));
      throw new UnauthorizedException('Email verification required');
    }
  }

  private async assertPortalApplicationApproved(userId: string, email: string, role: LoginRole) {
    if (role === 'patient' || role === 'admin') return;
    if (this.isInternalSystemEmail(email)) return;
    await this.ensureAuthRecoveryTables();
    const rows = await this.dataSource.query(
      `select status from portal_applications where user_id = $1 and role = $2 limit 1`,
      [userId, role]
    );
    if (rows[0]?.status !== 'approved') {
      throw new UnauthorizedException('Admin approval required');
    }
  }

  private async createAuthToken(userId: string, email: string, role: LoginRole, type: 'email_verification' | 'password_reset', ttlMinutes: number) {
    await this.ensureAuthRecoveryTables();
    const token = randomBytes(32).toString('hex');
    await this.dataSource.query(
      `
        insert into auth_tokens (token_hash, user_id, email, role, type, expires_at)
        values ($1, $2, $3, $4, $5, now() + ($6 || ' minutes')::interval)
      `,
      [this.hashAuthToken(token), userId, email, role, type, String(ttlMinutes)]
    );

    return token;
  }

  private async consumeAuthToken(token: string, type: 'email_verification' | 'password_reset') {
    await this.ensureAuthRecoveryTables();
    const rows = await this.dataSource.query(
      `
        update auth_tokens
        set consumed_at = now()
        where token_hash = $1
          and type = $2
          and consumed_at is null
          and expires_at > now()
        returning user_id, email, role, type
      `,
      [this.hashAuthToken(token), type]
    );

    if (!rows[0]) {
      throw new UnauthorizedException('Invalid token');
    }

    return rows[0] as { user_id: string; email: string; role: LoginRole; type: string };
  }

  private hashAuthToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildTokenDeliveryResponse(token: string | null, delivery?: { ok: boolean; reason?: string }) {
    const hasProvider = Boolean(env.resendApiKey);
    const deliveryState = delivery?.ok ? 'email_sent' : hasProvider ? 'email_provider_failed' : 'email_provider_pending';
    const message = delivery?.ok
      ? 'If the account exists, an email has been sent. Check inbox and spam.'
      : hasProvider
        ? 'If the account exists, the email provider failed. Check RESEND_API_KEY, AUTH_EMAIL_FROM and verified domain settings.'
        : 'If the account exists, email delivery will work after RESEND_API_KEY is configured.';

    return {
      ok: true,
      delivery: deliveryState,
      message,
      ...(delivery?.reason && process.env.NODE_ENV !== 'production' ? { reason: delivery.reason } : {}),
      ...(process.env.NODE_ENV === 'production' || !token ? {} : { oneTimeToken: token })
    };
  }

  private buildEmailVerificationUrl(token: string) {
    const baseUrl = (env.appBaseUrl || 'https://www.takhet.com').replace(/\/$/, '');
    return `${baseUrl}/auth/confirm-email?token=${encodeURIComponent(token)}`;
  }

  private buildPasswordResetUrl(token: string) {
    const baseUrl = (env.appBaseUrl || 'https://www.takhet.com').replace(/\/$/, '');
    return `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }

  private async sendAuthEmail(payload: { userId: string; role: LoginRole; to: string; subject: string; html: string }) {
    if (!env.resendApiKey) {
      await this.auditRepo.save(
        this.auditRepo.create({
          event: 'auth.email.delivery.failed',
          actorId: payload.userId,
          payload: { role: payload.role, reason: 'RESEND_API_KEY is not configured' }
        })
      );
      return { ok: false, reason: 'missing_resend_api_key' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.authEmailFrom,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html
        })
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        throw new Error(`Resend failed: ${response.status} ${responseText.slice(0, 300)}`);
      }

      await this.auditRepo.save(this.auditRepo.create({ event: 'auth.email.delivery.sent', actorId: payload.userId, payload: { role: payload.role } }));
      return { ok: true };
    } catch (error) {
      await this.auditRepo.save(
        this.auditRepo.create({
          event: 'auth.email.delivery.failed',
          actorId: payload.userId,
          payload: { role: payload.role, reason: error instanceof Error ? error.message : 'unknown_error' }
        })
      );
      return { ok: false, reason: error instanceof Error ? error.message : 'unknown_error' };
    }
  }

  private async assertPasswordSafe(password: string) {
    if (!password || password.length < 10) {
      throw new UnauthorizedException('Password must contain at least 10 characters');
    }

    if (!/[a-zа-я]/i.test(password) || !/\d/.test(password)) {
      throw new UnauthorizedException('Password must include letters and numbers');
    }

    const breach = await this.checkPasswordBreach(password);
    if (breach.checked && breach.breached) {
      throw new UnauthorizedException('Password was found in known breaches');
    }
  }

  private async checkPasswordBreach(password: string) {
    try {
      const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' }
      });

      if (!response.ok) {
        return { checked: false, breached: false };
      }

      const body = await response.text();
      const breached = body.split(/\r?\n/).some((line) => line.split(':')[0] === suffix);
      return { checked: true, breached };
    } catch {
      return { checked: false, breached: false };
    }
  }

  private async ensureCoreAccount(userId: string, email: string, role: LoginRole) {
    const storageEmail = this.toStorageEmail(email, role);
    const existingUser = await this.usersRepo.findOne({ where: { id: userId } });
    const seededPassword = this.getConfiguredPassword(role);
    if (!existingUser) {
      await this.usersRepo.save(
        this.usersRepo.create({
          id: userId,
          email: storageEmail,
          passwordHash: this.hashPassword(seededPassword),
          role
        })
      );
    } else if (!existingUser.passwordHash || !this.isHashedPassword(existingUser.passwordHash)) {
      existingUser.passwordHash = this.hashPassword(seededPassword);
      await this.usersRepo.save(existingUser);
    }

    if (role === 'doctor') {
      const existingDoctor = await this.doctorsRepo.findOne({ where: { id: userId } });
      if (!existingDoctor) {
        await this.doctorsRepo.save(
          this.doctorsRepo.create({
            id: userId,
            specialization: 'Общая практика',
            licenseNumber: 'TAKHET-DEMO',
            experienceYears: 5,
            verified: true
          })
        );
      }
    }
  }

  private isTempPortalLogin(email: string, password: string) {
    return email === this.tempPortalCredentials.login && password === this.tempPortalCredentials.password;
  }

  private getTempPortalAccountSeed(role: LoginRole) {
    const seeds: Record<LoginRole, { id: string; email: string }> = {
      admin: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        email: 'admin+portal-admin@takhet.local'
      },
      doctor: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        email: 'admin+portal-doctor@takhet.local'
      },
      partner: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        email: 'admin+portal-partner@takhet.local'
      },
      patient: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        email: 'admin+portal-patient@takhet.local'
      }
    };

    return seeds[role];
  }

  private async ensureTempPortalAccount(role: LoginRole) {
    const seed = this.getTempPortalAccountSeed(role);
    let user = await this.usersRepo.findOne({ where: { id: seed.id } });

    if (!user) {
      user = await this.usersRepo.save(
        this.usersRepo.create({
          id: seed.id,
          email: seed.email,
          passwordHash: this.hashPassword(this.tempPortalCredentials.password),
          role
        })
      );
    } else {
      let shouldSave = false;

      if (user.email !== seed.email) {
        user.email = seed.email;
        shouldSave = true;
      }

      if (user.role !== role) {
        user.role = role;
        shouldSave = true;
      }

      if (!user.passwordHash || !this.verifyPassword(user.passwordHash, this.tempPortalCredentials.password)) {
        user.passwordHash = this.hashPassword(this.tempPortalCredentials.password);
        shouldSave = true;
      }

      if (shouldSave) {
        user = await this.usersRepo.save(user);
      }
    }

    if (role === 'doctor') {
      const existingDoctor = await this.doctorsRepo.findOne({ where: { id: user.id } });
      if (!existingDoctor) {
        await this.doctorsRepo.save(
          this.doctorsRepo.create({
            id: user.id,
            specialization: 'Общая практика',
            licenseNumber: 'TEMP-PORTAL-ADMIN',
            experienceYears: 3,
            verified: true
          })
        );
      } else if (!existingDoctor.verified) {
        existingDoctor.verified = true;
        await this.doctorsRepo.save(existingDoctor);
      }
    }

    return user;
  }

  private toStorageEmail(email: string, role: LoginRole) {
    const parts = email.split('@');
    if (parts.length !== 2) return `${role}:${email}`;
    return `${parts[0]}+${role}@${parts[1]}`;
  }

  private getConfiguredPassword(role: LoginRole) {
    if (role === 'admin') return env.appAdminPassword;
    if (role === 'doctor') return env.appDoctorPassword;
    if (role === 'partner') return env.appPartnerPassword;
    return env.appPatientPassword;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${this.hashPrefix}$${salt}$${hash}`;
  }

  private isHashedPassword(value: string | null | undefined) {
    return typeof value === 'string' && value.startsWith(`${this.hashPrefix}$`);
  }

  private verifyPassword(storedPassword: string, candidate: string) {
    if (!this.isHashedPassword(storedPassword)) {
      return storedPassword === candidate;
    }

    const [, salt, storedHash] = storedPassword.split('$');
    if (!salt || !storedHash) {
      return false;
    }

    const candidateHash = scryptSync(candidate, salt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (storedBuffer.length !== candidateHash.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, candidateHash);
  }

  private async resolveVerifiedStatus(userId: string, role: LoginRole) {
    if (role === 'doctor') {
      const doctor = await this.doctorsRepo.findOne({ where: { id: userId } });
      return doctor?.verified ?? false;
    }

    return true;
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isInternalSystemEmail(email: string) {
    return email.endsWith('@takhet.local') || email.endsWith('@guest.takhet.local');
  }

  private extractToken(authorization?: string, cookieHeader?: string) {
    const headerToken = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (headerToken) {
      return headerToken;
    }

    const cookieToken = this.readCookie(cookieHeader, this.sessionCookieName);
    if (cookieToken) {
      return cookieToken;
    }

    throw new UnauthorizedException('Authentication required');
  }

  private readCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) return null;

    for (const chunk of cookieHeader.split(';')) {
      const [rawName, ...rest] = chunk.trim().split('=');
      if (rawName !== name) continue;
      const value = rest.join('=').trim();
      if (!value) return null;
      return decodeURIComponent(value);
    }

    return null;
  }
}
