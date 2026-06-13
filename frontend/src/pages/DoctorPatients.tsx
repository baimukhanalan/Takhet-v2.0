import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';
import { useLiveRefresh } from '../services/useLiveRefresh';

type DoctorCase = {
  id: string;
  patientId: string;
  status: 'open' | 'active' | 'in_review' | 'closed';
  createdAt: string;
};

const formatPatientName = (patientId: string) => `Пациент ${patientId.slice(0, 8)}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatStatus = (status: DoctorCase['status']) => {
  switch (status) {
    case 'open':
      return 'Открыт';
    case 'active':
      return 'Активен';
    case 'in_review':
      return 'На разборе';
    case 'closed':
      return 'Закрыт';
    default:
      return status;
  }
};

const DoctorPatients: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<DoctorCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await roleApi.doctorCases();
      setCases(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '?? ??????? ????????? ?????????');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(async () => {
    await load(true);
  }, { intervalMs: 12000 });

  const uniquePatients = useMemo(() => {
    const patientMap = new Map<string, { id: string; name: string; lastVisit: string; status: string; casesCount: number }>();

    for (const item of cases) {
      const current = patientMap.get(item.patientId);
      if (!current) {
        patientMap.set(item.patientId, {
          id: item.id,
          name: formatPatientName(item.patientId),
          lastVisit: item.createdAt,
          status: item.status,
          casesCount: 1
        });
        continue;
      }

      current.casesCount += 1;
      if (new Date(item.createdAt).getTime() > new Date(current.lastVisit).getTime()) {
        current.lastVisit = item.createdAt;
        current.status = item.status;
        current.id = item.id;
      }
    }

    return [...patientMap.values()].filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase()));
  }, [cases, search]);

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка пациентов</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Мои пациенты</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">Список пациентов по вашим обращениям и активным кейсам.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-border shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search className="w-6 h-6 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пациента..."
            className="bg-transparent border-none outline-none text-lg font-bold w-full"
          />
        </div>
        <div className="divide-y divide-slate-50">
          {uniquePatients.length > 0 ? uniquePatients.map((patient) => (
            <div key={patient.name} className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-6 min-w-0">
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-black text-lg md:text-2xl text-foreground tracking-tight break-words">{patient.name}</h4>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <Calendar className="w-4 h-4 text-primary" /> Последний визит: {formatDate(patient.lastVisit)}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${patient.status === 'closed' ? 'bg-success/10 text-success' : 'bg-blue-50 text-primary'}`}>
                      {formatStatus(patient.status as DoctorCase['status'])}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-100 text-slate-600">
                      {patient.casesCount} кейсов
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                <button onClick={() => navigate(`/consultation/${patient.id}`)} className="px-6 py-3 bg-white border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:border-primary/20 transition-all">
                  Кейсы
                </button>
                <button onClick={() => navigate(`/consultation/${patient.id}`)} className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-primary transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-30 font-black uppercase tracking-[0.4em]">Пациенты не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
