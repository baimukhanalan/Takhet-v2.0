import { Appointment, User, UserRole, MedicalRecord, Doctor, TimeSlot, ChatSession, PartnerAdmin, SwarmCase } from '../types';
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
  senderId?: string;
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
  adminId: string;
  commission: number;
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
  appointments: [
    {
      id: 'app_1',
      patientId: 'master-user-id',
      patientName: 'Алан Баймухан',
      doctorId: 'doc_1',
      doctorName: 'Др. Михаил Михайлов',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: 'upcoming',
      type: 'Video'
    },
    {
      id: 'app_test',
      patientId: 'master-user-id',
      patientName: 'Алан Баймухан',
      doctorId: 'doc_test',
      doctorName: 'Тестовый Врач (WebRTC)',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      status: 'upcoming',
      type: 'Video'
    }
  ],
  userProfile: {
    id: 'master-user-id',
    name: 'Алан Баймухан',
    email: 'alan@mail.ru',
    role: UserRole.PATIENT,
    lang: 'ru',
    avatar: 'https://i.pravatar.cc/150?u=alan'
  },
  records: [
    {
      id: 'rec_1',
      patientId: 'master-user-id',
      title: 'Ежегодный осмотр',
      date: '10.03.2024',
      type: 'Visit',
      status: 'Analyzed',
      summary: 'Общее состояние стабильное. Рекомендовано увеличить физическую активность.'
    }
  ],
  complaints: [
    {
      id: 'c_1',
      author: 'Алан Баймухан',
      title: 'Боли в колене после бега',
      body: 'После пробежки на 5км чувствую острую боль в левом колене. Что это может быть?',
      category: 'Травматология',
      likes: 5,
      replies: [
        { author: 'Др. Михаил Михайлов', doctorId: 'doc_1', text: 'Рекомендую сделать МРТ и временно прекратить нагрузки.' }
      ]
    }
  ],
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
      isApproved: true
    },
    {
      id: 'doc_2',
      name: 'Др. Елена Иванова',
      specialty: 'Терапевт',
      experience: 8,
      rating: 4.7,
      reputationPoints: 850,
      reviewsCount: 64,
      pricePrimary: 12000,
      priceSecondary: 8000,
      education: ['МУА'],
      biography: 'Внимательный специалист широкого профиля.',
      accepts: 'Всех',
      category: 'Первая',
      avatar: 'https://i.pravatar.cc/150?u=elena',
      participatesInCommunity: true,
      schedule: {},
      isApproved: false
    },
    {
      id: 'doc_test',
      name: 'Тестовый Врач (WebRTC)',
      specialty: 'Тестировщик систем',
      experience: 10,
      rating: 5.0,
      reputationPoints: 2000,
      reviewsCount: 1,
      pricePrimary: 1,
      priceSecondary: 1,
      education: ['WebRTC Academy'],
      biography: 'Специальный аккаунт для тестирования видеосвязи и консультаций.',
      accepts: 'Всех',
      category: 'Высшая',
      avatar: 'https://ui-avatars.com/api/?name=Test+Doctor&background=0D8ABC&color=fff',
      participatesInCommunity: true,
      schedule: {},
      isApproved: true
    },
    {
      id: 'doc_mental_test',
      name: 'Тестовый Психолог',
      specialty: 'Психолог-консультант',
      experience: 12,
      rating: 5.0,
      reputationPoints: 1500,
      reviewsCount: 42,
      pricePrimary: 1,
      priceSecondary: 1,
      education: ['Академия Психологии'],
      biography: 'Специалист по тестированию ментального здоровья и консультаций.',
      accepts: 'Всех',
      category: 'Высшая',
      avatar: 'https://ui-avatars.com/api/?name=Mental+Test&background=10B981&color=fff',
      participatesInCommunity: true,
      schedule: {},
      isApproved: true
    }
  ],
  notifications: [],
  chats: [],
  swarmCases: [
    {
      id: 'sc_1',
      originalRecordId: 'rec_1',
      title: 'Атипичная пневмония?',
      specialty: 'Пульмонология',
      specialtyRequired: 'Пульмонолог',
      consensusScore: 0,
      opinions: [],
      status: 'Open',
      createdAt: '2026-03-18',
      participants: 3,
      messages: 12
    },
    {
      id: 'sc_2',
      originalRecordId: 'rec_2',
      title: 'Сложный случай дерматита',
      specialty: 'Дерматология',
      specialtyRequired: 'Дерматолог',
      consensusScore: 0,
      opinions: [],
      status: 'Open',
      createdAt: '2026-03-19',
      participants: 5,
      messages: 24
    }
  ],
  revenueHistory: [
    { name: 'Mon', amount: 4000, users: 120 },
    { name: 'Tue', amount: 3000, users: 150 },
    { name: 'Wed', amount: 5000, users: 180 },
    { name: 'Thu', amount: 2000, users: 110 },
    { name: 'Fri', amount: 7000, users: 220 },
    { name: 'Sat', amount: 8000, users: 250 },
    { name: 'Sun', amount: 3490, users: 300 },
  ],
  aiChatHistory: [],
  sessionFiles: {},
  platformRequests: [
    { id: 'req_1', type: 'DoctorOnboarding', sender: 'Др. Елена Иванова', senderId: 'd_1', date: '17.03.2024', status: 'Pending' },
    { id: 'req_2', type: 'PartnerVerification', sender: 'Clinic "Health+"', senderId: 'p_1', date: '16.03.2024', status: 'Pending' }
  ],
  partners: [
    { id: 'p_1', name: 'Clinic "Health+"', bin: '123456789012', status: 'Pending', adminId: 'partner-user-id', commission: 15 },
    { id: 'p_2', name: 'City Hospital #1', bin: '987654321098', status: 'Active', adminId: 'another-partner-id', commission: 20 }
  ],
  pharmacyProducts: [
    { id: 'ph_1', name: 'Парацетамол', price: 500, category: 'Обезболивающие', img: '💊', stock: 150 },
    { id: 'ph_2', name: 'Витамин C', price: 1200, category: 'Витамины', img: '🍊', stock: 5 }
  ],
  reviews: [
    { id: 'rev_1', author: 'Алан Баймухан', rating: 5, text: 'Отличный врач, все объяснил доступно.', date: '15.03.2024' }
  ],
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
      title: 'Консилиум по записи #' + recordId.slice(-4),
      specialty: specialty,
      specialtyRequired: specialty,
      consensusScore: 0,
      status: 'Open',
      opinions: [],
      createdAt: new Date().toISOString().split('T')[0],
      participants: 1,
      messages: 0
    };
    db.swarmCases.push(newCase);
    db.records = db.records.map(r => r.id === recordId ? { ...r, swarmCaseId: newCase.id } : r);
    MockDB.save(db);
    return newCase;
  },
  getSwarmCase: (id: string) => MockDB.get().swarmCases.find(c => c.id === id),
  getSwarmCases: () => MockDB.get().swarmCases,
  getOpenSwarmCases: () => MockDB.get().swarmCases.filter(c => c.status === 'Open'),
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
  getAppointments: (userId?: string) => {
    const apps = MockDB.get().appointments;
    if (userId) return apps.filter(a => a.patientId === userId || a.doctorId === userId);
    return apps;
  },
  addAppointment: (app: Partial<Appointment>) => {
    const db = MockDB.get();
    const newApp = { ...app, id: 'app_' + Date.now(), status: app.status || 'upcoming' } as Appointment;
    db.appointments.push(newApp);
    MockDB.save(db);
    return newApp;
  },
  getRecords: () => MockDB.get().records,
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
  getDoctors: () => MockDB.get().doctors.filter(d => d.isApproved),
  getClinicDoctors: (clinicId: string) => MockDB.get().doctors.filter(d => d.clinicId === clinicId),
  getClinicByAdmin: (adminId: string) => MockDB.get().partners.find(p => p.adminId === adminId),
  updateClinic: (id: string, updates: Partial<PartnerClinic>) => {
    const db = MockDB.get();
    db.partners = db.partners.map(p => p.id === id ? { ...p, ...updates } : p);
    MockDB.save(db);
  },
  addDoctorToClinic: (doctorId: string, clinicId: string) => {
    const db = MockDB.get();
    db.doctors = db.doctors.map(d => d.id === doctorId ? { ...d, clinicId } : d);
    MockDB.save(db);
  },
  removeDoctorFromClinic: (doctorId: string) => {
    const db = MockDB.get();
    db.doctors = db.doctors.map(d => d.id === doctorId ? { ...d, clinicId: undefined } : d);
    MockDB.save(db);
  },
  getVerifiedDoctors: () => MockDB.get().doctors.filter(d => d.isApproved),
  getActiveMemberData: () => {
    const db = MockDB.get();
    return { 
      id: db.userProfile.id,
      name: db.userProfile.name
    };
  },
  getDoctorSchedule: (doctorId: string, date: string) => {
    const db = MockDB.get();
    const baseSlots = [
      { id: '1', time: '09:00', isBooked: false }, 
      { id: '2', time: '10:00', isBooked: false },
      { id: '3', time: '11:00', isBooked: false },
      { id: '4', time: '14:00', isBooked: false },
      { id: '5', time: '15:00', isBooked: false }
    ];
    
    // Check existing appointments to mark slots as booked
    const dayApps = db.appointments.filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled');
    return baseSlots.map(slot => ({
      ...slot,
      isBooked: dayApps.some(a => a.time === slot.time)
    }));
  },
  bookSlot: (doctorId: string, date: string, slotId: string, patientId: string, patientName: string) => {
    const db = MockDB.get();
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const slots = MockDB.getDoctorSchedule(doctorId, date);
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.isBooked) throw new Error('Slot already booked');

    // Check if patient is busy at this time
    const patientBusy = db.appointments.some(a => a.patientId === patientId && a.date === date && a.time === slot.time && a.status !== 'cancelled');
    if (patientBusy) throw new Error('You already have an appointment at this time');

    const newApp = { 
      id: 'app_' + Date.now(), 
      patientId,
      doctorId, 
      doctorName: doctor.name, 
      patientName, 
      date, 
      time: slot.time, 
      status: 'upcoming', 
      type: 'Video' 
    } as Appointment;
    
    db.appointments.push(newApp);
    MockDB.save(db);
    return newApp;
  },
  getChats: () => MockDB.get().chats,
  getDoctorStats: (doctorId?: string) => {
    const db = MockDB.get();
    if (doctorId) {
      const apps = db.appointments.filter(a => a.doctorId === doctorId && a.status === 'completed');
      return { 
        rating: 4.9, 
        sessions: apps.length, 
        patients: new Set(apps.map(a => a.patientId)).size, 
        revenue: apps.length * 15000 
      };
    }
    return { rating: 4.9, sessions: 42, patients: 28, revenue: 450000 };
  },
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
    
    // If approved, update doctor/partner status
    if (status === 'Approved') {
      const req = db.platformRequests.find(r => r.id === id);
      if (req) {
        const sid = req.senderId || req.sender;
        if (req.type === 'DoctorOnboarding') {
          db.doctors = db.doctors.map(d => d.id === sid ? { ...d, isApproved: true } : d);
        } else if (req.type === 'PartnerVerification') {
          db.partners = db.partners.map(p => p.id === sid ? { ...p, status: 'Active' } : p);
        }
      }
    }
    
    MockDB.save(db);
  },
  updateSystemConfig: (updates: Partial<SystemConfig>) => {
    const db = MockDB.get();
    db.config = { ...db.config, ...updates };
    MockDB.save(db);
  },
  getSystemConfig: () => MockDB.get().config,
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
  },
  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    const db = MockDB.get();
    db.appointments = db.appointments.map(app => 
      app.id === id ? { ...app, ...updates } : app
    );
    MockDB.save(db);
  },
  startAppointment: (id: string) => {
    const db = MockDB.get();
    db.appointments = db.appointments.map(app => 
      (app.id === id && app.status === 'upcoming') ? { ...app, status: 'ongoing' } : app
    );
    MockDB.save(db);
  },
  finishAppointment: (appId: string, reportId?: string) => {
    const db = MockDB.get();
    db.appointments = db.appointments.map(app => 
      app.id === appId ? { ...app, status: 'completed', completedAt: new Date().toISOString(), reportId } : app
    );
    MockDB.save(db);
  }
};
