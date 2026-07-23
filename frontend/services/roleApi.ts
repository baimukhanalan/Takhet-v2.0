import { api } from './api';

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const getFileExtension = (fileName: string) => {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.nii.gz')) return 'nii.gz';
  return normalized.split('.').pop() || '';
};

const shouldUseResumableUpload = (file: File) => {
  const heavyMedicalExtensions = new Set(['edf', 'bdf', 'dcm', 'dicom', 'nii', 'nii.gz']);
  const heavyMedicalMimeTypes = new Set(['application/dicom', 'application/octet-stream']);
  const legacyUploadLimit = 10 * 1024 * 1024;

  return file.size > legacyUploadLimit || heavyMedicalExtensions.has(getFileExtension(file.name)) || heavyMedicalMimeTypes.has(file.type);
};

export const roleApi = {
  aiLiveToken: () =>
    api<{ token: string; model: string; expiresAt: string }>('/ai/live-token', {
      method: 'POST'
    }),
  publicDoctors: () => api<any[]>('/doctors'),
  publicDoctor: (id: string) => api<any>(`/doctors/${id}`),
  guestCreateConsultation: (payload: {
    doctorId: string;
    fullName: string;
    phone: string;
    email?: string;
    preferredDate?: string;
    preferredSlot?: string;
    phoneVerificationToken: string;
  }) =>
    api<any>('/guest/consultations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  guestCreateUrgentConsultation: (payload: {
    summary: string;
    fullName: string;
    phone: string;
    email?: string;
    phoneVerificationToken: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedTelemedicine: boolean;
  }) =>
    api<any>('/guest/urgent-consultations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  patientCreateUrgentConsultation: (summary: string) =>
    api<any>('/patient/urgent-consultations', {
      method: 'POST',
      body: JSON.stringify({ summary })
    }),
  requestGuestPhoneOtp: (payload: { phone: string; email?: string }) =>
    api<any>('/guest/phone-otp/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyGuestPhoneOtp: (payload: { phone: string; code: string }) =>
    api<any>('/guest/phone-otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  requestEmailVerification: (payload: { email: string; role: 'patient' | 'doctor' | 'partner' | 'admin' }) =>
    api<any>('/auth/request-email-verification', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  confirmEmailVerification: (payload: { token: string }) =>
    api<any>('/auth/confirm-email-verification', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  requestPasswordReset: (payload: { email: string; role: 'patient' | 'doctor' | 'partner' | 'admin' }) =>
    api<any>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    api<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  startGoogleAuth: (payload: { role: 'patient' | 'doctor' | 'partner'; mode?: 'login' | 'register' }) =>
    api<{ ok: boolean; configured: boolean; authUrl?: string; message?: string }>('/auth/google/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  publicFeedback: (payload: { name: string; review: string }) =>
    api<any>('/community/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  myNotifications: () => api<any[]>('/notifications/my'),
  doctorDashboard: () => api<any>('/doctor/dashboard'),
  doctorCases: () => api<any[]>('/doctor/cases'),
  doctorCreateCase: (summary: string) =>
    api<any>('/doctor/cases', {
      method: 'POST',
      body: JSON.stringify({ summary })
    }),
  doctorCaseById: (id: string) => api<any>(`/doctor/case/${id}`),
  doctorAppointments: () => api<any[]>('/doctor/appointments'),
  doctorQueue: () => api<any[]>('/doctor/cases/queue'),
  doctorEarnings: () => api<any>('/doctor/earnings'),
  doctorProfile: () => api<any>('/doctor/profile'),
  doctorUpdateProfile: (payload: {
    avatar?: string;
    fullName?: string;
    specialty?: string;
    bio: string;
    headline: string;
    languages: string[];
    consultationModes: string[];
    focusAreas: string[];
    education: string[];
    city: string;
    clinicName: string;
    responseTargetHours: number;
    pricePrimary: number;
    experienceYears?: number;
    accepts: string;
    availability: { date: string; slots: string[] }[];
  }) =>
    api<any>('/doctor/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  doctorUpdateCaseStatus: (id: string, status: 'active' | 'in_review' | 'closed') =>
    api<any>(`/doctor/case/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  doctorCaseReport: (id: string) => api<any>(`/doctor/case/${id}/report`),
  doctorAppendConsultationMessage: (id: string, response: string) =>
    api<any>(`/doctor/case/${id}/consultation-message`, {
      method: 'POST',
      body: JSON.stringify({ response })
    }),
  doctorConfirmCaseReport: (id: string, doctorRecommendations: string) =>
    api<any>(`/doctor/case/${id}/report/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ doctorRecommendations })
    }),
  doctorSaveConsultationReportDraft: (id: string, payload: { aiSummary?: string; doctorRecommendations?: string }) =>
    api<any>(`/doctor/case/${id}/report/draft`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
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
  partnerProfile: () => api<any>('/partner/profile'),
  partnerUpdateProfile: (payload: any) =>
    api<any>('/partner/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  patientCases: () => api<any[]>('/patient/cases'),
  patientCreateCase: (
    summary:
      | string
      | {
          summary: string;
          doctorId?: string;
          appointmentDate?: string;
          appointmentSlot?: string;
        }
  ) =>
    api<any>('/patient/cases', {
      method: 'POST',
      body: JSON.stringify(typeof summary === 'string' ? { summary } : summary)
    }),
  patientNotifications: () => api<any[]>('/patient/notifications'),
  patientPayments: () => api<any[]>('/patient/payments'),
  patientProfile: () => api<any>('/patient/profile'),
  patientExportContext: () => api<any>('/patient/context-export'),
  patientExportCase: (caseId: string) => api<any>(`/patient/case/${caseId}/export-context`),
  patientShareContextToCase: (caseId: string) =>
    api<any>(`/patient/case/${caseId}/share-context`, {
      method: 'POST'
    }),
  patientUpdateProfile: (payload: any) =>
    api<any>('/patient/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  patientSubmitFeedback: (payload: { caseId: string; score: number; review: string }) =>
    api<any>('/patient/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  patientSaveConsultationDraft: (
    caseId: string,
    payload: {
      transcript: { speaker: 'patient' | 'doctor' | 'ai' | 'system'; text: string; createdAt: string }[];
      uploadedDocs?: { name: string; analysis: string }[];
      aiSummary?: string;
    }
  ) =>
    api<any>(`/patient/case/${caseId}/consultation-draft`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  patientFinalizeAiConsultationReport: (caseId: string, payload: { aiSummary?: string } = {}) =>
    api<any>(`/patient/case/${caseId}/consultation-report/finalize-ai`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  patientConsultationReport: (caseId: string) => api<any>(`/patient/case/${caseId}/consultation-report`),
  consultationSignals: (caseId: string, since = 0) => api<any[]>(`/cases/${caseId}/signals?since=${since}`),
  consultationIceServers: () => api<{ iceServers: RTCIceServer[]; relayConfigured: boolean }>('/cases/ice-servers'),
  cancelConsultation: (caseId: string) =>
    api<any>(`/cases/${caseId}/cancel`, {
      method: 'PATCH'
    }),
  consultationSignal: (
    caseId: string,
    payload: { type: 'offer' | 'answer' | 'ice' | 'leave'; payload?: any }
  ) =>
    api<any>(`/cases/${caseId}/signals`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  appState: () => api<any>('/profiles/app-state'),
  updateAppState: (payload: {
    aiBrowserHistory?: string[];
    aiBrowserCache?: Record<string, unknown>;
    takhetAiChatArchive?: unknown[];
  }) =>
    api<any>('/profiles/app-state', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  createPaymentIntent: (caseId: string) =>
    api<{
      available?: boolean;
      paymentRequired?: boolean;
      paymentUrl?: string | null;
      paymentId?: string | null;
      amount?: number;
      currency?: string;
      message?: string;
    }>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ caseId })
    }),

  uploadMedicalFile: (payload: { fileName: string; mimeType: string; base64: string }) =>
    api<{ path: string; bucket: string }>('/files/upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createMedicalResumableUpload: (payload: { fileName: string; mimeType: string; sizeBytes: number }) =>
    api<{
      bucket: string;
      path: string;
      token: string;
      endpoint: string;
      chunkSize: number;
      expiresInSeconds: number;
    }>('/files/resumable', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  uploadMedicalFileSmart: async (file: File) => {
    if (shouldUseResumableUpload(file)) {
      const session = await roleApi.createMedicalResumableUpload({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size
      });
      const { uploadMedicalFileResumable } = await import('../src/services/resumableUpload');
      return uploadMedicalFileResumable(file, session, () => undefined);
    }

    return roleApi.uploadMedicalFile({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64: await fileToBase64(file)
    });
  },

  communityPosts: () => api<any[]>('/community/posts'),
  communityTopDoctors: () => api<any[]>('/community/top-doctors'),
  communityCreatePost: (payload: { author: string; title: string; body: string; category: string }) =>
    api<any>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  communityReply: (id: string, text: string) =>
    api<any>(`/community/posts/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  adminDashboard: () => api<any>('/admin/dashboard'),
  adminKpis: () => api<any>('/admin/kpis'),
  adminPortalState: () => api<any>('/admin/portal-state'),
  adminSystemHealth: () => api<any>('/admin/system-health'),
  adminUpdatePortalConfig: (payload: any) =>
    api<any>('/admin/portal-config', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  adminAssistantMessage: (payload: { role: 'user' | 'model'; text: string; timestamp: string }) =>
    api<any>('/admin/assistant-message', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  adminClearAssistantHistory: () => api<any>('/admin/assistant-history', { method: 'DELETE' }),
  adminAddMedicine: () => api<any>('/admin/medicines', { method: 'POST' }),
  adminUpdateMedicine: (id: string, payload: any) =>
    api<any>(`/admin/medicine/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  adminDeleteMedicine: (id: string) => api<any>(`/admin/medicine/${id}`, { method: 'DELETE' }),
  adminAddPartner: () => api<any>('/admin/partners', { method: 'POST' }),
  adminUpdatePartner: (id: string, payload: any) =>
    api<any>(`/admin/partner/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  adminDeletePartner: (id: string) => api<any>(`/admin/partner/${id}`, { method: 'DELETE' }),
  adminAddContract: () => api<any>('/admin/contracts', { method: 'POST' }),
  adminUpdateContract: (id: string, payload: any) =>
    api<any>(`/admin/contract/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  adminDeleteContract: (id: string) => api<any>(`/admin/contract/${id}`, { method: 'DELETE' }),
  adminTogglePartner: (id: string) => api<any>(`/admin/partner/${id}/toggle`, { method: 'PATCH' }),
  adminToggleContract: (id: string) => api<any>(`/admin/contract/${id}/toggle`, { method: 'PATCH' }),
  adminDeleteReview: (id: string) => api<any>(`/admin/review/${id}`, { method: 'DELETE' }),
  adminDeleteComplaint: (id: string) => api<any>(`/admin/complaint/${id}`, { method: 'DELETE' }),
  adminDoctors: () => api<any[]>('/admin/doctors'),
  adminCreateDoctor: (
    fullName: string,
    specialty: string,
    options: { catalogAudience?: 'doctor' | 'mental' | 'both'; temporaryLogin?: string } = {}
  ) =>
    api<any>('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify({ fullName, specialty, ...options })
    }),
  adminCases: () => api<any[]>('/admin/cases'),
  adminUsers: () => api<any[]>('/admin/users'),
  adminPayments: () => api<any[]>('/admin/payments'),
  adminAudit: () => api<any[]>('/admin/audit'),
  adminApproveDoctor: (id: string) => api<any>(`/admin/doctor/${id}/approve`, { method: 'PATCH' }),
  adminDeactivateDoctor: (id: string) => api<any>(`/admin/doctor/${id}/deactivate`, { method: 'PATCH' }),
  adminDeleteDoctor: (id: string) => api<any>(`/admin/doctor/${id}`, { method: 'DELETE' }),
  adminAssignCase: (caseId: string, doctorId: string) => api<any>(`/admin/case/${caseId}/assign/${doctorId}`, { method: 'PATCH' }),
  adminReopenCase: (caseId: string) => api<any>(`/admin/case/${caseId}/reopen`, { method: 'PATCH' }),
  adminDeleteUser: (id: string) => api<any>(`/admin/user/${id}`, { method: 'DELETE' }),
  adminBroadcast: (title: string, body: string) =>
    api<any>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body })
    }),
  academyImports: (status?: string) => api<any>(`/academy/imports${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  academyCreateImport: (payload: any) =>
    api<any>('/academy/imports', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  academyApproveImport: (id: string) => api<any>(`/academy/imports/${id}/approve`, { method: 'PATCH' }),
  academyRejectImport: (id: string, reason?: string) =>
    api<any>(`/academy/imports/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    })
};
