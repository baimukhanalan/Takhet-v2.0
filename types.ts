
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  type: 'Analysis' | 'Prescription' | 'EEG' | 'Visit';
  summary?: string;
  status: 'New' | 'Analyzed' | 'Archived';
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  type: 'Video' | 'Audio' | 'Chat';
  specialty?: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}
