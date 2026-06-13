import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';

type PublicDoctor = {
  id: string;
  fullName: string;
  specialty: string;
  experienceYears: number;
  verified: boolean;
  avatar: string;
  pricePrimary: number;
  rating: number;
  reviewsCount?: number;
  headline?: string;
  catalogAudience?: 'doctor' | 'mental' | 'both';
};

const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')}₸`;
const normalizeSearchText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const DoctorsSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await roleApi.publicDoctors();
        setDoctors(list);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить список врачей');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filteredDoctors = useMemo(
    () => {
      const query = normalizeSearchText(searchTerm);
      return doctors.filter((doctor) => {
        const audience = doctor.catalogAudience || 'doctor';
        if (audience !== 'doctor' && audience !== 'both') return false;
        const index = normalizeSearchText(`${doctor.fullName} ${doctor.specialty} ${doctor.headline || ''}`);
        return !query || index.includes(query);
      });
    },
    [doctors, searchTerm]
  );

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка врачей</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-32 px-3 sm:px-4 lg:px-0">
      <div className="pt-8 md:pt-12 space-y-10">
        <div className="mx-auto w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] bg-white p-5 md:p-7 shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Поиск по специализации или имени..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-16 w-full rounded-[2rem] bg-slate-50 pl-14 pr-6 text-base font-black text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {error ? <div className="mx-auto max-w-5xl rounded-2xl bg-red-50 p-4 font-bold text-red-600">{error}</div> : null}

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="rounded-[2.75rem] bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.10)]"
            >
              <div className="flex items-start gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-visible rounded-[1.5rem]">
                  <img src={doctor.avatar} className="h-20 w-20 rounded-[1.5rem] object-cover shadow-xl" alt={doctor.fullName} />
                  {doctor.verified ? (
                    <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="max-w-[170px] truncate text-2xl font-black leading-tight tracking-tight text-[#0f1f3a]">{doctor.fullName}</h3>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.32em] text-primary">{doctor.specialty}</p>
                  <div className="mt-3 flex items-center gap-2 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black">{doctor.rating}</span>
                  </div>
                </div>
              </div>

              <div className="mt-9 grid grid-cols-2 gap-4">
                <div className="rounded-[1.75rem] bg-slate-50 px-5 py-6 text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-slate-400">Опыт</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{doctor.experienceYears} лет</p>
                </div>
                <div className="rounded-[1.75rem] bg-slate-50 px-5 py-6 text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-slate-400">Цена</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{formatPrice(doctor.pricePrimary)}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/doctors-search/${doctor.id}`)}
                className="mt-8 w-full rounded-[1.75rem] bg-[#070d1c] py-5 text-[10px] font-black uppercase tracking-[0.36em] text-white shadow-[0_16px_34px_rgba(7,13,28,0.18)] transition hover:bg-primary"
              >
                Записаться
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorsSearchPage;
