import { api } from './api';

export const roleApi = {
  doctorDashboard: () => api<any>('/doctor/dashboard'),
  doctorCases: () => api<any[]>('/doctor/cases'),
  doctorAppointments: () => api<any[]>('/doctor/appointments'),
  doctorQueue: () => api<any[]>('/doctor/cases/queue'),
  doctorEarnings: () => api<any>('/doctor/earnings'),
  doctorUpdateCaseStatus: (id: string, status: 'active' | 'in_review' | 'closed') =>
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

  patientCases: () => api<any[]>('/patient/cases'),
  patientCreateCase: (summary: string) =>
    api<any>('/patient/cases', {
      method: 'POST',
      body: JSON.stringify({ summary })
    }),
  patientNotifications: () => api<any[]>('/patient/notifications'),
  patientPayments: () => api<any[]>('/patient/payments'),

  uploadMedicalFile: (payload: { fileName: string; mimeType: string; base64: string }) =>
    api<{ path: string; bucket: string }>('/files/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  adminDashboard: () => api<any>('/admin/dashboard'),
  adminKpis: () => api<any>('/admin/kpis'),
  adminCases: () => api<any[]>('/admin/cases'),
  adminUsers: () => api<any[]>('/admin/users'),
  adminPayments: () => api<any[]>('/admin/payments')
};
