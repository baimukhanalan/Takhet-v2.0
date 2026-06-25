import { api } from '../../services/api';

export type LabsMembership = {
  code: 'CORE' | 'PLUS' | 'EXECUTIVE';
  title: string;
  priceLabel: string;
  features: string[];
};

export type LabsDashboard = {
  healthScore: number;
  biologicalAge: number;
  chronologicalAge: number;
  activeIssues: number;
  activeMembership?: {
    code: string;
    title: string;
    status: string;
    orderNumber?: string;
    qrPayload?: string;
  } | null;
  recentInsights: string[];
  alerts: string[];
  trendSummary: string;
};

export type LabsBiomarker = {
  code: string;
  name: string;
  value: string;
  range: string;
  status: 'optimal' | 'watch' | 'review';
  explanation: string;
  trend: number[];
};

export type LabsRole = 'member' | 'physician' | 'admin' | 'family';

export type LabsSession = {
  authenticated?: boolean;
  user: {
    id: string;
    role: LabsRole;
    fullName: string;
    email: string;
  } | null;
};

export type LabsPortalDashboard = {
  role: LabsRole;
  title: string;
  metrics: Array<{ title: string; value: string | number; caption?: string }>;
  sections: Array<{ title: string; text: string }>;
  rows?: any[];
};

export const takhetLabsApi = {
  memberships: () => api<LabsMembership[]>('/labs/memberships'),
  subscribeMembership: (payload: { code: LabsMembership['code']; bloodDrawMode?: 'partner_lab' | 'home_draw' }) =>
    api<any>('/labs/memberships/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  dashboard: () => api<LabsDashboard>('/labs/dashboard'),
  biomarkers: () => api<LabsBiomarker[]>('/labs/biomarkers'),
  healthSystems: () => api<any[]>('/labs/health-systems'),
  issues: () => api<any[]>('/labs/issues'),
  insights: () => api<any[]>('/labs/insights'),
  protocol: () => api<any>('/labs/protocol'),
  family: () => api<any[]>('/labs/family'),
  addFamilyProfile: (payload: { fullName: string; relation: string }) =>
    api<any>('/labs/family', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  reports: () => api<any[]>('/labs/reports'),
  generateReport: (payload: { labResultId?: string; reportType?: 'ai_summary' | 'physician_review' | 'executive' }) =>
    api<any>('/labs/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  uploadLabResult: (payload: { source: 'pdf' | 'manual' | 'api'; fileName?: string; biomarkers?: Record<string, unknown> }) =>
    api<any>('/labs/lab-results', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createPhysicianReview: (payload: { labResultId: string; status: 'approved' | 'edited' | 'needs_follow_up'; comment?: string }) =>
    api<any>('/labs/physician-reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  physicianReviewQueue: () => api<any[]>('/labs/physician/review-queue'),
  adminOverview: () => api<any>('/labs/admin/overview'),
  labsLogin: (payload: { identifier: string; password: string; role: LabsRole }) =>
    api<LabsSession>('/labs/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  labsSession: () => api<LabsSession>('/labs/auth/session'),
  labsLogout: () => api<{ ok: boolean }>('/labs/auth/logout', { method: 'POST' }),
  labsPortalDashboard: () => api<LabsPortalDashboard>('/labs/portal/dashboard')
};
