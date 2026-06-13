export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}
export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  isVerified?: boolean; // For Doctors/Partners
  isPending?: boolean; // For initial registration
}
// Added PartnerAdmin interface for settings and admin dashboard
export interface PartnerAdmin {
  id: string;
  name: string;
  role: string;
  avatar: string;
}
// Added NormalizedData interface for medical engine processing
export interface NormalizedData {
  originalValue: any;
  normalizedValue: string;
  units: string;
  confidenceScore: number;
  noiseLevel: 'low' | 'medium' | 'high';
}
export interface SwarmOpinion {
  doctorId: string;
  hypothesis: string;
  argument: string;
  confidence: number;
}
export interface SwarmCase {
  id: string;
  originalRecordId: string;
  title: string;
  specialty: string;
  specialtyRequired: string;
  consensusScore: number; // 0-100
  opinions: SwarmOpinion[];
  status: 'Open' | 'Closed';
  createdAt: string;
  participants: number;
  messages: number;
}
export interface TimeSlot {
  id: string;
  time: string;
  isBooked: boolean;
}
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reputationPoints: number;
  reviewsCount: number;
  pricePrimary: number;
  priceSecondary: number;
  education: string[];
  biography: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
  };
  accepts: 'Взрослых' | 'Детей' | 'Всех';
  category: 'Высшая' | 'Первая' | 'Вторая';
  avatar: string;
  participatesInCommunity: boolean;
  schedule: { [date: string]: TimeSlot[] };
  clinicId?: string;
  isApproved?: boolean;
}
export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  date: string;
  type: 'Photo' | 'Symptoms' | 'Analysis' | 'Voice' | 'Wearable' | 'Behavior' | 'Prescription' | 'EEG' | 'Visit';
  summary?: string;
  fullData?: any;
  status: 'New' | 'Analyzed' | 'Archived';
  swarmCaseId?: string;
}
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type: 'Video' | 'Chat' | 'In-Person';
  durationMinutes?: number;
  completedAt?: string;
  reportId?: string;
  notes?: string;
  diagnosis?: string;
  recommendations?: string;
  isShared?: boolean;
  patientConfirmed?: boolean;
}
export interface ChatSession {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  doctorAvatar: string;
  patientAvatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  consultationEndDate?: string;
  messages: any[];
}
export interface DecisionRoute {
  riskScore: number;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  timeframe: string;
  specialist: string;
  reason: string;
  redFlags: string[];
}

