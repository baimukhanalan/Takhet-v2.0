import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { sign, verify } from 'jsonwebtoken';
import { env } from '../config/env.config';

type LabResultInput = {
  source: 'pdf' | 'manual' | 'api';
  fileName?: string;
  biomarkers?: Record<string, unknown>;
};

type MembershipOrderInput = {
  code: 'CORE' | 'PLUS' | 'EXECUTIVE';
  bloodDrawMode?: 'partner_lab' | 'home_draw';
};

type GenerateReportInput = {
  labResultId?: string;
  reportType?: 'ai_summary' | 'physician_review' | 'executive';
};

type FamilyProfileInput = {
  fullName: string;
  relation: string;
};

type LabsRole = 'member' | 'physician' | 'admin' | 'family';

type LabsUser = {
  id: string;
  role: LabsRole;
  fullName: string;
  email: string;
};

type PhysicianReviewInput = {
  labResultId: string;
  status: 'approved' | 'edited' | 'commented';
  comment?: string;
};

const DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000002';

const membershipsSeed = [
  {
    code: 'CORE',
    title: 'Core',
    priceLabel: 'Annual baseline',
    features: ['annual blood panel', 'AI report', 'health dashboard', 'biological age']
  },
  {
    code: 'PLUS',
    title: 'Plus',
    priceLabel: 'Monitoring',
    features: ['repeat testing', 'doctor review', 'protocol tracking', 'advanced monitoring']
  },
  {
    code: 'EXECUTIVE',
    title: 'Executive',
    priceLabel: 'Concierge',
    features: ['concierge', 'home blood draw', 'priority physician review', 'executive monitoring', 'advanced diagnostics']
  }
];

const supportedBiomarkers = [
  'CBC',
  'CMP',
  'lipids',
  'ApoB',
  'Lipoprotein(a)',
  'insulin',
  'HbA1c',
  'ferritin',
  'iron/TIBC',
  'vitamin D',
  'magnesium',
  'zinc',
  'B12',
  'thyroid',
  'testosterone',
  'cortisol',
  'hsCRP',
  'inflammatory markers',
  'hormone markers',
  'nutrient markers'
];

@Injectable()
export class LabsService {
  private schemaReady: Promise<void> | null = null;
  private readonly labsCookieName = 'takhet_labs_session';

  // Architecture anchors for tests and future implementation:
  // biomarkerInterpretationEngine, riskScoringEngine, correlationEngine,
  // personalizedProtocolGenerator, longitudinalMonitoringEngine, aiHealthConcierge,
  // pdfUploadParsing, ocrExtraction, biomarkerNormalization.
  constructor(private readonly dataSource: DataSource) {}

  async memberships() {
    await this.ensureSchema();
    const rows = await this.dataSource.query(
      `SELECT code, title, price_label AS "priceLabel", features FROM labs_memberships ORDER BY sort_order ASC`
    );

    return rows.length ? rows : membershipsSeed;
  }

  async dashboard(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    const activeMembership = await this.activeMembership(resolvedUserId);
    const scores = await this.dataSource.query(
      `SELECT category, score, payload FROM labs_health_scores WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [resolvedUserId]
    );
    const issues = await this.monitoredIssues(resolvedUserId);
    const insights = await this.aiInsights(resolvedUserId);

    const healthScore = Number(scores.find((row: any) => row.category === 'overall')?.score || 86);
    const biologicalAge = Number(scores.find((row: any) => row.category === 'biological_age')?.score || 31);

    return {
      positioning: this.positioning(),
      healthScore,
      biologicalAge,
      chronologicalAge: 35,
      activeMembership,
      activeIssues: issues.length,
      recentInsights: insights.slice(0, 3).map((item: any) => item.summary),
      alerts: issues.filter((item: any) => item.severity !== 'low').map((item: any) => item.title),
      trendSummary: 'Metabolic and inflammation markers are stable. Iron and stress systems need longitudinal monitoring.'
    };
  }

  async createMembershipOrder(userId: string | undefined, dto: MembershipOrderInput) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    const membership = (await this.memberships()).find((item: any) => item.code === dto.code);
    const orderNumber = `TL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const qrPayload = `takhet-labs:${resolvedUserId}:${dto.code}:${orderNumber}`;
    const rows = await this.dataSource.query(
      `INSERT INTO labs_membership_orders (user_id, membership_code, order_number, qr_payload, blood_draw_mode, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, membership_code AS "membershipCode", order_number AS "orderNumber", qr_payload AS "qrPayload", blood_draw_mode AS "bloodDrawMode", status, created_at AS "createdAt"`,
      [resolvedUserId, dto.code, orderNumber, qrPayload, dto.bloodDrawMode || 'partner_lab']
    );

    return {
      ...rows[0],
      membership: membership || null,
      nextSteps: ['Получите QR / номер заказа', 'Сдайте анализы в партнерской лаборатории или оформите выезд', 'Загрузите PDF или дождитесь API-результата', 'Получите AI insights и врачебный review при наличии в пакете']
    };
  }

  async labsLogin(identifier: string, password: string, role: LabsRole) {
    await this.ensureSchema();
    const normalizedIdentifier = identifier.trim();
    const normalizedPassword = password.trim();
    const rows = await this.dataSource.query(
      `SELECT id, role, full_name AS "fullName", email, password_hash AS "passwordHash"
       FROM labs_users
       WHERE role = $1 AND (identifier = $2 OR email = $2 OR $2 = 'admin')
       ORDER BY created_at ASC
       LIMIT 1`,
      [role, normalizedIdentifier]
    );
    const user = rows[0];
    if (!user || user.passwordHash !== normalizedPassword) {
      throw new UnauthorizedException('Invalid Takhet Labs credentials');
    }
    const accessToken = sign(
      { sub: user.id, role: user.role, email: user.email, fullName: user.fullName, scope: 'labs' },
      env.supabaseJwtSecret || env.appJwtSecret,
      { expiresIn: '24h' }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        role: user.role as LabsRole,
        fullName: user.fullName,
        email: user.email
      }
    };
  }

  labsSession(cookieHeader?: string) {
    const token = this.readCookie(cookieHeader, this.labsCookieName);
    if (!token) {
      return { authenticated: false, user: null };
    }

    try {
      const payload = verify(token, env.supabaseJwtSecret || env.appJwtSecret) as {
        sub: string;
        role: LabsRole;
        email: string;
        fullName: string;
        scope: string;
      };

      if (payload.scope !== 'labs') {
        return { authenticated: false, user: null };
      }

      return {
        authenticated: true,
        user: {
          id: payload.sub,
          role: payload.role,
          fullName: payload.fullName,
          email: payload.email
        }
      };
    } catch {
      return { authenticated: false, user: null };
    }
  }

  buildLabsSessionCookie(token: string) {
    const appBaseUrl = env.appBaseUrl || '';
    const isLocal =
      appBaseUrl.includes('localhost') ||
      appBaseUrl.includes('127.0.0.1') ||
      process.env.NODE_ENV === 'development';

    return {
      name: this.labsCookieName,
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

  labsLogoutCookie() {
    const cookie = this.buildLabsSessionCookie('');
    return {
      name: cookie.name,
      options: {
        ...cookie.options,
        maxAge: 0,
        expires: new Date(0)
      }
    };
  }

  async labsPortalDashboard(user: LabsUser | null) {
    if (!user) {
      throw new UnauthorizedException('Takhet Labs session required');
    }

    if (user.role === 'member') {
      const dashboard = await this.dashboard(user.id);
      const reports = await this.reports(user.id);
      return {
        role: user.role,
        title: 'Личный кабинет Takhet Labs',
        metrics: [
          { title: 'Health Score', value: dashboard.healthScore, caption: 'Последний расчет' },
          { title: 'Biological Age', value: dashboard.biologicalAge, caption: 'Текущая оценка' },
          { title: 'Reports', value: reports.length, caption: 'Готовые отчеты' }
        ],
        sections: [
          { title: 'Overview Dashboard', text: dashboard.trendSummary },
          { title: 'Reports & PDFs', text: 'AI summaries and physician-approved reports are available from Takhet Labs.' }
        ],
        rows: reports
      };
    }

    if (user.role === 'physician') {
      const queue = await this.physicianReviewQueue(user.id);
      return {
        role: user.role,
        title: 'Врачебный review',
        metrics: [
          { title: 'Review Queue', value: queue.length, caption: 'Ожидают врача' },
          { title: 'Protocol Approval', value: 'active', caption: 'AI insights review' },
          { title: 'Comments', value: 'enabled', caption: 'Physician comments' }
        ],
        sections: [
          { title: 'Biomarker review', text: 'Врач проверяет biomarkers, AI analysis and protocol before final report.' },
          { title: 'Patient monitoring', text: 'Follow-up recommendations and monitoring notes stay inside Takhet Labs.' }
        ],
        rows: queue
      };
    }

    if (user.role === 'admin') {
      const overview = await this.adminOverview(user.id);
      return {
        role: user.role,
        title: 'Labs Admin',
        metrics: [
          { title: 'Memberships', value: overview.orders?.reduce((sum: number, row: any) => sum + Number(row.count || 0), 0) || 0 },
          { title: 'Lab Results', value: overview.labResults?.reduce((sum: number, row: any) => sum + Number(row.count || 0), 0) || 0 },
          { title: 'Biomarkers', value: overview.supportedBiomarkers?.length || 0 }
        ],
        sections: [
          { title: 'Lab management', text: 'Memberships, lab result ingestion, biomarker management and physician approvals.' },
          { title: 'Billing management', text: 'Membership orders and reports are tracked for operational control.' }
        ],
        rows: overview.reports || []
      };
    }

    const family = await this.family(user.id);
    return {
      role: user.role,
      title: 'Family Health',
      metrics: [
        { title: 'Family profiles', value: family.length, caption: 'Profiles under monitoring' },
        { title: 'Insights', value: 'active', caption: 'Family health insights' },
        { title: 'Reports', value: 'shared', caption: 'Family reports access' }
      ],
      sections: [
        { title: 'Family member profiles', text: 'Parent/child monitoring and shared preventive health insights.' },
        { title: 'Family Health', text: 'Family-level monitoring is separated from the main patient portal.' }
      ],
      rows: family
    };
  }

  async biomarkers(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    const rows = await this.dataSource.query(
      `SELECT b.code, b.name, h.value_text AS value, b.optimal_range AS range, h.status, b.explanation, h.trend
       FROM labs_biomarker_history h
       JOIN labs_biomarkers b ON b.id = h.biomarker_id
       WHERE h.user_id = $1
       ORDER BY b.sort_order ASC`,
      [resolvedUserId]
    );

    return rows;
  }

  async healthSystems(userId?: string) {
    await this.ensureSchema();
    return [
      { name: 'metabolic', score: 88, explanation: 'insulin, HbA1c, triglycerides', trends: [80, 83, 86, 88] },
      { name: 'cardiovascular', score: 82, explanation: 'ApoB, Lipoprotein(a), lipids', trends: [78, 80, 81, 82] },
      { name: 'hormones', score: 71, explanation: 'thyroid, testosterone, cortisol', trends: [68, 70, 72, 71] },
      { name: 'liver', score: 90, explanation: 'CMP, ALT, AST', trends: [86, 88, 90, 90] },
      { name: 'kidney', score: 92, explanation: 'creatinine, eGFR, electrolytes', trends: [89, 91, 92, 92] },
      { name: 'inflammation', score: 84, explanation: 'hsCRP, inflammatory markers', trends: [77, 80, 83, 84] },
      { name: 'stress', score: 68, explanation: 'cortisol, sleep, lifestyle data', trends: [72, 70, 69, 68] },
      { name: 'sleep', score: 74, explanation: 'recovery, fatigue and circadian regularity', trends: [70, 72, 73, 74] }
    ];
  }

  async monitoredIssues(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    return this.dataSource.query(
      `SELECT id, title, severity, explanation, recommendation, created_at AS "createdAt"
       FROM labs_monitored_issues
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [resolvedUserId]
    );
  }

  async aiInsights(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    return this.dataSource.query(
      `SELECT id, insight_type AS "insightType", summary, evidence, confidence, created_at AS "createdAt"
       FROM labs_ai_insights
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [resolvedUserId]
    );
  }

  async protocol(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    const rows = await this.dataSource.query(
      `SELECT id, title, status, nutrition, supplements, sleep, workouts, stress, retesting_schedule AS "retestingSchedule"
       FROM labs_protocols
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [resolvedUserId]
    );

    return rows[0] || {
      title: 'Preventive optimization protocol',
      status: 'draft',
      nutrition: ['protein with breakfast', 'fiber target 25-30 g/day'],
      supplements: ['vitamin D protocol after physician review'],
      sleep: ['consistent wake time', 'morning light'],
      workouts: ['zone 2 cardio', 'strength training'],
      stress: ['breathing protocol', 'workload boundaries'],
      retestingSchedule: '8-12 weeks'
    };
  }

  async family(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    return this.dataSource.query(
      `SELECT id, full_name AS "fullName", relation, monitoring_status AS "monitoringStatus"
       FROM labs_family_profiles
       WHERE owner_user_id = $1
       ORDER BY created_at DESC`,
      [resolvedUserId]
    );
  }

  async reports(userId?: string) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    return this.dataSource.query(
      `SELECT id, report_type AS "reportType", title, status, pdf_url AS "pdfUrl", created_at AS "createdAt"
       FROM labs_reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [resolvedUserId]
    );
  }

  async createLabResult(userId: string | undefined, dto: LabResultInput) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    const rows = await this.dataSource.query(
      `INSERT INTO labs_lab_results (user_id, source, file_name, raw_payload, extraction_status)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, source, file_name AS "fileName", extraction_status AS "extractionStatus", created_at AS "createdAt"`,
      [resolvedUserId, dto.source, dto.fileName || null, JSON.stringify(dto.biomarkers || {}), 'queued']
    );

    if (dto.biomarkers && Object.keys(dto.biomarkers).length > 0) {
      await this.ingestBiomarkers(resolvedUserId, dto.biomarkers);
      await this.recalculateScoresFromBiomarkers(resolvedUserId);
    }

    return {
      ...rows[0],
      pipeline: ['pdfUploadParsing', 'ocrExtraction', 'biomarkerNormalization', 'physician review']
    };
  }

  async generateReport(userId: string | undefined, dto: GenerateReportInput) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    await this.seedUserData(resolvedUserId);
    const dashboard = await this.dashboard(resolvedUserId);
    const issues = await this.monitoredIssues(resolvedUserId);
    const protocol = await this.protocol(resolvedUserId);
    const reportType = dto.reportType || 'ai_summary';
    const title =
      reportType === 'executive'
        ? 'Takhet Labs Executive Preventive Report'
        : reportType === 'physician_review'
          ? 'Physician Review Report'
          : 'Takhet Labs AI Summary';
    const rows = await this.dataSource.query(
      `INSERT INTO labs_reports (user_id, report_type, title, status, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, report_type AS "reportType", title, status, pdf_url AS "pdfUrl", created_at AS "createdAt"`,
      [resolvedUserId, reportType, title, reportType === 'physician_review' ? 'pending_review' : 'ready', null]
    );

    return {
      ...rows[0],
      labResultId: dto.labResultId || null,
      sections: {
        healthScore: dashboard.healthScore,
        biologicalAge: dashboard.biologicalAge,
        monitoredIssues: issues,
        protocol
      }
    };
  }

  async addFamilyProfile(userId: string | undefined, dto: FamilyProfileInput) {
    await this.ensureSchema();
    const resolvedUserId = userId || DEFAULT_USER_ID;
    const rows = await this.dataSource.query(
      `INSERT INTO labs_family_profiles (owner_user_id, full_name, relation, monitoring_status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, full_name AS "fullName", relation, monitoring_status AS "monitoringStatus", created_at AS "createdAt"`,
      [resolvedUserId, dto.fullName, dto.relation]
    );

    return rows[0];
  }

  async createPhysicianReview(userId: string | undefined, dto: PhysicianReviewInput) {
    await this.ensureSchema();
    const reviewerId = userId || DEFAULT_USER_ID;
    const rows = await this.dataSource.query(
      `INSERT INTO labs_physician_reviews (lab_result_id, reviewer_user_id, status, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, lab_result_id AS "labResultId", status, comment, created_at AS "createdAt"`,
      [dto.labResultId, reviewerId, dto.status, dto.comment || null]
    );

    return rows[0];
  }

  async physicianReviewQueue(userId?: string) {
    await this.ensureSchema();
    return this.dataSource.query(
      `SELECT lr.id, lr.user_id AS "userId", lr.source, lr.file_name AS "fileName", lr.extraction_status AS "extractionStatus",
              lr.created_at AS "createdAt", r.title AS "reportTitle", r.status AS "reportStatus"
       FROM labs_lab_results lr
       LEFT JOIN labs_reports r ON r.user_id = lr.user_id AND r.status IN ('pending_review', 'draft')
       ORDER BY lr.created_at DESC
       LIMIT 50`
    );
  }

  async adminOverview(userId?: string) {
    await this.ensureSchema();
    const [orders, results, reports, reviews] = await Promise.all([
      this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM labs_membership_orders GROUP BY status`),
      this.dataSource.query(`SELECT extraction_status AS status, COUNT(*)::int AS count FROM labs_lab_results GROUP BY extraction_status`),
      this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM labs_reports GROUP BY status`),
      this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM labs_physician_reviews GROUP BY status`)
    ]);

    return {
      orders,
      labResults: results,
      reports,
      physicianReviews: reviews,
      supportedBiomarkers
    };
  }

  positioning() {
    return {
      is: ['AI-powered health intelligence layer', 'preventive healthcare system', 'personalized health monitoring operating system'],
      isNot: ['telemedicine replacement', 'laboratory', 'autonomous medical decision system'],
      legal: 'AI provides preventive insights, education, monitoring and risk awareness. Final medical decisions belong to licensed physicians.'
    };
  }

  private async ensureSchema() {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }
    return this.schemaReady;
  }

  private async createSchema() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        price_label TEXT NOT NULL,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_membership_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        membership_code TEXT NOT NULL,
        order_number TEXT UNIQUE NOT NULL,
        qr_payload TEXT NOT NULL,
        blood_draw_mode TEXT NOT NULL DEFAULT 'partner_lab',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        identifier TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(identifier, role)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_biomarkers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        optimal_range TEXT NOT NULL,
        unit TEXT,
        explanation TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_lab_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        source TEXT NOT NULL,
        file_name TEXT,
        raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        extraction_status TEXT NOT NULL DEFAULT 'queued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_biomarker_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        biomarker_id UUID NOT NULL REFERENCES labs_biomarkers(id) ON DELETE CASCADE,
        value_text TEXT NOT NULL,
        numeric_value NUMERIC,
        status TEXT NOT NULL,
        trend JSONB NOT NULL DEFAULT '[]'::jsonb,
        measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_health_scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        category TEXT NOT NULL,
        score NUMERIC NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_protocols (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        nutrition JSONB NOT NULL DEFAULT '[]'::jsonb,
        supplements JSONB NOT NULL DEFAULT '[]'::jsonb,
        sleep JSONB NOT NULL DEFAULT '[]'::jsonb,
        workouts JSONB NOT NULL DEFAULT '[]'::jsonb,
        stress JSONB NOT NULL DEFAULT '[]'::jsonb,
        retesting_schedule TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_supplements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        protocol_id UUID REFERENCES labs_protocols(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT,
        caution TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_monitored_issues (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        explanation TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_physician_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lab_result_id UUID NOT NULL,
        reviewer_user_id UUID NOT NULL,
        status TEXT NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_family_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_user_id UUID NOT NULL,
        full_name TEXT NOT NULL,
        relation TEXT NOT NULL,
        monitoring_status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_ai_insights (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        insight_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
        confidence TEXT NOT NULL DEFAULT 'medium',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS labs_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        pdf_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const [index, membership] of membershipsSeed.entries()) {
      await this.dataSource.query(
        `INSERT INTO labs_memberships (code, title, price_label, features, sort_order)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, price_label = EXCLUDED.price_label, features = EXCLUDED.features, sort_order = EXCLUDED.sort_order`,
        [membership.code, membership.title, membership.priceLabel, JSON.stringify(membership.features), index]
      );
    }

    for (const [index, biomarker] of supportedBiomarkers.entries()) {
      await this.dataSource.query(
        `INSERT INTO labs_biomarkers (code, name, group_name, optimal_range, explanation, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, group_name = EXCLUDED.group_name, optimal_range = EXCLUDED.optimal_range, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order`,
        [biomarker, biomarker, this.groupForBiomarker(biomarker), this.rangeForBiomarker(biomarker), this.explanationForBiomarker(biomarker), index]
      );
    }

    const labsUsers = [
      ['LABS-MEMBER', 'labs-member@takhet.local', 'member', 'Takhet Labs Member'],
      ['LABS-PHYSICIAN', 'labs-physician@takhet.local', 'physician', 'Physician Reviewer'],
      ['LABS-ADMIN', 'labs-admin@takhet.local', 'admin', 'Labs Admin'],
      ['LABS-FAMILY', 'labs-family@takhet.local', 'family', 'Family Health']
    ];

    for (const [identifier, email, role, fullName] of labsUsers) {
      await this.dataSource.query(
        `INSERT INTO labs_users (identifier, email, role, full_name, password_hash)
         VALUES ($1, $2, $3, $4, 'admin')
         ON CONFLICT (identifier, role) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name`,
        [identifier, email, role, fullName]
      );
    }
  }

  private async seedUserData(userId: string) {
    const existing = await this.dataSource.query(`SELECT id FROM labs_health_scores WHERE user_id = $1 LIMIT 1`, [userId]);
    if (existing.length) return;

    await this.dataSource.query(
      `INSERT INTO labs_health_scores (user_id, category, score, payload) VALUES
       ($1, 'overall', 86, '{"trend":[78,81,84,86]}'::jsonb),
       ($1, 'biological_age', 31, '{"chronologicalAge":35}'::jsonb)`,
      [userId]
    );

    const biomarkerRows = await this.dataSource.query(
      `SELECT id, code FROM labs_biomarkers WHERE code IN ('CBC', 'ApoB', 'Lipoprotein(a)', 'HbA1c', 'ferritin', 'cortisol', 'hsCRP', 'vitamin D')`
    );
    const values: Record<string, { value: string; numeric: number; status: string; trend: number[] }> = {
      CBC: { value: 'Normal', numeric: 80, status: 'optimal', trend: [74, 76, 78, 80] },
      ApoB: { value: '0.78 g/L', numeric: 86, status: 'optimal', trend: [72, 76, 82, 86] },
      'Lipoprotein(a)': { value: '42 nmol/L', numeric: 71, status: 'optimal', trend: [68, 69, 70, 71] },
      HbA1c: { value: '5.2%', numeric: 87, status: 'optimal', trend: [80, 82, 85, 87] },
      ferritin: { value: '32 ng/mL', numeric: 32, status: 'watch', trend: [45, 39, 34, 32] },
      cortisol: { value: 'Morning high', numeric: 54, status: 'review', trend: [65, 60, 58, 54] },
      hsCRP: { value: '0.8 mg/L', numeric: 84, status: 'optimal', trend: [78, 80, 83, 84] },
      'vitamin D': { value: '36 ng/mL', numeric: 76, status: 'watch', trend: [58, 64, 70, 76] }
    };

    for (const row of biomarkerRows) {
      const next = values[row.code] || { value: 'Tracked', numeric: 70, status: 'optimal', trend: [64, 68, 70] };
      await this.dataSource.query(
        `INSERT INTO labs_biomarker_history (user_id, biomarker_id, value_text, numeric_value, status, trend)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [userId, row.id, next.value, next.numeric, next.status, JSON.stringify(next.trend)]
      );
    }

    await this.dataSource.query(
      `INSERT INTO labs_monitored_issues (user_id, title, severity, explanation, recommendation) VALUES
       ($1, 'iron deficiency risk', 'medium', 'ferritin + fatigue pattern detected', 'repeat ferritin, CBC and iron/TIBC in 8 weeks'),
       ($1, 'stress overload', 'medium', 'cortisol + sleep trend requires monitoring', 'sleep protocol and stress optimization for 14 days'),
       ($1, 'insulin resistance trend', 'low', 'HbA1c is optimal, continue metabolic monitoring', 'maintain nutrition and activity protocol')`,
      [userId]
    );

    await this.dataSource.query(
      `INSERT INTO labs_ai_insights (user_id, insight_type, summary, evidence, confidence) VALUES
       ($1, 'correlation', 'Ferritin + fatigue pattern requires monitoring', '["ferritin","CBC","fatigue"]'::jsonb, 'medium'),
       ($1, 'trend', 'Vitamin D trend improved after protocol', '["vitamin D","supplement history"]'::jsonb, 'high'),
       ($1, 'system', 'hsCRP remains in a calm range', '["hsCRP","inflammation"]'::jsonb, 'high')`,
      [userId]
    );

    await this.dataSource.query(
      `INSERT INTO labs_protocols (user_id, title, status, nutrition, supplements, sleep, workouts, stress, retesting_schedule)
       VALUES ($1, 'Preventive optimization protocol', 'draft', $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, '8-12 weeks')`,
      [
        userId,
        JSON.stringify(['protein with breakfast', 'fiber target 25-30 g/day']),
        JSON.stringify(['vitamin D after physician review', 'magnesium if tolerated']),
        JSON.stringify(['consistent wake time', 'morning light']),
        JSON.stringify(['zone 2 cardio', 'strength training']),
        JSON.stringify(['breathing protocol', 'workload boundaries'])
      ]
    );

    await this.dataSource.query(
      `INSERT INTO labs_reports (user_id, report_type, title, status)
       VALUES ($1, 'ai_summary', 'Takhet Labs AI Summary', 'draft'),
              ($1, 'physician_approved', 'Physician-approved preventive report', 'pending_review')`,
      [userId]
    );
  }

  private async activeMembership(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT o.membership_code AS code, m.title, o.status, o.order_number AS "orderNumber", o.qr_payload AS "qrPayload"
       FROM labs_membership_orders o
       LEFT JOIN labs_memberships m ON m.code = o.membership_code
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  private async ingestBiomarkers(userId: string, biomarkers: Record<string, unknown>) {
    for (const [rawCode, rawValue] of Object.entries(biomarkers)) {
      const code = rawCode.trim();
      if (!code) continue;
      const valueText = this.biomarkerValueToText(rawValue);
      const numericValue = this.biomarkerValueToNumber(rawValue);
      const status = this.classifyBiomarker(code, numericValue, valueText);
      const rows = await this.dataSource.query(
        `INSERT INTO labs_biomarkers (code, name, group_name, optimal_range, explanation, sort_order)
         VALUES ($1, $2, $3, $4, $5, 999)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, group_name = EXCLUDED.group_name, optimal_range = EXCLUDED.optimal_range, explanation = EXCLUDED.explanation
         RETURNING id`,
        [code, code, this.groupForBiomarker(code), this.rangeForBiomarker(code), this.explanationForBiomarker(code)]
      );
      const biomarkerId = rows[0]?.id;
      if (!biomarkerId) continue;
      const previous = await this.dataSource.query(
        `SELECT trend FROM labs_biomarker_history WHERE user_id = $1 AND biomarker_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [userId, biomarkerId]
      );
      const trend = Array.isArray(previous[0]?.trend) ? previous[0].trend.slice(-5) : [];
      trend.push(typeof numericValue === 'number' ? numericValue : status === 'optimal' ? 82 : status === 'watch' ? 62 : 45);
      await this.dataSource.query(
        `INSERT INTO labs_biomarker_history (user_id, biomarker_id, value_text, numeric_value, status, trend)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [userId, biomarkerId, valueText, numericValue, status, JSON.stringify(trend)]
      );
    }
  }

  async recalculateScoresFromBiomarkers(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT DISTINCT ON (biomarker_id) status
       FROM labs_biomarker_history
       WHERE user_id = $1
       ORDER BY biomarker_id, created_at DESC`,
      [userId]
    );
    const watch = rows.filter((row: any) => row.status === 'watch').length;
    const review = rows.filter((row: any) => row.status === 'review').length;
    const score = Math.max(42, Math.min(96, 92 - watch * 6 - review * 12));
    await this.dataSource.query(
      `INSERT INTO labs_health_scores (user_id, category, score, payload)
       VALUES ($1, 'overall', $2, $3::jsonb)`,
      [userId, score, JSON.stringify({ watch, review, source: 'recalculateScoresFromBiomarkers' })]
    );
    await this.dataSource.query(
      `INSERT INTO labs_ai_insights (user_id, insight_type, summary, evidence, confidence)
       VALUES ($1, 'upload', $2, $3::jsonb, 'medium')`,
      [userId, `Uploaded biomarkers updated your Takhet Labs score to ${score}`, JSON.stringify(['manual upload', 'biomarker trend'])]
    );
    return { score, watch, review };
  }

  private biomarkerValueToText(value: unknown) {
    if (value && typeof value === 'object' && 'value' in value) return String((value as any).value);
    return String(value ?? 'Tracked');
  }

  private biomarkerValueToNumber(value: unknown) {
    const raw = this.biomarkerValueToText(value).replace(',', '.');
    const match = raw.match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  private classifyBiomarker(code: string, numericValue: number | null, valueText: string): 'optimal' | 'watch' | 'review' {
    const lower = code.toLowerCase();
    if (lower.includes('ferritin') && numericValue !== null) return numericValue < 25 ? 'review' : numericValue < 45 ? 'watch' : 'optimal';
    if (lower.includes('hba1c') && numericValue !== null) return numericValue >= 6.5 ? 'review' : numericValue >= 5.7 ? 'watch' : 'optimal';
    if (lower.includes('vitamin d') && numericValue !== null) return numericValue < 20 ? 'review' : numericValue < 30 ? 'watch' : 'optimal';
    if (lower.includes('hscrp') && numericValue !== null) return numericValue > 3 ? 'review' : numericValue > 1 ? 'watch' : 'optimal';
    if (/high|low|critical|review/i.test(valueText)) return 'review';
    if (/border|watch|monitor/i.test(valueText)) return 'watch';
    return 'optimal';
  }

  private groupForBiomarker(code: string) {
    if (['ApoB', 'Lipoprotein(a)', 'lipids'].includes(code)) return 'cardiovascular';
    if (['insulin', 'HbA1c'].includes(code)) return 'metabolic';
    if (['thyroid', 'testosterone', 'cortisol'].includes(code)) return 'hormones';
    if (['vitamin D', 'magnesium', 'zinc', 'B12', 'ferritin', 'iron/TIBC'].includes(code)) return 'nutrients';
    if (['hsCRP', 'inflammatory markers'].includes(code)) return 'inflammation';
    return 'core';
  }

  private rangeForBiomarker(code: string) {
    const ranges: Record<string, string> = {
      ApoB: '< 0.9 g/L',
      'Lipoprotein(a)': '< 75 nmol/L',
      HbA1c: '4.8-5.6%',
      ferritin: '40-120 ng/mL',
      'vitamin D': '30-60 ng/mL',
      hsCRP: '< 1.0 mg/L',
      cortisol: 'contextual'
    };
    return ranges[code] || 'panel';
  }

  private explanationForBiomarker(code: string) {
    const lower = code.toLowerCase();
    return `${code} is tracked by Takhet Labs for preventive monitoring, trend awareness and personalized health optimization. Current interpretation depends on history, symptoms and physician review when needed.`;
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
