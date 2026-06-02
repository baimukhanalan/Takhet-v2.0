import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { env } from '../config/env.config';
import { EnterpriseCheckInput, evaluateEnterpriseRisk } from './enterprise-risk.engine';

export type EnterpriseRole =
  | 'employee'
  | 'employer_admin'
  | 'doctor'
  | 'psychologist'
  | 'takhet_admin'
  | 'clinical_supervisor';

type LegacyEnterpriseRole = 'worker' | 'enterprise_admin' | 'medical_reviewer' | 'super_admin';
type AnyEnterpriseRole = EnterpriseRole | LegacyEnterpriseRole;

type EnterpriseSessionUser = {
  id: string;
  enterpriseId: string;
  employeeId: string;
  email: string;
  role: EnterpriseRole;
  fullName: string;
  enterpriseName: string;
};

type ConsultationRequest = {
  serviceType: 'duty_doctor' | 'psychologist' | 'specialist';
  specialty?: string;
  preferredTime?: string;
  notes?: string;
  premiumRequested?: boolean;
};

const LEGAL_POSITIONING =
  'Takhet Enterprise provides corporate healthcare access, AI support and anonymized workforce risk analytics. It does not replace authorized medical staff, occupational exams, or enterprise safety procedures.';
const ENTERPRISE_SYSTEM_ACTOR_ID = '00000000-0000-4000-8000-000000000001';
const MIN_AGGREGATE_GROUP_SIZE = 10;

@Injectable()
export class EnterpriseService implements OnModuleInit {
  private readonly cookieName = 'takhet_enterprise_session';
  private readonly hashPrefix = 'scrypt';

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureSchema();
    await this.ensureSeedData();
  }

  getLegalPositioning() {
    return LEGAL_POSITIONING;
  }

  async createLead(payload: Record<string, any>) {
    const rows = await this.dataSource.query(
      `
        INSERT INTO enterprise_leads (company_name, contact_name, email, phone, employees, message, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'new')
        RETURNING id
      `,
      [
        payload.companyName,
        payload.contactName,
        String(payload.email || '').toLowerCase(),
        payload.phone || null,
        payload.employees || null,
        payload.message || ''
      ]
    );
    await this.audit('enterprise.lead.created', ENTERPRISE_SYSTEM_ACTOR_ID, { leadId: rows[0].id });
    return { ok: true, id: rows[0].id };
  }

  async login(identifier: string, password: string, role?: EnterpriseRole) {
    const normalized = this.resolveEnterpriseDemoIdentifier(identifier, role);
    const rows = await this.dataSource.query(
      `
        SELECT
          eu.id,
          eu.enterprise_id AS "enterpriseId",
          eu.employee_id AS "employeeId",
          eu.email,
          eu.role,
          eu.full_name AS "fullName",
          eu.password_hash AS "passwordHash",
          e.name AS "enterpriseName"
        FROM enterprise_users eu
        JOIN enterprises e ON e.id = eu.enterprise_id
        WHERE eu.active = true
          AND (LOWER(eu.email) = $1 OR LOWER(eu.employee_id) = $1)
        LIMIT 1
      `,
      [normalized]
    );

    const user = rows[0];
    if (!user?.passwordHash || !this.verifyPassword(user.passwordHash, password)) {
      throw new UnauthorizedException('Invalid enterprise credentials');
    }
    const normalizedRole = this.normalizeRole(user.role);
    if (role && normalizedRole !== role) {
      throw new UnauthorizedException('Enterprise role does not match credentials');
    }

    const sessionUser = this.toSessionUser({ ...user, role: normalizedRole });
    return {
      token: this.issueToken(sessionUser),
      user: sessionUser,
      legal: LEGAL_POSITIONING
    };
  }

  async registerAccessRequest(identifier: string, password: string, role: EnterpriseRole) {
    const normalized = identifier.trim().toLowerCase();
    const enterpriseRows = await this.dataSource.query(`SELECT id FROM enterprises ORDER BY created_at ASC LIMIT 1`);
    const enterpriseId = enterpriseRows[0]?.id || null;
    await this.dataSource.query(
      `
        INSERT INTO enterprise_registration_requests (enterprise_id, identifier, password_hash, role, status)
        VALUES ($1, $2, $3, $4, 'submitted')
      `,
      [enterpriseId, normalized, this.hashPassword(password), role]
    );
    await this.audit('enterprise.registration.requested', ENTERPRISE_SYSTEM_ACTOR_ID, { identifier: normalized, role });
    return { ok: true, status: 'request_submitted', role, legal: LEGAL_POSITIONING };
  }

  async resolveSession(cookieHeader?: string) {
    const token = this.readCookie(cookieHeader, this.cookieName);
    if (!token) {
      throw new UnauthorizedException('Enterprise session required');
    }

    try {
      const payload = verify(token, env.supabaseJwtSecret || env.appJwtSecret) as EnterpriseSessionUser;
      return { ...payload, role: this.normalizeRole(payload.role as AnyEnterpriseRole) };
    } catch {
      throw new UnauthorizedException('Invalid enterprise session');
    }
  }

  buildSessionCookie(token: string) {
    const isLocal =
      (env.appBaseUrl || '').includes('localhost') ||
      (env.appBaseUrl || '').includes('127.0.0.1') ||
      process.env.NODE_ENV === 'development';

    return {
      name: this.cookieName,
      value: token,
      options: {
        httpOnly: true,
        secure: !isLocal,
        sameSite: (isLocal ? 'lax' : 'none') as 'lax' | 'none',
        domain: isLocal ? undefined : '.takhet.com',
        path: '/',
        maxAge: 12 * 60 * 60 * 1000
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

  async employeeDashboard(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    const profile = await this.getEmployeeForUser(user.id);
    const benefits = await this.employeeBenefits(user);
    const history = await this.employeeHistory(user);
    const notifications = await this.employeeNotifications(user);
    return {
      legal: LEGAL_POSITIONING,
      greeting: `Здравствуйте, ${user.fullName}`,
      plan: benefits.plan,
      benefits: benefits.benefits,
      latestConsultation: history[0] || null,
      pendingNotifications: notifications.filter((item: Record<string, any>) => !item.read).length,
      profile
    };
  }

  async employeeBenefits(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    const rows = await this.dataSource.query(
      `
        SELECT eb.service_type AS "serviceType", eb.monthly_allowance AS "monthlyAllowance", eb.remaining_credits AS "remainingCredits",
               eb.used_credits AS "usedCredits", eb.premium_copay_required AS "premiumCopayRequired",
               cp.name AS "plan", cp.payer_policy AS "payerPolicy"
        FROM employee_benefits eb
        JOIN company_plans cp ON cp.id = eb.plan_id
        WHERE eb.user_id = $1
        ORDER BY eb.service_type
      `,
      [user.id]
    );
    return {
      legal: LEGAL_POSITIONING,
      plan: rows[0]?.plan || 'Business',
      payerPolicy: rows[0]?.payerPolicy || 'company',
      benefits: rows.map((row: Record<string, any>) => this.hideInternalTariff(row))
    };
  }

  async employeeHistory(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    return this.dataSource.query(
      `
        SELECT id, service_type AS "serviceType", status, specialty, provider_name AS "providerName",
               scheduled_at AS "scheduledAt", created_at AS "createdAt", employee_visible_summary AS "summary"
        FROM enterprise_consultations
        WHERE employee_user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [user.id]
    );
  }

  async employeeNotifications(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    return this.listNotifications(user.id);
  }

  async employeeRecommendations(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    return {
      legal: LEGAL_POSITIONING,
      recommendations: [
        'Начните с AI-поддержки 24/7, если нужно быстро структурировать состояние.',
        'Запросите дежурного врача, если симптомы мешают работе или повторяются.',
        'Психологическая поддержка доступна в рамках корпоративных лимитов и triage-правил.'
      ]
    };
  }

  async employeeProfile(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employee']);
    return { legal: LEGAL_POSITIONING, ...(await this.getEmployeeForUser(user.id)) };
  }

  async startAiSession(user: EnterpriseSessionUser, payload: Record<string, any>) {
    this.assertRole(user, ['employee']);
    const rows = await this.dataSource.query(
      `
        INSERT INTO ai_sessions (enterprise_id, employee_user_id, mode, summary, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING id, mode, summary, status, created_at AS "createdAt"
      `,
      [user.enterpriseId, user.id, payload.mode || 'mental_support', payload.summary || 'AI support session started']
    );
    await this.audit('enterprise.ai_session.started', user.id, { sessionId: rows[0].id });
    return { ...rows[0], legal: LEGAL_POSITIONING };
  }

  async runTriage(user: EnterpriseSessionUser, payload: Record<string, any>) {
    this.assertRole(user, ['employee']);
    const level = payload.urgent ? 'urgent' : payload.specialistNeeded ? 'specialist' : 'self_care';
    const rows = await this.dataSource.query(
      `
        INSERT INTO risk_scores (enterprise_id, employee_user_id, category, score, level, explanation)
        VALUES ($1, $2, 'triage', $3, $4, $5)
        RETURNING id, category, score, level, explanation, created_at AS "createdAt"
      `,
      [user.enterpriseId, user.id, level === 'urgent' ? 90 : level === 'specialist' ? 65 : 30, level, payload.summary || 'Triage completed']
    );
    return { ...rows[0], legal: LEGAL_POSITIONING };
  }

  async requestConsultation(user: EnterpriseSessionUser, request: ConsultationRequest) {
    this.assertRole(user, ['employee']);
    const access = await this.calculateConsultationAccess(user, request);
    const provider = await this.findProvider(user.enterpriseId, request.serviceType);
    const rows = await this.dataSource.query(
      `
        INSERT INTO enterprise_consultations (
          enterprise_id, employee_user_id, provider_user_id, service_type, specialty, status, scheduled_at,
          employee_visible_summary, copay_required, premium_requested, night_surcharge, payer_policy
        )
        VALUES ($1, $2, $3, $4, $5, 'requested', $6, $7, $8, $9, $10, $11)
        RETURNING id, service_type AS "serviceType", specialty, status, scheduled_at AS "scheduledAt",
                  provider_name AS "providerName", copay_required AS "copayRequired",
                  premium_requested AS "premiumRequested", night_surcharge AS "nightSurcharge", payer_policy AS "payerPolicy"
      `,
      [
        user.enterpriseId,
        user.id,
        provider?.id || null,
        request.serviceType,
        request.specialty || provider?.specialty || 'дежурный врач',
        request.preferredTime ? new Date(request.preferredTime) : null,
        access.employeeMessage,
        access.copayRequired,
        Boolean(request.premiumRequested),
        access.nightSurcharge,
        access.payerPolicy
      ]
    );
    await this.consumeBenefit(user, request.serviceType);
    await this.audit('enterprise.consultation.requested', user.id, { consultationId: rows[0].id, serviceType: request.serviceType });
    return { ...this.hideInternalTariff(rows[0]), access, legal: LEGAL_POSITIONING };
  }

  async submitFeedback(user: EnterpriseSessionUser, payload: Record<string, any>) {
    this.assertRole(user, ['employee']);
    await this.dataSource.query(
      `UPDATE enterprise_consultations SET feedback = $1::jsonb WHERE id = $2 AND employee_user_id = $3`,
      [JSON.stringify({ rating: payload.rating, comment: payload.comment || '' }), payload.consultationId, user.id]
    );
    await this.audit('enterprise.consultation.feedback', user.id, { consultationId: payload.consultationId, rating: payload.rating });
    return { ok: true };
  }

  async submitRiskPrecheck(user: EnterpriseSessionUser, input: EnterpriseCheckInput) {
    this.assertRole(user, ['employee']);
    const employee = await this.getEmployeeForUser(user.id);
    const risk = evaluateEnterpriseRisk(input);
    const checkRows = await this.dataSource.query(
      `
        INSERT INTO checks (enterprise_id, employee_id, user_id, status, label, recommendation, completion_percent, score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, status, label, recommendation, completion_percent AS "completionPercent", score, created_at AS "createdAt"
      `,
      [user.enterpriseId, employee.id, user.id, risk.status, risk.label, risk.recommendation, risk.completionPercent, risk.score]
    );
    const check = checkRows[0];
    for (const [key, value] of Object.entries(input)) {
      await this.dataSource.query(`INSERT INTO check_answers (check_id, question_key, value) VALUES ($1, $2, $3::jsonb)`, [
        check.id,
        key,
        JSON.stringify(value)
      ]);
    }
    for (const reason of risk.reasons) {
      await this.dataSource.query(`INSERT INTO risk_flags (check_id, severity, reason) VALUES ($1, $2, $3)`, [
        check.id,
        risk.status,
        reason
      ]);
    }
    await this.audit('enterprise.risk_precheck.submitted', user.id, { checkId: check.id, status: risk.status });
    return { ...check, reasons: risk.reasons, legal: LEGAL_POSITIONING };
  }

  async employerDashboard(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return {
      legal: LEGAL_POSITIONING,
      privacy: this.employerPrivacyCopy(),
      metrics: await this.aggregateMetrics(user.enterpriseId),
      activation: await this.employerActivation(user),
      utilization: await this.employerUtilization(user),
      trends: await this.employerTrends(user)
    };
  }

  async employerEmployees(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return this.dataSource.query(
      `
        SELECT emp.id, emp.full_name AS "fullName", emp.employee_number AS "employeeNumber",
               d.name AS department, emp.active, emp.position
        FROM employees emp
        LEFT JOIN departments d ON d.id = emp.department_id
        WHERE emp.enterprise_id = $1
        ORDER BY emp.full_name
      `,
      [user.enterpriseId]
    );
  }

  async inviteEmployee(user: EnterpriseSessionUser, payload: Record<string, any>) {
    this.assertRole(user, ['employer_admin']);
    const employeeId = `EMP-${Date.now()}`;
    const passwordHash = this.hashPassword('temporary-admin');
    const rows = await this.dataSource.query(
      `
        INSERT INTO enterprise_users (enterprise_id, employee_id, email, password_hash, role, full_name)
        VALUES ($1, $2, $3, $4, 'employee', $5)
        RETURNING id, employee_id AS "employeeId", email, full_name AS "fullName"
      `,
      [user.enterpriseId, employeeId, String(payload.email).toLowerCase(), passwordHash, payload.fullName]
    );
    await this.dataSource.query(
      `
        INSERT INTO employees (enterprise_id, user_id, employee_number, full_name, position, profile)
        VALUES ($1, $2, $3, $4, 'Employee', $5::jsonb)
      `,
      [user.enterpriseId, rows[0].id, employeeId, payload.fullName, JSON.stringify({ invited: true, department: payload.department || null })]
    );
    await this.audit('enterprise.employee.invited', user.id, { employeeUserId: rows[0].id });
    return rows[0];
  }

  async employerDepartments(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return this.dataSource.query(`SELECT id, name FROM departments WHERE enterprise_id = $1 ORDER BY name`, [user.enterpriseId]);
  }

  async employerActivation(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    const rows = await this.dataSource.query(
      `
        SELECT COUNT(emp.id)::int AS total,
               COUNT(emp.id) FILTER (WHERE eu.active = true)::int AS active
        FROM employees emp
        JOIN enterprise_users eu ON eu.id = emp.user_id
        WHERE emp.enterprise_id = $1
      `,
      [user.enterpriseId]
    );
    const total = Number(rows[0]?.total || 0);
    const active = Number(rows[0]?.active || 0);
    return { total, active, activationRate: total ? Math.round((active / total) * 100) : 0 };
  }

  async employerUtilization(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    const rows = await this.dataSource.query(
      `
        SELECT service_type AS "serviceType", COUNT(*)::int AS count
        FROM enterprise_consultations
        WHERE enterprise_id = $1
        GROUP BY service_type
        ORDER BY count DESC
      `,
      [user.enterpriseId]
    );
    return { anonymized: true, rows };
  }

  async employerTrends(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    const groupRows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM employees WHERE enterprise_id = $1 AND active = true`,
      [user.enterpriseId]
    );
    const total = Number(groupRows[0]?.total || 0);
    if (total < MIN_AGGREGATE_GROUP_SIZE) {
      return {
        status: 'insufficient_group_size',
        minimumGroupSize: MIN_AGGREGATE_GROUP_SIZE,
        message: 'Aggregate analytics are hidden until the group has at least 10 employees.'
      };
    }
    const rows = await this.dataSource.query(
      `
        SELECT category, ROUND(AVG(score), 2)::float AS "averageScore", COUNT(*)::int AS count
        FROM risk_scores
        WHERE enterprise_id = $1
        GROUP BY category
        ORDER BY category
      `,
      [user.enterpriseId]
    );
    return { status: 'ok', anonymized: true, rows };
  }

  async employerFinance(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return this.dataSource.query(
      `
        SELECT id, period_start AS "periodStart", period_end AS "periodEnd", total_amount AS "totalAmount", status
        FROM billing_invoices
        WHERE enterprise_id = $1
        ORDER BY period_start DESC
        LIMIT 12
      `,
      [user.enterpriseId]
    );
  }

  async employerPlan(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    const rows = await this.dataSource.query(
      `
        SELECT cp.name, cp.monthly_price_per_employee AS "monthlyPricePerEmployee", cp.payer_policy AS "payerPolicy",
               pl.service_type AS "serviceType", pl.monthly_limit AS "monthlyLimit", pl.triage_required AS "triageRequired"
        FROM company_plans cp
        LEFT JOIN plan_limits pl ON pl.plan_id = cp.id
        WHERE cp.enterprise_id = $1
        ORDER BY cp.created_at DESC, pl.service_type
      `,
      [user.enterpriseId]
    );
    return { legal: LEGAL_POSITIONING, plan: rows[0]?.name || 'Business', limits: rows };
  }

  async employerReports(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return this.dataSource.query(
      `SELECT id, report_type AS "reportType", period, payload, created_at AS "createdAt" FROM aggregate_reports WHERE enterprise_id = $1 ORDER BY created_at DESC`,
      [user.enterpriseId]
    );
  }

  async employerPrivacy(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return this.employerPrivacyCopy();
  }

  async employerSettings(user: EnterpriseSessionUser) {
    this.assertRole(user, ['employer_admin']);
    return {
      legal: LEGAL_POSITIONING,
      departments: await this.employerDepartments(user),
      privacy: this.employerPrivacyCopy(),
      notificationRules: ['activation reminders', 'monthly usage summary', 'aggregate trend alerts']
    };
  }

  async providerQueue(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.dataSource.query(
      `
        SELECT id, service_type AS "serviceType", specialty, status, employee_visible_summary AS "summary",
               scheduled_at AS "scheduledAt", created_at AS "createdAt"
        FROM enterprise_consultations
        WHERE provider_user_id = $1 OR ($2 = 'doctor' AND service_type = 'duty_doctor') OR ($2 = 'psychologist' AND service_type = 'psychologist')
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [user.id, user.role]
    );
  }

  async providerSchedule(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return [
      { day: 'Понедельник', time: '09:00-18:00', status: 'available' },
      { day: 'Среда', time: '10:00-18:00', status: 'available' },
      { day: 'Пятница', time: '09:00-15:00', status: 'available' }
    ];
  }

  async providerPatients(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.dataSource.query(
      `
        SELECT DISTINCT emp.id, emp.full_name AS "fullName", emp.employee_number AS "employeeNumber"
        FROM enterprise_consultations ec
        JOIN enterprise_users eu ON eu.id = ec.employee_user_id
        JOIN employees emp ON emp.user_id = eu.id
        WHERE ec.provider_user_id = $1
        ORDER BY emp.full_name
      `,
      [user.id]
    );
  }

  async providerConsultations(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.providerQueue(user);
  }

  async providerTriageSummary(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return {
      legal: LEGAL_POSITIONING,
      queue: await this.providerQueue(user),
      summary: 'Triage summaries show employee-provided context and risk flags for consultation preparation.'
    };
  }

  async providerNotes(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.dataSource.query(
      `
        SELECT cn.id, cn.consultation_id AS "consultationId", cn.note, cn.recommendation, cn.created_at AS "createdAt"
        FROM consultation_notes cn
        WHERE cn.provider_user_id = $1
        ORDER BY cn.created_at DESC
        LIMIT 100
      `,
      [user.id]
    );
  }

  async addProviderNote(user: EnterpriseSessionUser, payload: Record<string, any>) {
    this.assertProviderRole(user);
    const rows = await this.dataSource.query(
      `
        INSERT INTO consultation_notes (consultation_id, provider_user_id, note, recommendation)
        VALUES ($1, $2, $3, $4)
        RETURNING id, consultation_id AS "consultationId", note, recommendation, created_at AS "createdAt"
      `,
      [payload.consultationId, user.id, payload.note, payload.recommendation || '']
    );
    await this.audit('enterprise.provider.note.created', user.id, { noteId: rows[0].id });
    return rows[0];
  }

  async providerPayouts(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.dataSource.query(
      `SELECT id, amount, status, period, created_at AS "createdAt" FROM payouts WHERE provider_user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
  }

  async providerTraining(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    return this.dataSource.query(
      `SELECT id, training_name AS "trainingName", status, completed_at AS "completedAt" FROM doctor_training WHERE provider_user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
  }

  async providerProfile(user: EnterpriseSessionUser) {
    this.assertProviderRole(user);
    const rows = await this.dataSource.query(
      `
        SELECT eu.id, eu.full_name AS "fullName", eu.email, dv.verification_status AS "verificationStatus",
               dv.specialty, dv.category, dt.status AS "trainingStatus"
        FROM enterprise_users eu
        LEFT JOIN doctor_verifications dv ON dv.provider_user_id = eu.id
        LEFT JOIN doctor_training dt ON dt.provider_user_id = eu.id
        WHERE eu.id = $1
        LIMIT 1
      `,
      [user.id]
    );
    return rows[0] || user;
  }

  async adminCompanies(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(
      `
        SELECT e.id, e.name, e.industry, e.subscription_status AS "subscriptionStatus",
               cp.name AS plan, COUNT(emp.id)::int AS employees
        FROM enterprises e
        LEFT JOIN company_plans cp ON cp.enterprise_id = e.id
        LEFT JOIN employees emp ON emp.enterprise_id = e.id
        GROUP BY e.id, cp.name
        ORDER BY e.name
      `
    );
  }

  async adminPlans(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, name, monthly_price_per_employee AS "monthlyPricePerEmployee", payer_policy AS "payerPolicy" FROM company_plans ORDER BY name`);
  }

  async adminEmployees(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, full_name AS "fullName", employee_number AS "employeeNumber", active FROM employees ORDER BY created_at DESC LIMIT 100`);
  }

  async adminDoctors(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(
      `
        SELECT eu.id, eu.full_name AS "fullName", eu.role, dv.specialty, dv.category, dv.verification_status AS "verificationStatus"
        FROM enterprise_users eu
        LEFT JOIN doctor_verifications dv ON dv.provider_user_id = eu.id
        WHERE eu.role IN ('doctor', 'psychologist')
        ORDER BY eu.full_name
      `
    );
  }

  async adminVerification(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, provider_user_id AS "providerUserId", specialty, category, verification_status AS "verificationStatus" FROM doctor_verifications ORDER BY created_at DESC`);
  }

  async adminTariffs(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, provider_user_id AS "providerUserId", service_type AS "serviceType", amount, currency, category FROM doctor_tariffs ORDER BY created_at DESC`);
  }

  async adminLimits(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, service_type AS "serviceType", monthly_limit AS "monthlyLimit", triage_required AS "triageRequired", premium_copay AS "premiumCopay" FROM plan_limits ORDER BY service_type`);
  }

  async adminBilling(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, enterprise_id AS "enterpriseId", total_amount AS "totalAmount", status, period_start AS "periodStart" FROM billing_invoices ORDER BY created_at DESC`);
  }

  async adminPayouts(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, provider_user_id AS "providerUserId", amount, status, period FROM payouts ORDER BY created_at DESC`);
  }

  async adminAiSessions(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, enterprise_id AS "enterpriseId", mode, status, created_at AS "createdAt" FROM ai_sessions ORDER BY created_at DESC LIMIT 100`);
  }

  async adminReports(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, enterprise_id AS "enterpriseId", report_type AS "reportType", period, created_at AS "createdAt" FROM aggregate_reports ORDER BY created_at DESC`);
  }

  async adminAudit(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return this.dataSource.query(`SELECT id, event, actor_id AS "actorId", payload, created_at AS "createdAt" FROM audit_logs WHERE event LIKE 'enterprise.%' ORDER BY created_at DESC LIMIT 100`);
  }

  async adminCompliance(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return {
      legal: LEGAL_POSITIONING,
      privacy: this.employerPrivacyCopy(),
      minimumGroupSize: MIN_AGGREGATE_GROUP_SIZE,
      consentRequired: true
    };
  }

  async adminSettings(user: EnterpriseSessionUser) {
    this.assertRole(user, ['takhet_admin']);
    return {
      pricingRules: await this.dataSource.query(`SELECT id, rule_key AS "ruleKey", payload FROM pricing_rules ORDER BY rule_key`),
      leads: await this.dataSource.query(`SELECT id, company_name AS "companyName", contact_name AS "contactName", status, created_at AS "createdAt" FROM enterprise_leads ORDER BY created_at DESC LIMIT 50`)
    };
  }

  async supervisorQualityReview(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return this.dataSource.query(
      `
        SELECT cn.id, cn.consultation_id AS "consultationId", cn.note, cn.recommendation, cn.created_at AS "createdAt"
        FROM consultation_notes cn
        ORDER BY cn.created_at DESC
        LIMIT 100
      `
    );
  }

  async supervisorFlaggedCases(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return this.dataSource.query(`SELECT id, category, score, level, explanation, created_at AS "createdAt" FROM risk_scores WHERE score >= 65 ORDER BY created_at DESC LIMIT 100`);
  }

  async supervisorEscalations(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return this.dataSource.query(`SELECT id, event_type AS "eventType", status, summary, created_at AS "createdAt" FROM escalation_events ORDER BY created_at DESC LIMIT 100`);
  }

  async supervisorNotesAudit(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return this.supervisorQualityReview(user);
  }

  async supervisorRiskMonitoring(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return {
      minimumGroupSize: MIN_AGGREGATE_GROUP_SIZE,
      flagged: await this.supervisorFlaggedCases(user),
      legal: LEGAL_POSITIONING
    };
  }

  async supervisorProtocols(user: EnterpriseSessionUser) {
    this.assertRole(user, ['clinical_supervisor']);
    return [
      { id: 'escalation', title: 'Escalation review', status: 'active' },
      { id: 'notes-audit', title: 'Consultation notes audit', status: 'active' },
      { id: 'quality', title: 'Quality review checklist', status: 'active' }
    ];
  }

  private async calculateConsultationAccess(user: EnterpriseSessionUser, request: ConsultationRequest) {
    const benefits = await this.employeeBenefits(user);
    const benefit = benefits.benefits.find((item: Record<string, any>) => item.serviceType === request.serviceType);
    const triageRequired = request.serviceType === 'specialist' || Boolean(benefit?.triageRequired);
    const remaining = Number(benefit?.remainingCredits ?? 0);
    const premium = Boolean(request.premiumRequested);
    const copayRequired = premium || remaining <= 0;
    const preferred = request.preferredTime ? new Date(request.preferredTime) : null;
    const hour = preferred ? preferred.getHours() : new Date().getHours();
    const nightSurcharge = hour >= 22 || hour < 8;
    const payerPolicy = benefit?.payerPolicy || 'company';
    return {
      allowed: !triageRequired || request.notes || request.serviceType !== 'specialist',
      triageRequired,
      remainingCredits: remaining,
      copayRequired,
      premiumCopay: premium ? true : undefined,
      nightSurcharge,
      payerPolicy,
      employeeMessage: copayRequired
        ? 'Доступно с co-pay или после подтверждения лимита.'
        : 'Услуга входит в корпоративный пакет.'
    };
  }

  private hideInternalTariff(row: Record<string, any>) {
    const { internalTariff: _internalTariff, tariffAmount: _tariffAmount, amount: _amount, ...safe } = row;
    void _internalTariff;
    void _tariffAmount;
    void _amount;
    return safe;
  }

  private async consumeBenefit(user: EnterpriseSessionUser, serviceType: string) {
    await this.dataSource.query(
      `
        UPDATE employee_benefits
        SET used_credits = used_credits + 1,
            remaining_credits = GREATEST(remaining_credits - 1, 0)
        WHERE user_id = $1 AND service_type = $2
      `,
      [user.id, serviceType]
    );
  }

  private async findProvider(enterpriseId: string, serviceType: string) {
    const role = serviceType === 'psychologist' ? 'psychologist' : 'doctor';
    const rows = await this.dataSource.query(
      `
        SELECT eu.id, eu.full_name AS "fullName", dv.specialty
        FROM enterprise_users eu
        LEFT JOIN doctor_verifications dv ON dv.provider_user_id = eu.id
        WHERE eu.enterprise_id = $1 AND eu.role = $2 AND eu.active = true
        ORDER BY eu.created_at ASC
        LIMIT 1
      `,
      [enterpriseId, role]
    );
    return rows[0] || null;
  }

  private async aggregateMetrics(enterpriseId: string) {
    const rows = await this.dataSource.query(
      `
        SELECT COUNT(DISTINCT emp.id)::int AS employees,
               COUNT(DISTINCT ec.id)::int AS consultations,
               COUNT(DISTINCT ai.id)::int AS aiSessions,
               COUNT(DISTINCT rs.id) FILTER (WHERE rs.score >= 65)::int AS riskSignals
        FROM enterprises e
        LEFT JOIN employees emp ON emp.enterprise_id = e.id
        LEFT JOIN enterprise_consultations ec ON ec.enterprise_id = e.id
        LEFT JOIN ai_sessions ai ON ai.enterprise_id = e.id
        LEFT JOIN risk_scores rs ON rs.enterprise_id = e.id
        WHERE e.id = $1
      `,
      [enterpriseId]
    );
    return rows[0] || {};
  }

  private employerPrivacyCopy() {
    return {
      anonymized: true,
      minimumGroupSize: MIN_AGGREGATE_GROUP_SIZE,
      message: 'Employer dashboards return only aggregate analytics. Individual medical records, chats, notes and AI sessions are not exposed.'
    };
  }

  private async listNotifications(userId: string) {
    return this.dataSource.query(
      `
        SELECT id, title, body, is_read AS read, created_at AS "createdAt"
        FROM enterprise_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [userId]
    );
  }

  private async getEmployeeForUser(userId: string) {
    const rows = await this.dataSource.query(
      `
        SELECT emp.id, emp.employee_number AS "employeeNumber", emp.full_name AS "fullName", emp.position,
               emp.active, e.name AS enterprise, d.name AS "departmentName", emp.profile
        FROM employees emp
        JOIN enterprises e ON e.id = emp.enterprise_id
        LEFT JOIN departments d ON d.id = emp.department_id
        WHERE emp.user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    if (!rows[0]) {
      throw new UnauthorizedException('Enterprise employee profile not found');
    }
    return rows[0];
  }

  private assertRole(user: EnterpriseSessionUser, allowed: EnterpriseRole[]) {
    if (!allowed.includes(user.role)) {
      throw new UnauthorizedException('Enterprise role is not allowed for this action');
    }
  }

  private assertProviderRole(user: EnterpriseSessionUser) {
    if (!['doctor', 'psychologist'].includes(user.role)) {
      throw new UnauthorizedException('Enterprise provider role is required');
    }
  }

  private toSessionUser(row: Record<string, any>): EnterpriseSessionUser {
    return {
      id: row.id,
      enterpriseId: row.enterpriseId,
      employeeId: row.employeeId,
      email: row.email,
      role: this.normalizeRole(row.role),
      fullName: row.fullName,
      enterpriseName: row.enterpriseName
    };
  }

  private issueToken(user: EnterpriseSessionUser) {
    return sign(user, env.supabaseJwtSecret || env.appJwtSecret, { expiresIn: '12h' });
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${this.hashPrefix}$${salt}$${hash}`;
  }

  private verifyPassword(storedPassword: string, candidate: string) {
    if (!storedPassword.startsWith(`${this.hashPrefix}$`)) {
      return storedPassword === candidate;
    }

    const [, salt, storedHash] = storedPassword.split('$');
    if (!salt || !storedHash) return false;

    const candidateHash = scryptSync(candidate, salt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');
    return storedBuffer.length === candidateHash.length && timingSafeEqual(storedBuffer, candidateHash);
  }

  private readCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) return null;
    for (const chunk of cookieHeader.split(';')) {
      const [rawName, ...rest] = chunk.trim().split('=');
      if (rawName !== name) continue;
      const value = rest.join('=').trim();
      return value ? decodeURIComponent(value) : null;
    }
    return null;
  }

  private resolveEnterpriseDemoIdentifier(identifier: string, role?: EnterpriseRole) {
    const normalized = identifier.trim().toLowerCase();
    if (normalized !== 'admin' || !role) return normalized;
    const demoByRole: Record<EnterpriseRole, string> = {
      employee: 'emp-1001',
      employer_admin: 'hr-admin',
      doctor: 'dr-enterprise',
      psychologist: 'psy-enterprise',
      takhet_admin: 't+admin',
      clinical_supervisor: 'clin-sup'
    };
    return demoByRole[role];
  }

  private normalizeRole(role: AnyEnterpriseRole): EnterpriseRole {
    const legacyMap: Record<LegacyEnterpriseRole, EnterpriseRole> = {
      worker: 'employee',
      enterprise_admin: 'employer_admin',
      medical_reviewer: 'clinical_supervisor',
      super_admin: 'takhet_admin'
    };
    return (legacyMap as Record<string, EnterpriseRole>)[role] || (role as EnterpriseRole);
  }

  private async audit(event: string, actorId: string | null, payload: Record<string, unknown>) {
    await this.dataSource.query(`INSERT INTO audit_logs (event, actor_id, payload) VALUES ($1, $2, $3::jsonb)`, [
      event,
      actorId ?? ENTERPRISE_SYSTEM_ACTOR_ID,
      JSON.stringify(payload)
    ]);
  }

  private async ensureSchema() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprises (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        industry TEXT NOT NULL DEFAULT 'Corporate healthcare',
        subscription_status TEXT NOT NULL DEFAULT 'active',
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_id TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (enterprise_id, employee_id),
        UNIQUE (enterprise_id, email)
      )
    `);
    await this.dataSource.query(`ALTER TABLE enterprise_users DROP CONSTRAINT IF EXISTS enterprise_users_role_check`);
    await this.dataSource.query(`
      ALTER TABLE enterprise_users ADD CONSTRAINT enterprise_users_role_check
      CHECK (role IN ('employee', 'employer_admin', 'doctor', 'psychologist', 'takhet_admin', 'clinical_supervisor', 'worker', 'enterprise_admin', 'medical_reviewer', 'super_admin'))
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        employees INT,
        message TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        employee_number TEXT NOT NULL,
        full_name TEXT NOT NULL,
        position TEXT NOT NULL DEFAULT 'Employee',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (enterprise_id, employee_number)
      )
    `);
    await this.dataSource.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id UUID`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS company_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        monthly_price_per_employee INT NOT NULL DEFAULT 5000,
        employee_allowance INT NOT NULL DEFAULT 2,
        payer_policy TEXT NOT NULL DEFAULT 'company',
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS plan_limits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID NOT NULL REFERENCES company_plans(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        monthly_limit INT NOT NULL DEFAULT 0,
        triage_required BOOLEAN NOT NULL DEFAULT FALSE,
        premium_copay BOOLEAN NOT NULL DEFAULT FALSE,
        night_surcharge_percent INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS employee_benefits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES company_plans(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        monthly_allowance INT NOT NULL DEFAULT 0,
        remaining_credits INT NOT NULL DEFAULT 0,
        used_credits INT NOT NULL DEFAULT 0,
        premium_copay_required BOOLEAN NOT NULL DEFAULT FALSE,
        triage_required BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, service_type)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS benefit_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        credits_used INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS doctor_verifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        specialty TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'standard',
        verification_status TEXT NOT NULL DEFAULT 'verified',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (provider_user_id)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS doctor_training (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        training_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS doctor_tariffs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        amount INT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'KZT',
        category TEXT NOT NULL DEFAULT 'standard',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_consultations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        provider_user_id UUID REFERENCES enterprise_users(id) ON DELETE SET NULL,
        service_type TEXT NOT NULL,
        specialty TEXT,
        status TEXT NOT NULL DEFAULT 'requested',
        scheduled_at TIMESTAMPTZ,
        provider_name TEXT,
        employee_visible_summary TEXT NOT NULL DEFAULT '',
        copay_required BOOLEAN NOT NULL DEFAULT FALSE,
        premium_requested BOOLEAN NOT NULL DEFAULT FALSE,
        night_surcharge BOOLEAN NOT NULL DEFAULT FALSE,
        payer_policy TEXT NOT NULL DEFAULT 'company',
        feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS consultation_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        consultation_id UUID NOT NULL REFERENCES enterprise_consultations(id) ON DELETE CASCADE,
        provider_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        recommendation TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`ALTER TABLE consultation_notes ADD COLUMN IF NOT EXISTS recommendation TEXT NOT NULL DEFAULT ''`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_user_id UUID REFERENCES enterprise_users(id) ON DELETE SET NULL,
        mode TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS mental_checkins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_user_id UUID REFERENCES enterprise_users(id) ON DELETE SET NULL,
        stress_level INT NOT NULL DEFAULT 0,
        burnout_signal INT NOT NULL DEFAULT 0,
        summary TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_user_id UUID REFERENCES enterprise_users(id) ON DELETE SET NULL,
        category TEXT NOT NULL,
        score INT NOT NULL,
        level TEXT NOT NULL,
        explanation TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS aggregate_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        report_type TEXT NOT NULL,
        period TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS billing_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        period_start DATE NOT NULL DEFAULT CURRENT_DATE,
        period_end DATE NOT NULL DEFAULT CURRENT_DATE,
        total_amount INT NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
        amount INT NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        amount INT NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        period TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rule_key TEXT NOT NULL UNIQUE,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS consent_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        consent_type TEXT NOT NULL,
        accepted BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS escalation_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        summary TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.ensureLegacyRiskTables();
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_enterprise_consultations_employee ON enterprise_consultations(employee_user_id, created_at DESC)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_risk_scores_enterprise ON risk_scores(enterprise_id, created_at DESC)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_enterprise_leads_created ON enterprise_leads(created_at DESC)`);
  }

  private async ensureLegacyRiskTables() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS checks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red')),
        label TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        completion_percent INT NOT NULL DEFAULT 0,
        score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS check_answers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        question_key TEXT NOT NULL,
        value JSONB NOT NULL DEFAULT 'null'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS risk_flags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
        severity TEXT NOT NULL CHECK (severity IN ('green', 'yellow', 'red')),
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS enterprise_registration_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
        identifier TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.dataSource.query(`ALTER TABLE enterprise_registration_requests DROP CONSTRAINT IF EXISTS enterprise_registration_requests_role_check`);
    await this.dataSource.query(`
      ALTER TABLE enterprise_registration_requests ADD CONSTRAINT enterprise_registration_requests_role_check
      CHECK (role IN ('employee', 'employer_admin', 'doctor', 'psychologist', 'takhet_admin', 'clinical_supervisor', 'worker', 'enterprise_admin', 'medical_reviewer', 'super_admin'))
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
        scope TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async ensureSeedData() {
    const password = this.hashPassword(process.env.ENTERPRISE_BOOTSTRAP_PASSWORD || 'admin');
    const existing = await this.dataSource.query(`SELECT id FROM enterprises ORDER BY created_at ASC LIMIT 1`);
    const enterpriseId = existing[0]?.id || (await this.createSeedEnterprise());
    await this.ensureSeedPlan(enterpriseId);
    await this.ensureBootstrapEnterpriseAccounts(enterpriseId, password);
  }

  private async createSeedEnterprise() {
    const enterpriseRows = await this.dataSource.query(
      `
        INSERT INTO enterprises (name, industry, settings)
        VALUES ('Takhet Corporate Health Demo', 'Corporate healthcare', $1::jsonb)
        RETURNING id
      `,
      [JSON.stringify({ positioning: LEGAL_POSITIONING })]
    );
    await this.dataSource.query(
      `INSERT INTO departments (enterprise_id, name) VALUES ($1, 'Operations'), ($1, 'Sales'), ($1, 'Back office') ON CONFLICT DO NOTHING`,
      [enterpriseRows[0].id]
    );
    return enterpriseRows[0].id;
  }

  private async ensureSeedPlan(enterpriseId: string) {
    const rows = await this.dataSource.query(
      `
        INSERT INTO company_plans (enterprise_id, name, monthly_price_per_employee, employee_allowance, payer_policy, settings)
        VALUES ($1, 'Business', 5000, 2, 'company', $2::jsonb)
        ON CONFLICT DO NOTHING
        RETURNING id
      `,
      [enterpriseId, JSON.stringify({ aiSupport: 'fair-use', pilot: '30 days' })]
    );
    const planRows = rows.length ? rows : await this.dataSource.query(`SELECT id FROM company_plans WHERE enterprise_id = $1 ORDER BY created_at ASC LIMIT 1`, [enterpriseId]);
    const planId = planRows[0]?.id;
    if (!planId) return;
    for (const limit of [
      ['duty_doctor', 2, false, false, 50],
      ['psychologist', 1, false, true, 50],
      ['specialist', 1, true, true, 50],
      ['ai_mental', 999, false, false, 0]
    ] as Array<[string, number, boolean, boolean, number]>) {
      await this.dataSource.query(
        `
          INSERT INTO plan_limits (plan_id, service_type, monthly_limit, triage_required, premium_copay, night_surcharge_percent)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `,
        [planId, ...limit]
      );
    }
  }

  private async ensureBootstrapEnterpriseAccounts(enterpriseId: string, password: string) {
    const users: Array<[string, string, EnterpriseRole, string]> = [
      ['EMP-1001', 'employee.enterprise@takhet.com', 'employee', 'Aidos Employee'],
      ['HR-ADMIN', 'hr.enterprise@takhet.com', 'employer_admin', 'Enterprise HR Admin'],
      ['DR-ENTERPRISE', 'doctor.enterprise@takhet.com', 'doctor', 'Dr. Ayan Enterprise'],
      ['PSY-ENTERPRISE', 'psychologist.enterprise@takhet.com', 'psychologist', 'Dana Psychologist'],
      ['T+ADMIN', 'takhet.admin.enterprise@takhet.com', 'takhet_admin', 'Takhet Admin'],
      ['CLIN-SUP', 'clinical.supervisor@takhet.com', 'clinical_supervisor', 'Clinical Supervisor']
    ];

    for (const [employeeId, email, role, fullName] of users) {
      const rows = await this.dataSource.query(
        `
          INSERT INTO enterprise_users (enterprise_id, employee_id, email, password_hash, role, full_name)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (enterprise_id, employee_id)
          DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, full_name = EXCLUDED.full_name, active = true
          RETURNING id
        `,
        [enterpriseId, employeeId, email, password, role, fullName]
      );
      if (role === 'employee') {
        await this.ensureEmployeeProfile(enterpriseId, rows[0].id, employeeId, fullName);
        await this.ensureEmployeeBenefits(enterpriseId, rows[0].id);
      }
      if (role === 'doctor' || role === 'psychologist') {
        await this.ensureProviderProfile(rows[0].id, role);
      }
    }
    await this.seedOperationalRows(enterpriseId);
  }

  private async ensureEmployeeProfile(enterpriseId: string, userId: string, employeeId: string, fullName: string) {
    await this.dataSource.query(
      `
        INSERT INTO employees (enterprise_id, user_id, employee_number, full_name, position, profile)
        VALUES ($1, $2, $3, $4, 'Employee', $5::jsonb)
        ON CONFLICT (enterprise_id, employee_number)
        DO UPDATE SET user_id = EXCLUDED.user_id, full_name = EXCLUDED.full_name, active = true
      `,
      [enterpriseId, userId, employeeId, fullName, JSON.stringify({ corporateInvite: true })]
    );
  }

  private async ensureEmployeeBenefits(enterpriseId: string, userId: string) {
    const planRows = await this.dataSource.query(`SELECT id FROM company_plans WHERE enterprise_id = $1 ORDER BY created_at ASC LIMIT 1`, [enterpriseId]);
    const planId = planRows[0]?.id;
    if (!planId) return;
    const limits = await this.dataSource.query(`SELECT * FROM plan_limits WHERE plan_id = $1`, [planId]);
    for (const limit of limits) {
      await this.dataSource.query(
        `
          INSERT INTO employee_benefits (enterprise_id, user_id, plan_id, service_type, monthly_allowance, remaining_credits, premium_copay_required, triage_required)
          VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
          ON CONFLICT (user_id, service_type)
          DO UPDATE SET plan_id = EXCLUDED.plan_id, monthly_allowance = EXCLUDED.monthly_allowance
        `,
        [enterpriseId, userId, planId, limit.service_type, limit.monthly_limit, limit.premium_copay, limit.triage_required]
      );
    }
  }

  private async ensureProviderProfile(userId: string, role: EnterpriseRole) {
    const specialty = role === 'psychologist' ? 'Психологическая поддержка' : 'Дежурный врач';
    const category = role === 'psychologist' ? 'senior' : 'standard';
    await this.dataSource.query(
      `
        INSERT INTO doctor_verifications (provider_user_id, specialty, category, verification_status)
        VALUES ($1, $2, $3, 'verified')
        ON CONFLICT (provider_user_id)
        DO UPDATE SET specialty = EXCLUDED.specialty, category = EXCLUDED.category, verification_status = 'verified'
      `,
      [userId, specialty, category]
    );
    await this.dataSource.query(
      `INSERT INTO doctor_training (provider_user_id, training_name, status, completed_at) VALUES ($1, 'Corporate online consultation', 'completed', NOW()) ON CONFLICT DO NOTHING`,
      [userId]
    );
    await this.dataSource.query(
      `INSERT INTO doctor_tariffs (provider_user_id, service_type, amount, category) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [userId, role === 'psychologist' ? 'psychologist' : 'duty_doctor', role === 'psychologist' ? 10000 : 4000, category]
    );
  }

  private async seedOperationalRows(enterpriseId: string) {
    await this.dataSource.query(
      `
        INSERT INTO pricing_rules (rule_key, payload)
        VALUES
          ('night_surcharge', '{"percent":50,"payerPolicy":"company"}'::jsonb),
          ('premium_copay', '{"enabled":true}'::jsonb),
          ('aggregate_privacy', '{"minimumGroupSize":10}'::jsonb)
        ON CONFLICT (rule_key) DO NOTHING
      `
    );
    await this.dataSource.query(
      `
        INSERT INTO aggregate_reports (enterprise_id, report_type, period, payload)
        VALUES ($1, 'monthly_usage', TO_CHAR(NOW(), 'YYYY-MM'), '{"activeEmployees":1,"privacy":"aggregate-only"}'::jsonb)
        ON CONFLICT DO NOTHING
      `,
      [enterpriseId]
    );
    await this.dataSource.query(
      `
        INSERT INTO billing_invoices (enterprise_id, total_amount, status)
        VALUES ($1, 250000, 'draft')
        ON CONFLICT DO NOTHING
      `,
      [enterpriseId]
    );
  }
}
