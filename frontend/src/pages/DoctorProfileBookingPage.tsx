import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Star, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
  bio?: string;
  clinicName?: string;
  availability?: { date: string; slots: string[] }[];
};

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createCalendarDays = (visibleMonth: Date) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;

  return [
    ...Array.from({ length: mondayOffset }, (_, index) => ({ key: `empty-${index}`, label: '', dateKey: '' })),
    ...Array.from({ length: daysCount }, (_, index) => {
      const day = index + 1;
      return { key: String(day), label: String(day), dateKey: toDateKey(new Date(year, month, day)) };
    })
  ];
};

const formatPrice = (value: number) => `${value.toLocaleString('ru-RU')}₸`;

const DoctorProfileBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<PublicDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) return;
      setLoading(true);
      setError(null);
      try {
        const nextDoctor = await roleApi.publicDoctor(doctorId);
        const firstDate = nextDoctor.availability?.[0]?.date || toDateKey(new Date());
        const firstSlot = nextDoctor.availability?.[0]?.slots?.[0] || '';
        setDoctor(nextDoctor);
        setSelectedDate(firstDate);
        setSelectedSlot(firstSlot);
        setVisibleMonth(new Date(`${firstDate}T00:00:00`));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить профиль врача');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [doctorId]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of doctor?.availability || []) {
      map.set(item.date, item.slots || []);
    }
    return map;
  }, [doctor]);

  const selectedSlots = availabilityByDate.get(selectedDate) || [];
  const calendarDays = useMemo(() => createCalendarDays(visibleMonth), [visibleMonth]);

  const selectDate = (dateKey: string) => {
    if (!dateKey || !availabilityByDate.has(dateKey)) return;
    const slots = availabilityByDate.get(dateKey) || [];
    setSelectedDate(dateKey);
    setSelectedSlot(slots[0] || '');
  };

  const changeMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const confirmBooking = async () => {
    if (!doctor || !selectedDate || !selectedSlot) {
      setError('Выберите врача, дату и время записи');
      return;
    }

    setError(null);
    navigate(`/doctors-search/${doctor.id}/confirm`, {
      state: {
        doctor,
        selectedDate,
        selectedSlot,
        bookingNote: ''
      }
    });
    return;

    try {
      await roleApi.patientCreateCase({
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot,
        summary: [
          'Запись к врачу',
          `Врач: ${doctor.fullName}`,
          `Специальность: ${doctor.specialty}`,
          `Дата: ${selectedDate}`,
          `Время: ${selectedSlot}`,
          'Комментарий пациента: Без дополнительного комментария',
          'Статус оплаты: подтверждение Kaspi Pay будет подключено позже'
        ].join('\n')
      });
      navigate(`/doctors-search/${doctor.id}/confirm`, {
        state: {
          doctor,
          selectedDate,
          selectedSlot,
          bookingNote: ''
        }
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка профиля врача</div>;
  }

  if (error || !doctor) {
    return <div className="max-w-5xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error || 'Врач не найден'}</div>;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 px-4 py-6 backdrop-blur-[2px]">
      <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[3rem] bg-white shadow-[0_40px_140px_rgba(15,23,42,0.28)] md:grid-cols-[1.25fr_1fr]">
        <button
          onClick={() => navigate(-1)}
          className="absolute right-7 top-7 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <section className="min-h-[560px] px-8 py-12 md:px-14 md:py-14">
          <div className="flex items-start gap-8">
            <div className="relative h-28 w-28 shrink-0">
              <img src={doctor.avatar} alt={doctor.fullName} className="h-28 w-28 rounded-[1.75rem] object-cover shadow-2xl" />
              {doctor.verified ? (
                <span className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary text-white shadow-lg">
                  <ShieldCheck className="h-5 w-5" />
                </span>
              ) : null}
            </div>

            <div className="min-w-0 pt-1">
              <h1 className="max-w-[310px] text-4xl font-black leading-[0.95] tracking-tight text-[#10213d]">{doctor.fullName}</h1>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.42em] text-primary">{doctor.specialty}</p>
              <div className="mt-5 flex items-center gap-5">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-base font-black">{doctor.rating}</span>
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{doctor.reviewsCount || 0} отзывов</span>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <p className="text-[10px] font-black uppercase tracking-[0.52em] text-slate-400">О специалисте</p>
            <div className="mt-6 rounded-[2rem] border border-slate-100 bg-white px-8 py-7 shadow-sm">
              <p className="text-xl font-semibold italic leading-relaxed text-slate-500">
                "{doctor.bio || doctor.headline || 'Специалист по онлайн-консультациям.'}"
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white/80 px-8 py-12 md:border-l md:border-t-0 md:px-12 md:py-14">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#10213d]">Запись</h2>

          <div className="mt-9 rounded-[2rem] bg-slate-50 p-8">
            <div className="mb-7 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#10213d]">{monthNames[visibleMonth.getMonth()]}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => changeMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-5 text-center">
              {weekdayNames.map((day) => (
                <div key={day} className="text-[10px] font-black text-slate-400">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const isAvailable = availabilityByDate.has(day.dateKey);
                const isSelected = selectedDate === day.dateKey;
                return (
                  <button
                    key={day.key}
                    onClick={() => selectDate(day.dateKey)}
                    disabled={!isAvailable}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black transition ${
                      isSelected
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : isAvailable
                          ? 'text-slate-800 hover:bg-white'
                          : 'text-slate-300'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-9">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">Доступное время</p>
            <div className="grid grid-cols-3 gap-3">
              {selectedSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-2xl border px-5 py-4 text-sm font-black transition ${
                    selectedSlot === slot
                      ? 'border-primary bg-primary text-white shadow-xl shadow-primary/25'
                      : 'border-slate-100 bg-white text-slate-900 hover:border-primary/30'
                  }`}
                >
                  {slot}
                </button>
              ))}
              {selectedSlots.length === 0 ? (
                <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-400">
                  Нет доступного времени
                </div>
              ) : null}
            </div>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-600">{error}</div> : null}

          <button
            onClick={() => void confirmBooking()}
            disabled={!selectedDate || !selectedSlot || submitting}
            className="mt-9 w-full rounded-[2rem] bg-[#070d1c] py-6 text-[11px] font-black uppercase tracking-[0.34em] text-white shadow-[0_22px_45px_rgba(7,13,28,0.18)] transition hover:bg-primary disabled:opacity-60"
          >
            {submitting ? 'Создание записи...' : `К оплате: ${formatPrice(doctor.pricePrimary)}`}
          </button>
        </section>
      </div>
    </div>
  );
};

export default DoctorProfileBookingPage;
