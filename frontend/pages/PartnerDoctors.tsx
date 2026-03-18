import React, { useState, useEffect } from 'react';
import { Users, Search, MoreVertical, Star, TrendingUp, UserCheck, UserPlus, Filter, Mail, X } from 'lucide-react';
import { MockDB } from '../services/db';
import { Doctor } from '../types';
import { translations, Language } from '../services/i18n';
import { roleApi } from '../services/roleApi';

const toDoctorVm = (d: any): Doctor & { active?: boolean } => ({
  id: d.id,
  name: d.fullName || d.name,
  specialty: d.specialty || 'General',
  experience: 5,
  rating: 4.8,
  reputationPoints: 1000,
  reviewsCount: 0,
  pricePrimary: 0,
  priceSecondary: 0,
  education: [],
  biography: d.bio || '',
  accepts: 'Всех',
  category: 'Первая',
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
  participatesInCommunity: false,
  schedule: {},
  edsVerified: Boolean(d.active),
  active: Boolean(d.active)
});

const PartnerDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<(Doctor & { active?: boolean })[]>([]);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('General');
  const [statusText, setStatusText] = useState('');

  const load = async () => {
    setLang(MockDB.getLang());
    try {
      const data = await roleApi.partnerDoctors();
      setDoctors((data || []).map(toDoctorVm));
    } catch {
      setDoctors(MockDB.getDoctors() as any);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('storage_update', load as any);
    return () => window.removeEventListener('storage_update', load as any);
  }, []);

  const t = translations[lang];

  const filtered = doctors.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (doctor: Doctor & { active?: boolean }) => {
    try {
      if (doctor.active) await roleApi.partnerDeactivateDoctor(doctor.id);
      else await roleApi.partnerActivateDoctor(doctor.id);
      setStatusText(`Статус врача ${doctor.name} обновлён в backend.`);
      await load();
    } catch {
      setDoctors(prev => prev.map(d => (d.id === doctor.id ? { ...d, active: !doctor.active } : d)));
      setStatusText(`Статус врача ${doctor.name} обновлён локально.`);
    }
  };

  const handleCreateDoctor = async () => {
    if (!newDoctorName.trim()) return;
    try {
      await roleApi.partnerCreateDoctor(newDoctorName.trim(), newDoctorSpecialty.trim() || 'General');
      setStatusText('Врач создан через backend.');
      setIsCreateOpen(false);
      setNewDoctorName('');
      setNewDoctorSpecialty('General');
      await load();
    } catch {
      setStatusText('Не удалось создать врача в backend.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">Добавить врача</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-3 rounded-xl bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <input value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-medium" placeholder="ФИО" />
            <input value={newDoctorSpecialty} onChange={(e) => setNewDoctorSpecialty(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-medium" placeholder="Специализация" />
            <button onClick={handleCreateDoctor} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest">Создать</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">{t.sidebar.doctors}</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Контроль активности и эффективности врачей вашей клиники.</p>
          {statusText && <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary">{statusText}</p>}
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white border border-border rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
             <Filter className="w-4 h-4" /> Фильтр
          </button>
          <button onClick={() => setIsCreateOpen(true)} className="px-8 py-4 bg-primary text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
             <UserPlus className="w-5 h-5" /> Добавить врача
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Всего специалистов', val: doctors.length, icon: Users, color: 'text-primary bg-primary/5' },
           { label: 'Средний рейтинг', val: '4.85', icon: Star, color: 'text-amber-500 bg-amber-50' },
           { label: 'Активных сессий', val: String(filtered.filter(d => d.active).length), icon: TrendingUp, color: 'text-success bg-success/5' },
         ].map((s, i) => (
           <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-6">
              <div className={`w-16 h-16 ${s.color} rounded-2xl flex items-center justify-center`}><s.icon className="w-8 h-8" /></div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                 <p className="text-3xl font-black text-foreground mt-1">{s.val}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search className="w-6 h-6 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по ФИО или специализации..." className="bg-transparent border-none outline-none text-lg font-bold w-full" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50/50 border-b border-slate-100"><tr><th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Врач</th><th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</th><th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Эффективность</th><th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Репутация</th><th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Действия</th></tr></thead>
             <tbody className="divide-y divide-slate-50">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="p-6"><div className="flex items-center gap-5"><div className="relative"><img src={doc.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" alt="" /><div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${doc.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div></div><div><h4 className="font-black text-foreground leading-tight">{doc.name}</h4><p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">{doc.specialty}</p></div></div></td>
                     <td className="p-6"><button onClick={() => handleToggleActive(doc)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg border flex items-center w-fit gap-2 ${doc.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}><UserCheck className="w-3 h-3" /> {doc.active ? 'В сети' : 'Неактивен'}</button></td>
                     <td className="p-6"><div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500 fill-current" /><span className="font-black text-slate-700">{doc.rating}</span></div></td>
                     <td className="p-6"><span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-full text-xs">{doc.reputationPoints} pts</span></td>
                     <td className="p-6"><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-3 bg-white border border-slate-200 rounded-xl hover:text-primary hover:border-primary/20 transition-all shadow-sm"><Mail className="w-4 h-4" /></button><button className="p-3 bg-white border border-slate-200 rounded-xl hover:text-primary hover:border-primary/20 transition-all shadow-sm"><MoreVertical className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-24 text-center opacity-30 font-black uppercase tracking-[0.4em]">Специалисты не найдены</div>}
      </div>
    </div>
  );
};

export default PartnerDoctors;
