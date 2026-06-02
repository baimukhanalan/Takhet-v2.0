import React, { Suspense, lazy, useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, Doctor } from '../types';
import { 
  Users, Activity, Database, CheckCircle2, 
  Settings, LogOut, Bell, Search, TrendingUp, 
  ArrowUpRight, Server, Globe, Cpu, BarChart3, 
  Lock, MessageSquare, AlertCircle, FileText, Info, 
  ClipboardList, Stethoscope, Building2, Pill, Star, Trash2, Check, X,
  ShieldAlert, ToggleLeft, ToggleRight, DollarSign, Percent, Zap, Sun, Moon,
  Send, Sparkles, Briefcase, FileSearch, Mail, Archive, ShoppingBag, Eye, Menu, 
  ShieldEllipsis, History, BarChartHorizontal, LineChart as LineChartIcon, Radar, Layers,
  UserCheck, ArrowRight
} from 'lucide-react';
import type { PlatformRequest, PharmacyProduct, PartnerClinic, PartnerContract, SystemConfig, AIChatMessage } from '../services/db';
import TakhetLogo from '../components/Logo';
import { roleApi } from '../../services/roleApi';
import { advancedChatStream } from '../services/gemini';
import { useLiveRefresh } from '../services/useLiveRefresh';

const AdminSystemLoadChart = lazy(() =>
  import('../components/charts/DashboardCharts').then((module) => ({ default: module.AdminSystemLoadChart }))
);
const AdminRevenueChart = lazy(() =>
  import('../components/charts/DashboardCharts').then((module) => ({ default: module.AdminRevenueChart }))
);
const AdminAudienceChart = lazy(() =>
  import('../components/charts/DashboardCharts').then((module) => ({ default: module.AdminAudienceChart }))
);

type AdminDoctorRow = {
  id: string;
  fullName: string;
  specialty: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  casesCount: number;
  reputationPoints: number;
  verified: boolean;
};

type AdminUserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

type AdminSystemHealth = {
  current: {
    time: string;
    cpu: number;
    ram: number;
    reqs: number;
  };
  history: {
    time: string;
    cpu: number;
    ram: number;
    reqs: number;
  }[];
  uptimeSeconds: number;
  activeRequestsPerMinute: number;
  status: 'stable' | 'attention';
};

const formatRequestType = (type: string) => (type === 'DoctorOnboarding' ? 'Врач' : 'Партнер');
const formatRequestStatus = (status: string) =>
  status === 'Approved' ? 'Верифицирован' : status === 'Rejected' ? 'Отклонен' : 'Новая';

const normalizeCatalogAudience = (value: string | null): 'doctor' | 'mental' | 'both' => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'mental' || normalized === 'душевный' || normalized === 'специалист') return 'mental';
  if (normalized === 'both' || normalized === 'оба' || normalized === 'везде') return 'both';
  return 'doctor';
};

const looksCorrupted = (value?: string) =>
  typeof value === 'string' &&
  (value.includes('Р') || value.includes('�') || value.includes('вЂ') || value.includes('???'));

const sanitizeAdminText = (value: string, fallback: string) => {
  const normalized = value?.trim() || '';
  if (!normalized || looksCorrupted(normalized)) return fallback;
  return normalized;
};

const normalizePartnerRows = (items: any[] = []): PartnerClinic[] =>
  items.map((item: any) => ({
    ...item,
    name: sanitizeAdminText(item.name, 'Партнер Takhet+')
  }));

const buildVerificationRequests = (apiDoctors: any[] = [], partnerRows: PartnerClinic[] = []): PlatformRequest[] => {
  const doctorRequests = apiDoctors
    .filter((doctor) => !(doctor.verified ?? doctor.active))
    .map((doctor) => ({
      id: doctor.id,
      type: 'DoctorOnboarding' as const,
      status: 'Pending' as const,
      sender: doctor.fullName || 'Новый врач',
      senderId: doctor.id,
      date: new Date(doctor.createdAt || Date.now()).toLocaleDateString('ru-RU')
    }));

  const partnerRequests = partnerRows
    .filter((partner) => partner.status === 'Pending')
    .map((partner) => ({
      id: partner.id,
      type: 'PartnerVerification' as const,
      status: 'Pending' as const,
      sender: partner.name || 'Новый партнер',
      senderId: partner.id,
      date: new Date().toLocaleDateString('ru-RU')
    }));

  return [...doctorRequests, ...partnerRequests];
};

type AdminTab = 'overview' | 'requests' | 'doctors' | 'partners' | 'contracts' | 'qa' | 'reviews' | 'medicines' | 'analytics' | 'settings' | 'assistant';

const NAV_ITEMS: { id: AdminTab, icon: any, label: string }[] = [
  { id: 'overview', icon: BarChart3, label: 'Дашборд' },
  { id: 'assistant', icon: Sparkles, label: 'Ассистент' },
  { id: 'requests', icon: ClipboardList, label: 'Заявки' },
  { id: 'doctors', icon: Stethoscope, label: 'Врачи' },
  { id: 'partners', icon: Building2, label: 'Партнеры' },
  { id: 'contracts', icon: FileText, label: 'Договоры' },
  { id: 'qa', icon: MessageSquare, label: 'Вопросы' },
  { id: 'reviews', icon: Star, label: 'Отзывы' },
  { id: 'medicines', icon: Pill, label: 'Аптека' },
  { id: 'analytics', icon: TrendingUp, label: 'Аналитика' },
  { id: 'settings', icon: Settings, label: 'Настройки' },
];

const SidebarContent: React.FC<{
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
  isDark: boolean;
}> = ({ activeTab, setActiveTab, setIsMobileMenuOpen, onLogout, isDark }) => (
  <div className="flex flex-col items-center h-full w-full py-10 relative">
     <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-10 shrink-0">
        <TakhetLogo className="w-10 h-10" />
     </Link>
     
     <nav className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar w-full items-center px-4 md:px-2 py-4">
        {NAV_ITEMS.map(item => (
          <button 
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center lg:justify-center gap-4 p-4 lg:p-5 rounded-2xl transition-all relative group shrink-0 ${activeTab === item.id ? (isDark ? 'bg-white/10 text-white shadow-xl' : 'bg-primary text-white shadow-lg') : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
          >
            <item.icon className="w-6 h-6 shrink-0" />
            <span className="lg:hidden font-black text-xs uppercase tracking-widest">{item.label}</span>
            <span className={`hidden lg:block absolute left-full ml-4 px-3 py-1 ${isDark ? 'bg-slate-800' : 'bg-slate-900'} text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[1000]`}>
               {item.label}
            </span>
          </button>
        ))}
     </nav>
     
     <button onClick={onLogout} className="w-full flex items-center lg:justify-center gap-4 p-5 rounded-2xl text-red-500/50 hover:text-red-500 transition-colors shrink-0 mt-4 px-8 lg:px-5">
        <LogOut className="w-6 h-6" />
        <span className="lg:hidden font-black text-xs uppercase tracking-widest">Выйти</span>
     </button>
  </div>
);

const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [requests, setRequests] = useState<PlatformRequest[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [partners, setPartners] = useState<PartnerClinic[]>([]);
  const [contracts, setContracts] = useState<PartnerContract[]>([]);
  const [medicines, setMedicines] = useState<PharmacyProduct[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealth | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfig>({
    theme: 'light',
    maintenanceMode: false,
    serviceFeePercent: 15,
    aiModel: 'Gemini 2.0 Flash',
    supportEmail: 'support@takhet.com'
  });
  
  // Assistant States
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, apiDoctors, apiUsers, portalState, health] = await Promise.all([
          roleApi.adminDashboard(),
          roleApi.adminDoctors(),
          roleApi.adminUsers(),
          roleApi.adminPortalState(),
          roleApi.adminSystemHealth()
        ]);

        const partnerRows = normalizePartnerRows(portalState.partners || []);
        setPartners(partnerRows);
        setContracts(
          (portalState.contracts || []).map((item: any) => ({
            ...item,
            partnerName: sanitizeAdminText(item.partnerName, 'Партнер Takhet+'),
            contractNumber: sanitizeAdminText(item.contractNumber, 'Договор')
          }))
        );
        setMedicines(
          (portalState.medicines || []).map((item: any) => ({
          ...item,
          name: sanitizeAdminText(item.name, 'Препарат'),
          category: sanitizeAdminText(item.category, 'Каталог'),
          img: looksCorrupted(item.img) ? '💊' : item.img
        }))
        );
        setReviews(
          (portalState.reviews || []).map((item: any) => ({
          ...item,
          author: sanitizeAdminText(item.author, 'Пациент'),
          text: sanitizeAdminText(item.text, 'Комментарий временно недоступен.')
        }))
        );
        setComplaints(
          (portalState.complaints || []).map((item: any) => ({
          ...item,
          author: sanitizeAdminText(item.author, 'Анонимно'),
          title: sanitizeAdminText(item.title, 'Вопрос пациента'),
          category: sanitizeAdminText(item.category, 'Общее'),
          replies: (item.replies || []).map((reply: any) => ({
            ...reply,
            author: sanitizeAdminText(reply.author, 'Врач Takhet+'),
            text: sanitizeAdminText(reply.text, 'Ответ врача временно недоступен.')
          }))
        }))
        );
        setRevenueHistory(portalState.revenueHistory || []);
        setSysConfig(portalState.config || sysConfig);
        setAiMessages(portalState.aiChatHistory || []);
        setSystemHealth(health);

        setAdminStats(dashboard);
        setDoctors(
          apiDoctors.map((doctor) => ({
            id: doctor.id,
            fullName: doctor.fullName || 'Специалист Takhet+',
            specialty: doctor.specialty || doctor.specialization || 'Общая практика',
            experienceYears: doctor.experienceYears || 0,
            rating: doctor.rating || 0,
            reviewsCount: doctor.reviewsCount || 0,
            casesCount: doctor.casesCount || 0,
            reputationPoints: doctor.reputationPoints || 0,
            verified: Boolean(doctor.verified ?? doctor.active)
          }))
        );
        setAdminUsers(
          apiUsers.map((entry) => ({
            id: entry.id,
            email: String(entry.email || ''),
            role: String(entry.role || ''),
            createdAt: entry.createdAt || new Date().toISOString()
          }))
        );
        setRequests(buildVerificationRequests(apiDoctors, partnerRows));
        setAdminError(null);
      } catch (error) {
        setAdminError(error instanceof Error ? error.message : 'Не удалось загрузить данные админ-портала');
      }
    };
    void load();
  }, []);

  useLiveRefresh(
    async () => {
      if (activeTab === 'assistant' || activeTab === 'settings' || activeTab === 'medicines' || activeTab === 'reviews' || activeTab === 'qa') {
        return;
      }

      await refreshAdminData();
      const [portalState, health] = await Promise.all([
        roleApi.adminPortalState(),
        roleApi.adminSystemHealth()
      ]);
      const partnerRows = normalizePartnerRows(portalState.partners || []);
      setPartners(partnerRows);
      setRequests((current) => [
        ...current.filter((request) => request.type === 'DoctorOnboarding'),
        ...buildVerificationRequests([], partnerRows)
      ]);
      setContracts(
        (portalState.contracts || []).map((item: any) => ({
          ...item,
          partnerName: sanitizeAdminText(item.partnerName, 'Партнер Takhet+'),
          contractNumber: sanitizeAdminText(item.contractNumber, 'Договор')
        }))
      );
      setMedicines(
        (portalState.medicines || []).map((item: any) => ({
          ...item,
          name: sanitizeAdminText(item.name, 'Препарат'),
          category: sanitizeAdminText(item.category, 'Каталог'),
          img: looksCorrupted(item.img) ? '💊' : item.img
        }))
      );
      setReviews(
        (portalState.reviews || []).map((item: any) => ({
          ...item,
          author: sanitizeAdminText(item.author, 'Пациент'),
          text: sanitizeAdminText(item.text, 'Комментарий временно недоступен.')
        }))
      );
      setComplaints(
        (portalState.complaints || []).map((item: any) => ({
          ...item,
          author: sanitizeAdminText(item.author, 'Анонимно'),
          title: sanitizeAdminText(item.title, 'Вопрос пациента'),
          category: sanitizeAdminText(item.category, 'Общее'),
          replies: (item.replies || []).map((reply: any) => ({
            ...reply,
            author: sanitizeAdminText(reply.author, 'Врач Takhet+'),
            text: sanitizeAdminText(reply.text, 'Ответ врача временно недоступен.')
          }))
        }))
      );
      setRevenueHistory(portalState.revenueHistory || []);
      setSystemHealth(health);
    },
    { intervalMs: 20000 }
  );

  useEffect(() => {
    aiScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const isDark = sysConfig?.theme === 'dark';

  const styles = {
    bg: isDark ? 'bg-slate-950' : 'bg-white',
    mainBg: isDark ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl',
    card: isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm',
    header: isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white/80 border-slate-200',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-500' : 'text-slate-400',
    border: isDark ? 'border-white/5' : 'border-slate-100',
    input: isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900',
    aiBubble: isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800',
    aiUser: 'bg-primary text-white'
  };

  const formatUserEmail = (email: string) => email.replace(/\+(admin|doctor|partner|patient)(?=@)/i, '');

  const formatUserRole = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized === 'admin') return 'Администратор';
    if (normalized === 'doctor') return 'Врач';
    if (normalized === 'partner') return 'Партнер';
    if (normalized === 'patient') return 'Пациент';
    return role;
  };

  const formatKztCompact = (amount: number) => {
    if (!amount) return '₸0';
    return `₸${new Intl.NumberFormat('ru-RU', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)}`;
  };

  const overviewStats = [
    {
      label: 'Пользователи',
      val: String(adminStats?.usersTotal ?? adminUsers.length ?? 0),
      change: `${adminStats?.doctors?.active ?? doctors.filter((doc) => doc.verified).length} активных врачей`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Открытые кейсы',
      val: String(adminStats?.cases?.open ?? 0),
      change: `${adminStats?.cases?.total ?? 0} всего`,
      icon: Activity,
      color: 'text-green-500'
    },
    {
      label: 'Платежи',
      val: formatKztCompact(adminStats?.payments?.paidAmount ?? 0),
      change: `${adminStats?.payments?.pending ?? 0} ожидают`,
      icon: TrendingUp,
      color: 'text-amber-500'
    },
    {
      label: 'Стабильность системы',
      val: systemHealth?.status === 'attention' ? 'внимание' : 'стабильно',
      change: adminError ? 'требует внимания' : `uptime ${Math.floor((systemHealth?.uptimeSeconds || 0) / 3600)}ч`,
      icon: CheckCircle2,
      color: 'text-emerald-500'
    }
  ];


  const analyticsSeries = useMemo(
    () =>
      revenueHistory.map((entry, index) => ({
        ...entry,
        users:
          typeof entry.users === 'number'
            ? entry.users
            : Math.max(1, Math.round((adminStats?.usersTotal || adminUsers.length || 0) / Math.max(revenueHistory.length - index, 1)))
      })),
    [revenueHistory, adminStats, adminUsers.length]
  );

  const getDoctorCasesCount = (doctor: AdminDoctorRow) => doctor.casesCount || 0;

  const getDoctorReputationPoints = (doctor: AdminDoctorRow) => doctor.reputationPoints || 0;
  const refreshAdminData = async () => {
    const [dashboard, apiDoctors, apiUsers, portalState, health] = await Promise.all([
      roleApi.adminDashboard(),
      roleApi.adminDoctors(),
      roleApi.adminUsers(),
      roleApi.adminPortalState(),
      roleApi.adminSystemHealth()
    ]);
    const partnerRows = normalizePartnerRows(portalState.partners || []);

    setAdminStats(dashboard);
    setPartners(partnerRows);
    setDoctors(
      apiDoctors.map((doctor) => ({
        id: doctor.id,
        fullName: doctor.fullName || 'Специалист Takhet+',
        specialty: doctor.specialty || doctor.specialization || 'Общая практика',
        experienceYears: doctor.experienceYears || 0,
        rating: doctor.rating || 0,
        reviewsCount: doctor.reviewsCount || 0,
        casesCount: doctor.casesCount || 0,
        reputationPoints: doctor.reputationPoints || 0,
        verified: Boolean(doctor.verified ?? doctor.active)
      }))
    );
    setAdminUsers(
      apiUsers.map((entry) => ({
        id: entry.id,
        email: String(entry.email || ''),
        role: String(entry.role || ''),
        createdAt: entry.createdAt || new Date().toISOString()
      }))
    );
    setRequests(buildVerificationRequests(apiDoctors, partnerRows));
    setSystemHealth(health);
  };

  const handleSendAi = async () => {
    if (!aiInput.trim()) return;
    const userText = aiInput.trim();
    const newMsg: AIChatMessage = { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString() };
    setAiMessages((current) => [...current, newMsg]);
    await roleApi.adminAssistantMessage(newMsg);
    setAiInput('');
    setIsAiTyping(true);
    const aiMsg: AIChatMessage = {
      role: 'model',
      text: 'AI секретарь отвечает...',
      timestamp: new Date().toLocaleTimeString()
    };
    setAiMessages((current) => [...current, aiMsg]);

    try {
      const responseText = await advancedChatStream(userText, {
        systemInstruction: `You are the Executive Personal Secretary for Alan, Master Admin of Takhet+.
Provide strategic summaries, financial audits, and security alerts.
Use bold headings and concise bullet points.
Always mention that detailed logs are available at baimukhanalan1@gmail.com.`,
        useSearch: false,
        onDelta: (_delta, fullText) => {
          setAiMessages((current) =>
            current.map((message) => (message === aiMsg ? { ...message, text: fullText } : message))
          );
        }
      });
      const finalAiMsg: AIChatMessage = {
        ...aiMsg,
        text: responseText || 'Ошибка связи с AI-ядром.',
      };
      setAiMessages((current) => current.map((message) => (message === aiMsg ? finalAiMsg : message)));
      await roleApi.adminAssistantMessage(finalAiMsg);
    } catch (e) {
      console.error(e);
      setAiMessages((current) =>
        current.map((message) => (message === aiMsg ? { ...message, text: 'Ошибка связи с AI-ядром.' } : message))
      );
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleRequestAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const request = requests.find((item) => item.id === id);
      if (request?.type === 'PartnerVerification') {
        if (status === 'Approved') {
          await roleApi.adminTogglePartner(id);
        } else {
          await roleApi.adminDeletePartner(id);
        }
      } else if (status === 'Approved') {
        await roleApi.adminApproveDoctor(id);
      } else {
        await roleApi.adminDeactivateDoctor(id);
      }
      await refreshAdminData();
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось обновить статус заявки');
    }
  };

  const handleConfigToggle = (key: keyof SystemConfig) => {
    if (!sysConfig) return;
    const next = { ...sysConfig, [key]: !sysConfig[key] };
    setSysConfig(next);
    void roleApi.adminUpdatePortalConfig({ [key]: !sysConfig[key] });
  };

  const handleThemeSwitch = (theme: 'dark' | 'light') => {
    setSysConfig((current) => (current ? { ...current, theme } : current));
    void roleApi.adminUpdatePortalConfig({ theme });
  };

  const handleServiceFeeChange = (value: string) => {
    const serviceFeePercent = Math.max(0, Math.min(100, Number(value) || 0));
    setSysConfig((current) => (current ? { ...current, serviceFeePercent } : current));
    void roleApi.adminUpdatePortalConfig({ serviceFeePercent });
  };

  const handleAddMedicine = async () => {
    await roleApi.adminAddMedicine();
    const portalState = await roleApi.adminPortalState();
    setMedicines(portalState.medicines || []);
  };

  const handleAddDoctorDraft = async () => {
    try {
      const nextIndex = doctors.length + 1;
      const fullName = window.prompt('ФИО врача', `Новый врач ${nextIndex}`);
      if (fullName === null) return;
      const specialty = window.prompt('Специализация', 'Общая практика');
      if (specialty === null) return;
      const catalogAudience = normalizeCatalogAudience(
        window.prompt('Каталог: doctor = врачи, mental = Mental, both = оба', 'doctor')
      );
      const temporaryLogin = window.prompt('Временный логин врача (оставьте пустым для автогенерации)', '');
      const created = await roleApi.adminCreateDoctor(
        fullName.trim() || `Новый врач ${nextIndex}`,
        specialty.trim() || 'Общая практика',
        {
          catalogAudience,
          temporaryLogin: temporaryLogin?.trim() || undefined
        }
      );
      await refreshAdminData();
      if (created?.temporaryLogin && created?.temporaryPassword) {
        window.alert(`Врач добавлен.\nВременный логин: ${created.temporaryLogin}\nВременный пароль: ${created.temporaryPassword}`);
      }
      setAdminError(null);
      return;
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось создать карточку врача');
      return;
    }
  };

  const handleAddPartnerDraft = async () => {
    try {
      await roleApi.adminAddPartner();
      const portalState = await roleApi.adminPortalState();
      const partnerRows = normalizePartnerRows(portalState.partners || []);
      setPartners(partnerRows);
      setRequests((current) => [
        ...current.filter((request) => request.type === 'DoctorOnboarding'),
        ...buildVerificationRequests([], partnerRows)
      ]);
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось добавить партнера');
    }
  };

  const handleAddContract = async () => {
    try {
      await roleApi.adminAddContract();
      const portalState = await roleApi.adminPortalState();
      setContracts(portalState.contracts || []);
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось добавить договор');
    }
  };

  const handleRequestDocuments = (request: PlatformRequest) => {
    setActiveTab(request.type === 'DoctorOnboarding' ? 'doctors' : 'partners');
  };

  const handleRequestContact = (request: PlatformRequest) => {
    window.location.href = `mailto:${sysConfig?.supportEmail || 'support@takhet.com'}?subject=${encodeURIComponent(`Takhet request ${request.id}`)}&body=${encodeURIComponent(`Заявка: ${request.sender}\nТип: ${request.type}\nСтатус: ${request.status}`)}`;
  };

  const handleDoctorSettings = async (doctor: AdminDoctorRow) => {
    try {
      await roleApi.adminApproveDoctor(doctor.id);
      await refreshAdminData();
      setAdminError(null);
      return;
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось активировать врача');
      return;
    }
  };

  const handleDoctorArchive = async (doctor: AdminDoctorRow) => {
    try {
      await roleApi.adminDeactivateDoctor(doctor.id);
      await refreshAdminData();
      setAdminError(null);
      return;
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось изменить статус врача');
      return;
    }
  };

  const handleDoctorDelete = async (doctor: AdminDoctorRow) => {
    try {
      await roleApi.adminDeleteDoctor(doctor.id);
      await refreshAdminData();
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось удалить врача');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await roleApi.adminDeleteUser(userId);
      await refreshAdminData();
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Не удалось отключить пользователя');
    }
  };

  const handleClearAssistantHistory = async () => {
    await roleApi.adminClearAssistantHistory();
    setAiMessages([]);
  };

  const handleDeleteReview = async (reviewId: string) => {
    await roleApi.adminDeleteReview(reviewId);
    setReviews((current) => current.filter((item) => item.id !== reviewId));
  };

  const reloadPortalState = async () => {
    const portalState = await roleApi.adminPortalState();
    const partnerRows = normalizePartnerRows(portalState.partners || []);
    setPartners(partnerRows);
    setRequests((current) => [
      ...current.filter((request) => request.type === 'DoctorOnboarding'),
      ...buildVerificationRequests([], partnerRows)
    ]);
    setContracts(portalState.contracts || []);
    setMedicines(portalState.medicines || []);
    setReviews(portalState.reviews || []);
    setComplaints(portalState.complaints || []);
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    await roleApi.adminDeleteComplaint(complaintId);
    setComplaints((current) => current.filter((item) => item.id !== complaintId));
  };

  const handlePartnerManage = async (partnerId: string) => {
    await roleApi.adminTogglePartner(partnerId);
    await reloadPortalState();
  };

  const handleContractManage = async (contractId: string) => {
    await roleApi.adminToggleContract(contractId);
    await reloadPortalState();
  };

  const handleMedicineEdit = async (medicine: PharmacyProduct) => {
    const name = window.prompt('Название препарата', medicine.name);
    if (name === null) return;
    const price = window.prompt('Цена в тенге', String(medicine.price));
    if (price === null) return;
    const stock = window.prompt('Количество на складе', String(medicine.stock));
    if (stock === null) return;
    await roleApi.adminUpdateMedicine(medicine.id, {
      name,
      price: Number(price),
      stock: Number(stock),
      category: medicine.category,
      img: medicine.img
    });
    await reloadPortalState();
  };

  const handleMedicineDelete = async (medicineId: string) => {
    await roleApi.adminDeleteMedicine(medicineId);
    await reloadPortalState();
  };

  const handlePartnerEdit = async (partner: PartnerClinic) => {
    const name = window.prompt('Название партнера', partner.name);
    if (name === null) return;
    const bin = window.prompt('БИН', partner.bin);
    if (bin === null) return;
    const commission = window.prompt('Комиссия (%)', String(partner.commission));
    if (commission === null) return;
    await roleApi.adminUpdatePartner(partner.id, {
      name,
      bin,
      commission: Number(commission)
    });
    await reloadPortalState();
  };

  const handlePartnerDelete = async (partnerId: string) => {
    await roleApi.adminDeletePartner(partnerId);
    await reloadPortalState();
  };

  const handleContractEdit = async (contract: PartnerContract) => {
    const contractNumber = window.prompt('Номер договора', contract.contractNumber);
    if (contractNumber === null) return;
    const partnerName = window.prompt('Партнер', contract.partnerName);
    if (partnerName === null) return;
    const expiresAt = window.prompt('Действует до', contract.expiresAt);
    if (expiresAt === null) return;
    const commission = window.prompt('Комиссия (%)', String(contract.commission));
    if (commission === null) return;
    await roleApi.adminUpdateContract(contract.id, {
      contractNumber,
      partnerName,
      expiresAt,
      commission: Number(commission)
    });
    await reloadPortalState();
  };

  const handleContractDelete = async (contractId: string) => {
    await roleApi.adminDeleteContract(contractId);
    await reloadPortalState();
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
               {overviewStats.map((s, i) => (
                 <div key={i} className={`${styles.card} p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border hover:border-primary/20 transition-all group`}>
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                       <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-primary/10 ${s.color} group-hover:scale-110 transition-transform`}>
                          <s.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                       </div>
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full ${s.label === 'Стабильность системы' && adminError ? 'text-red-500 bg-red-500/10' : 'text-emerald-400 bg-emerald-400/10'}`}>{s.change}</span>
                    </div>
                    <p className={`${styles.textSub} text-[10px] font-black uppercase tracking-widest`}>{s.label}</p>
                    <p className={`text-2xl lg:text-4xl font-black ${styles.textMain} mt-2`}>{s.val}</p>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
               <div className={`lg:col-span-8 ${styles.card} p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-10 overflow-hidden`}>
                  <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight`}>Нагрузка системы</h3>
                  <div className="h-60 lg:h-80 w-full">
                     <Suspense fallback={null}>
                       <AdminSystemLoadChart data={systemHealth?.history || []} isDark={isDark} />
                     </Suspense>
                  </div>
               </div>

               <div className={`lg:col-span-4 ${styles.card} p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-8`}>
                  <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight`}>Быстрый контроль</h3>
                  <div className="space-y-4">
                     {sysConfig && [
                       { label: 'Режим обслуживания', key: 'maintenanceMode' as const, icon: ShieldAlert, danger: true },
                       { label: 'Анализ AI-ядра', key: 'aiDiagnosticEnabled' as const, icon: Zap, danger: false }
                     ].map(item => (
                        <div key={item.key} className={`p-4 lg:p-6 bg-slate-400/5 rounded-2xl lg:rounded-3xl flex items-center justify-between`}>
                           <div className="flex items-center gap-4">
                              <item.icon className={`w-5 h-5 ${item.danger && sysConfig[item.key] ? 'text-red-500' : 'text-primary'}`} />
                              <span className={`text-xs lg:text-sm font-black ${styles.textMain}`}>{item.label}</span>
                           </div>
                           <button onClick={() => handleConfigToggle(item.key)}>
                              {sysConfig[item.key] ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        );
      case 'assistant':
        return (
          <div className="flex flex-col gap-4 lg:gap-8 animate-in fade-in duration-500 pb-20 -mx-4 lg:mx-0">
             {/* Massive AI Chat Window - Full Width & Extended Height */}
             <div className={`${styles.card} lg:rounded-[3.5rem] flex flex-col overflow-hidden border-x-0 lg:border-x min-h-[600px] lg:min-h-[900px] shadow-2xl relative`}>
                <div className={`flex-1 overflow-y-auto p-4 lg:p-16 space-y-8 lg:space-y-12 no-scrollbar ${isDark ? 'bg-slate-900/60' : 'bg-white'}`}>
                   {aiMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 py-40">
                         <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary rounded-[2rem] flex items-center justify-center text-white mb-6">
                            <Sparkles className="w-12 h-12 lg:w-16 lg:h-16" />
                         </div>
                         <p className="text-xl lg:text-3xl font-black uppercase tracking-[0.3em]">Центр AI-ассистента</p>
                         <p className="text-xs lg:text-sm font-bold uppercase tracking-widest">Готов к приему команд управления</p>
                      </div>
                   )}
                   {aiMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                         <div className={`max-w-[95%] lg:max-w-[85%] p-5 lg:p-12 rounded-[2rem] lg:rounded-[4rem] shadow-xl text-sm lg:text-xl font-medium leading-relaxed ${m.role === 'user' ? styles.aiUser + ' rounded-tr-none' : styles.aiBubble + ' rounded-tl-none border ' + styles.border}`}>
                            <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none prose-lg lg:prose-xl`}>
                               {m.text.split('\n').map((line, idx) => <p key={idx} className="mb-4">{line}</p>)}
                            </div>
                            <div className="mt-8 flex items-center justify-between opacity-30 border-t border-current/10 pt-4">
                               <span className="text-[9px] font-black uppercase tracking-widest">{m.timestamp}</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Проверенный стратегический ответ</span>
                            </div>
                         </div>
                      </div>
                   ))}
                   {isAiTyping && (
                      <div className="flex gap-4 p-8 animate-pulse items-center">
                         <div className="w-3 h-3 bg-primary rounded-full"></div>
                         <div className="w-3 h-3 bg-primary rounded-full delay-75"></div>
                         <div className="w-3 h-3 bg-primary rounded-full delay-150"></div>
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">Генерация аналитики...</span>
                      </div>
                   )}
                   <div ref={aiScrollRef} />
                </div>
                <div className={`p-4 lg:p-12 border-t shrink-0 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                   <div className={`flex items-center gap-2 lg:gap-6 ${styles.input} border ${styles.border} rounded-[2.5rem] lg:rounded-[6rem] p-1.5 lg:p-4 pl-8 lg:pl-16 focus-within:ring-[12px] focus-within:ring-primary/5 transition-all shadow-inner`}>
                      <input 
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendAi()}
                        placeholder="Запросите аудит, отчет или прогноз..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-base lg:text-2xl placeholder:opacity-30 min-w-0" 
                      />
                      <div className="flex items-center gap-1 lg:gap-3">
                        <button 
                          onClick={() => void handleClearAssistantHistory()}
                          className="w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                          title="Очистить историю"
                        >
                           <Trash2 className="w-5 h-5 lg:w-7 lg:h-7" />
                        </button>
                        <button 
                          onClick={handleSendAi}
                          disabled={!aiInput.trim() || isAiTyping}
                          className="w-12 h-12 lg:w-24 lg:h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                           <Send className="w-5 h-5 lg:w-10 lg:h-10" />
                        </button>
                      </div>
                   </div>
                </div>
             </div>

             {/* Management Reports Section Below the Chat */}
             <div className="space-y-8 lg:space-y-12 mt-10 lg:mt-16 px-4 lg:px-0">
                <div className="flex items-center gap-6">
                   <div className="w-10 h-10 lg:w-14 lg:h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg"><Briefcase className="text-white w-5 h-5 lg:w-7 lg:h-7" /></div>
                   <h4 className={`text-xl lg:text-5xl font-black ${styles.textMain} uppercase tracking-tighter`}>Директивы управления</h4>
                   <div className="flex-1 h-px bg-slate-400/20"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-10">
                   {[
                     { label: 'Финансовый аудит', icon: DollarSign, color: 'text-emerald-500', desc: 'Маржинальность и P&L', prompt: 'Проведи финансовый аудит за текущий месяц' },
                     { label: 'Эффективность врачей', icon: Stethoscope, color: 'text-blue-500', desc: 'Конверсия в повторный прием', prompt: 'Дай отчет по эффективности врачей' },
                     { label: 'Аудит безопасности', icon: ShieldEllipsis, color: 'text-red-500', desc: 'Аномалии доступа и логи', prompt: 'Покажи отчет по инцидентам безопасности' },
                     { label: 'Телеметрия API', icon: Cpu, color: 'text-amber-500', desc: 'Нагрузка и задержки серверов', prompt: 'Проанализируй телеметрию системы' },
                     { label: 'Retention анализ', icon: History, color: 'text-purple-500', desc: 'Удержание пациентов и LTV', prompt: 'Покажи статистику удержания пациентов' },
                     { label: 'Прогноз выручки', icon: BarChartHorizontal, color: 'text-emerald-400', desc: 'AI-прогнозирование роста', prompt: 'Сделай прогноз выручки на следующий квартал' },
                     { label: 'Точность AI-диагностики', icon: Zap, color: 'text-orange-500', desc: 'Подтверждаемость анализов', prompt: 'Каков процент точности AI за неделю?' },
                     { label: 'География запросов', icon: Globe, color: 'text-cyan-500', desc: 'Тепловая карта обращений', prompt: 'Покажи географическое распределение вызовов' },
                     { label: 'Анализ онбординга', icon: UserCheck, color: 'text-indigo-500', desc: 'Скорость проверки дипломов', prompt: 'Дай отчет по скорости онбординга новых врачей' },
                     { label: 'Маркетинговый ROI', icon: LineChartIcon, color: 'text-rose-500', desc: 'Стоимость привлечения CAC', prompt: 'Рассчитай ROI маркетинговых кампаний' },
                     { label: 'Compliance статус', icon: CheckCircle2, color: 'text-teal-500', desc: 'Соответствие закону о ПД', prompt: 'Проверь статус комплаенса данных' },
                     { label: 'Целостность БД', icon: Database, color: 'text-slate-500', desc: 'Здоровье репликаций и индексов', prompt: 'Проведи диагностику базы данных' }
                   ].map((btn, i) => (
                     <button 
                       key={i}
                       onClick={() => setAiInput(btn.prompt)}
                       className={`${styles.card} p-6 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border ${styles.border} text-left group hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden`}
                     >
                        <div className={`absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 ${btn.color} opacity-[0.03] -mr-6 -mt-6 lg:-mr-10 lg:-mt-10 group-hover:scale-150 transition-transform duration-700`}>
                           <btn.icon className="w-full h-full" />
                        </div>
                        <div className="flex items-center gap-4 lg:gap-5 mb-4 lg:mb-6">
                           <div className="w-10 h-10 lg:w-20 lg:h-20 bg-slate-500/5 rounded-xl lg:rounded-[2rem] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                              <btn.icon className="w-5 h-5 lg:w-10 lg:h-10" />
                           </div>
                           <span className={`font-black text-base lg:text-2xl ${styles.textMain} leading-tight`}>{btn.label}</span>
                        </div>
                        <p className="text-xs lg:text-base text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-6 lg:mb-8">{btn.desc}</p>
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] lg:text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                           Запустить анализ <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5" />
                        </div>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Отзывы</h2>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-400/5 border-b border-white/5">
                        <tr>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Автор</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Оценка</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Комментарий</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Дата</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Действия</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                        {reviews.map(rev => (
                          <tr key={rev.id} className="hover:bg-primary/5 transition-colors">
                            <td className={`p-6 font-bold ${styles.textMain}`}>{rev.author}</td>
                            <td className="p-6">
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="font-black text-xs">{rev.rating}</span>
                                </div>
                            </td>
                            <td className={`p-6 text-sm ${styles.textSub} max-w-xs break-words`}>{rev.text}</td>
                            <td className={`p-6 text-xs ${styles.textSub}`}>{rev.date}</td>
                            <td className="p-6">
                                <button onClick={() => void handleDeleteReview(rev.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4"/></button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      case 'medicines':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Аптека</h2>
               <button onClick={handleAddMedicine} className="px-4 lg:px-8 py-2 lg:py-4 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Добавить</button>
             </div>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-400/5 border-b border-white/5">
                        <tr>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Товар</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Цена</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Склад</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Статус</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Действия</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                        {medicines.map(med => (
                          <tr key={med.id} className="hover:bg-primary/5 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{med.img}</span>
                                  <span className={`font-bold ${styles.textMain}`}>{med.name}</span>
                                </div>
                            </td>
                            <td className={`p-6 font-black ${styles.textMain}`}>{med.price} ₸</td>
                            <td className={`p-6 font-bold ${styles.textSub}`}>{med.stock} шт</td>
                            <td className="p-6">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${med.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {med.stock > 10 ? 'В наличии' : 'Мало'}
                                </span>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => void handleMedicineEdit(med)} className={`p-2 rounded-xl ${styles.card} border ${styles.border} ${styles.textSub} hover:text-primary hover:border-primary/50 transition-all shadow-sm`}>
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => void handleMedicineDelete(med.id)} className={`p-2 rounded-xl ${styles.card} border ${styles.border} ${styles.textSub} hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm`}>
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      case 'qa':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Вопросы</h2>
             <div className="grid gap-4">
                {complaints.map(comp => (
                  <div key={comp.id} className={`${styles.card} p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-4 hover:border-primary/20 transition-all`}>
                     <div className="flex items-center gap-4 lg:gap-6 flex-1 w-full">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                           <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                           <p className={`${styles.textMain} font-black text-base lg:text-lg break-words`}>{comp.title}</p>
                           <p className={`${styles.textSub} text-[9px] font-bold uppercase tracking-widest`}>{comp.author} • {comp.category}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 lg:gap-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
                        <div className="text-right">
                           <p className={`text-[9px] font-black uppercase ${styles.textSub}`}>Ответы</p>
                           <p className={`text-lg lg:text-xl font-black ${styles.textMain}`}>{comp.replies?.length || 0}</p>
                        </div>
                        <button onClick={() => void handleDeleteComplaint(comp.id)} className="p-3 lg:p-4 bg-red-500/10 text-red-500 rounded-xl lg:rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'requests':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="flex items-center justify-between">
                 <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Заявки на верификацию</h2>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      {requests.filter(r => r.status === 'Pending').length} новых
                   </span>
                </div>
             </div>
             <div className="grid gap-4">
                {requests.map(req => (
                  <div key={req.id} className={`${styles.card} p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-primary/5 transition-all group`}>
                     <div className="flex items-center gap-4 lg:gap-6 w-full">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                           {req.type === 'DoctorOnboarding' ? <Stethoscope className="w-6 h-6 lg:w-8 lg:h-8" /> : <Building2 className="w-6 h-6 lg:w-8 lg:h-8" />}
                        </div>
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-3">
                              <p className={`${styles.textMain} font-black text-base lg:text-xl break-words`}>{req.sender}</p>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${req.type === 'DoctorOnboarding' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                  {formatRequestType(req.type)}
                                </span>
                           </div>
                           <p className={`${styles.textSub} text-[10px] font-bold uppercase tracking-widest mt-1`}>Подано: {req.date}</p>
                           <div className="mt-3 flex gap-2">
                              <button onClick={() => handleRequestDocuments(req)} className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"><FileSearch className="w-3 h-3" /> Проверить документы</button>
                              <button onClick={() => handleRequestContact(req)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:underline"><Mail className="w-3 h-3" /> Связаться</button>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        {req.status === 'Pending' ? (
                          <>
                             <button onClick={() => handleRequestAction(req.id, 'Approved')} className="flex-1 md:flex-none px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                 <Check className="w-4 h-4" /> Одобрить
                             </button>
                             <button onClick={() => handleRequestAction(req.id, 'Rejected')} className="flex-1 md:flex-none px-8 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                 <X className="w-4 h-4" /> Отклонить
                             </button>
                          </>
                        ) : (
                          <div className={`w-full md:w-40 px-4 py-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {req.status === 'Approved' ? <UserCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                              {formatRequestStatus(req.status)}
                            </div>
                          )}
                     </div>
                  </div>
                ))}
             </div>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                   <h3 className={`text-lg font-black ${styles.textMain} uppercase tracking-tight`}>Пользователи платформы</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${styles.textSub}`}>{adminUsers.length} записей</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[760px]">
                    <thead className="bg-slate-400/5 border-b border-white/5">
                      <tr>
                        <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Почта</th>
                        <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Роль</th>
                        <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Создан</th>
                        <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub} text-right`}>Действия</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                      {adminUsers.map((entry) => (
                        <tr key={entry.id} className="hover:bg-primary/5 transition-colors">
                          <td className={`p-6 font-bold ${styles.textMain}`}>{formatUserEmail(entry.email)}</td>
                          <td className={`p-6 text-sm ${styles.textSub}`}>{formatUserRole(entry.role)}</td>
                          <td className={`p-6 text-sm ${styles.textSub}`}>{new Date(entry.createdAt).toLocaleDateString('ru-RU')}</td>
                          <td className="p-6 text-right">
                            <button onClick={() => void handleDeleteUser(entry.id)} className="p-2 text-red-500 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      case 'doctors':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                 <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Реестр врачей</h2>
                <div className="flex gap-4">
                   <div className={`hidden md:flex items-center gap-3 ${styles.input} px-6 py-3 rounded-2xl border ${styles.border}`}>
                      <Search className="w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Поиск по реестру..." className="bg-transparent border-none outline-none text-xs font-bold w-48" />
                   </div>
                  <button onClick={handleAddDoctorDraft} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Добавить врача</button>
                </div>
             </div>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-400/5 border-b border-white/5">
                        <tr>
                          <th className={`p-8 text-[10px] font-black uppercase ${styles.textSub} tracking-widest`}>Специалист</th>
                          <th className={`p-8 text-[10px] font-black uppercase ${styles.textSub} tracking-widest`}>Статус</th>
                          <th className={`p-8 text-[10px] font-black uppercase ${styles.textSub} tracking-widest`}>Статистика</th>
                          <th className={`p-8 text-[10px] font-black uppercase ${styles.textSub} tracking-widest`}>Репутация</th>
                          <th className={`p-8 text-[10px] font-black uppercase ${styles.textSub} tracking-widest text-right`}>Действия</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                        {doctors.map(doc => (
                          <tr key={doc.id} className="group hover:bg-primary/5 transition-all duration-300">
                            <td className="p-8">
                                <div className="flex items-center gap-5">
                                  <div className="relative">
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName)}&background=0D47A1&color=fff`} className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                                      <Check className="w-2 h-2 text-white" />
                                    </div>
                                  </div>
                                  <div>
                                      <p className={`${styles.textMain} font-black text-sm tracking-tight`}>{doc.fullName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] ${styles.textSub} font-black uppercase tracking-wider bg-slate-400/10 px-2 py-0.5 rounded-md`}>{doc.specialty}</span>
                                        <span className={`text-[9px] ${styles.textSub} font-bold opacity-50`}>{doc.experienceYears} лет опыта</span>
                                      </div>
                                  </div>
                                </div>
                            </td>
                            <td className="p-8">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${doc.verified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                  <span className={`${styles.textMain} text-[10px] font-black uppercase tracking-widest`}>{doc.verified ? 'Активен' : 'Ожидает активации'}</span>
                                </div>
                            </td>
                            <td className="p-8">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`${styles.textMain} font-black text-xs`}>{getDoctorCasesCount(doc).toLocaleString('ru-RU')}</p>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">приемов</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="w-3 h-3 fill-current" />
                                  <span className={`text-xs font-black ${styles.textMain}`}>{doc.rating.toFixed ? doc.rating.toFixed(1) : doc.rating}</span>
                                </div>
                                </div>
                            </td>
                            <td className="p-8">
                                <div className="flex items-center gap-2">
                                  <div className="px-3 py-1 bg-primary/10 rounded-lg">
                                    <span className="text-primary font-black text-xs">+{getDoctorReputationPoints(doc)}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold ${styles.textSub} uppercase tracking-widest`}>RP</span>
                                </div>
                            </td>
                            <td className="p-8 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <button onClick={() => void handleDoctorSettings(doc)} className={`p-2 rounded-xl ${styles.card} border ${styles.border} ${styles.textSub} hover:text-primary hover:border-primary/50 transition-all shadow-sm`}>
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => void handleDoctorArchive(doc)} className={`p-2 rounded-xl ${styles.card} border ${styles.border} ${styles.textSub} hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-sm`}>
                                      <Archive className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => void handleDoctorDelete(doc)} className={`p-2 rounded-xl ${styles.card} border ${styles.border} ${styles.textSub} hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm`}>
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      case 'partners':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                 <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Партнерская сеть</h2>
                 <button onClick={handleAddPartnerDraft} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Новый партнер</button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                {partners.map(p => (
                   <div key={p.id} className={`${styles.card} p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border space-y-8 group hover:border-primary/20 transition-all hover:shadow-2xl relative overflow-hidden`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.02] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`}>
                         <Building2 className="w-full h-full" />
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                         <div className="w-14 h-14 lg:w-20 lg:h-20 bg-primary/10 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Building2 className="w-8 h-8 lg:w-10 lg:h-10" />
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                               {p.status === 'Active' ? 'Активен' : 'Верификация'}
                            </span>
                         </div>
                      </div>
                      <div className="relative z-10">
                         <h4 className={`${styles.textMain} font-black text-xl lg:text-3xl tracking-tighter leading-none`}>{p.name}</h4>
                          <p className={`${styles.textSub} text-[10px] font-black uppercase tracking-[0.2em] mt-3`}>БИН: {p.bin}</p>
                      </div>
                      <div className="pt-6 border-t border-slate-400/10 flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className={`text-[10px] font-black ${styles.textMain}`}>{doctors.length} врачей</span>
                          </div>
                         <div className="flex items-center gap-3">
                           <button onClick={() => void handlePartnerEdit(p)} className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underline">Управление <ArrowRight className="w-3 h-3" /></button>
                           <button onClick={() => void handlePartnerManage(p.id)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary">Статус</button>
                           <button onClick={() => void handlePartnerDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
      case 'contracts':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                 <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Договоры партнеров</h2>
                 <button onClick={handleAddContract} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Новый договор</button>
             </div>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} text-left`}>
                      <tr className={`text-[10px] font-black uppercase tracking-widest ${styles.textSub}`}>
                        <th className="p-6">Партнер</th>
                        <th className="p-6">Договор</th>
                        <th className="p-6">Подписан</th>
                        <th className="p-6">Действует до</th>
                        <th className="p-6">Комиссия</th>
                        <th className="p-6">Статус</th>
                        <th className="p-6 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <tr key={contract.id} className="border-t border-slate-400/10">
                          <td className={`p-6 font-bold ${styles.textMain}`}>{contract.partnerName}</td>
                          <td className={`p-6 font-black ${styles.textMain}`}>{contract.contractNumber}</td>
                          <td className={`p-6 ${styles.textSub}`}>{contract.signedAt}</td>
                          <td className={`p-6 ${styles.textSub}`}>{contract.expiresAt}</td>
                          <td className={`p-6 font-black ${styles.textMain}`}>{contract.commission}%</td>
                          <td className="p-6">
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              contract.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : contract.status === 'Expired'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {contract.status === 'Active' ? 'Активен' : contract.status === 'Expired' ? 'Истек' : 'Черновик'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <button onClick={() => void handleContractEdit(contract)} className="mr-4 text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
                              Править
                            </button>
                            <button onClick={() => void handleContractManage(contract.id)} className="mr-4 text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
                              {contract.status === 'Active' ? 'Завершить' : 'Активировать'}
                            </button>
                            <button onClick={() => void handleContractDelete(contract.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500">
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Аналитика</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-8`}>
                   <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><DollarSign className="text-emerald-500" /> Выручка (7 дней)</h3>
                   <div className="h-64 w-full">
                      <Suspense fallback={null}>
                        <AdminRevenueChart data={analyticsSeries} isDark={isDark} />
                      </Suspense>
                   </div>
                </div>
                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-8`}>
                   <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><Users className="text-blue-500" /> Рост аудитории</h3>
                   <div className="h-64 w-full">
                      <Suspense fallback={null}>
                        <AdminAudienceChart data={analyticsSeries} isDark={isDark} />
                      </Suspense>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500">
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Настройки</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-8`}>
                   <h3 className={`text-lg font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><Sun className="text-primary" /> Внешний вид</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleThemeSwitch('light')}
                        className={`flex flex-col items-center gap-4 p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] border-2 transition-all ${!isDark ? 'border-primary bg-primary/5' : 'border-slate-400/10 hover:border-slate-400/30'}`}
                      >
                         <Sun className={`w-8 h-8 lg:w-10 lg:h-10 ${!isDark ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-[9px] lg:text-[10px] font-black uppercase ${!isDark ? 'text-primary' : 'text-slate-400'}`}>Светлая</span>
                      </button>
                      <button 
                        onClick={() => handleThemeSwitch('dark')}
                        className={`flex flex-col items-center gap-4 p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] border-2 transition-all ${isDark ? 'border-primary bg-primary/5' : 'border-slate-400/10 hover:border-slate-400/30'}`}
                      >
                         <Moon className={`w-8 h-8 lg:w-10 lg:h-10 ${isDark ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-[9px] lg:text-[10px] font-black uppercase ${isDark ? 'text-primary' : 'text-slate-400'}`}>Темная</span>
                      </button>
                   </div>
                </div>
                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-8`}>
                   <h3 className={`text-lg font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><Percent className="text-primary" /> Экономика</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className={`text-[10px] font-black uppercase ${styles.textSub} tracking-widest ml-4`}>Комиссия (%)</label>
                         <div className={`flex items-center gap-4 ${styles.input} p-4 lg:p-6 rounded-2xl lg:rounded-3xl`}>
                            <input type="number" value={sysConfig?.serviceFeePercent ?? 0} onChange={(event) => handleServiceFeeChange(event.target.value)} className="bg-transparent border-none outline-none font-black text-xl lg:text-2xl flex-1" />
                            <span className="text-slate-400 font-black">%</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  const navItems: { id: AdminTab, icon: any, label: string }[] = NAV_ITEMS;

  return (
    <div className={`min-h-screen ${styles.bg} flex flex-col lg:flex-row transition-all duration-700 ease-in-out overflow-hidden`}>
      
      {/* Desktop Sidebar (Fixed, strictly unchanged) */}
      <div className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-24 lg:w-28 ${styles.sidebar} border-r flex flex-col items-center z-[100] transition-all duration-700`}>
         <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} setIsMobileMenuOpen={setIsMobileMenuOpen} onLogout={onLogout} isDark={isDark} />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
           <div className={`absolute top-0 left-0 h-full w-[min(18rem,calc(100vw-1rem))] ${styles.sidebar} animate-in slide-in-from-left duration-500 shadow-2xl flex flex-col`}>
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-6 p-2 text-slate-400 hover:text-primary transition-colors"><X className="w-6 h-6" /></button>
              <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} setIsMobileMenuOpen={setIsMobileMenuOpen} onLogout={onLogout} isDark={isDark} />
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ml-0 lg:ml-24 lg:lg:ml-28 flex flex-col h-screen overflow-hidden ${styles.mainBg} transition-colors duration-700`}>
         <header className={`min-h-20 lg:min-h-24 ${styles.header} backdrop-blur-xl border-b flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 sticky top-0 z-[90] transition-all duration-700 shrink-0`}>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
               {/* Burger Button for Mobile */}
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className={`p-2 lg:hidden rounded-xl ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-600'} hover:scale-105 active:scale-95 transition-all`}
               >
                 <Menu className="w-6 h-6" />
               </button>
                  <h1 className={`text-base sm:text-lg lg:text-2xl font-black ${styles.textMain} uppercase tracking-tighter`}>Контроль платформы</h1>
                  <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/20 text-emerald-500 text-[8px] lg:text-[10px] font-black uppercase rounded-full border border-emerald-500/20">Система онлайн</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-8 shrink-0">
               <div className={`hidden sm:flex items-center gap-3 ${styles.input} rounded-2xl px-4 py-2 border ${styles.border}`}>
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className={`text-[10px] font-black ${styles.textSub} uppercase`}>{systemHealth?.current?.cpu ?? 0}% нагрузки</span>
               </div>
               <div className={`flex items-center gap-3 lg:gap-4 sm:pl-8 sm:border-l ${styles.border}`}>
                  <div className="text-right hidden sm:block">
                  <p className={`text-xs font-black ${styles.textMain} leading-tight`}>Главный админ</p>
                     <p className={`text-[10px] font-bold ${styles.textSub} uppercase tracking-widest`}>Alan</p>
                  </div>
                  <button onClick={() => setActiveTab('settings')} className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${styles.input} p-0.5 border border-white/10 overflow-hidden shadow-sm`}>
                     <img src={user.avatar} className="w-full h-full rounded-xl lg:rounded-2xl object-cover" />
                  </button>
               </div>
            </div>
         </header>

         <main className={`flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:p-10 scrollbar-hide flex flex-col ${styles.mainBg}`}>
            {renderSection()}
         </main>
      </div>
    </div>
  );
};

export default AdminDashboard;





