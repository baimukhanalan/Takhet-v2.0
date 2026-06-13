import { api } from '../../services/api';

export type EnterpriseRole =
  | 'employee'
  | 'employer_admin'
  | 'doctor'
  | 'psychologist'
  | 'takhet_admin'
  | 'clinical_supervisor';

export type EnterpriseUser = {
  id: string;
  enterpriseId: string;
  employeeId: string;
  email: string;
  role: EnterpriseRole;
  fullName: string;
  enterpriseName: string;
};

export type EnterpriseSession = {
  authenticated?: boolean;
  user: EnterpriseUser | null;
  legal: string;
};

export type EnterpriseRegisterInput = {
  identifier: string;
  password: string;
  role: EnterpriseRole;
};

export type EnterpriseLeadInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employees?: number;
  message?: string;
};

export type EnterpriseCheckInput = {
  sleepHours?: number;
  fatigueLevel?: number;
  dizziness?: boolean;
  headache?: boolean;
  nausea?: boolean;
  painLevel?: number;
  stressLevel?: number;
  medications?: string;
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  symptomsToday?: string;
  fitToWork?: boolean;
};

export type EnterpriseConsultationRequestInput = {
  serviceType: 'duty_doctor' | 'psychologist' | 'specialist';
  specialty?: string;
  preferredTime?: string;
  notes?: string;
  premiumRequested?: boolean;
};

const enterpriseDemoIdentifiers: Record<EnterpriseRole, string> = {
  employee: 'EMP-1001',
  employer_admin: 'HR-ADMIN',
  doctor: 'DR-ENTERPRISE',
  psychologist: 'PSY-ENTERPRISE',
  takhet_admin: 'T+ADMIN',
  clinical_supervisor: 'CLIN-SUP'
};

const resolveEnterpriseDemoIdentifier = (identifier: string, role: EnterpriseRole) =>
  ['admin', 'baimukhanalan1@gmail.com'].includes(identifier.trim().toLowerCase()) ? enterpriseDemoIdentifiers[role] : identifier;

export const enterpriseApi = {
  createLead: (payload: EnterpriseLeadInput) =>
    api<{ ok: boolean; id: string }>('/enterprise/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (identifier: string, password: string, role: EnterpriseRole) =>
    api<EnterpriseSession>('/enterprise/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: resolveEnterpriseDemoIdentifier(identifier, role), password, role })
    }),
  register: (payload: EnterpriseRegisterInput) =>
    api<{ ok: boolean; status: 'request_submitted'; role: EnterpriseRole; legal: string }>('/enterprise/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        identifier: resolveEnterpriseDemoIdentifier(payload.identifier, payload.role)
      })
    }),
  session: () => api<EnterpriseSession>('/enterprise/auth/session'),
  logout: () => api<{ ok: boolean }>('/enterprise/auth/logout', { method: 'POST' }),

  employeeDashboard: () => api<any>('/enterprise/employee/dashboard'),
  employeeBenefits: () => api<any>('/enterprise/employee/benefits'),
  employeeHistory: () => api<any[]>('/enterprise/employee/history'),
  employeeRecommendations: () => api<any>('/enterprise/employee/recommendations'),
  employeeProfile: () => api<any>('/enterprise/employee/profile'),
  employeeNotifications: () => api<any[]>('/enterprise/employee/notifications'),
  startAiSession: (payload: any) =>
    api<any>('/enterprise/employee/ai-sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  runTriage: (payload: any) =>
    api<any>('/enterprise/employee/triage', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  requestConsultation: (payload: EnterpriseConsultationRequestInput) =>
    api<any>('/enterprise/employee/consultation-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  submitFeedback: (payload: any) =>
    api<any>('/enterprise/employee/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  riskPrecheck: (payload: EnterpriseCheckInput) =>
    api<any>('/enterprise/employee/risk-precheck', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  employerDashboard: () => api<any>('/enterprise/employer/dashboard'),
  employerEmployees: () => api<any[]>('/enterprise/employer/employees'),
  inviteEmployee: (payload: any) =>
    api<any>('/enterprise/employer/invites', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  employerDepartments: () => api<any[]>('/enterprise/employer/departments'),
  employerActivation: () => api<any>('/enterprise/employer/activation'),
  employerUtilization: () => api<any>('/enterprise/employer/utilization'),
  employerTrends: () => api<any>('/enterprise/employer/trends'),
  employerFinance: () => api<any>('/enterprise/employer/finance'),
  employerPlan: () => api<any>('/enterprise/employer/plan'),
  employerReports: () => api<any>('/enterprise/employer/reports'),
  employerPrivacy: () => api<any>('/enterprise/employer/privacy'),
  employerSettings: () => api<any>('/enterprise/employer/settings'),

  providerQueue: () => api<any[]>('/enterprise/provider/queue'),
  providerSchedule: () => api<any[]>('/enterprise/provider/schedule'),
  providerPatients: () => api<any[]>('/enterprise/provider/patients'),
  providerConsultations: () => api<any[]>('/enterprise/provider/consultations'),
  providerTriageSummary: () => api<any>('/enterprise/provider/triage-summary'),
  providerNotes: () => api<any[]>('/enterprise/provider/notes'),
  addProviderNote: (payload: any) =>
    api<any>('/enterprise/provider/notes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  providerPayouts: () => api<any>('/enterprise/provider/payouts'),
  providerTraining: () => api<any>('/enterprise/provider/training'),
  providerProfile: () => api<any>('/enterprise/provider/profile'),

  takhetAdminCompanies: () => api<any[]>('/enterprise/takhet-admin/companies'),
  takhetAdminPlans: () => api<any[]>('/enterprise/takhet-admin/plans'),
  takhetAdminEmployees: () => api<any[]>('/enterprise/takhet-admin/employees'),
  takhetAdminDoctors: () => api<any[]>('/enterprise/takhet-admin/doctors'),
  takhetAdminVerification: () => api<any[]>('/enterprise/takhet-admin/verification'),
  takhetAdminTariffs: () => api<any[]>('/enterprise/takhet-admin/tariffs'),
  takhetAdminLimits: () => api<any[]>('/enterprise/takhet-admin/limits'),
  takhetAdminBilling: () => api<any[]>('/enterprise/takhet-admin/billing'),
  takhetAdminPayouts: () => api<any[]>('/enterprise/takhet-admin/payouts'),
  takhetAdminAiSessions: () => api<any[]>('/enterprise/takhet-admin/ai-sessions'),
  takhetAdminReports: () => api<any[]>('/enterprise/takhet-admin/reports'),
  takhetAdminAudit: () => api<any[]>('/enterprise/takhet-admin/audit'),
  takhetAdminCompliance: () => api<any>('/enterprise/takhet-admin/compliance'),
  takhetAdminSettings: () => api<any>('/enterprise/takhet-admin/settings'),

  supervisorQualityReview: () => api<any[]>('/enterprise/supervisor/quality-review'),
  supervisorFlaggedCases: () => api<any[]>('/enterprise/supervisor/flagged-cases'),
  supervisorEscalations: () => api<any[]>('/enterprise/supervisor/escalations'),
  supervisorNotesAudit: () => api<any[]>('/enterprise/supervisor/notes-audit'),
  supervisorRiskMonitoring: () => api<any>('/enterprise/supervisor/risk-monitoring'),
  supervisorProtocols: () => api<any[]>('/enterprise/supervisor/protocols')
};
