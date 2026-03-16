
import { Appointment, User, UserRole, MedicalRecord, Doctor, DigitalTwinState, TimeSlot, ChatSession, PartnerAdmin, FamilyMember, AccessLevel, SwarmCase } from '../types';
import { Language } from './i18n';

const DB_KEY = 'takhet_v15_db';

export interface Complaint {
  id: string;
  author: string;
  title: string;
  body: string;
  category: string;
  likes: number;
  replies: { author: string; doctorId?: string; text: string }[];
}

export interface PlatformRequest {
  id: string;
  type: 'DoctorOnboarding' | 'PartnerVerification';
  sender: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Added PharmacyProduct interface for admin/pharmacy views
export interface PharmacyProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  img: string;
  stock: number;
}

// Added PartnerClinic interface for admin view
export interface PartnerClinic {
  id: string;
  name: string;
  bin: string;
  status: 'Active' | 'Pending';
}

// Added AIChatMessage interface for admin assistant
export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface SystemConfig {
  theme: 'light' | 'dark';
  maintenanceMode: boolean;
  aiDiagnosticEnabled: boolean;
  serviceFeePercent: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'alert' | 'success' | 'invite' | 'swarm';
  meta?: any;
}

interface DBState {
  appointments: Appointment[];
  userProfile: Partial<User> & any;
  records: MedicalRecord[];
  complaints: Complaint[];
  doctors: Doctor[];
  notifications: Notification[];
  familyMembers: FamilyMember[];
  selectedMemberId: string;
  chats: ChatSession[];
  swarmCases: SwarmCase[];
  config: SystemConfig;
  revenueHistory: any[];
  aiChatHistory: AIChatMessage[];
  sessionFiles: { [appointmentId: string]: any[] };
  platformRequests: PlatformRequest[];
  partners: PartnerClinic[];
  pharmacyProducts: PharmacyProduct[];
  reviews: any[];
}

const initialState: DBState = {
  appointments: [],
  userProfile: {
    id: 'master-user-id',
    name: 'Алан Баймухан',
    email: 'alan@mail.ru',
    role: UserRole.PATIENT,
    lang: 'ru'
  },
  records: [],
  complaints: [],
  doctors: [
    {
      id: 'doc_1',
      name: 'Др. Михаил Михайлов',
      specialty: 'Кардиолог',
      experience: 15,
      rating: 4.9,
      reputationPoints: 1250,
      reviewsCount: 128,
      pricePrimary: 15000,
      priceSecondary: 10000,
      education: ['КазНМУ им. Асфендиярова'],
      biography: 'Эксперт в области кардиологии.',
      accepts: 'Взрослых',
      category: 'Высшая',
      avatar: 'https://i.pravatar.cc/150?u=mikhail',
      participatesInCommunity: true,
      schedule: {},
      edsVerified: true
    }
  ],
  notifications: [],
  selectedMemberId: 'self',
  familyMembers: [
    { 
      id: 'self', 
      name: 'Я (Алан)', 
      email: 'alan@mail.ru', 
      avatar: 'https://ui-avatars.com/api/?name=Alan&background=0D47A1&color=fff',
      status: 'Active',
      accessLevel: 'Full',
      healthScore: 88,
      lastUpdate: 'Сегодня',
      activeRisks: 1
    }
  ],
  chats: [],
  swarmCases: [],
  revenueHistory: [
    { name: 'Mon', amount: 4000, users: 120 },
    { name: 'Sun', amount: 3490, users: 300 },
  ],
  aiChatHistory: [],
  sessionFiles: {},
  platformRequests: [],
  partners: [],
  pharmacyProducts: [],
  reviews: [],
  config: { 
    theme: 'light',
    maintenanceMode: false,
    aiDiagnosticEnabled: true,
    serviceFeePercent: 15
  }
};

export const MockDB = {
  get: (): DBState => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : initialState;
  },
  save: (state: DBState) => {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('storage_update'));
  },

  createSwarmCase: (recordId: string, specialty: string) => {
    const db = MockDB.get();
    const newCase: SwarmCase = {
      id: 'swarm_' + Date.now(),
      originalRecordId: recordId,
      specialtyRequired: specialty,
      consensusScore: 0,
      status: 'Open',
      opinions: []
    };
    db.swarmCases.push(newCase);
    db.records = db.records.map(r => r.id === recordId ? { ...r, swarmCaseId: newCase.id } : r);
    MockDB.save(db);
    return newCase;
  },

  getSwarmCase: (id: string) => MockDB.get().swarmCases.find(c => c.id === id),
  getOpenSwarmCases: () => MockDB.get().swarmCases.filter(c => c.status === 'Open'),

  inviteMember: (email: string, access: AccessLevel = 'Full') => {
    const db = MockDB.get();
    const newMember: FamilyMember = {
      id: 'member_' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${email}&background=random&color=fff`,
      status: 'Pending',
      accessLevel: 'Full', 
      healthScore: 0,
      lastUpdate: 'Ожидание...',
      activeRisks: 0
    };
    db.familyMembers.push(newMember);
    db.notifications.unshift({
      id: 'notif_inv_' + Date.now(),
      title: 'Приглашение в Семейный штаб',
      body: `Пользователь ${db.userProfile.name} приглашает вас в свой штаб`,
      time: 'Только что',
      isRead: false,
      type: 'invite',
      meta: { memberId: newMember.id }
    });
    MockDB.save(db);
  },

  acceptInvite: (memberId: string) => {
    const db = MockDB.get();
    const member = db.familyMembers.find(m => m.id === memberId);
    if (member) {
      member.status = 'Active';
      member.healthScore = 75 + Math.floor(Math.random() * 20);
      MockDB.save(db);
    }
  },

  getRecords: () => MockDB.get().records,
  getNotifications: () => MockDB.get().notifications,
  getLang: (): Language => MockDB.get().userProfile.lang || 'ru',
  setLang: (lang: Language) => {
    const db = MockDB.get();
    db.userProfile.lang = lang;
    MockDB.save(db);
  },
  getProfile: () => MockDB.get().userProfile,
  updateProfile: (updates: any) => {
    const db = MockDB.get();
    db.userProfile = { ...db.userProfile, ...updates };
    MockDB.save(db);
  },
  getAppointments: () => MockDB.get().appointments,
  addAppointment: (app: Partial<Appointment>) => {
    const db = MockDB.get();
    const newApp = { ...app, id: 'app_' + Date.now(), status: app.status || 'upcoming' } as Appointment;
    db.appointments.push(newApp);
    MockDB.save(db);
    return newApp;
  },
  addRecord: (record: Partial<MedicalRecord>) => {
    const db = MockDB.get();
    const newRecord = { ...record, id: 'rec_' + Date.now(), status: record.status || 'New' } as MedicalRecord;
    db.records.unshift(newRecord);
    MockDB.save(db);
    return newRecord;
  },
  markNotificationRead: (id: string) => {
    const db = MockDB.get();
    db.notifications = db.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    MockDB.save(db);
  },
  getDoctors: () => MockDB.get().doctors,
  getVerifiedDoctors: () => MockDB.get().doctors.filter(d => d.edsVerified),
  getSelectedMemberId: () => MockDB.get().selectedMemberId,
  setSelectedMemberId: (id: string) => {
    const db = MockDB.get();
    db.selectedMemberId = id;
    MockDB.save(db);
  },
  getActiveMemberData: () => {
    const db = MockDB.get();
    return { 
      name: db.userProfile.name, 
      digitalTwin: { 
        overallScore: 88, bioAge: 27, age: 26, gender: 'male', weight: 75, height: 180, bodyType: 'Mesomorph',
        bloodPressure: { sys: 120, dia: 80 }, glucose: 5.4, smoking: 0, alcohol: 1, activityHours: 5, activityType: 'Mixed', stressLevel: 3, sleepHours: 7.5,
        chronicDiseases: ['Gastritis'],
        risks: [
          { label: 'Cardio Risk', probability: 12, timeline: '10 yrs', type: 'ASCVD' },
          { label: 'Diabetes Risk', probability: 8, timeline: '5 yrs', type: 'DIABETES' }
        ], 
        systemStatus: { cardio: 90, neuro: 85, metabolic: 80, immunity: 92, respiratory: 88 } 
      } 
    };
  },
  getDoctorSchedule: (doctorId: string, date: string) => {
    return [{ id: '1', time: '09:00', isBooked: false }, { id: '2', time: '10:00', isBooked: false }];
  },
  bookSlot: (doctorId: string, date: string, slotId: string, patientName: string) => {
    const db = MockDB.get();
    const newApp = { id: 'app_' + Date.now(), doctorId, doctorName: 'Doctor', patientName, date, time: '09:00', status: 'upcoming', type: 'Video' } as Appointment;
    db.appointments.push(newApp);
    MockDB.save(db);
    return newApp;
  },
  getChats: () => MockDB.get().chats,
  getDoctorStats: () => ({ rating: 4.9, sessions: 42, patients: 28, revenue: 450000 }),
  getRevenueHistory: () => MockDB.get().revenueHistory,
  getAdmins: () => [{ id: 'adm_1', name: 'Baimukhan Alan', role: 'System Admin', avatar: 'https://ui-avatars.com/api/?name=Admin' }],
  updateDoctor: (id: string, updates: Partial<Doctor>) => {
    const db = MockDB.get();
    db.doctors = db.doctors.map(d => d.id === id ? { ...d, ...updates } : d);
    MockDB.save(db);
  },
  getComplaints: () => MockDB.get().complaints,
  addComplaint: (c: Omit<Complaint, 'id' | 'likes' | 'replies'>) => {
    const db = MockDB.get();
    db.complaints.unshift({ ...c, id: 'c_' + Date.now(), likes: 0, replies: [] });
    MockDB.save(db);
  },
  addReply: (id: string, reply: any) => {
    const db = MockDB.get();
    const c = db.complaints.find(comp => comp.id === id);
    if (c) { c.replies.push(reply); MockDB.save(db); }
  },
  addAIChatMessage: (msg: AIChatMessage) => {
    const db = MockDB.get();
    db.aiChatHistory.push(msg);
    MockDB.save(db);
  },
  clearAIChatHistory: () => {
    const db = MockDB.get();
    db.aiChatHistory = [];
    MockDB.save(db);
  },
  updateRequestStatus: (id: string, status: any) => {
    const db = MockDB.get();
    db.platformRequests = db.platformRequests.map(r => r.id === id ? { ...r, status } : r);
    MockDB.save(db);
  },
  updateSystemConfig: (updates: Partial<SystemConfig>) => {
    const db = MockDB.get();
    db.config = { ...db.config, ...updates };
    MockDB.save(db);
  },
  deleteRecord: (id: string) => {
    const db = MockDB.get();
    db.records = db.records.filter(r => r.id !== id);
    MockDB.save(db);
  },
  deleteReview: (id: string) => {
    const db = MockDB.get();
    db.reviews = db.reviews.filter(r => r.id !== id);
    MockDB.save(db);
  },
  deleteComplaint: (id: string) => {
    const db = MockDB.get();
    db.complaints = db.complaints.filter(c => c.id !== id);
    MockDB.save(db);
  },
  deleteDoctor: (id: string) => {
    const db = MockDB.get();
    db.doctors = db.doctors.filter(d => d.id !== id);
    MockDB.save(db);
  },
  updateTwinParams: (memberId: string, params: Partial<DigitalTwinState>) => {
    const db = MockDB.get();
    MockDB.save(db);
  },
  uploadFile: (appId: string, file: any) => {
    const db = MockDB.get();
    if (!db.sessionFiles[appId]) db.sessionFiles[appId] = [];
    db.sessionFiles[appId].push({ ...file, id: 'f_' + Date.now() });
    MockDB.save(db);
  },
  getFiles: (appId: string) => MockDB.get().sessionFiles[appId] || [],
  sendMessage: (chatId: string, senderId: string, text: string) => {
    const db = MockDB.get();
    const chat = db.chats.find(c => c.id === chatId);
    if (chat) { chat.messages.push({ id: 'msg_'+Date.now(), senderId, text, timestamp: '12:00' }); MockDB.save(db); }
  },
  finishConsultation: (chatId: string) => {
    const db = MockDB.get();
    const chat = db.chats.find(c => c.id === chatId);
    if (chat) { chat.consultationEndDate = new Date().toISOString(); MockDB.save(db); }
  }
};