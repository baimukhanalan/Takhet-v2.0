import React, { useState, useEffect } from 'react';
import { User, Doctor } from '../types';
import { Building2, Users, Briefcase, TrendingUp, Shield, Globe, Plus, Trash2, Percent, DollarSign, Star, ChevronRight, X, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { translations, Language } from '../services/i18n';
import { MockDB } from '../services/db';

const CLINIC_PERFORMANCE = [
  { month: 'Jan', revenue: 4200, consults: 120 },
  { month: 'Feb', revenue: 3800, consults: 110 },
  { month: 'Mar', revenue: 5100, consults: 150 },
  { month: 'Apr', revenue: 6200, consults: 180 },
  { month: 'May', revenue: 5800, consults: 165 },
];

const PartnerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [showManageDocs, setShowManageDocs] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [commission, setCommission] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const loadData = () => {
      setLang(MockDB.getLang());
      const myClinic = MockDB.getClinicByAdmin(user.id);
      if (myClinic) {
        setClinic(myClinic);
        setCommission(myClinic.commission);
        setDoctors(MockDB.getClinicDoctors(myClinic.id));
      }
      setAllDoctors(MockDB.getDoctors().filter(d => !d.clinicId));
    };
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, [user.id]);

  const t = translations[lang];

  const handleRemoveDoctor = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить врача из клиники?')) {
      MockDB.removeDoctorFromClinic(id);
    }
  };

  const handleAddDoctor = (id: string) => {
    if (clinic) {
      MockDB.addDoctorToClinic(id, clinic.id);
      setShowAddDoc(false);
    }
  };

  const handleSaveCommission = () => {
    if (clinic) {
      MockDB.updateClinic(clinic.id, { commission });
      alert('Комиссия сохранена');
    }
  };

  const filteredDocs = doctors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {showManageDocs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setShowManageDocs(false)} className="absolute top-8 right-8 z-10 p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="p-10 border-b bg-slate-50/50">
               <h2 className="text-3xl font-black tracking-tight">Управление персоналом</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Список врачей вашей клиники</p>
            </div>
            <div className="p-10 flex-1 overflow-y-auto no-scrollbar space-y-6">
               <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Поиск врача по имени или специальности..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none"
                  />
               </div>
               <div className="space-y-3">
                  {filteredDocs.map(doc => (
                    <div key={doc.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all gap-4 min-w-0">
                       <div className="flex items-center gap-5 min-w-0 flex-1">
                          <img src={doc.avatar} className="w-14 h-14 rounded-2xl object-cover shrink-0" alt={doc.name} />
                          <div className="min-w-0">
                             <h4 className="font-black text-slate-900 break-words">{doc.name}</h4>
                             <p className="text-[10px] font-bold text-primary uppercase tracking-widest break-words">{doc.specialty}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 md:gap-8 shrink-0">
                          <div className="text-right hidden sm:block">
                             <p className="text-xs font-black text-slate-900">{MockDB.getDoctorStats(doc.id).sessions} приемов</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">В этом месяце</p>
                          </div>
                          <button onClick={() => handleRemoveDoctor(doc.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-10 bg-slate-50 border-t flex justify-between items-center">
               <button onClick={() => setShowAddDoc(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить врача
               </button>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Всего: {doctors.length} специалистов</p>
            </div>
          </div>
        </div>
      )}

      {showAddDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setShowAddDoc(false)} className="absolute top-8 right-8 z-10 p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="p-10 border-b bg-slate-50/50">
               <h2 className="text-2xl font-black tracking-tight">Доступные специалисты</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Врачи без привязки к клинике</p>
            </div>
            <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
               {allDoctors.length > 0 ? allDoctors.map(doc => (
                  <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between gap-4 min-w-0">
                     <div className="flex items-center gap-4 min-w-0 flex-1">
                        <img src={doc.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt={doc.name} />
                        <div className="min-w-0">
                           <h4 className="font-bold text-slate-900 break-words">{doc.name}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase break-words">{doc.specialty}</p>
                        </div>
                     </div>
                    <button onClick={() => handleAddDoctor(doc.id)} className="px-4 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase shrink-0">Пригласить</button>
                 </div>
               )) : (
                 <p className="text-center text-slate-400 py-10 font-bold">Нет свободных врачей</p>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
             <h3 className="text-xl font-bold text-primary">{clinic?.name || 'City Medical Center'}</h3>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{t.dashboard.partner.orgTitle}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{lang === 'en' ? 'Clinic working with' : lang === 'kz' ? 'Сіздің МО' : 'Ваш МЦ работает с'} <span className="text-success font-bold">120% {t.dashboard.partner.efficiency}</span>.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3.5 bg-white border border-border rounded-2xl font-bold hover:bg-slate-50 transition-all">{t.dashboard.partner.export}</button>
          <button onClick={() => setShowManageDocs(true)} className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-primary/20">{t.dashboard.partner.manageDocs}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: t.dashboard.partner.activeDocs, val: doctors.length.toString(), icon: Users, color: 'text-primary bg-primary/10' },
          { label: t.dashboard.partner.totalConsults, val: '1,420', icon: Briefcase, color: 'text-accent bg-accent/10' },
          { label: t.dashboard.partner.revenueMTD, val: '₸5.8M', icon: TrendingUp, color: 'text-success bg-success/10' },
          { label: 'Комиссия МЦ', val: `${commission}%`, icon: Percent, color: 'text-purple-600 bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-border shadow-sm group hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}><stat.icon className="w-6 h-6" /></div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-2xl font-extrabold">{t.dashboard.partner.growth}</h2>
                 <select className="bg-background border-none text-xs font-bold rounded-xl px-4 py-2"><option>{t.dashboard.partner.period}</option></select>
              </div>
              <div className="h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={CLINIC_PERFORMANCE}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip cursor={{fill: '#F5F9FF'}} contentStyle={{borderRadius: '1.5rem', border: 'none'}} />
                     <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#0D47A1" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm">
              <h2 className="text-2xl font-extrabold mb-8">Топ специалисты</h2>
              <div className="space-y-6">
                 {doctors.slice(0, 3).map((doc, i) => {
                   const stats = MockDB.getDoctorStats(doc.id);
                   return (
                     <div key={doc.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                        <div className="flex items-center gap-4 min-w-0">
                           <span className="text-lg font-black text-slate-300 shrink-0">0{i+1}</span>
                           <img src={doc.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt={doc.name} />
                           <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 break-words">{doc.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-amber-500 font-black">
                                 <Star className="w-3 h-3 fill-current" /> {doc.rating}
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-slate-900">₸{stats.revenue.toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Выручка</p>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
              <h3 className="text-xl font-bold mb-4">{t.dashboard.partner.verificationStatus}</h3>
              <div className="flex items-center gap-3 text-success mb-6">
                 <Shield className="w-8 h-8" />
                 <span className="font-bold uppercase tracking-widest text-sm">{t.dashboard.partner.verified}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.dashboard.partner.complianceDesc}</p>
              <button className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all">{t.dashboard.partner.viewCompliance}</button>
           </div>

           <div className="bg-primary p-10 rounded-[3rem] text-white space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Percent className="w-6 h-6" /></div>
                 <h3 className="text-xl font-bold">Комиссия МЦ</h3>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                    <span>Текущая ставка</span>
                    <span>{commission}%</span>
                 </div>
                 <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  value={commission} 
                  onChange={e => setCommission(parseInt(e.target.value))}
                  className="w-full accent-white" 
                 />
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">Изменение комиссии вступит в силу со следующего расчетного периода.</p>
              <button onClick={handleSaveCommission} className="w-full py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">Сохранить</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
