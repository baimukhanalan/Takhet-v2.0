import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, CreditCard, Globe, Save, Shield, Star, Stethoscope, Users } from 'lucide-react';
import { User, UserRole } from '../types';
import { useLanguage } from '../services/useLanguage';
import { LANGUAGE_OPTIONS, type Language } from '../services/language';
import { roleApi } from '../../services/roleApi';

type NotificationItem = {
  id: string;
  title?: string | null;
  body?: string | null;
  createdAt?: string;
};

type PaymentItem = {
  id: string;
  amount: number;
  currency?: string | null;
  status?: string | null;
  createdAt?: string;
  caseId?: string | null;
};

type DoctorProfile = {
  id: string;
  avatar?: string;
  fullName?: string;
  specialty?: string;
  bio?: string;
  verified?: boolean;
  experienceYears?: number;
  headline?: string;
  languages?: string[];
  consultationModes?: string[];
  focusAreas?: string[];
  education?: string[];
  availability?: { date: string; slots: string[] }[];
  availabilityRules?: { date: string; slots: string[] }[];
  city?: string;
  clinicName?: string;
  responseTargetHours?: number;
  pricePrimary?: number;
  accepts?: string;
  rating?: number;
  reviewsCount?: number;
  recentReviews?: { caseId: string; score: number; review: string; createdAt: string }[];
};

type PartnerDoctor = {
  id: string;
  fullName?: string;
  specialty?: string | null;
  specialization?: string | null;
  verified?: boolean;
  experienceYears?: number | null;
  rating?: number;
  reviewsCount?: number;
};

type PortalProfile = {
  phone?: string;
  city?: string;
  organizationName?: string;
  emergencyContact?: string;
  notificationsMode?: string;
  preferredChannel?: string;
  about?: string;
};

const cardClassName = 'bg-white border border-border rounded-[2rem] p-5 md:p-7 xl:p-8 shadow-sm space-y-5';

const splitField = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const joinField = (value?: string[]) => (value && value.length > 0 ? value.join(', ') : '');
const parseAvailabilityText = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, slots] = line.split('|');
      return {
        date: (date || '').trim(),
        slots: (slots || '')
          .split(',')
          .map((slot) => slot.trim())
          .filter(Boolean)
      };
    })
    .filter((item) => item.date);

const serializeAvailability = (value: { date: string; slots: string[] }[]) =>
  value
    .filter((item) => item.date && item.slots.length > 0)
    .map((item) => `${item.date}|${item.slots.join(',')}`)
    .join('\n');

const weekdayOptions = [
  { value: '1', label: 'Пн' },
  { value: '2', label: 'Вт' },
  { value: '3', label: 'Ср' },
  { value: '4', label: 'Чт' },
  { value: '5', label: 'Пт' },
  { value: '6', label: 'Сб' },
  { value: '0', label: 'Вс' }
];

const formatAvailabilityDate = (date: string) => {
  const weekly = /^weekly:(\d)$/.exec(date);
  if (!weekly) return date;
  return `Каждую ${weekdayOptions.find((item) => item.value === weekly[1])?.label || 'неделю'}`;
};

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
  const { lang, setLanguage, formatDateTime } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(lang);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    avatar: '',
    fullName: '',
    specialty: '',
    bio: '',
    headline: '',
    languages: '',
    consultationModes: '',
    focusAreas: '',
    education: '',
    availability: '',
    city: '',
    clinicName: '',
    experienceYears: '0',
    responseTargetHours: '2',
    pricePrimary: '15000',
    accepts: ''
  });
  const [availabilityDraftWeekdays, setAvailabilityDraftWeekdays] = useState<string[]>([]);
  const [availabilityDraftSlots, setAvailabilityDraftSlots] = useState('');
  const [portalProfile, setPortalProfile] = useState<PortalProfile>({
    phone: '',
    city: '',
    emergencyContact: '',
    organizationName: '',
    notificationsMode: 'instant',
    preferredChannel: 'app',
    about: ''
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [partnerDoctors, setPartnerDoctors] = useState<PartnerDoctor[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (user.role === UserRole.DOCTOR) {
          const [profile, doctorNotifications] = await Promise.all([roleApi.doctorProfile(), roleApi.myNotifications()]);
          setDoctorProfile(profile);
          setDoctorForm({
            avatar: profile.avatar || '',
            fullName: profile.fullName || '',
            specialty: profile.specialty || '',
            bio: profile.bio || '',
            headline: profile.headline || '',
            languages: joinField(profile.languages),
            consultationModes: joinField(profile.consultationModes),
            focusAreas: joinField(profile.focusAreas),
            education: joinField(profile.education),
            availability: (profile.availabilityRules || profile.availability || []).map((item) => `${item.date}|${item.slots.join(',')}`).join('\n'),
            city: profile.city || '',
            clinicName: profile.clinicName || '',
            experienceYears: String(profile.experienceYears || 0),
            responseTargetHours: String(profile.responseTargetHours || 2),
            pricePrimary: String(profile.pricePrimary || 15000),
            accepts: profile.accepts || ''
          });
          setNotifications(doctorNotifications);
        }

        if (user.role === UserRole.PATIENT) {
          const [patientNotifications, patientPayments, patientProfile] = await Promise.all([
            roleApi.patientNotifications(),
            roleApi.patientPayments(),
            roleApi.patientProfile()
          ]);
          setNotifications(patientNotifications);
          setPayments(patientPayments);
          setPortalProfile(patientProfile);
        }

        if (user.role === UserRole.PARTNER) {
          const [doctors, requests, profile] = await Promise.all([roleApi.partnerDoctors(), roleApi.partnerRequests(), roleApi.partnerProfile()]);
          setPartnerDoctors(doctors);
          setPartnerRequests(requests?.pendingDoctors || []);
          setPortalProfile(profile);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить настройки');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user.role]);

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      setLanguage(selectedLanguage);

      if (user.role === UserRole.DOCTOR) {
        const updated = await roleApi.doctorUpdateProfile({
          avatar: doctorForm.avatar.trim(),
          fullName: doctorForm.fullName.trim(),
          specialty: doctorForm.specialty.trim(),
          bio: doctorForm.bio.trim(),
          headline: doctorForm.headline.trim(),
          languages: splitField(doctorForm.languages),
          consultationModes: splitField(doctorForm.consultationModes),
          focusAreas: splitField(doctorForm.focusAreas),
          education: splitField(doctorForm.education),
          availability: doctorForm.availability
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [date, slots] = line.split('|');
              return {
                date: (date || '').trim(),
                slots: (slots || '').split(',').map((slot) => slot.trim()).filter(Boolean)
              };
            }),
          city: doctorForm.city.trim(),
          clinicName: doctorForm.clinicName.trim(),
          experienceYears: Number(doctorForm.experienceYears) || 0,
          responseTargetHours: Number(doctorForm.responseTargetHours) || 2,
          pricePrimary: Number(doctorForm.pricePrimary) || 15000,
          accepts: doctorForm.accepts.trim()
        });
        setDoctorProfile(updated);
      }

      if (user.role === UserRole.PATIENT) {
        const updated = await roleApi.patientUpdateProfile(portalProfile);
        setPortalProfile(updated);
      }

      if (user.role === UserRole.PARTNER) {
        const updated = await roleApi.partnerUpdateProfile(portalProfile);
        setPortalProfile(updated);
      }

      setMessage('Настройки сохранены');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const doctorStats = useMemo(() => {
    if (!doctorProfile) return [];
    return [
      { label: 'Статус', value: doctorProfile.verified ? 'Подтвержден' : 'На проверке' },
      { label: 'Рейтинг', value: `${doctorProfile.rating || 4.8} / 5` },
      { label: 'Отзывы', value: `${doctorProfile.reviewsCount || 0}` },
      { label: 'Опыт', value: `${doctorProfile.experienceYears || 0} лет` }
    ];
  }, [doctorProfile]);

  const availabilityEntries = useMemo(() => parseAvailabilityText(doctorForm.availability), [doctorForm.availability]);

  const addAvailabilityEntry = () => {
    const weekdays = availabilityDraftWeekdays;
    const slots = availabilityDraftSlots
      .split(',')
      .map((slot) => slot.trim())
      .filter(Boolean);

    if (weekdays.length === 0 || slots.length === 0) return;

    const next = [...availabilityEntries];
    weekdays.forEach((weekday) => {
      const date = `weekly:${weekday}`;
      const existing = next.find((item) => item.date === date);
      if (existing) {
        existing.slots = Array.from(new Set([...existing.slots, ...slots])).sort();
      } else {
        next.push({ date, slots: Array.from(new Set(slots)).sort() });
      }
    });
    next.sort((a, b) => a.date.localeCompare(b.date));

    setDoctorForm((state) => ({ ...state, availability: serializeAvailability(next) }));
    setAvailabilityDraftWeekdays([]);
    setAvailabilityDraftSlots('');
  };

  const removeAvailabilityEntry = (date: string) => {
    setDoctorForm((state) => ({
      ...state,
      availability: serializeAvailability(availabilityEntries.filter((item) => item.date !== date))
    }));
  };

  const partnerStats = useMemo(() => {
    const ratedDoctors = partnerDoctors.filter((item) => typeof item.rating === 'number');
    const avgRating =
      ratedDoctors.length > 0
        ? (ratedDoctors.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratedDoctors.length).toFixed(1)
        : '4.8';

    return [
      { label: 'Всего врачей', value: `${partnerDoctors.length}` },
      { label: 'Подтверждено', value: `${partnerDoctors.filter((item) => item.verified).length}` },
      { label: 'Ожидают', value: `${partnerRequests.length}` },
      { label: 'Средний рейтинг', value: avgRating }
    ];
  }, [partnerDoctors, partnerRequests]);

  if (loading) {
    return <div className="max-w-6xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка настроек</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20 px-3 sm:px-4 md:px-0">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-foreground">Настройки</h1>
          <p className="text-muted-foreground text-base md:text-lg font-medium mt-2">Профиль, слоты, рейтинг и личные предпочтения.</p>
        </div>
        <button
          onClick={() => void savePreferences()}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-3"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 px-5 py-4 font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          {message}
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 text-red-700 px-5 py-4 font-bold">{error}</div>}

      <div className={cardClassName}>
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black uppercase tracking-tight">Язык и общие предпочтения</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedLanguage(option.value)}
              className={`px-5 py-4 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all ${
                selectedLanguage === option.value ? 'border-primary bg-primary text-white' : 'border-border bg-slate-50 text-slate-600'
              }`}
            >
              {option.flag} {option.label}
            </button>
          ))}
        </div>
      </div>

      {user.role === UserRole.DOCTOR && (
        <>
          <div className={cardClassName}>
            <div className="flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Профиль врача</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {doctorStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">{stat.label}</p>
                  <p className="text-lg font-black text-slate-900 mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Имя врача</label>
                <input
                  value={doctorForm.fullName}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, fullName: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Алан Баймухан"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Специальность</label>
                <input
                  value={doctorForm.specialty}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, specialty: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Врач общей практики"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Фото профиля</label>
                <input
                  value={doctorForm.avatar}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, avatar: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Опыт работы</label>
                <input
                  type="number"
                  min={0}
                  value={doctorForm.experienceYears}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, experienceYears: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Краткий заголовок</label>
                <input
                  value={doctorForm.headline}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, headline: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Кардиология, хронические пациенты, повторные консультации"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Клиника и город</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={doctorForm.clinicName}
                    onChange={(event) => setDoctorForm((state) => ({ ...state, clinicName: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                    placeholder="Клиника или сеть"
                  />
                  <input
                    value={doctorForm.city}
                    onChange={(event) => setDoctorForm((state) => ({ ...state, city: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                    placeholder="Город"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Публичное описание</label>
              <textarea
                value={doctorForm.bio}
                onChange={(event) => setDoctorForm((state) => ({ ...state, bio: event.target.value }))}
                rows={5}
                className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Коротко о враче"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Языки консультации</label>
                <input
                  value={doctorForm.languages}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, languages: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Русский, Қазақша, English"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Форматы консультации</label>
                <input
                  value={doctorForm.consultationModes}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, consultationModes: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="ИИ-маршрутизация, чат, видео"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Ключевые направления</label>
                <input
                  value={doctorForm.focusAreas}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, focusAreas: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Гипертония, наблюдение, профилактика"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Образование и сертификаты</label>
                <input
                  value={doctorForm.education}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, education: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="ВУЗ, резидентура, сертификаты"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Календарь доступности</label>
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr_auto] gap-3">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {weekdayOptions.map((day) => {
                    const active = availabilityDraftWeekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() =>
                          setAvailabilityDraftWeekdays((current) =>
                            current.includes(day.value)
                              ? current.filter((item) => item !== day.value)
                              : [...current, day.value]
                          )
                        }
                        className={`rounded-2xl border px-3 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                          active ? 'border-primary bg-primary text-white' : 'border-border bg-slate-50 text-slate-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={availabilityDraftSlots}
                  onChange={(event) => setAvailabilityDraftSlots(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="10:00, 12:00, 15:00"
                />
                <button
                  type="button"
                  onClick={addAvailabilityEntry}
                  className="rounded-2xl bg-primary text-white px-6 py-4 font-black text-xs uppercase tracking-widest"
                >
                  Добавить
                </button>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 font-medium">
                Выберите дни недели и перечислите доступное время через запятую. Пациент увидит все будущие даты по этим дням.
              </div>
              <div className="grid gap-3">
                {availabilityEntries.length > 0 ? (
                  availabilityEntries.map((item) => (
                    <div key={item.date} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{formatAvailabilityDate(item.date)}</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">{item.slots.join(', ')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAvailabilityEntry(item.date)}
                        className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-400">
                    Пока нет доступных дней. Добавьте дни недели и временные слоты.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Целевое время ответа</label>
                <input
                  type="number"
                  min={1}
                  value={doctorForm.responseTargetHours}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, responseTargetHours: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Цена основной консультации</label>
                <input
                  type="number"
                  min={0}
                  value={doctorForm.pricePrimary}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, pricePrimary: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">Принимает</label>
                <input
                  value={doctorForm.accepts}
                  onChange={(event) => setDoctorForm((state) => ({ ...state, accepts: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                  placeholder="Взрослых / Детей / Всех"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Последние уведомления</h2>
              </div>
              <div className="space-y-3">
                {notifications.length > 0 ? notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="font-black text-slate-900">{item.title || 'Уведомление'}</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">{item.body || 'Подробности пока недоступны'}</p>
                  </div>
                )) : (
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Пока нет уведомлений</div>
                )}
              </div>
            </div>
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-black uppercase tracking-tight">Последние оценки</h2>
              </div>
              <div className="space-y-3">
                {(doctorProfile?.recentReviews || []).length > 0 ? (
                  doctorProfile?.recentReviews?.map((review) => (
                    <div key={review.caseId} className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
                      <p className="font-black text-slate-900">Обращение #{review.caseId.slice(0, 8)} · {review.score}/5</p>
                      <p className="text-sm text-slate-600 font-medium mt-1">{review.review}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Пока нет оценок</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {user.role === UserRole.PATIENT && (
        <>
          <div className={cardClassName}>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Профиль пациента</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <input
                value={portalProfile.phone || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, phone: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Телефон"
              />
              <input
                value={portalProfile.city || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, city: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Город"
              />
              <input
                value={portalProfile.emergencyContact || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, emergencyContact: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Контакт на случай срочной связи"
              />
              <input
                value={portalProfile.notificationsMode || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, notificationsMode: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Режим уведомлений"
              />
              <input
                value={portalProfile.preferredChannel || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, preferredChannel: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Предпочтительный канал"
              />
              <textarea
                value={portalProfile.about || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, about: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium md:col-span-2 xl:col-span-3 min-h-32"
                placeholder="Комментарий для команды сопровождения"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Уведомления пациента</h2>
              </div>
              <div className="space-y-3">
                {notifications.length > 0 ? notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="font-black text-slate-900">{item.title || 'Уведомление'}</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">{item.body || 'Подробности пока недоступны'}</p>
                  </div>
                )) : (
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Пока нет уведомлений</div>
                )}
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">История оплат</h2>
              </div>
              <div className="space-y-3">
                {payments.length > 0 ? payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-900">Обращение #{payment.caseId?.slice(0, 8) || '—'}</p>
                      <p className="text-sm text-slate-500 font-medium mt-1">{payment.createdAt ? formatDateTime(payment.createdAt) : 'Недавно'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{payment.amount} {payment.currency || '₸'}</p>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-1">{payment.status === 'paid' ? 'Оплачено' : payment.status === 'failed' ? 'Ошибка оплаты' : payment.status === 'created' ? 'Создано' : 'Ожидает'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Пока нет оплат</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {user.role === UserRole.PARTNER && (
        <>
          <div className={cardClassName}>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Профиль партнера</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <input
                value={portalProfile.organizationName || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, organizationName: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Название организации"
              />
              <input
                value={portalProfile.phone || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, phone: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Рабочий телефон"
              />
              <input
                value={portalProfile.city || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, city: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Город"
              />
              <input
                value={portalProfile.notificationsMode || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, notificationsMode: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Режим уведомлений"
              />
              <input
                value={portalProfile.preferredChannel || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, preferredChannel: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
                placeholder="Основной канал связи"
              />
              <textarea
                value={portalProfile.about || ''}
                onChange={(event) => setPortalProfile((state) => ({ ...state, about: event.target.value }))}
                className="rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium md:col-span-2 xl:col-span-3 min-h-32"
                placeholder="Модель работы, заметки и особенности маршрутизации"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {partnerStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className={cardClassName}>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Реестр врачей</h2>
            </div>
            <div className="grid gap-3">
              {partnerDoctors.map((doctor) => (
                <div key={doctor.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-3 items-center">
                  <div>
                    <p className="font-black text-slate-900">{doctor.fullName || `Врач #${doctor.id.slice(0, 8)}`}</p>
                    <p className="text-sm text-slate-500 font-medium mt-1">{doctor.specialty || doctor.specialization || 'Общая практика'}</p>
                  </div>
                  <div className="flex items-center md:justify-end gap-4 text-sm font-black">
                    <span className="text-slate-500">{doctor.experienceYears || 0} лет</span>
                    <span className="inline-flex items-center gap-1 text-amber-600"><Star className="w-4 h-4 fill-current" /> {doctor.rating || 4.8}</span>
                    <span className="text-slate-400">{doctor.reviewsCount || 0} отзывов</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
