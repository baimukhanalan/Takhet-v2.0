import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { DoctorsService } from '../doctors/doctors.service';
import { env } from '../config/env.config';

type CommunityReply = {
  author: string;
  doctorId?: string;
  text: string;
};

type CommunityPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  category: string;
  likes: number;
  replies: CommunityReply[];
};

const COMMUNITY_OWNER_ID = '11111111-1111-1111-1111-111111111111';
const COMMUNITY_KEY = 'community_posts';
const ALLOWED_CATEGORIES = new Set(['Общее', 'General', 'Жалпы']);

const normalizeText = (value: string, maxLength: number) => value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

@Injectable()
export class CommunityService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly doctorsService: DoctorsService
  ) {}

  async listPosts() {
    const posts = await this.getPosts();
    return posts.sort((a, b) => b.id.localeCompare(a.id));
  }

  async createPost(payload: { author: string; title: string; body: string; category: string }) {
    const posts = await this.getPosts();
    const normalizedCategory = normalizeText(payload.category, 80);
    const next: CommunityPost = {
      id: `community_${Date.now()}`,
      author: 'Анонимно',
      title: normalizeText(payload.title, 160),
      body: normalizeText(payload.body, 4000),
      category: ALLOWED_CATEGORIES.has(normalizedCategory) ? normalizedCategory : 'Общее',
      likes: 0,
      replies: []
    };
    posts.unshift(next);
    await this.savePosts(posts);
    await this.auditService.log('community.post.created', COMMUNITY_OWNER_ID, { postId: next.id, title: next.title });
    return next;
  }

  async addReply(postId: string, payload: { author: string; doctorId: string; text: string }) {
    const posts = await this.getPosts();
    const index = posts.findIndex((post) => post.id === postId);
    if (index < 0) throw new NotFoundException('Community post not found');

    posts[index] = {
      ...posts[index],
      replies: [
        ...(posts[index].replies || []),
        {
          author: normalizeText(payload.author, 120),
          doctorId: payload.doctorId,
          text: normalizeText(payload.text, 2000)
        }
      ]
    };

    await this.savePosts(posts);
    await this.auditService.log('community.reply.created', payload.doctorId, { postId });
    return posts[index];
  }

  async topDoctors() {
    const doctors = await this.doctorsService.listActive();
    return doctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.fullName,
        specialty: doctor.specialty,
        avatar: doctor.avatar,
        reputationPoints: Math.round((doctor.rating || 0) * 100 + (doctor.reviewsCount || 0) * 5 + (doctor.experienceYears || 0) * 10)
      }))
      .sort((a, b) => b.reputationPoints - a.reputationPoints)
      .slice(0, 5);
  }

  async submitPublicFeedback(payload: { name: string; review: string }) {
    const posts = await this.getPosts();
    const nextItem: CommunityPost = {
      id: `public_feedback_${Date.now()}`,
      author: normalizeText(payload.name, 120),
      title: 'Отзыв о платформе',
      body: normalizeText(payload.review, 2000),
      category: 'Общее',
      likes: 0,
      replies: []
    };
    posts.unshift(nextItem);
    await this.savePosts(posts);
    await this.saveAdminReview(nextItem);
    await this.notifyPublicFeedback(nextItem);
    await this.auditService.log('public.feedback.created', COMMUNITY_OWNER_ID, { feedbackId: nextItem.id });
    return { submitted: true };
  }

  private async notifyPublicFeedback(item: CommunityPost) {
    try {
      let response: Response | null = null;
      if (env.feedbackEmailWebhookUrl) {
        response = await fetch(env.feedbackEmailWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: env.feedbackEmailRecipient,
            subject: 'Новый отзыв Takhet+',
            name: item.author,
            review: item.body,
            feedbackId: item.id
          })
        });
      } else if (env.resendApiKey) {
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.authEmailFrom,
            to: [env.feedbackEmailRecipient],
            subject: 'Новый отзыв Takhet+',
            html: [
              '<h2>Новый отзыв Takhet+</h2>',
              `<p><strong>Имя:</strong> ${escapeHtml(item.author)}</p>`,
              `<p><strong>ID:</strong> ${escapeHtml(item.id)}</p>`,
              `<p>${escapeHtml(item.body).replace(/\n/g, '<br />')}</p>`
            ].join('')
          })
        });
      }

      if (!response) {
        await this.auditService.log('public.feedback.email.pending', COMMUNITY_OWNER_ID, {
          feedbackId: item.id,
          recipient: env.feedbackEmailRecipient,
          reason: 'email_provider_not_configured'
        });
        return;
      }

      await this.auditService.log('public.feedback.email.sent', COMMUNITY_OWNER_ID, {
        feedbackId: item.id,
        ok: response.ok,
        status: response.status,
        recipient: env.feedbackEmailRecipient
      });
    } catch {
      await this.auditService.log('public.feedback.email.failed', COMMUNITY_OWNER_ID, {
        feedbackId: item.id,
        error: 'unknown'
      });
    }
  }

  private async getPosts(): Promise<CommunityPost[]> {
    const rows = await this.dataSource.query('select value from settings where user_id = $1 and key = $2 limit 1', [COMMUNITY_OWNER_ID, COMMUNITY_KEY]);
    const posts = rows[0]?.value;
    return Array.isArray(posts) ? posts : [];
  }

  private async savePosts(posts: CommunityPost[]) {
    const existing = await this.dataSource.query('select id from settings where user_id = $1 and key = $2 limit 1', [COMMUNITY_OWNER_ID, COMMUNITY_KEY]);
    if (existing[0]?.id) {
      await this.dataSource.query('update settings set value = $3::jsonb where id = $1 and user_id = $2', [
        existing[0].id,
        COMMUNITY_OWNER_ID,
        JSON.stringify(posts)
      ]);
      return;
    }

    await this.dataSource.query('insert into settings (user_id, key, value) values ($1, $2, $3::jsonb)', [
      COMMUNITY_OWNER_ID,
      COMMUNITY_KEY,
      JSON.stringify(posts)
    ]);
  }

  private async saveAdminReview(item: CommunityPost) {
    const key = 'public_feedback_entries';
    const rows = await this.dataSource.query('select value from settings where user_id = $1 and key = $2 limit 1', [
      COMMUNITY_OWNER_ID,
      key
    ]);
    const current = Array.isArray(rows[0]?.value) ? rows[0].value : [];
    const next = [
      {
        id: item.id,
        author: item.author,
        score: 5,
        review: item.body,
        createdAt: new Date().toISOString()
      },
      ...current.filter((entry: any) => entry?.id !== item.id)
    ];

    const existing = await this.dataSource.query('select id from settings where user_id = $1 and key = $2 limit 1', [
      COMMUNITY_OWNER_ID,
      key
    ]);
    if (existing[0]?.id) {
      await this.dataSource.query('update settings set value = $3::jsonb where id = $1 and user_id = $2', [
        existing[0].id,
        COMMUNITY_OWNER_ID,
        JSON.stringify(next)
      ]);
      return;
    }

    await this.dataSource.query('insert into settings (user_id, key, value) values ($1, $2, $3::jsonb)', [
      COMMUNITY_OWNER_ID,
      key,
      JSON.stringify(next)
    ]);
  }

}
