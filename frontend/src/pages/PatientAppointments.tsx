import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, Download, Plus, CreditCard, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';
import { useLanguage } from '../services/useLanguage';
import { useLiveRefresh } from '../services/useLiveRefresh';

type PatientCase = {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
  doctorName?: string | null;
  specialty?: string | null;
  appointmentDate?: string | null;
  appointmentSlot?: string | null;
};

type PatientPayment = {
  id: string;
  caseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const formatStatus = (value: PatientCase['status']) =>
  value === 'closed' ? 'Завершено' : value === 'in_review' ? 'На проверке' : value === 'active' ? 'В работе' : 'Открыто';
const parseBookingDetails = (summary: string | null) => {
  const text = summary || '';
  return {
    doctorName: text.match(/^Врач:\s*(.+)$/m)?.[1]?.trim() || null,
    specialty: text.match(/^Специальность:\s*(.+)$/m)?.[1]?.trim() || null,
    appointmentDate: text.match(/^Дата:\s*(.+)$/m)?.[1]?.trim() || null,
    appointmentSlot: text.match(/^Время:\s*(.+)$/m)?.[1]?.trim() || null
  };
};
const getBookingDetails = (item: PatientCase) => {
  const parsed = parseBookingDetails(item.summary);
  return {
    doctorName: item.doctorName || parsed.doctorName,
    specialty: item.specialty || parsed.specialty,
    appointmentDate: item.appointmentDate || parsed.appointmentDate,
    appointmentSlot: item.appointmentSlot || parsed.appointmentSlot
  };
};
const isDoctorBookingCase = (summary: string | null) => {
  const normalized = (summary || '').trim();
  return normalized.startsWith('Запись к врачу') || normalized.startsWith('Запрос на ментальную консультацию');
};
const formatSummary = (value: string | null) => {
  if (!value) return 'Не указано';
  const normalized = value.trim();
  if (!normalized) return 'Не указано';
  if (normalized === 'AI consultation request' || normalized === 'Запрос на AI-консультацию') return 'Запрос на ИИ консультацию';
  if (normalized === 'Feedback runtime verification case') return 'Завершенная консультация с отзывом пациента';
  if (normalized === 'Smoke test case from Codex runtime validation') return 'Служебное обращение';
  if (normalized === 'Test payment case from runtime validation') return 'Проверка оплаты';
  if (/^\?+$/.test(normalized) || normalized.includes('????')) return 'Описание обращения требует уточнения';
  if (normalized.startsWith('Doctor response:')) {
    const response = normalized.slice('Doctor response:'.length).trim();
    return response ? `Ответ врача: ${response}` : 'Ответ врача добавлен';
  }
  if (normalized.startsWith('AI consultation request:')) {
    const details = normalized.slice('AI consultation request:'.length).trim();
    return details ? `Запрос на ИИ консультацию: ${details}` : 'Запрос на ИИ консультацию';
  }
  return normalized;
};

const PatientAppointments: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingCaseId, setPayingCaseId] = useState<string | null>(null);
  const [ratingCaseId, setRatingCaseId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [caseData, paymentData] = await Promise.all([roleApi.patientCases(), roleApi.patientPayments()]);
      setCases(caseData);
      setPayments(paymentData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить обращения');
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
  }, { intervalMs: 15000 });

  const paymentByCase = useMemo(() => {
    const map = new Map<string, PatientPayment>();
    for (const payment of payments) {
      if (!map.has(payment.caseId)) {
        map.set(payment.caseId, payment);
      }
    }
    return map;
  }, [payments]);

  const upcoming = cases.filter((item) => item.status !== 'closed');
  const past = cases.filter((item) => item.status === 'closed');

  const handlePay = async (caseId: string) => {
    setPayingCaseId(caseId);
    try {
      const intent = await roleApi.createPaymentIntent(caseId);
      if (intent?.paymentUrl) {
        window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(`/consultation/${caseId}`);
      }
      await load();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Не удалось создать оплату');
    } finally {
      setPayingCaseId(null);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка обращений</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 pb-32 px-3 sm:px-4 md:px-0">
      {ratingCaseId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white border border-slate-100 p-6 md:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Оценить консультацию</h3>
              <p className="text-slate-500 font-medium mt-2">Оценка появится в профиле врача и поможет другим пациентам при выборе специалиста.</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setRatingScore(score)}
                  className={`p-2 rounded-xl ${score <= ratingScore ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-slate-50'}`}
                >
                  <Star className={`w-6 h-6 ${score <= ratingScore ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingReview}
              onChange={(event) => setRatingReview(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-border bg-slate-50 px-5 py-4 outline-none font-medium"
              placeholder={t.appointments.reviewPlaceholder}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setRatingCaseId(null);
                  setRatingReview('');
                  setRatingScore(5);
                }}
                className="flex-1 px-5 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-xs"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!ratingCaseId) return;
                  setSubmittingFeedback(true);
                  setError(null);
                  try {
                    await roleApi.patientSubmitFeedback({ caseId: ratingCaseId, score: ratingScore, review: ratingReview });
                    setRatingCaseId(null);
                    setRatingReview('');
                    setRatingScore(5);
                    await load();
                  } catch (feedbackError) {
                    setError(feedbackError instanceof Error ? feedbackError.message : 'Не удалось отправить отзыв');
                  } finally {
                    setSubmittingFeedback(false);
                  }
                }}
                disabled={submittingFeedback}
                className="flex-1 px-5 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs disabled:opacity-60"
              >
                {submittingFeedback ? 'Отправляем...' : 'Отправить оценку'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none uppercase">Мои обращения</h1>
          <p className="text-muted-foreground text-base md:text-lg font-medium">Здесь собраны активные обращения, статусы и оплаты.</p>
        </div>
        <Link to="/doctors-search" className="w-full md:w-auto px-6 md:px-10 py-4 md:py-5 bg-white border border-border rounded-xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3">
          Новая запись <Plus className="w-4 h-4" />
        </Link>
      </div>

      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-8 md:w-12 h-px bg-primary/20"></div>
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-primary">Активные обращения</h2>
        </div>
        <div className="grid gap-4 md:gap-6">
          {upcoming.length > 0 ? upcoming.map((item) => {
            const payment = paymentByCase.get(item.id);
            const isPendingPayment = !isDoctorBookingCase(item.summary) && (!payment || payment.status === 'pending');
            const bookingDetails = getBookingDetails(item);
            return (
              <div key={item.id} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3.5rem] border border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center shrink-0 bg-blue-50 text-primary">
                    <Calendar className="w-6 h-6 md:w-10 md:h-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                      <h3 className="text-lg md:text-2xl font-black text-foreground leading-tight break-words">{bookingDetails.doctorName || `Обращение #${item.id.slice(0, 8)}`}</h3>
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">{formatStatus(item.status)}</span>
                    </div>
                    <p className="text-[10px] md:text-sm font-bold text-primary mb-2 md:mb-3 uppercase tracking-widest opacity-70">{bookingDetails.specialty || (item.doctorId ? 'Врач назначен' : 'Ожидание врача')}</p>
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 md:gap-2"><Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" /> {bookingDetails.appointmentDate || formatDate(item.createdAt)}</span>
                      <span className="flex items-center gap-1.5 md:gap-2"><Clock className="w-3 h-3 md:w-4 md:h-4 text-primary" /> {bookingDetails.appointmentSlot || formatTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                  {isPendingPayment ? (
                    <button
                      onClick={() => void handlePay(item.id)}
                      disabled={payingCaseId === item.id}
                      className="flex-1 lg:flex-none px-6 md:px-12 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-lg transition-all flex items-center justify-center gap-2 md:gap-3 bg-primary text-white shadow-xl shadow-primary/20 disabled:opacity-60"
                    >
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5" /> {payingCaseId === item.id ? 'Создание...' : 'Оплатить'}
                    </button>
                  ) : (
                    <Link to={`/consultation/${item.id}`} className="flex-1 lg:flex-none px-6 md:px-12 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-lg transition-all flex items-center justify-center gap-2 md:gap-3 bg-slate-100 text-foreground hover:bg-slate-200">
                      Детали <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="py-16 md:py-24 bg-slate-50/50 rounded-3xl md:rounded-[4rem] border-4 border-dashed border-slate-100 text-center space-y-4">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-bold text-base md:text-xl uppercase tracking-widest">У вас пока нет активных обращений</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-8 md:w-12 h-px bg-muted"></div>
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Архив</h2>
        </div>
        <div className="grid gap-3 md:gap-4">
          {past.length > 0 ? past.map((item) => {
            const bookingDetails = getBookingDetails(item);
            return (
              <div key={item.id} className="bg-white/60 p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 group hover:bg-white transition-all opacity-80 hover:opacity-100">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-success/10 group-hover:text-success transition-colors">
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl font-black text-foreground leading-tight break-words">{bookingDetails.doctorName || `Обращение #${item.id.slice(0, 8)}`}</h3>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{bookingDetails.appointmentDate || formatDate(item.createdAt)} · {bookingDetails.appointmentSlot || formatTime(item.createdAt)} · Завершено</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full lg:w-auto">
                  {item.doctorId && (
                    <button
                      onClick={() => setRatingCaseId(item.id)}
                      className="flex-1 sm:flex-none px-4 md:px-6 py-3 md:py-4 bg-amber-50 text-amber-700 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 transition-all"
                    >
                      <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" /> Оценить врача
                    </button>
                  )}
                  <button onClick={() => {
                    const content = [`Обращение: ${item.id}`, `Запись: ${bookingDetails.appointmentDate || formatDate(item.createdAt)} ${bookingDetails.appointmentSlot || formatTime(item.createdAt)}`, `Статус: ${formatStatus(item.status)}`, `Описание: ${formatSummary(item.summary)}`].join('\n');
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `patient-case-${item.id.slice(0, 8)}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }} className="flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 bg-primary/5 text-primary rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                    <Download className="w-3 h-3 md:w-4 md:h-4" /> История
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 md:py-20 opacity-30 font-black uppercase tracking-[0.4em] text-xs md:text-sm">История пуста</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientAppointments;
