import { api } from './api';

export const roleApi = {
  doctorDashboard: () => api<any>('/doctor/dashboard'),
  doctorCases: () => api<any[]>('/doctor/cases'),
  doctorQueue: () => api<any[]>('/doctor/cases/queue'),
  doctorEarnings: () => api<any>('/doctor/earnings'),

  partnerDashboard: () => api<any>('/partner/dashboard'),
  partnerDoctors: () => api<any[]>('/partner/doctors'),
  partnerRequests: () => api<any>('/partner/requests'),
  partnerPayments: () => api<any[]>('/partner/payments'),

  adminDashboard: () => api<any>('/admin/dashboard'),
  adminKpis: () => api<any>('/admin/kpis'),
  adminCases: () => api<any[]>('/admin/cases'),
  adminUsers: () => api<any[]>('/admin/users'),
  adminPayments: () => api<any[]>('/admin/payments')
};
