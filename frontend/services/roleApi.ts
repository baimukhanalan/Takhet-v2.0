import { api } from './api';

export const roleApi = {
  health: () => api<{ status: string; timestamp: string; service: string }>('/health'),

  doctorDashboard: () => api<any>('/doctor/dashboard'),
  doctorCases: () => api<any[]>('/doctor/cases'),
  doctorAppointments: () => api<any[]>('/doctor/appointments'),
  doctorQueue: () => api<any[]>('/doctor/cases/queue'),
  doctorEarnings: () => api<any>('/doctor/earnings'),
  doctorProfile: () => api<any>('/doctor/profile'),
  doctorUpdateProfile: (bio: string) =>
    api<any>('/doctor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio })
    }),
  doctorUpdateCaseStatus: (id: string, status: 'assigned' | 'consultation_started' | 'consultation_finished' | 'closed') =>
    api<any>(`/doctor/case/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  partnerDashboard: () => api<any>('/partner/dashboard'),
  partnerDoctors: () => api<any[]>('/partner/doctors'),
  partnerCreateDoctor: (fullName: string, specialty: string) =>
    api<any>('/partner/doctors', {
      method: 'POST',
      body: JSON.stringify({ fullName, specialty })
    }),
  partnerActivateDoctor: (id: string) => api<any>(`/partner/doctors/${id}/activate`, { method: 'PATCH' }),
  partnerDeactivateDoctor: (id: string) => api<any>(`/partner/doctors/${id}/deactivate`, { method: 'PATCH' }),
  partnerRequests: () => api<any>('/partner/requests'),
  partnerPayments: () => api<any[]>('/partner/payments'),
  partnerCommissions: () => api<any>('/partner/commissions'),
  partnerPayoutBacklog: () => api<any>('/partner/payout-backlog'),

  patientCases: () => api<any[]>('/patient/cases'),
  patientCreateCase: (summary: string) =>
    api<any>('/patient/cases', {
      method: 'POST',
      body: JSON.stringify({ summary })
    }),
  patientNotifications: () => api<any[]>('/patient/notifications'),
  patientPayments: () => api<any[]>('/patient/payments'),
  createPaymentIntent: (caseId: string, amount: number) =>
    api<any>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ caseId, amount })
    }),

  publicDoctors: () => api<any[]>('/doctors'),

  uploadMedicalFile: (payload: { fileName: string; mimeType: string; base64: string }) =>
    api<{ path: string; bucket: string }>('/files/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  adminDashboard: () => api<any>('/admin/dashboard'),
  adminKpis: () => api<any>('/admin/kpis'),
  adminCases: () => api<any[]>('/admin/cases'),
  adminUsers: () => api<any[]>('/admin/users'),
  adminPayments: () => api<any[]>('/admin/payments'),

  adminAudit: () => api<any[]>('/admin/audit'),
  adminApproveDoctor: (id: string) => api<any>(`/admin/doctor/${id}/approve`, { method: 'PATCH' }),
  adminAssignCase: (caseId: string, doctorId: string) => api<any>(`/admin/case/${caseId}/assign/${doctorId}`, { method: 'PATCH' }),
  adminReopenCase: (caseId: string) => api<any>(`/admin/case/${caseId}/reopen`, { method: 'PATCH' }),
  adminDeleteUser: (id: string) => api<any>(`/admin/user/${id}`, { method: 'DELETE' }),
  adminBroadcast: (title: string, body: string) =>
    api<any>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body })
    }),
  adminPreparePayouts: () => api<any>('/admin/payouts/prepare', { method: 'POST' }),
  adminPayouts: () => api<any[]>('/admin/payouts'),
  adminPayoutDryRun: (doctorId: string, periodStart: string, periodEnd: string) =>
    api<any>('/admin/payouts/dry-run', {
      method: 'POST',
      body: JSON.stringify({ doctorId, periodStart, periodEnd })
    }),
  adminCreatePayout: (doctorId: string, periodStart: string, periodEnd: string) =>
    api<any>('/admin/payouts/create', {
      method: 'POST',
      body: JSON.stringify({ doctorId, periodStart, periodEnd })
    }),
  adminReversePayout: (payoutId: string) => api<any>(`/admin/payout/${payoutId}/reverse`, { method: 'PATCH' }),
};
