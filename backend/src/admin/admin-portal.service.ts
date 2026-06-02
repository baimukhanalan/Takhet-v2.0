import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { PaymentsService } from '../payments/payments.service';

const ADMIN_OWNER_ID = '11111111-1111-1111-1111-111111111111';

type AdminSystemConfig = {
  theme: 'light' | 'dark';
  maintenanceMode: boolean;
  aiDiagnosticEnabled: boolean;
  serviceFeePercent: number;
  aiModel: string;
  supportEmail: string;
};

type AdminAiMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
};

type AdminMedicine = {
  id: string;
  name: string;
  price: number;
  category: string;
  img: string;
  stock: number;
};

type AdminPartnerDraft = {
  id: string;
  name: string;
  bin: string;
  status: 'Active' | 'Pending';
  adminId: string;
  commission: number;
};

type AdminPartnerOverride = {
  name?: string;
  bin?: string;
  commission?: number;
};

type AdminPartnerContract = {
  id: string;
  partnerId: string;
  partnerName: string;
  contractNumber: string;
  status: 'Draft' | 'Active' | 'Expired';
  signedAt: string;
  expiresAt: string;
  commission: number;
};

@Injectable()
export class AdminPortalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly paymentsService: PaymentsService
  ) {}

  async getPortalState() {
    const [
      config,
      aiChatHistory,
      medicines,
      partnerDrafts,
      partnerContracts,
      partnerStatusMap,
      partnerRejectedIds,
      partnerOverrides,
      users,
      rawReviews,
      complaints,
      payments
    ] = await Promise.all([
      this.getSettingsValue<AdminSystemConfig>('admin_portal_config'),
      this.getSettingsValue<AdminAiMessage[]>('admin_ai_chat_history'),
      this.getSettingsValue<AdminMedicine[]>('admin_medicines'),
      this.getSettingsValue<AdminPartnerDraft[]>('admin_partner_drafts'),
      this.getSettingsValue<AdminPartnerContract[]>('admin_partner_contracts'),
      this.getSettingsValue<Record<string, 'Active' | 'Pending'>>('admin_partner_user_statuses'),
      this.getSettingsValue<string[]>('admin_partner_rejected_ids'),
      this.getSettingsValue<Record<string, AdminPartnerOverride>>('admin_partner_overrides'),
      this.usersService.findAll(),
      this.getReviewRows(),
      this.getSettingsValue<any[]>('community_posts'),
      this.paymentsService.findAllPayments()
    ]);

    const rejectedPartnerIds = new Set(Array.isArray(partnerRejectedIds) ? partnerRejectedIds : []);
    const partnerUsers = users.filter(
      (user) => String(user.role).toLowerCase() === 'partner' && !rejectedPartnerIds.has(user.id)
    );
    const partners = await Promise.all(
      partnerUsers.map(async (user) => {
        const profile = await this.profilesService.getPortalProfile(user.id, 'partner');
        const override = partnerOverrides?.[user.id] || {};
        return {
          id: user.id,
          name: profile.organizationName || user.email?.split('@')[0] || 'Партнер Takhet+',
          bin: `${String(user.id).replace(/-/g, '').slice(0, 12).padEnd(12, '0')}`,
          status: (partnerStatusMap?.[user.id] || 'Pending') as 'Active' | 'Pending',
          adminId: user.id,
          commission: Number(override.commission ?? config?.serviceFeePercent ?? 15) || 15
        };
      })
    );

    const mergedPartners = [...partners, ...(Array.isArray(partnerDrafts) ? partnerDrafts : [])];
    const derivedContracts = partners.filter((partner) => partner.status === 'Active').map((partner) => ({
      id: `contract_${partner.id}`,
      partnerId: partner.id,
      partnerName: partner.name,
      contractNumber: `TAKHET-${String(partner.bin).slice(-6)}`,
      status: 'Active' as const,
      signedAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      commission: partner.commission
    }));
    const mergedContracts = [
      ...derivedContracts,
      ...((Array.isArray(partnerContracts) ? partnerContracts : []).filter(
        (contract) => !derivedContracts.some((item) => item.id === contract.id)
      ))
    ];
    const reviewHiddenIds = new Set((await this.getSettingsValue<string[]>('admin_hidden_review_ids')) || []);
    const reviews = rawReviews.filter((item: any) => !reviewHiddenIds.has(item.id));

    return {
      config: config || this.defaultConfig(),
      aiChatHistory: Array.isArray(aiChatHistory) ? aiChatHistory : [],
      medicines: Array.isArray(medicines) ? medicines : [],
      partners: mergedPartners,
      contracts: mergedContracts,
      reviews,
      complaints: Array.isArray(complaints) ? complaints : [],
      revenueHistory: this.buildRevenueHistory(payments)
    };
  }

  async updateConfig(patch: Partial<AdminSystemConfig>) {
    const current = (await this.getSettingsValue<AdminSystemConfig>('admin_portal_config')) || this.defaultConfig();
    const next = { ...current, ...patch };
    await this.upsertSettingsValue('admin_portal_config', next);
    return next;
  }

  async appendAssistantMessage(message: AdminAiMessage) {
    const current = (await this.getSettingsValue<AdminAiMessage[]>('admin_ai_chat_history')) || [];
    const next = [...current, message];
    await this.upsertSettingsValue('admin_ai_chat_history', next);
    return next;
  }

  async clearAssistantHistory() {
    await this.upsertSettingsValue('admin_ai_chat_history', []);
    return { cleared: true };
  }

  async addMedicine() {
    const current = (await this.getSettingsValue<AdminMedicine[]>('admin_medicines')) || [];
    const nextItem: AdminMedicine = {
      id: `ph_${Date.now()}`,
      name: 'Новый препарат',
      price: 1000,
      category: 'Каталог',
      img: '💉',
      stock: 25
    };
    const next = [nextItem, ...current];
    await this.upsertSettingsValue('admin_medicines', next);
    return nextItem;
  }

  async addPartnerDraft(serviceFeePercent: number) {
    const current = (await this.getSettingsValue<AdminPartnerDraft[]>('admin_partner_drafts')) || [];
    const nextItem: AdminPartnerDraft = {
      id: `p_${Date.now()}`,
      name: 'Новый партнер',
      bin: `${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      status: 'Pending',
      adminId: `partner_${Date.now()}`,
      commission: serviceFeePercent || 15
    };
    const next = [nextItem, ...current];
    await this.upsertSettingsValue('admin_partner_drafts', next);
    return nextItem;
  }

  async addPartnerContract(serviceFeePercent: number) {
    const state = await this.getPortalState();
    const partner = state.partners[0];
    const nextItem: AdminPartnerContract = {
      id: `draft_contract_${Date.now()}`,
      partnerId: partner?.id || `partner_${Date.now()}`,
      partnerName: partner?.name || 'Новый партнер',
      contractNumber: `DRAFT-${String(Date.now()).slice(-6)}`,
      status: 'Draft',
      signedAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      commission: serviceFeePercent || 15
    };
    const current = (await this.getSettingsValue<AdminPartnerContract[]>('admin_partner_contracts')) || [];
    const next = [nextItem, ...current];
    await this.upsertSettingsValue('admin_partner_contracts', next);
    return nextItem;
  }

  async togglePartnerDraft(id: string) {
    const partnerUser = await this.findPartnerUser(id);
    if (partnerUser) {
      const current = (await this.getSettingsValue<Record<string, 'Active' | 'Pending'>>('admin_partner_user_statuses')) || {};
      const nextStatus = current[id] === 'Active' ? 'Pending' : 'Active';
      await this.upsertSettingsValue('admin_partner_user_statuses', { ...current, [id]: nextStatus });
      return { id, status: nextStatus };
    }

    const current = (await this.getSettingsValue<AdminPartnerDraft[]>('admin_partner_drafts')) || [];
    const next = current.map((item) =>
      item.id === id ? { ...item, status: item.status === 'Active' ? 'Pending' : 'Active' } : item
    );
    await this.upsertSettingsValue('admin_partner_drafts', next);
    return next.find((item) => item.id === id) || null;
  }

  async togglePartnerContract(id: string) {
    const current = (await this.getSettingsValue<AdminPartnerContract[]>('admin_partner_contracts')) || [];
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === 'Active' ? 'Expired' : 'Active',
            signedAt: item.status === 'Active' ? item.signedAt : new Date().toISOString().slice(0, 10)
          }
        : item
    );
    await this.upsertSettingsValue('admin_partner_contracts', next);
    return next.find((item) => item.id === id) || null;
  }

  async updateMedicine(id: string, patch: Partial<AdminMedicine>) {
    const current = (await this.getSettingsValue<AdminMedicine[]>('admin_medicines')) || [];
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            id: item.id,
            price: Number(patch.price ?? item.price) || 0,
            stock: Number(patch.stock ?? item.stock) || 0
          }
        : item
    );
    await this.upsertSettingsValue('admin_medicines', next);
    return next.find((item) => item.id === id) || null;
  }

  async deleteMedicine(id: string) {
    const current = (await this.getSettingsValue<AdminMedicine[]>('admin_medicines')) || [];
    const next = current.filter((item) => item.id !== id);
    await this.upsertSettingsValue('admin_medicines', next);
    return { deleted: true };
  }

  async updatePartnerDraft(id: string, patch: Partial<AdminPartnerDraft>) {
    const partnerUser = await this.findPartnerUser(id);
    if (partnerUser) {
      const current = (await this.getSettingsValue<Record<string, AdminPartnerOverride>>('admin_partner_overrides')) || {};
      const next = {
        ...current,
        [id]: {
          ...(current[id] || {}),
          name: patch.name ?? current[id]?.name,
          bin: patch.bin ?? current[id]?.bin,
          commission: Number(patch.commission ?? current[id]?.commission) || current[id]?.commission
        }
      };
      await this.upsertSettingsValue('admin_partner_overrides', next);
      return { id, ...next[id] };
    }

    const current = (await this.getSettingsValue<AdminPartnerDraft[]>('admin_partner_drafts')) || [];
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            id: item.id,
            commission: Number(patch.commission ?? item.commission) || item.commission
          }
        : item
    );
    await this.upsertSettingsValue('admin_partner_drafts', next);
    return next.find((item) => item.id === id) || null;
  }

  async deletePartnerDraft(id: string) {
    const partnerUser = await this.findPartnerUser(id);
    if (partnerUser) {
      const rejected = (await this.getSettingsValue<string[]>('admin_partner_rejected_ids')) || [];
      if (!rejected.includes(id)) {
        await this.upsertSettingsValue('admin_partner_rejected_ids', [...rejected, id]);
      }

      const currentStatuses = (await this.getSettingsValue<Record<string, 'Active' | 'Pending'>>('admin_partner_user_statuses')) || {};
      if (currentStatuses[id]) {
        const { [id]: _removed, ...nextStatuses } = currentStatuses;
        await this.upsertSettingsValue('admin_partner_user_statuses', nextStatuses);
      }

      return { deleted: true };
    }

    const current = (await this.getSettingsValue<AdminPartnerDraft[]>('admin_partner_drafts')) || [];
    const next = current.filter((item) => item.id !== id);
    await this.upsertSettingsValue('admin_partner_drafts', next);
    return { deleted: true };
  }

  async updatePartnerContract(id: string, patch: Partial<AdminPartnerContract>) {
    const current = (await this.getSettingsValue<AdminPartnerContract[]>('admin_partner_contracts')) || [];
    const next = current.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            id: item.id,
            commission: Number(patch.commission ?? item.commission) || item.commission
          }
        : item
    );
    await this.upsertSettingsValue('admin_partner_contracts', next);
    return next.find((item) => item.id === id) || null;
  }

  async deletePartnerContract(id: string) {
    const current = (await this.getSettingsValue<AdminPartnerContract[]>('admin_partner_contracts')) || [];
    const next = current.filter((item) => item.id !== id);
    await this.upsertSettingsValue('admin_partner_contracts', next);
    return { deleted: true };
  }

  async hideReview(id: string) {
    const current = (await this.getSettingsValue<string[]>('admin_hidden_review_ids')) || [];
    if (!current.includes(id)) {
      await this.upsertSettingsValue('admin_hidden_review_ids', [...current, id]);
    }
    return { hidden: true };
  }

  async deleteComplaint(id: string) {
    const current = (await this.getSettingsValue<any[]>('community_posts')) || [];
    const next = current.filter((item) => item.id !== id);
    await this.upsertSettingsValue('community_posts', next);
    return { deleted: true };
  }

  private async getReviewRows() {
    const rows = await this.dataSource.query(
      `select user_id, key, value
       from settings
       where key like 'case_feedback:%'
       union all
       select user_id, entry->>'id' as key, entry as value
       from settings
       cross join lateral jsonb_array_elements(value) as entry
       where user_id = $1 and key = 'public_feedback_entries' and jsonb_typeof(value) = 'array'`,
      [ADMIN_OWNER_ID]
    );

    return rows
      .map((row: any) => ({
        id: row.key,
        author: row.user_id === '44444444-4444-4444-4444-444444444444' ? 'Пациент платформы' : 'Пациент',
        rating: Number(row.value?.score || 0),
        text: String(row.value?.review || '').trim(),
        date: String(row.value?.createdAt || new Date().toISOString()).slice(0, 10)
      }))
      .filter((row: any) => row.text);
  }

  private buildRevenueHistory(payments: any[]) {
    const byMonth = new Map<string, { month: string; revenue: number; users: number }>();
    for (const payment of payments || []) {
      const date = new Date(payment.createdAt || Date.now());
      const month = date.toLocaleDateString('ru-RU', { month: 'short' });
      const current = byMonth.get(month) || { month, revenue: 0, users: 0 };
      current.revenue += Number(payment.amount || 0);
      current.users += 1;
      byMonth.set(month, current);
    }

    const values = Array.from(byMonth.values());
    return values.length > 0 ? values : [{ month: 'тек.', revenue: 0, users: 0 }];
  }

  private defaultConfig(): AdminSystemConfig {
    return {
      theme: 'light',
      maintenanceMode: false,
      aiDiagnosticEnabled: true,
      serviceFeePercent: 15,
      aiModel: 'Gemini 2.0 Flash',
      supportEmail: 'support@takhet.com'
    };
  }

  private async findPartnerUser(id: string) {
    const users = await this.usersService.findAll();
    return users.find((user) => user.id === id && String(user.role).toLowerCase() === 'partner') || null;
  }

  private async getSettingsValue<T>(key: string): Promise<T | null> {
    const rows = await this.dataSource.query('select value from settings where user_id = $1 and key = $2 limit 1', [ADMIN_OWNER_ID, key]);
    return rows[0]?.value ?? null;
  }

  private async upsertSettingsValue(key: string, value: unknown) {
    const existing = await this.dataSource.query('select id from settings where user_id = $1 and key = $2 limit 1', [ADMIN_OWNER_ID, key]);
    if (existing[0]?.id) {
      await this.dataSource.query('update settings set value = $3::jsonb where id = $1 and user_id = $2', [
        existing[0].id,
        ADMIN_OWNER_ID,
        JSON.stringify(value)
      ]);
      return;
    }

    await this.dataSource.query('insert into settings (user_id, key, value) values ($1, $2, $3::jsonb)', [
      ADMIN_OWNER_ID,
      key,
      JSON.stringify(value)
    ]);
  }
}
