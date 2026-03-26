
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, Doctor } from '../types';
import { 
  Users, Activity, Database, ShieldCheck, 
  Settings, LogOut, Bell, Search, TrendingUp, 
  ArrowUpRight, Server, Globe, Cpu, BarChart3, 
  Lock, MessageSquare, AlertCircle, FileText, Info, 
  ClipboardList, Stethoscope, Building2, Pill, Star, Trash2, Check, X,
  ShieldAlert, ToggleLeft, ToggleRight, DollarSign, Percent, Zap, Sun, Moon,
  Send, Sparkles, Briefcase, FileSearch, Mail, Archive, ShoppingBag, Eye, Menu, 
  ShieldEllipsis, History, BarChartHorizontal, LineChart as LineChartIcon, Radar, Layers,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, LineChart, Line } from 'recharts';
import { MockDB, PlatformRequest, PharmacyProduct, PartnerClinic, SystemConfig, AIChatMessage } from '../services/db';
import { GoogleGenAI } from '@google/genai';
import TakhetLogo from '../components/Logo';

const SYSTEM_HEALTH = [
  { time: '00:00', cpu: 12, ram: 45, reqs: 120 },
  { time: '04:00', cpu: 8, ram: 42, reqs: 80 },
  { time: '08:00', cpu: 34, ram: 58, reqs: 450 },
  { time: '12:00', cpu: 56, ram: 65, reqs: 890 },
  { time: '16:00', cpu: 42, ram: 62, reqs: 720 },
  { time: '20:00', cpu: 28, ram: 55, reqs: 340 },
  { time: '23:59', cpu: 15, ram: 48, reqs: 180 },
];

type AdminTab = 'overview' | 'requests' | 'doctors' | 'partners' | 'qa' | 'reviews' | 'medicines' | 'analytics' | 'settings' | 'assistant';

const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [requests, setRequests] = useState<PlatformRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [partners, setPartners] = useState<PartnerClinic[]>([]);
  const [medicines, setMedicines] = useState<PharmacyProduct[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  
  // Assistant States
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      const db = MockDB.get();
      setRequests(db.platformRequests);
      setDoctors(db.doctors);
      setPartners(db.partners);
      setMedicines(db.pharmacyProducts);
      setReviews(db.reviews);
      setComplaints(db.complaints);
      setRevenueHistory(db.revenueHistory);
      setSysConfig(db.config);
      setAiMessages(db.aiChatHistory);
    };
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

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

  const handleSendAi = async () => {
    if (!aiInput.trim()) return;
    const userText = aiInput.trim();
    const newMsg: AIChatMessage = { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString() };
    
    MockDB.addAIChatMessage(newMsg);
    setAiInput('');
    setIsAiTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userText,
        config: {
          systemInstruction: `You are the Executive Personal Secretary for Alan, Master Admin of Takhet+. 
          Provide strategic summaries, financial audits, and security alerts. 
          Use bold headings and concise bullet points. 
          Always mention that detailed logs are available at baimukhanalan1@gmail.com.`,
        },
      });

      const aiMsg: AIChatMessage = { 
        role: 'model', 
        text: response.text || "Ошибка связи с ядром ИИ.", 
        timestamp: new Date().toLocaleTimeString() 
      };
      MockDB.addAIChatMessage(aiMsg);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleRequestAction = (id: string, status: 'Approved' | 'Rejected') => {
    MockDB.updateRequestStatus(id, status);
  };

  const handleConfigToggle = (key: keyof SystemConfig) => {
    if (!sysConfig) return;
    MockDB.updateSystemConfig({ [key]: !sysConfig[key] });
  };

  const handleThemeSwitch = (theme: 'dark' | 'light') => {
    MockDB.updateSystemConfig({ theme });
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
               {[
                 { label: 'Пользователи', val: '14,204', change: '+12%', icon: Users, color: 'text-blue-500' },
                 { label: 'Активные сессии', val: '842', change: '+5%', icon: Activity, color: 'text-green-500' },
                 { label: 'Транзакции MTD', val: '₸42.5M', change: '+22%', icon: TrendingUp, color: 'text-amber-500' },
                 { label: 'Uptime системы', val: '99.9%', change: 'Stable', icon: ShieldCheck, color: 'text-emerald-500' },
               ].map((s, i) => (
                 <div key={i} className={`${styles.card} p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border hover:border-primary/20 transition-all group`}>
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                       <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-primary/10 ${s.color} group-hover:scale-110 transition-transform`}>
                          <s.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                       </div>
                       <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">{s.change}</span>
                    </div>
                    <p className={`${styles.textSub} text-[10px] font-black uppercase tracking-widest`}>{s.label}</p>
                    <p className={`text-2xl lg:text-4xl font-black ${styles.textMain} mt-2`}>{s.val}</p>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
               <div className={`lg:col-span-8 ${styles.card} p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-10 overflow-hidden`}>
                  <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight`}>Load Telemetry</h3>
                  <div className="h-60 lg:h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={SYSTEM_HEALTH}>
                           <defs>
                              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#0D47A1" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                           <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <Tooltip contentStyle={{backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1.5rem', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'}} />
                           <Area type="monotone" dataKey="cpu" stroke="#0D47A1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={4} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div className={`lg:col-span-4 ${styles.card} p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-8`}>
                  <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight`}>Quick Security</h3>
                  <div className="space-y-4">
                     {sysConfig && [
                       { label: 'Maintenance Mode', key: 'maintenanceMode' as const, icon: ShieldAlert, danger: true },
                       { label: 'AI Core Analysis', key: 'aiDiagnosticEnabled' as const, icon: Zap, danger: false }
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
                         <p className="text-xl lg:text-3xl font-black uppercase tracking-[0.3em]">Центр ИИ Ассистента</p>
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
                               <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Verified Strategic Output</span>
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
                          onClick={() => MockDB.clearAIChatHistory()}
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
                     { label: 'Retention Анализ', icon: History, color: 'text-purple-500', desc: 'Удержание пациентов LTV', prompt: 'Покажи статистику удержания пациентов' },
                     { label: 'Прогноз выручки', icon: BarChartHorizontal, color: 'text-emerald-400', desc: 'AI-прогнозирование роста', prompt: 'Сделай прогноз выручки на следующий квартал' },
                     { label: 'Точность ИИ-диагностики', icon: Zap, color: 'text-orange-500', desc: 'Подтверждаемость анализов', prompt: 'Каков процент точности ИИ за неделю?' },
                     { label: 'География запросов', icon: Globe, color: 'text-cyan-500', desc: 'Тепловая карта обращений', prompt: 'Покажи географическое распределение вызовов' },
                     { label: 'Анализ онбординга', icon: UserCheck, color: 'text-indigo-500', desc: 'Скорость проверки дипломов', prompt: 'Дай отчет по скорости онбординга новых врачей' },
                     { label: 'Маркетинговый ROI', icon: LineChartIcon, color: 'text-rose-500', desc: 'Стоимость привлечения CAC', prompt: 'Рассчитай ROI маркетинговых кампаний' },
                     { label: 'Compliance Статус', icon: ShieldCheck, color: 'text-teal-500', desc: 'Соответствие закону о ПД', prompt: 'Проверь статус комплаенса данных' },
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
                            <td className={`p-6 text-sm ${styles.textSub} max-w-xs truncate`}>{rev.text}</td>
                            <td className={`p-6 text-xs ${styles.textSub}`}>{rev.date}</td>
                            <td className="p-6">
                                <button onClick={() => MockDB.deleteReview(rev.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4"/></button>
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
                <button className="px-4 lg:px-8 py-2 lg:py-4 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Добавить</button>
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
                           <p className={`${styles.textMain} font-black text-base lg:text-lg truncate`}>{comp.title}</p>
                           <p className={`${styles.textSub} text-[9px] font-bold uppercase tracking-widest`}>{comp.author} • {comp.category}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 lg:gap-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
                        <div className="text-right">
                           <p className={`text-[9px] font-black uppercase ${styles.textSub}`}>Ответы</p>
                           <p className={`text-lg lg:text-xl font-black ${styles.textMain}`}>{comp.replies?.length || 0}</p>
                        </div>
                        <button onClick={() => MockDB.deleteComplaint(comp.id)} className="p-3 lg:p-4 bg-red-500/10 text-red-500 rounded-xl lg:rounded-2xl hover:bg-red-500 hover:text-white transition-all">
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
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Заявки</h2>
             <div className="grid gap-4">
                {requests.map(req => (
                  <div key={req.id} className={`${styles.card} p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-primary/5 transition-all`}>
                     <div className="flex items-center gap-4 lg:gap-6 w-full">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-primary shrink-0">
                           {req.type === 'DoctorOnboarding' ? <Stethoscope className="w-6 h-6 lg:w-7 lg:h-7" /> : <Building2 className="w-6 h-6 lg:w-7 lg:h-7" />}
                        </div>
                        <div className="min-w-0">
                           <p className={`${styles.textMain} font-black text-base lg:text-lg truncate`}>{req.sender}</p>
                           <p className={`${styles.textSub} text-[10px] font-bold uppercase tracking-widest`}>{req.type} • {req.date}</p>
                        </div>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        {req.status === 'Pending' ? (
                          <>
                             <button onClick={() => handleRequestAction(req.id, 'Approved')} className="flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-emerald-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest">Да</button>
                             <button onClick={() => handleRequestAction(req.id, 'Rejected')} className="flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-red-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest">Нет</button>
                          </>
                        ) : (
                          <span className={`w-full px-4 py-2 rounded-lg text-center text-[10px] font-black uppercase tracking-widest ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{req.status}</span>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );

      case 'doctors':
        return (
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center">
                <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Врачи</h2>
                <button className="px-4 lg:px-8 py-2 lg:py-4 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Добавить</button>
             </div>
             <div className={`${styles.card} rounded-[2rem] lg:rounded-[3rem] border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-400/5 border-b border-white/5">
                        <tr>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Врач</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Стаж</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Рейтинг</th>
                          <th className={`p-6 text-[10px] font-black uppercase ${styles.textSub}`}>Действия</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${styles.border}`}>
                        {doctors.map(doc => (
                          <tr key={doc.id} className="hover:bg-primary/5 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <img src={doc.avatar} className="w-10 h-10 rounded-full object-cover" />
                                  <div>
                                      <p className={`${styles.textMain} font-bold`}>{doc.name}</p>
                                      <p className={`text-[9px] ${styles.textSub} font-black uppercase`}>{doc.specialty}</p>
                                  </div>
                                </div>
                            </td>
                            <td className={`p-6 ${styles.textMain} font-bold`}>{doc.experience} л.</td>
                            <td className="p-6"><div className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" /> <span className={`font-black ${styles.textMain}`}>{doc.rating}</span></div></td>
                            <td className="p-6 flex gap-2">
                                <button className={`${styles.textSub} hover:text-primary transition-colors`}><Settings className="w-5 h-5" /></button>
                                <button onClick={() => MockDB.deleteDoctor(doc.id)} className={`${styles.textSub} hover:text-red-500 transition-colors`}><Trash2 className="w-5 h-5" /></button>
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
          <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <h2 className={`text-2xl lg:text-3xl font-black ${styles.textMain} uppercase tracking-tighter`}>Партнеры</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {partners.map(p => (
                   <div key={p.id} className={`${styles.card} p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border space-y-6 group hover:border-primary/20 transition-all`}>
                      <div className="flex justify-between items-start">
                         <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Building2 className="w-7 h-7 lg:w-8 lg:h-8" /></div>
                         <span className={`px-2 py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.status}</span>
                      </div>
                      <div>
                         <h4 className={`${styles.textMain} font-black text-lg lg:text-xl truncate`}>{p.name}</h4>
                         <p className={`${styles.textSub} text-[9px] font-black uppercase tracking-widest mt-1`}>БИН: {p.bin}</p>
                      </div>
                   </div>
                ))}
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
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={revenueHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none'}} />
                            <Bar dataKey="amount" fill="#0D47A1" radius={[10, 10, 10, 10]} barSize={25} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-8`}>
                   <h3 className={`text-lg lg:text-xl font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><Users className="text-blue-500" /> Рост Аудитории</h3>
                   <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={revenueHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none'}} />
                            <Line type="monotone" dataKey="users" stroke="#00BFA5" strokeWidth={4} dot={{fill: '#00BFA5', r: 6}} />
                         </LineChart>
                      </ResponsiveContainer>
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
                         <span className={`text-[9px] lg:text-[10px] font-black uppercase ${!isDark ? 'text-primary' : 'text-slate-400'}`}>Light</span>
                      </button>
                      <button 
                        onClick={() => handleThemeSwitch('dark')}
                        className={`flex flex-col items-center gap-4 p-6 lg:p-8 rounded-2xl lg:rounded-[2rem] border-2 transition-all ${isDark ? 'border-primary bg-primary/5' : 'border-slate-400/10 hover:border-slate-400/30'}`}
                      >
                         <Moon className={`w-8 h-8 lg:w-10 lg:h-10 ${isDark ? 'text-primary' : 'text-slate-400'}`} />
                         <span className={`text-[9px] lg:text-[10px] font-black uppercase ${isDark ? 'text-primary' : 'text-slate-400'}`}>Dark</span>
                      </button>
                   </div>
                </div>

                <div className={`${styles.card} p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border space-y-6 lg:space-y-8`}>
                   <h3 className={`text-lg font-black ${styles.textMain} uppercase tracking-tight flex items-center gap-3`}><Percent className="text-primary" /> Экономика</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className={`text-[10px] font-black uppercase ${styles.textSub} tracking-widest ml-4`}>Комиссия (%)</label>
                         <div className={`flex items-center gap-4 ${styles.input} p-4 lg:p-6 rounded-2xl lg:rounded-3xl`}>
                            <input type="number" defaultValue={sysConfig?.serviceFeePercent} className="bg-transparent border-none outline-none font-black text-xl lg:text-2xl flex-1" />
                            <span className="text-slate-400 font-black">%</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'overview':
      default: return null;
    }
  };

  const navItems: { id: AdminTab, icon: any, label: string }[] = [
    { id: 'overview', icon: BarChart3, label: 'Дашборд' },
    { id: 'assistant', icon: Sparkles, label: 'Secretary' },
    { id: 'requests', icon: ClipboardList, label: 'Заявки' },
    { id: 'doctors', icon: Stethoscope, label: 'Врачи' },
    { id: 'partners', icon: Building2, label: 'Партнеры' },
    { id: 'qa', icon: MessageSquare, label: 'Вопросы' },
    { id: 'reviews', icon: Star, label: 'Отзывы' },
    { id: 'medicines', icon: Pill, label: 'Аптека' },
    { id: 'analytics', icon: TrendingUp, label: 'Аналитика' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col items-center h-full w-full py-10 relative">
       <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-10 shrink-0">
          <TakhetLogo className="w-10 h-10" />
       </Link>
       
       <nav className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar w-full items-center px-4 md:px-2 py-4">
          {navItems.map(item => (
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

  return (
    <div className={`min-h-screen ${styles.bg} flex flex-col lg:flex-row transition-all duration-700 ease-in-out overflow-hidden`}>
      
      {/* Desktop Sidebar (Fixed, strictly unchanged) */}
      <div className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-24 lg:w-28 ${styles.sidebar} border-r flex flex-col items-center z-[100] transition-all duration-700`}>
         <SidebarContent />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
           <div className={`absolute top-0 left-0 w-72 h-full ${styles.sidebar} animate-in slide-in-from-left duration-500 shadow-2xl flex flex-col`}>
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-6 p-2 text-slate-400 hover:text-primary transition-colors"><X className="w-6 h-6" /></button>
              <SidebarContent />
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ml-0 lg:ml-24 lg:lg:ml-28 flex flex-col h-screen overflow-hidden ${styles.mainBg} transition-colors duration-700`}>
         <header className={`h-20 lg:h-24 ${styles.header} backdrop-blur-xl border-b flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[90] transition-all duration-700 shrink-0`}>
            <div className="flex items-center gap-4">
               {/* Burger Button for Mobile */}
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className={`p-2 lg:hidden rounded-xl ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-600'} hover:scale-105 active:scale-95 transition-all`}
               >
                 <Menu className="w-6 h-6" />
               </button>
               <h1 className={`text-lg lg:text-2xl font-black ${styles.textMain} uppercase tracking-tighter`}>Root Control</h1>
               <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/20 text-emerald-500 text-[8px] lg:text-[10px] font-black uppercase rounded-full border border-emerald-500/20">System Online</span>
            </div>
            <div className="flex items-center gap-3 lg:gap-8">
               <div className={`hidden sm:flex items-center gap-3 ${styles.input} rounded-2xl px-4 py-2 border ${styles.border}`}>
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className={`text-[10px] font-black ${styles.textSub} uppercase`}>14% Load</span>
               </div>
               <div className={`flex items-center gap-3 lg:gap-4 sm:pl-8 sm:border-l ${styles.border}`}>
                  <div className="text-right hidden sm:block">
                     <p className={`text-xs font-black ${styles.textMain} leading-tight`}>Master Admin</p>
                     <p className={`text-[10px] font-bold ${styles.textSub} uppercase tracking-widest`}>Alan</p>
                  </div>
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${styles.input} p-0.5 border border-white/10 overflow-hidden shadow-sm`}>
                     <img src={user.avatar} className="w-full h-full rounded-xl lg:rounded-2xl object-cover" />
                  </div>
               </div>
            </div>
         </header>

         <main className={`flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide flex flex-col ${styles.mainBg}`}>
            {renderSection()}
         </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
