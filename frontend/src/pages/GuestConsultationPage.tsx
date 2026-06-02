import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Search, ShieldCheck, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { roleApi } from '../../services/roleApi';

type AvailabilitySlot = {
  date: string;
  slots: string[];
};

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
  bio?: string;
  education?: string[];
  languages?: string[];
  clinicName?: string;
  city?: string;
  focusAreas?: string[];
  availability?: AvailabilitySlot[];
  catalogAudience?: 'doctor' | 'mental' | 'both';
};

const formatPrice = (value: number) => `${Number(value || 0).toLocaleString('ru-RU')}₸`;
const normalizeSearchText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const formatDateLabel = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    weekday: 'short'
  }).format(new Date(`${date}T12:00:00`));

const resolveAvailableDates = (availability: AvailabilitySlot[] = []) => {
  const directDates = availability.filter((item) => !item.date.startsWith('weekly:'));
  const weeklyDates = availability.filter((item) => item.date.startsWith('weekly:'));
  const generated: AvailabilitySlot[] = [];

  for (let offset = 0; offset < 21; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const weekDay = date.getDay() === 0 ? 7 : date.getDay();
    for (const item of weeklyDates) {
      const configuredDay = Number(item.date.replace('weekly:', ''));
      if (configuredDay === weekDay) {
        generated.push({ date: toIsoDate(date), slots: item.slots });
      }
    }
  }

  return [...directDates, ...generated]
    .filter((item) => item.slots?.length)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);
};

const GuestConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await roleApi.publicDoctors();
        const activeDoctors = list.filter((doctor) => {
          const audience = doctor.catalogAudience || 'doctor';
          return audience === 'doctor' || audience === 'both';
        });
        setDoctors(activeDoctors);
        if (activeDoctors[0]) {
          setSelectedDoctorId(activeDoctors[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить врачей');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) {
      setSelectedDoctor(null);
      return;
    }

    const loadDoctor = async () => {
      setError(null);
      setSelectedDate('');
      setSelectedSlot('');
      setPhoneVerificationToken('');
      setOtpCode('');
      try {
        const profile = await roleApi.publicDoctor(selectedDoctorId);
        setSelectedDoctor(profile);
      } catch {
        setSelectedDoctor(doctors.find((doctor) => doctor.id === selectedDoctorId) || null);
      }
    };

    void loadDoctor();
  }, [selectedDoctorId, doctors]);

  const filteredDoctors = useMemo(() => {
    const query = normalizeSearchText(searchTerm);
    return doctors.filter((doctor) => {
      const index = normalizeSearchText(`${doctor.fullName} ${doctor.specialty} ${doctor.headline || ''}`);
      return !query || index.includes(query);
    });
  }, [doctors, searchTerm]);

  const availableDates = useMemo(() => resolveAvailableDates(selectedDoctor?.availability || []), [selectedDoctor]);
  const activeDate = availableDates.find((item) => item.date === selectedDate) || null;

  const requestOtp = async () => {
    setError(null);
    setStatus(null);
    try {
      const result = await roleApi.requestGuestPhoneOtp({ phone: phone.trim() });
      setOtpRequested(true);
      setPhoneVerificationToken('');
      setStatus(result.devCode ? `SMS-код подготовлен. Тестовый код: ${result.devCode}` : 'SMS-код отправлен на указанный номер.');
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : 'Не удалось отправить SMS-код');
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setStatus(null);
    try {
      const result = await roleApi.verifyGuestPhoneOtp({ phone: phone.trim(), code: otpCode.trim() });
      setPhoneVerificationToken(result.phoneVerificationToken);
      setStatus('Телефон подтвержден. Теперь можно забронировать выбранный слот.');
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : 'Не удалось подтвердить телефон');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedSlot || !phoneVerificationToken) return;

    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      const result = await roleApi.guestCreateConsultation({
        doctorId: selectedDoctorId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        preferredDate: selectedDate,
        preferredSlot: selectedSlot,
        phoneVerificationToken
      });
      setStatus(`Запись создана. Номер консультации: ${String(result.caseId || '').slice(0, 8)}. Финальный PDF будет доступен один раз после консультации.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось создать консультацию без регистрации');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PublicHeader activePath="/" />
      <main className="px-4 md:px-10 xl:px-20 pb-24 pt-28 md:pt-36">
        <div className="mx-auto max-w-7xl space-y-10">
          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Консультация без регистрации</p>
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-slate-950">
                Врач онлайн <span className="text-primary">без аккаунта</span>
              </h1>
              <p className="max-w-3xl text-base md:text-lg font-medium leading-relaxed text-slate-500">
                Выберите врача, откройте профиль, подтвердите телефон по SMS и забронируйте доступный слот: финальное PDF-заключение доступно один раз, а саммари консультации не сохраняется в медархиве.
              </p>
            </div>
            <div className="rounded-[2.5rem] border border-amber-100 bg-amber-50 p-6 text-sm font-bold leading-relaxed text-amber-800">
              <CheckCircle2 className="mb-4 h-6 w-6 text-amber-600" />
              Для постоянного хранения истории, PDF и медицинского архива лучше войти или зарегистрироваться. Гостевой формат нужен для быстрой разовой онлайн-консультации.
            </div>
          </section>

          <section className="space-y-8">
            <div className="rounded-[2rem] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
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

            {loading ? (
              <div className="py-20 text-center text-xs font-black uppercase tracking-[0.3em] text-slate-400">Загрузка врачей</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`rounded-[2.75rem] bg-white p-8 text-left shadow-[0_20px_70px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 ${
                      selectedDoctorId === doctor.id ? 'ring-2 ring-primary' : 'ring-1 ring-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <div className="relative h-20 w-20 shrink-0">
                        <img src={doctor.avatar} className="h-20 w-20 rounded-[1.5rem] object-cover shadow-xl" alt={doctor.fullName} />
                        {doctor.verified ? (
                          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 pt-1">
                        <h3 className="max-w-[190px] truncate text-2xl font-black leading-tight tracking-tight text-[#0f1f3a]">{doctor.fullName}</h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.32em] text-primary">{doctor.specialty}</p>
                        <div className="mt-3 flex items-center gap-2 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-black">{doctor.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="rounded-[1.75rem] bg-slate-50 px-5 py-5 text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.28em] text-slate-400">Опыт</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{doctor.experienceYears} лет</p>
                      </div>
                      <div className="rounded-[1.75rem] bg-slate-50 px-5 py-5 text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.28em] text-slate-400">Цена</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{formatPrice(doctor.pricePrimary)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {selectedDoctor ? (
            <section className="grid gap-8 rounded-[3rem] bg-slate-950 p-5 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] lg:grid-cols-[0.95fr_1.05fr] md:p-8">
              <div className="rounded-[2.5rem] bg-white p-8 text-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Профиль врача</p>
                <div className="mt-6 flex items-start gap-5">
                  <img src={selectedDoctor.avatar} className="h-24 w-24 rounded-[2rem] object-cover shadow-xl" alt={selectedDoctor.fullName} />
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedDoctor.fullName}</h2>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.32em] text-primary">{selectedDoctor.specialty}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                      <span className="rounded-full bg-slate-100 px-4 py-2">{selectedDoctor.experienceYears} лет опыта</span>
                      <span className="rounded-full bg-slate-100 px-4 py-2">{formatPrice(selectedDoctor.pricePrimary)}</span>
                      <span className="rounded-full bg-amber-50 px-4 py-2 text-amber-600">★ {selectedDoctor.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-7 text-sm font-semibold leading-relaxed text-slate-500">
                  {selectedDoctor.bio || selectedDoctor.headline || 'Врач проводит онлайн-консультации и помогает быстро определить следующий безопасный шаг.'}
                </p>
                <div className="mt-6 grid gap-3 text-xs font-bold text-slate-500">
                  {selectedDoctor.education?.slice(0, 3).map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</div>
                  ))}
                  {selectedDoctor.clinicName ? <div className="rounded-2xl bg-slate-50 px-4 py-3">{selectedDoctor.clinicName}</div> : null}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 rounded-[2.5rem] bg-white p-6 text-slate-950 md:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Дата и время</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableDates.map((item) => (
                    <button
                      type="button"
                      key={item.date}
                      onClick={() => {
                        setSelectedDate(item.date);
                        setSelectedSlot('');
                      }}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-xs font-black uppercase tracking-widest ${
                        selectedDate === item.date ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                      {formatDateLabel(item.date)}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(activeDate?.slots || []).map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-xs font-black uppercase tracking-widest ${
                        selectedSlot === slot ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-white text-slate-600'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {slot}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Имя пациента" className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-primary focus:bg-white" />
                  <input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Телефон для SMS" className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-primary focus:bg-white" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email для PDF" className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-primary focus:bg-white" />
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <button type="button" onClick={requestOtp} disabled={!phone.trim()} className="rounded-2xl bg-slate-950 px-5 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                    Отправить SMS-код
                  </button>
                  <input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder={otpRequested ? 'Код из SMS' : 'Сначала запросите код'} className="rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-primary focus:bg-white" />
                  <button type="button" onClick={verifyOtp} disabled={!otpCode.trim()} className="rounded-2xl bg-primary px-5 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                    Подтвердить телефон
                  </button>
                </div>

                {error ? <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600">{error}</div> : null}
                {status ? <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-700">{status}</div> : null}

                <button
                  disabled={submitting || !selectedDoctorId || !selectedDate || !selectedSlot || !phoneVerificationToken}
                  className="w-full rounded-[2rem] bg-primary py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl disabled:opacity-60"
                >
                  {submitting ? 'Создаем запись' : 'Забронировать слот'}
                </button>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Перед оплатой требуется SMS-подтверждение. Напоминание о консультации создается за 1 час.
                </p>
              </form>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default GuestConsultationPage;
