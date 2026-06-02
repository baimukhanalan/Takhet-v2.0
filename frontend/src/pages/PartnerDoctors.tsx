import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Star, TrendingUp, UserCheck, UserPlus, Filter, Mail, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/useLanguage';
import { roleApi } from '../../services/roleApi';

type PartnerDoctor = {
  id: string;
  fullName?: string;
  specialty?: string;
  active?: boolean;
  verified?: boolean;
  experienceYears?: number;
};

const doctorName = (doctor: PartnerDoctor) => doctor.fullName || `Врач ${doctor.id.slice(0, 8)}`;
const doctorSpecialty = (doctor: PartnerDoctor) => {
  const value = (doctor.specialty || '').trim();
  if (!value || value.toLowerCase() === 'general practice') return 'Общая практика';
  return value;
};

const PartnerDoctors: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<PartnerDoctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await roleApi.partnerDoctors();
        setDoctors(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить врачей');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchesSearch =
          doctorName(doctor).toLowerCase().includes(search.toLowerCase()) ||
          doctorSpecialty(doctor).toLowerCase().includes(search.toLowerCase());
        const matchesPending = !showOnlyPending || !doctor.verified;
        return matchesSearch && matchesPending;
      }),
    [doctors, search, showOnlyPending]
  );

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка врачей</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">{t.sidebar.doctors}</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Состав врачей клиники, статусы активации и быстрые действия.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={() => setShowOnlyPending((value) => !value)} className="px-6 py-3.5 bg-white border border-border rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" /> Фильтр
          </button>
          <button onClick={() => navigate('/dashboard', { state: { section: 'activate-doctors' } })} className="px-8 py-4 bg-primary text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all">
            <UserPlus className="w-5 h-5" /> Добавить врача
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { label: 'Всего специалистов', val: doctors.length, icon: Users, color: 'text-primary bg-primary/5' },
          { label: 'Активных врачей', val: doctors.filter((doctor) => doctor.verified).length, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ожидают активации', val: doctors.filter((doctor) => !doctor.verified).length, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-4 md:gap-6">
            <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-foreground mt-1">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search className="w-6 h-6 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по врачу или специальности..."
            className="bg-transparent border-none outline-none text-lg font-bold w-full"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Врач</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Опыт</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Профиль</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-sm border-2 border-white font-black">
                          {doctorName(doctor).slice(0, 2).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${doctor.verified ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                      </div>
                      <div>
                        <h4 className="font-black text-foreground leading-tight">{doctorName(doctor)}</h4>
                        <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">{doctorSpecialty(doctor)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg border flex items-center w-fit gap-2 ${doctor.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      <UserCheck className="w-3 h-3" /> {doctor.verified ? 'Активен' : 'Ожидает'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="font-black text-slate-700">{doctor.experienceYears || 0}</span>
                      <span className="text-[10px] text-slate-300 font-bold ml-1">лет</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-full text-xs">
                      {doctor.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => window.location.href = `mailto:?subject=Takhet doctor ${doctor.id.slice(0, 8)}&body=Doctor: ${doctorName(doctor)}%0ASpecialty: ${doctorSpecialty(doctor)}`} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-primary hover:border-primary/20 transition-all shadow-sm" title="Связаться">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button onClick={() => navigate('/dashboard', { state: { section: 'manage-doctors' } })} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-primary hover:border-primary/20 transition-all shadow-sm" title="Открыть управление врачами">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-24 text-center opacity-30 font-black uppercase tracking-[0.4em]">Специалисты не найдены</div>
        )}
      </div>
    </div>
  );
};

export default PartnerDoctors;
