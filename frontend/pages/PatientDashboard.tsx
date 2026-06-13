
import React, { useState, useEffect } from 'react';
import { User, FamilyMember, AccessLevel } from '../types';
import { 
  ArrowUpRight, ShoppingBag, Fingerprint, 
  BrainCircuit, Plus, X, Truck, Heart, Activity, Settings2, ShieldAlert,
  Users, Mail, ShieldCheck, Zap, HeartPulse, Clock, ShieldAlert as DangerIcon, CheckCircle2, AlertCircle,
  Info, Video as VideoIcon, Gauge, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MockDB, Notification } from '../services/db';
import { translations, Language } from '../services/i18n';
import { roleApi } from '../services/roleApi';

const PatientDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [activeData, setActiveData] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [remoteNotifications, setRemoteNotifications] = useState<any[]>([]);
  const [remotePayments, setRemotePayments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLang(MockDB.getLang());
      setFamilyMembers(MockDB.get().familyMembers);
      setActiveData(MockDB.getActiveMemberData());
      try {
        const [notifs, payments] = await Promise.all([
          roleApi.patientNotifications(),
          roleApi.patientPayments()
        ]);
        setRemoteNotifications(notifs || []);
        setRemotePayments(payments || []);
      } catch {
        setRemoteNotifications([]);
        setRemotePayments([]);
      }
    };
    loadData();
    window.addEventListener('storage_update', loadData as any);
    return () => window.removeEventListener('storage_update', loadData as any);
  }, []);

  const t = translations[lang];

  const handleInvite = () => {
    if (!newMemberEmail.includes('@')) return;
    // Always default to 'Full' access as requested
    MockDB.inviteMember(newMemberEmail, 'Full');
    setNewMemberEmail('');
    setIsAddMemberOpen(false);
    alert('Приглашение отправлено!');
  };

  const handleAcceptInvite = (notifId: string, memberId: string) => {
    MockDB.acceptInvite(memberId);
    MockDB.markNotificationRead(notifId);
  };

  const notifications = MockDB.getNotifications().filter(n => !n.isRead && n.type === 'invite');
  const incomingAlertsCount = remoteNotifications.length + notifications.length;

  if (!activeData) return null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* SIMPLIFIED INVITE MODAL */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
           <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl w-full max-w-xl space-y-10 animate-in zoom-in-95 duration-500 border border-slate-100">
              <div className="flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Семейный штаб</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Пригласить участника</p>
                 </div>
                 <button onClick={() => setIsAddMemberOpen(false)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email пользователя</label>
                    <div className="relative">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                       <input 
                         value={newMemberEmail} 
                         onChange={e => setNewMemberEmail(e.target.value)} 
                         placeholder="user@takhet.kz" 
                         className="w-full pl-16 pr-6 py-6 bg-slate-50 border-none rounded-3xl font-bold outline-none focus:ring-4 ring-primary/5 transition-all" 
                       />
                    </div>
                 </div>
                 <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">Участник получит запрос на полный доступ. Общий штаб позволяет видеть анализы и риски в единой панели.</p>
                 </div>
              </div>

              <button onClick={handleInvite} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-primary transition-all">Отправить приглашение</button>
           </div>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 px-4 lg:px-0">
        <div className="space-y-2">
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Центр <span className="text-primary italic">управления</span></h1>
           <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em]">{lang === 'kz' ? 'Отбасылық медициналық штаб' : 'Семейный медицинский штаб'} • v1.2</p>
        </div>
        
        {/* INVITE NOTIFICATIONS AREA - ADDED OPTIONAL CHAINING */}
        {incomingAlertsCount > 0 && (
           <div className="w-full lg:w-auto bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-8 animate-in slide-in-from-right duration-700">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center text-amber-700"><Users className="w-6 h-6" /></div>
                 <div>
                    <p className="font-black text-amber-900 text-sm">Новое приглашение</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Вас пригласили в семью</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleAcceptInvite(notifications[0].id, notifications[0].meta?.memberId)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Принять</button>
                 <button onClick={() => MockDB.markNotificationRead(notifications[0].id)} className="px-4 py-2 text-amber-700 font-black text-[10px] uppercase">Отклонить</button>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* FAMILY STATUSES */}
        <div className="xl:col-span-8 space-y-12 px-4 lg:px-0">
           <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Activity className="w-6 h-6" /> Состояние семьи</h3>
                 <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-widest hover:underline"><Plus className="w-4 h-4" /> Добавить близкого</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {familyMembers.map((member) => (
                    <div key={member.id} className="bg-white p-8 rounded-[3.5rem] border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between overflow-hidden relative">
                       <div className="space-y-6">
                          <div className="flex items-center gap-5">
                             <div className="relative">
                                <img src={member.avatar} className="w-16 h-16 rounded-[1.8rem] object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                                {member.status === 'Pending' && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[1.8rem] flex items-center justify-center"><Clock className="w-5 h-5 text-slate-400" /></div>}
                             </div>
                             <div className="min-w-0">
                                <h4 className="font-black text-xl text-slate-900 truncate">{member.name}</h4>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${member.status === 'Pending' ? 'text-amber-500' : 'text-blue-500'}`}>
                                   {member.status === 'Pending' ? 'Ожидание' : 'Активен'}
                                </span>
                             </div>
                          </div>

                          {member.status === 'Active' && (
                             <div className="space-y-5">
                                <div className="flex items-end justify-between">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Health Index</span>
                                   <span className={`text-3xl font-black ${member.healthScore > 85 ? 'text-blue-500' : 'text-orange-500'}`}>{member.healthScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <div className={`h-full transition-all duration-1000 ${member.healthScore > 85 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${member.healthScore}%` }} />
                                </div>
                             </div>
                          )}
                       </div>

                       <button 
                         disabled={member.status === 'Pending'} 
                         onClick={() => MockDB.setSelectedMemberId(member.id)}
                         className={`mt-8 w-full py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-lg transition-all disabled:opacity-30 ${MockDB.getSelectedMemberId() === member.id ? 'bg-primary text-white' : 'bg-slate-900 text-white group-hover:bg-primary'}`}
                       >
                         {MockDB.getSelectedMemberId() === member.id ? 'Текущий профиль' : 'Выбрать профиль'}
                       </button>
                    </div>
                 ))}
              </div>
           </div>

           {/* MINIMALISTIC DIGITAL TWIN BLOCK */}
           <div className="bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
              
              <div className="relative z-10 w-40 h-40 shrink-0">
                 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-[3s]" />
                 <div className="relative w-full h-full bg-gradient-to-tr from-primary to-accent rounded-full flex flex-col items-center justify-center border-4 border-white/20 shadow-[0_0_50px_rgba(13,71,161,0.5)]">
                    <span className="text-5xl font-black leading-none">{activeData.digitalTwin.overallScore}</span>
                    <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Index</span>
                 </div>
              </div>

              <div className="relative z-10 space-y-6 flex-1 text-center md:text-left">
                 <div className="space-y-2">
                    <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Цифровой двойник</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Биометрическая симуляция здоровья</p>
                 </div>
                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Био-возраст</p>
                       <p className="text-xl font-black text-accent">{activeData.digitalTwin.bioAge} лет</p>
                    </div>
                    <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Статус систем</p>
                       <p className="text-xl font-black text-white">Стабильно</p>
                    </div>
                 </div>
                 <button onClick={() => navigate('/digital-twin')} className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 mx-auto md:mx-0">
                    Настроить <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-4 h-full px-4 lg:px-0">
           <div className="bg-white rounded-[4rem] p-10 border border-slate-100 shadow-sm space-y-12">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner"><Zap className="w-10 h-10" /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Роль в системе</p>
                    <h4 className="text-3xl font-black text-slate-900 leading-tight">Master Admin</h4>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Анализы</p>
                    <p className="text-2xl font-black text-primary">{remoteNotifications.length || 14}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Консультации</p>
                    <p className="text-2xl font-black text-primary">{remotePayments.length || 5}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ближайшее событие</h4>
                 <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] flex items-center gap-4">
                    <VideoIcon className="w-6 h-6 text-primary" />
                    <div>
                       <p className="text-xs font-black text-slate-800">Др. Каримова</p>
                       <p className="text-[8px] font-black text-primary uppercase">Завтра, 14:00</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 space-y-3">
                 <button onClick={() => navigate('/doctors-search')} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Запись на прием</button>
                 <button onClick={() => navigate('/archive')} className="w-full py-6 bg-slate-50 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Мед. архив</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
