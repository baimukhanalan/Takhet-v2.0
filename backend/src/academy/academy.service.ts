import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

type AcademyArticleSeed = {
  slug: string;
  categorySlug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  readMinutes: number;
  isFeatured?: boolean;
};

export type AcademyImportPayload = {
  slug: string;
  categorySlug: string;
  title: string;
  summary: string;
  body: string;
  characterCount?: number;
  medicalQaStatus?: 'APPROVED' | 'REQUIRED_CHANGES' | 'REJECTED';
  medicalQaArtifact?: string;
  sourceUrls?: string[];
  tags?: string[];
  readMinutes?: number;
  status?: 'draft' | 'review';
  sourceFile?: string;
  sourceTool?: string;
  automationRunId?: string;
  createdBy?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
};

const MIN_ARTICLE_CHARACTER_COUNT = 7000;
const MAX_ARTICLE_CHARACTER_COUNT = 10000;

const categorySeeds = [
  {
    slug: 'symptoms',
    title: 'Симптомы',
    description: 'Понятные разборы частых симптомов и сигналов, когда стоит обратиться к врачу.'
  },
  {
    slug: 'conditions',
    title: 'Заболевания',
    description: 'Справочник состояний без обещаний диагноза и самолечения.'
  },
  {
    slug: 'blood-tests',
    title: 'Анализы крови',
    description: 'Как читать показатели, динамику и подготовиться к обсуждению с врачом.'
  },
  {
    slug: 'diagnostics',
    title: 'Диагностика',
    description: 'ЭКГ, ЭЭГ, УЗИ, МРТ, КТ и подготовка к исследованиям.'
  },
  {
    slug: 'prevention',
    title: 'Профилактика',
    description: 'Профилактические чек-листы, привычки и ранние сигналы риска.'
  },
  {
    slug: 'mental-health',
    title: 'Психическое здоровье',
    description: 'Стресс, сон, тревога и безопасная навигация к специалисту.'
  }
];

const articleSeeds: AcademyArticleSeed[] = [
  {
    slug: 'headache-when-to-see-doctor',
    categorySlug: 'symptoms',
    title: 'Головная боль: причины, симптомы и когда обращаться к врачу',
    summary: 'Краткая навигация по частым типам головной боли, тревожным признакам и подготовке к консультации.',
    body:
      'Головная боль может быть связана со стрессом, сном, давлением, инфекцией, мигренью или другими причинами. Важно оценить интенсивность, длительность, повторяемость и сопутствующие симптомы. Срочно обращайтесь за медицинской помощью при внезапной сильной боли, нарушении речи, слабости в конечностях, высокой температуре, травме головы или резком ухудшении состояния.',
    tags: ['головная боль', 'симптомы', 'неврология'],
    readMinutes: 4,
    isFeatured: true
  },
  {
    slug: 'ecg-preparation',
    categorySlug: 'diagnostics',
    title: 'Что показывает ЭКГ и как подготовиться к исследованию',
    summary: 'Что фиксирует электрокардиограмма, как проходит процедура и что сообщить врачу заранее.',
    body:
      'ЭКГ регистрирует электрическую активность сердца и помогает врачу оценить ритм, проводимость и косвенные признаки перегрузки. Перед процедурой желательно избегать интенсивной нагрузки, предупредить врача о лекарствах и взять прошлые исследования, если они есть.',
    tags: ['ЭКГ', 'сердце', 'диагностика'],
    readMinutes: 3,
    isFeatured: true
  },
  {
    slug: 'high-alt-blood-test',
    categorySlug: 'blood-tests',
    title: 'Высокий АЛТ: что это может означать в анализе крови',
    summary: 'Почему АЛТ смотрят вместе с другими показателями и почему один показатель не является диагнозом.',
    body:
      'АЛТ может повышаться при нагрузке на печень, приеме некоторых лекарств, вирусных инфекциях, метаболических нарушениях и других состояниях. Интерпретация зависит от АСТ, билирубина, ГГТ, щелочной фосфатазы, симптомов и истории пациента. Решение принимает врач.',
    tags: ['АЛТ', 'печень', 'анализ крови'],
    readMinutes: 5,
    isFeatured: true
  },
  {
    slug: 'eeg-preparation',
    categorySlug: 'diagnostics',
    title: 'Как подготовиться к ЭЭГ и что важно сообщить врачу',
    summary: 'Сон, лекарства, кофеин и другие детали, которые влияют на качество исследования.',
    body:
      'Перед ЭЭГ важно уточнить у клиники требования по сну, приему препаратов и стимуляторам. Сообщите врачу о приступах, потере сознания, лекарствах и предыдущих исследованиях. Не отменяйте препараты без назначения врача.',
    tags: ['ЭЭГ', 'неврология', 'диагностика'],
    readMinutes: 4
  },
  {
    slug: 'ferritin-fatigue-iron',
    categorySlug: 'blood-tests',
    title: 'Ферритин, усталость и дефицит железа: как читать динамику',
    summary: 'Почему ферритин важно оценивать вместе с симптомами и другими показателями крови.',
    body:
      'Ферритин отражает запасы железа, но может меняться при воспалении и хронических состояниях. Для оценки часто нужны общий анализ крови, железо, трансферрин, насыщение трансферрина и клиническая картина. Самостоятельно назначать железо не стоит.',
    tags: ['ферритин', 'железо', 'усталость'],
    readMinutes: 5
  },
  {
    slug: 'online-consultation-or-offline-care',
    categorySlug: 'prevention',
    title: 'Когда онлайн-консультация подходит, а когда нужна очная помощь',
    summary: 'Как безопасно выбрать формат помощи и подготовить контекст для врача.',
    body:
      'Онлайн-консультация подходит для первичной навигации, обсуждения анализов, контроля хронических вопросов и уточнения следующего шага. Очная помощь нужна при острых состояниях, травмах, выраженной боли, нарушении дыхания, сознания или других тревожных признаках.',
    tags: ['онлайн-консультация', 'профилактика', 'маршрут'],
    readMinutes: 4
  }
];

const alphabet = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Э'];

@Injectable()
export class AcademyService {
  private initialized?: Promise<void>;

  constructor(private readonly dataSource: DataSource) {}

  async overview() {
    await this.ensureReady();

    const [categories, featured, popular, latest] = await Promise.all([
      this.dataSource.query(
        `SELECT c.slug, c.title, c.description, c.sort_order AS "sortOrder",
                COUNT(a.id)::int AS "articleCount"
         FROM academy_categories c
         LEFT JOIN academy_articles a ON a.category_slug = c.slug AND a.status = 'published'
         GROUP BY c.slug, c.title, c.description, c.sort_order
         ORDER BY c.sort_order ASC`
      ),
      this.articleListQuery(`a.is_featured = true`, [], 6),
      this.articleListQuery(`a.status = 'published'`, [], 6, 'a.views DESC, a.published_at DESC'),
      this.articleListQuery(`a.status = 'published'`, [], 6, 'a.published_at DESC')
    ]);

    return {
      categories,
      featured,
      popular,
      latest,
      alphabet,
      stats: {
        articles: categories.reduce((sum: number, item: { articleCount?: number }) => sum + Number(item.articleCount || 0), 0),
        categories: categories.length,
        reviewed: featured.length
      }
    };
  }

  async search(query: { q?: string; category?: string; letter?: string }) {
    await this.ensureReady();

    const filters = [`a.status = 'published'`];
    const params: any[] = [];
    const normalizedQuery = (query.q || '').trim();
    const normalizedCategory = (query.category || '').trim();
    const normalizedLetter = (query.letter || '').trim().slice(0, 1);

    if (normalizedQuery) {
      params.push(`%${normalizedQuery}%`);
      filters.push(`(a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length} OR a.body ILIKE $${params.length})`);
    }

    if (normalizedCategory) {
      params.push(normalizedCategory);
      filters.push(`a.category_slug = $${params.length}`);
    }

    if (normalizedLetter) {
      params.push(`${normalizedLetter}%`);
      filters.push(`a.title ILIKE $${params.length}`);
    }

    const items = await this.articleListQuery(filters.join(' AND '), params, 20);
    return {
      query: normalizedQuery,
      category: normalizedCategory || null,
      letter: normalizedLetter || null,
      items,
      total: items.length
    };
  }

  async articleBySlug(slug: string) {
    await this.ensureReady();

    const rows = await this.dataSource.query(
      `SELECT a.id, a.slug, a.title, a.summary, a.body, a.character_count AS "characterCount",
              a.read_minutes AS "readMinutes",
              a.views, a.review_status AS "reviewStatus", a.published_at AS "publishedAt",
              c.slug AS "categorySlug", c.title AS "categoryTitle"
       FROM academy_articles a
       JOIN academy_categories c ON c.slug = a.category_slug
       WHERE a.slug = $1 AND a.status = 'published'
       LIMIT 1`,
      [slug]
    );

    const article = rows[0];
    if (!article) {
      throw new NotFoundException('Academy article not found');
    }

    await this.dataSource.query(`UPDATE academy_articles SET views = views + 1, updated_at = now() WHERE id = $1`, [article.id]);

    const tags = await this.dataSource.query(
      `SELECT t.slug, t.title
       FROM academy_tags t
       JOIN academy_article_tags at ON at.tag_slug = t.slug
       WHERE at.article_id = $1
       ORDER BY t.title ASC`,
      [article.id]
    );

    return {
      ...article,
      tags
    };
  }

  async trackEvent(dto: { event: string; target?: string; query?: string }) {
    await this.ensureReady();

    await this.dataSource.query(
      `INSERT INTO academy_article_events (event, target, query)
       VALUES ($1, $2, $3)`,
      [dto.event, dto.target || null, dto.query || null]
    );

    return { ok: true };
  }

  async createImport(dto: AcademyImportPayload) {
    await this.ensureReady();

    const normalized = this.normalizeImportPayload(dto);
    await this.validateImportPayload(normalized);

    const rows = await this.dataSource.query(
      `INSERT INTO academy_article_imports (
         slug, category_slug, title, summary, body, character_count, medical_qa_status, medical_qa_artifact,
         source_urls, tags, read_minutes, status,
         source_file, source_tool, automation_run_id, created_by,
         seo_title, seo_description, canonical_url, medical_review_required
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19, true)
       RETURNING id, slug, category_slug AS "categorySlug", title, summary, body,
         character_count AS "characterCount", medical_qa_status AS "medicalQaStatus",
         medical_qa_artifact AS "medicalQaArtifact", source_urls AS "sourceUrls",
         tags, read_minutes AS "readMinutes",
         status, source_file AS "sourceFile", source_tool AS "sourceTool", automation_run_id AS "automationRunId",
         created_by AS "createdBy", seo_title AS "seoTitle", seo_description AS "seoDescription",
         canonical_url AS "canonicalUrl", medical_review_required AS "medicalReviewRequired",
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        normalized.slug,
        normalized.categorySlug,
        normalized.title,
        normalized.summary,
        normalized.body,
        normalized.characterCount,
        normalized.medicalQaStatus,
        normalized.medicalQaArtifact,
        JSON.stringify(normalized.sourceUrls),
        JSON.stringify(normalized.tags),
        normalized.readMinutes,
        normalized.status || 'draft',
        normalized.sourceFile,
        normalized.sourceTool,
        normalized.automationRunId,
        normalized.createdBy,
        normalized.seoTitle,
        normalized.seoDescription,
        normalized.canonicalUrl
      ]
    );

    const draft = rows[0];
    await this.dataSource.query(
      `INSERT INTO academy_article_sources (import_id, source_file, source_tool, automation_run_id, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [draft.id, normalized.sourceFile, normalized.sourceTool, normalized.automationRunId, normalized.createdBy]
    );
    await this.dataSource.query(
      `INSERT INTO academy_article_review_tasks (import_id, status, reason)
       VALUES ($1, 'open', 'medical_review_required')`,
      [draft.id]
    );

    return draft;
  }

  async listImports(status?: string) {
    await this.ensureReady();

    const params: any[] = [];
    const filters = [];
    if (status) {
      params.push(status);
      filters.push(`i.status = $${params.length}`);
    }

    const rows = await this.dataSource.query(
      `SELECT i.id, i.slug, i.category_slug AS "categorySlug", i.title, i.summary, i.tags,
              i.read_minutes AS "readMinutes", i.status, i.character_count AS "characterCount",
              i.medical_qa_status AS "medicalQaStatus", i.medical_qa_artifact AS "medicalQaArtifact",
              i.source_urls AS "sourceUrls", i.source_file AS "sourceFile",
              i.source_tool AS "sourceTool", i.automation_run_id AS "automationRunId",
              i.created_by AS "createdBy", i.medical_review_required AS "medicalReviewRequired",
              i.rejected_reason AS "rejectedReason", i.created_at AS "createdAt", i.updated_at AS "updatedAt"
       FROM academy_article_imports i
       ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       ORDER BY i.created_at DESC
       LIMIT 100`,
      params
    );

    return { items: rows, total: rows.length };
  }

  async approveImport(id: string, reviewer = 'admin') {
    await this.ensureReady();

    const draft = await this.getImportById(id);
    if (!['draft', 'review'].includes(draft.status)) {
      throw new BadRequestException('Only draft or review imports can be approved');
    }
    if (draft.medicalQaStatus !== 'APPROVED') {
      throw new BadRequestException('medical_qa_not_approved');
    }
    if (!draft.medicalQaArtifact) {
      throw new BadRequestException('medical_qa_artifact_required');
    }
    this.assertApprovedLongForm(draft);

    const existing = await this.dataSource.query(`SELECT id FROM academy_articles WHERE slug = $1 LIMIT 1`, [draft.slug]);
    if (existing[0]) {
      throw new BadRequestException('duplicate_slug');
    }

    const articleRows = await this.dataSource.query(
      `INSERT INTO academy_articles (slug, category_slug, title, summary, body, character_count, read_minutes, status, review_status, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', 'medically_reviewed', false)
       RETURNING id, slug, title`,
      [draft.slug, draft.categorySlug, draft.title, draft.summary, draft.body, draft.characterCount, draft.readMinutes]
    );
    const article = articleRows[0];

    await this.dataSource.query(
      `INSERT INTO academy_article_versions (article_id, import_id, version, title, summary, body, reviewer, status)
       VALUES ($1, $2, 1, $3, $4, $5, $6, 'approved')`,
      [article.id, draft.id, draft.title, draft.summary, draft.body, reviewer]
    );

    await this.dataSource.query(
      `INSERT INTO academy_article_seo (article_id, seo_title, seo_description, canonical_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (article_id) DO UPDATE SET seo_title = EXCLUDED.seo_title,
         seo_description = EXCLUDED.seo_description, canonical_url = EXCLUDED.canonical_url, updated_at = now()`,
      [article.id, draft.seoTitle || draft.title, draft.seoDescription || draft.summary, draft.canonicalUrl || null]
    );

    await this.attachTags(article.id, draft.tags || []);

    await this.dataSource.query(
      `UPDATE academy_article_imports SET status = 'published', approved_article_id = $2, approved_by = $3, updated_at = now()
       WHERE id = $1`,
      [draft.id, article.id, reviewer]
    );
    await this.dataSource.query(
      `UPDATE academy_article_review_tasks SET status = 'done', reviewer = $2, updated_at = now()
       WHERE import_id = $1 AND status = 'open'`,
      [draft.id, reviewer]
    );

    return { ok: true, article };
  }

  async rejectImport(id: string, reason = 'Rejected by reviewer', reviewer = 'admin') {
    await this.ensureReady();
    await this.getImportById(id);

    await this.dataSource.query(
      `UPDATE academy_article_imports SET status = 'rejected', rejected_reason = $2, approved_by = $3, updated_at = now()
       WHERE id = $1`,
      [id, reason, reviewer]
    );
    await this.dataSource.query(
      `UPDATE academy_article_review_tasks SET status = 'rejected', reviewer = $2, reason = $3, updated_at = now()
       WHERE import_id = $1 AND status = 'open'`,
      [id, reviewer, reason]
    );

    return { ok: true };
  }

  private async articleListQuery(where: string, params: any[], limit: number, order = 'a.is_featured DESC, a.published_at DESC') {
    return this.dataSource.query(
      `SELECT a.slug, a.title, a.summary, a.character_count AS "characterCount",
              a.read_minutes AS "readMinutes",
              a.views, a.review_status AS "reviewStatus", a.published_at AS "publishedAt",
              c.slug AS "categorySlug", c.title AS "categoryTitle"
       FROM academy_articles a
       JOIN academy_categories c ON c.slug = a.category_slug
       WHERE ${where}
       ORDER BY ${order}
       LIMIT ${limit}`,
      params
    );
  }

  private normalizeImportPayload(dto: AcademyImportPayload) {
    return {
      slug: this.slugify(dto.slug || ''),
      categorySlug: this.slugify(dto.categorySlug || ''),
      title: (dto.title || '').trim(),
      summary: (dto.summary || '').trim(),
      body: (dto.body || '').trim(),
      characterCount: Number(dto.characterCount || 0),
      medicalQaStatus: dto.medicalQaStatus || 'REJECTED',
      medicalQaArtifact: (dto.medicalQaArtifact || '').trim(),
      sourceUrls: Array.isArray(dto.sourceUrls)
        ? dto.sourceUrls.map((url) => String(url).trim()).filter(Boolean).slice(0, 12)
        : [],
      tags: Array.isArray(dto.tags) ? dto.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [],
      readMinutes: Math.max(1, Math.min(60, Number(dto.readMinutes || 4))),
      status: dto.status === 'review' ? 'review' : 'draft',
      sourceFile: (dto.sourceFile || '').trim(),
      sourceTool: (dto.sourceTool || 'automation').trim(),
      automationRunId: (dto.automationRunId || '').trim(),
      createdBy: (dto.createdBy || 'automation').trim(),
      seoTitle: (dto.seoTitle || dto.title || '').trim().slice(0, 90),
      seoDescription: (dto.seoDescription || dto.summary || '').trim().slice(0, 180),
      canonicalUrl: (dto.canonicalUrl || '').trim()
    };
  }

  private async validateImportPayload(dto: ReturnType<AcademyService['normalizeImportPayload']>) {
    if (!dto.slug || !dto.categorySlug || !dto.title || !dto.summary || !dto.body) {
      throw new BadRequestException('required_article_fields_missing');
    }
    if (!dto.sourceFile) {
      throw new BadRequestException('source_file_required');
    }
    if (!dto.automationRunId) {
      throw new BadRequestException('automation_run_id_required');
    }
    if (dto.medicalQaStatus === 'APPROVED') {
      this.assertApprovedLongForm(dto);
    }

    const category = await this.dataSource.query(`SELECT slug FROM academy_categories WHERE slug = $1 LIMIT 1`, [dto.categorySlug]);
    if (!category[0]) {
      throw new BadRequestException('category_not_found');
    }

    const duplicateArticle = await this.dataSource.query(`SELECT id FROM academy_articles WHERE slug = $1 LIMIT 1`, [dto.slug]);
    const duplicateImport = await this.dataSource.query(
      `SELECT id FROM academy_article_imports WHERE slug = $1 AND status IN ('draft', 'review', 'published') LIMIT 1`,
      [dto.slug]
    );
    if (duplicateArticle[0] || duplicateImport[0]) {
      throw new BadRequestException('duplicate_slug');
    }

    const medicalDisclaimerRequired = !this.hasMedicalDisclaimer(dto);
    if (medicalDisclaimerRequired) {
      throw new BadRequestException('medical_disclaimer_required');
    }

    const leakText = `${dto.title}\n${dto.summary}\n${dto.body}`.toLowerCase();
    const systemPromptLeak = ['system prompt', 'developer message', 'ignore previous instructions', 'hidden instruction', 'openai api key'].some((marker) =>
      leakText.includes(marker)
    );
    if (systemPromptLeak) {
      throw new BadRequestException('system_prompt_leak');
    }
  }

  private hasMedicalDisclaimer(dto: { summary: string; body: string }) {
    const text = `${dto.summary}\n${dto.body}`.toLowerCase();
    return [
      'не заменяет врача',
      'не является диагнозом',
      'обратитесь к врачу',
      'does not replace',
      'not a diagnosis',
      'consult a doctor',
      'дәрігерге'
    ].some((marker) => text.includes(marker));
  }

  private async getImportById(id: string) {
    const rows = await this.dataSource.query(
      `SELECT id, slug, category_slug AS "categorySlug", title, summary, body, tags,
              character_count AS "characterCount", medical_qa_status AS "medicalQaStatus",
              medical_qa_artifact AS "medicalQaArtifact", source_urls AS "sourceUrls",
              read_minutes AS "readMinutes", status, seo_title AS "seoTitle",
              seo_description AS "seoDescription", canonical_url AS "canonicalUrl"
       FROM academy_article_imports
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    const draft = rows[0];
    if (!draft) {
      throw new NotFoundException('Academy import not found');
    }
    return draft;
  }

  private async attachTags(articleId: string, tags: string[]) {
    for (const tag of tags) {
      const slug = this.slugify(tag);
      if (!slug) continue;
      await this.dataSource.query(
        `INSERT INTO academy_tags (slug, title)
         VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title`,
        [slug, tag]
      );
      await this.dataSource.query(
        `INSERT INTO academy_article_tags (article_id, tag_slug)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [articleId, slug]
      );
    }
  }

  private async ensureReady() {
    if (!this.initialized) {
      this.initialized = this.bootstrap();
    }

    return this.initialized;
  }

  private async bootstrap() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug TEXT UNIQUE NOT NULL,
        category_slug TEXT NOT NULL REFERENCES academy_categories(slug) ON DELETE RESTRICT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        character_count INT,
        read_minutes INT NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'published',
        review_status TEXT NOT NULL DEFAULT 'medically_reviewed',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        views INT NOT NULL DEFAULT 0,
        published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_tags (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_tags (
        article_id UUID NOT NULL REFERENCES academy_articles(id) ON DELETE CASCADE,
        tag_slug TEXT NOT NULL REFERENCES academy_tags(slug) ON DELETE CASCADE,
        PRIMARY KEY (article_id, tag_slug)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_translations (
        article_id UUID NOT NULL REFERENCES academy_articles(id) ON DELETE CASCADE,
        locale TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        PRIMARY KEY (article_id, locale)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event TEXT NOT NULL,
        target TEXT,
        query TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_imports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug TEXT UNIQUE NOT NULL,
        category_slug TEXT NOT NULL REFERENCES academy_categories(slug) ON DELETE RESTRICT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        character_count INT,
        medical_qa_status TEXT NOT NULL DEFAULT 'REJECTED',
        medical_qa_artifact TEXT,
        source_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        read_minutes INT NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'draft',
        source_file TEXT NOT NULL,
        source_tool TEXT NOT NULL DEFAULT 'automation',
        automation_run_id TEXT NOT NULL,
        created_by TEXT NOT NULL DEFAULT 'automation',
        seo_title TEXT,
        seo_description TEXT,
        canonical_url TEXT,
        medical_review_required BOOLEAN NOT NULL DEFAULT true,
        approved_article_id UUID REFERENCES academy_articles(id) ON DELETE SET NULL,
        approved_by TEXT,
        rejected_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`ALTER TABLE academy_articles ADD COLUMN IF NOT EXISTS character_count INT`);
    await this.dataSource.query(`ALTER TABLE academy_article_imports ADD COLUMN IF NOT EXISTS character_count INT`);
    await this.dataSource.query(`ALTER TABLE academy_article_imports ADD COLUMN IF NOT EXISTS medical_qa_status TEXT NOT NULL DEFAULT 'REJECTED'`);
    await this.dataSource.query(`ALTER TABLE academy_article_imports ADD COLUMN IF NOT EXISTS medical_qa_artifact TEXT`);
    await this.dataSource.query(`ALTER TABLE academy_article_imports ADD COLUMN IF NOT EXISTS source_urls JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_id UUID NOT NULL REFERENCES academy_article_imports(id) ON DELETE CASCADE,
        source_file TEXT NOT NULL,
        source_tool TEXT NOT NULL,
        automation_run_id TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_review_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_id UUID NOT NULL REFERENCES academy_article_imports(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'open',
        reason TEXT NOT NULL DEFAULT 'medical_review_required',
        reviewer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_seo (
        article_id UUID PRIMARY KEY REFERENCES academy_articles(id) ON DELETE CASCADE,
        seo_title TEXT NOT NULL,
        seo_description TEXT NOT NULL,
        canonical_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS academy_article_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        article_id UUID NOT NULL REFERENCES academy_articles(id) ON DELETE CASCADE,
        import_id UUID REFERENCES academy_article_imports(id) ON DELETE SET NULL,
        version INT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        reviewer TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_academy_articles_category ON academy_articles(category_slug)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_academy_articles_published ON academy_articles(status, published_at DESC)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_academy_events_created_at ON academy_article_events(created_at DESC)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_academy_imports_status ON academy_article_imports(status, created_at DESC)`);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS idx_academy_imports_source ON academy_article_imports(automation_run_id, source_file)`);

    for (const [index, category] of categorySeeds.entries()) {
      await this.dataSource.query(
        `INSERT INTO academy_categories (slug, title, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, updated_at = now()`,
        [category.slug, category.title, category.description, index]
      );
    }

    for (const article of articleSeeds) {
      const rows = await this.dataSource.query(
        `INSERT INTO academy_articles (slug, category_slug, title, summary, body, read_minutes, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET category_slug = EXCLUDED.category_slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
           body = EXCLUDED.body, read_minutes = EXCLUDED.read_minutes, is_featured = EXCLUDED.is_featured, updated_at = now()
         RETURNING id`,
        [article.slug, article.categorySlug, article.title, article.summary, article.body, article.readMinutes, Boolean(article.isFeatured)]
      );

      const articleId = rows[0]?.id;
      if (!articleId) continue;

      await this.attachTags(articleId, article.tags);
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private mainArticleCharacterCount(body: string) {
    const [mainBody] = body.split(/\n\s*Источники:\s*\n/i);
    return Array.from(mainBody.trim()).length;
  }

  private assertApprovedLongForm(dto: { body: string; characterCount: number; medicalQaArtifact: string; sourceUrls: string[] }) {
    const actualCharacterCount = this.mainArticleCharacterCount(dto.body);
    if (dto.characterCount < MIN_ARTICLE_CHARACTER_COUNT || dto.characterCount > MAX_ARTICLE_CHARACTER_COUNT) {
      throw new BadRequestException('article_length_out_of_range');
    }
    if (actualCharacterCount !== dto.characterCount) {
      throw new BadRequestException('article_character_count_mismatch');
    }
    if (!dto.medicalQaArtifact) {
      throw new BadRequestException('medical_qa_artifact_required');
    }
    if (dto.sourceUrls.length < 2 || dto.sourceUrls.some((url) => !/^https:\/\//i.test(url))) {
      throw new BadRequestException('authoritative_sources_required');
    }
  }
}
