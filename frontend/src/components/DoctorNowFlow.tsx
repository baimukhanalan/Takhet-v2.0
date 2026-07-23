import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Headphones,
  Loader2,
  Mic,
  Send,
  ShieldCheck,
  Stethoscope,
  Video,
  Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';
import { User } from '../types';

const questions = [
  'Что беспокоит больше всего прямо сейчас?',
  'Когда это началось и становится ли состояние хуже?',
  'Оцените выраженность симптома от 0 до 10.',
  'Есть ли температура, одышка, боль в груди, потеря сознания, нарушение речи, судороги или кровотечение?',
  'Какие у вас хронические болезни, аллергии и какие лекарства вы принимаете?'
];

const redFlagPattern = /(сильн.*боль.*груд|боль.*груд|задыха|одышк|не могу дыш|потер.*сознан|обморок|наруш.*реч|онемел|парализ|судорог|кровотеч|кровь.*не.*остан|синеет|анафилак)/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MatchedDoctor = {
  fullName: string;
  specialty: string;
  avatar?: string;
  experienceYears?: number;
  clinicName?: string;
};

const searchStatuses = [
  'Анализируем запрос',
  'Подбираем свободного врача',
  'Передаём врачу резюме TakhetAI',
  'Врач назначен на консультацию',
  'Подготавливаем защищённую видеосвязь'
];

const DoctorNowFlow: React.FC<{ user?: User; trialMode?: boolean }> = ({ user }) => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState('');
  const [stage, setStage] = useState<'questions' | 'emergency' | 'summary' | 'contact' | 'searching' | 'matched'>('questions');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTelemedicine, setAcceptedTelemedicine] = useState(false);
  const [matchedDoctor, setMatchedDoctor] = useState<MatchedDoctor | null>(null);
  const [searchStep, setSearchStep] = useState(0);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [mediaState, setMediaState] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [networkState, setNetworkState] = useState<'idle' | 'ready' | 'limited' | 'offline'>('idle');
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const progress = useMemo(() => Math.round((answers.length / questions.length) * 100), [answers.length]);

  useEffect(() => {
    if (stage !== 'searching') return;

    setSearchSeconds(0);
    setSearchStep(0);
    const timer = window.setInterval(() => {
      setSearchSeconds((current) => {
        const next = current + 1;
        setSearchStep(Math.min(4, Math.floor(next / 2)));
        if (next >= 10) {
          window.clearInterval(timer);
          setStage('matched');
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => () => {
    previewStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const finishRequestCreation = async (created: any) => {
    setCaseId(created.caseId);
    setMatchedDoctor(created.doctor || null);
    setPaymentUnavailable(created.paymentRequired === false);
    setStage('searching');

    if (created.paymentRequired === false) return;
    try {
      const intent = await roleApi.createPaymentIntent(created.caseId);
      if (intent?.paymentUrl) {
        setPaymentUrl(intent.paymentUrl);
        window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
      } else if (intent?.available === false) {
        setPaymentUnavailable(true);
      }
    } catch {
      setError('Заявка создана, но платёжный сервис сейчас недоступен. Заявка сохранена.');
    }
  };

  const submitAnswer = () => {
    const answer = value.trim();
    if (!answer) return;
    const next = [...answers, answer];
    setAnswers(next);
    setValue('');

    if (redFlagPattern.test(answer)) {
      setStage('emergency');
      return;
    }

    if (next.length === questions.length) {
      setSummary(questions.map((question, index) => `${question}\n${next[index]}`).join('\n\n'));
      setStage('summary');
    }
  };

  const createUrgentRequest = async () => {
    if (!user) {
      setStage('contact');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const created = await roleApi.patientCreateUrgentConsultation(summary.trim());
      await finishRequestCreation(created);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setError(
        message.includes('Payment provider')
          ? 'Заявка создана, но платёжный сервис пока недоступен. Она сохранена в личном кабинете.'
          : 'Не удалось отправить заявку. Проверьте соединение и повторите попытку.'
      );
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await roleApi.requestGuestPhoneOtp({ phone: phone.trim(), email: email.trim().toLowerCase() });
      setOtpRequested(true);
      setPhoneVerificationToken('');
      setStatus(
        result.devCode
          ? `Код подготовлен. Тестовый код: ${result.devCode}`
          : result.channel === 'email'
            ? 'Код отправлен на email. Он действует 10 минут.'
            : 'SMS-код отправлен. Он действует 10 минут.'
      );
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : 'Не удалось отправить SMS-код.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await roleApi.verifyGuestPhoneOtp({ phone: phone.trim(), code: otpCode.trim() });
      setPhoneVerificationToken(result.phoneVerificationToken);
      setStatus('Телефон подтверждён. Можно переходить к оплате.');
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : 'Неверный или просроченный SMS-код.');
    } finally {
      setBusy(false);
    }
  };

  const createGuestUrgentRequest = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    let createdCaseId: string | null = null;
    try {
      const created = await roleApi.guestCreateUrgentConsultation({
        summary: summary.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        phoneVerificationToken,
        acceptedTerms,
        acceptedPrivacy,
        acceptedTelemedicine
      });
      createdCaseId = created.caseId;
      await finishRequestCreation(created);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось создать срочную консультацию.');
      if (!createdCaseId) setStage('contact');
    } finally {
      setBusy(false);
    }
  };

  const retryPayment = async () => {
    if (!caseId) return;
    setBusy(true);
    setError(null);
    try {
      const intent = await roleApi.createPaymentIntent(caseId);
      if (!intent?.paymentUrl) throw new Error('Payment URL is missing');
      setPaymentUrl(intent.paymentUrl);
      window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Платёжный сервис пока недоступен. Заявка сохранена, попробуйте ещё раз через минуту.');
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async () => {
    if (!caseId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await roleApi.cancelConsultation(caseId);
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
      setCaseId(null);
      setMatchedDoctor(null);
      setMediaState('idle');
      setNetworkState('idle');
      setStatus('Предыдущая заявка отменена. Можно изменить резюме и начать новый поиск.');
      setStage('summary');
    } catch {
      setError('Не удалось отменить заявку. Обратитесь в поддержку.');
    } finally {
      setBusy(false);
    }
  };

  const checkConnection = async () => {
    setMediaState('checking');
    setNetworkState(navigator.onLine ? 'idle' : 'offline');
    setError(null);

    if (!navigator.onLine) {
      setMediaState('error');
      setError('Нет подключения к интернету. Восстановите соединение и повторите проверку.');
      return;
    }

    try {
      const ice = await roleApi.consultationIceServers();
      setNetworkState(ice.relayConfigured ? 'ready' : 'limited');
      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      previewStreamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
      setMediaState('ready');
    } catch (checkError) {
      setMediaState('error');
      setError(
        checkError instanceof DOMException && checkError.name === 'NotAllowedError'
          ? 'Разрешите браузеру доступ к камере и микрофону, затем повторите проверку.'
          : 'Не удалось включить камеру или микрофон. Проверьте устройства и разрешения браузера.'
      );
    }
  };

  const joinConsultation = () => {
    if (!caseId || mediaState !== 'ready' || networkState === 'offline') return;
    previewStreamRef.current?.getTracks().forEach((track) => track.stop());
    previewStreamRef.current = null;
    window.location.assign(`/consultation/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0E1F44]">
      <header className="border-b border-[#E7EBF4] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-lg text-[#0E1F44] hover:bg-[#EEF2FE]" aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black">Срочный врач</h1>
            <p className="text-xs text-[#5D6B86]">TakhetAI собирает жалобы и передаёт врачу структурированное резюме</p>
          </div>
          <Stethoscope className="h-6 w-6 text-[#1D4ED8]" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {stage === 'questions' && (
          <section className="space-y-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#DCE4F8]"><div className="h-full bg-[#1D4ED8] transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="text-xs font-bold uppercase text-[#5D6B86]">Вопрос {answers.length + 1} из {questions.length}</p>
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">{questions[answers.length]}</h2>
            <textarea
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submitAnswer();
              }}
              rows={5}
              className="w-full resize-none rounded-lg border border-[#D5DCEC] bg-white p-4 text-base outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
              placeholder="Ответьте своими словами"
            />
            <button onClick={submitAnswer} disabled={!value.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-4 font-bold text-white hover:bg-[#183FAF] disabled:opacity-40 sm:w-auto">
              Продолжить <Send className="h-4 w-4" />
            </button>
          </section>
        )}

        {stage === 'emergency' && (
          <section className="space-y-6 border-l-4 border-red-600 bg-white p-6 sm:p-8">
            <AlertTriangle className="h-10 w-10 text-red-600" />
            <div><h2 className="text-2xl font-black">Возможны опасные симптомы</h2><p className="mt-3 leading-7 text-slate-700">Не ждите онлайн-консультацию. Позвоните в скорую помощь Казахстана по номеру 103 или в единую экстренную службу 112. Не оставайтесь один и не садитесь за руль.</p></div>
            <div className="flex flex-wrap gap-3"><a href="tel:103" className="rounded-lg bg-red-600 px-6 py-3 font-black text-white">Позвонить 103</a><a href="tel:112" className="rounded-lg border border-red-600 px-6 py-3 font-black text-red-700">Позвонить 112</a></div>
            <button onClick={() => { setStage('questions'); setAnswers([]); }} className="text-sm font-bold text-slate-600 underline">Начать опрос заново, если ответ был ошибочным</button>
          </section>
        )}

        {stage === 'summary' && (
          <section className="space-y-5">
            <div><h2 className="text-2xl font-black">Проверьте резюме для врача</h2><p className="mt-2 text-[#5D6B86]">Исправьте неточности перед отправкой. Стоимость срочной консультации: 4000 ₸, до 15 минут.</p></div>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={16} className="w-full rounded-lg border border-[#D5DCEC] bg-white p-4 leading-6 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20" />
            {status && <p className="border-l-4 border-[#1D4ED8] bg-[#EEF2FE] p-4 text-sm font-semibold text-[#0E1F44]">{status}</p>}
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <button onClick={createUrgentRequest} disabled={busy || summary.trim().length < 20} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-4 font-bold text-white hover:bg-[#183FAF] disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              {user ? 'Отправить заявку врачу' : 'Продолжить без входа'}
            </button>
          </section>
        )}

        {stage === 'contact' && (
          <section className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase text-[#1D4ED8]">Без регистрации</p>
              <h2 className="mt-2 text-2xl font-black">Контакт для консультации</h2>
              <p className="mt-2 leading-6 text-[#5D6B86]">Аккаунт и пароль не нужны. Подтвердите контакт, чтобы мы могли защитить обращение и подключить вас к врачу.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">Имя пациента</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="h-12 w-full rounded-lg border border-[#D5DCEC] bg-white px-4 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20" placeholder="Как к вам обращаться" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Телефон</span>
                <input
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setPhoneVerificationToken('');
                    setOtpRequested(false);
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-12 w-full rounded-lg border border-[#D5DCEC] bg-white px-4 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
                  placeholder="+7 700 000 00 00"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Email для кода и заключения</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="h-12 w-full rounded-lg border border-[#D5DCEC] bg-white px-4 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20" placeholder="patient@example.com" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" disabled={!otpRequested || Boolean(phoneVerificationToken)} className="h-12 rounded-lg border border-[#D5DCEC] bg-white px-4 outline-none focus:border-[#1D4ED8] disabled:bg-[#F1F3F9]" placeholder={otpRequested ? 'Одноразовый код' : 'Сначала получите код'} />
              {!otpRequested ? (
                <button onClick={requestOtp} disabled={busy || phone.trim().length < 5 || !emailPattern.test(email.trim())} className="h-12 rounded-lg bg-[#0E1F44] px-5 font-bold text-white hover:bg-[#172B55] disabled:opacity-40">Получить код</button>
              ) : phoneVerificationToken ? (
                <span className="inline-flex h-12 items-center gap-2 px-3 font-bold text-[#1D4ED8]"><ShieldCheck className="h-5 w-5" /> Подтверждён</span>
              ) : (
                <button onClick={verifyOtp} disabled={busy || otpCode.trim().length < 4} className="h-12 rounded-lg bg-[#1D4ED8] px-5 font-bold text-white hover:bg-[#183FAF] disabled:opacity-40">Подтвердить</button>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedTelemedicine} onChange={(event) => setAcceptedTelemedicine(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1D4ED8]" /><span>Согласен на телемедицинскую консультацию и понимаю, что она не заменяет экстренную помощь.</span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1D4ED8]" /><span>Согласен на обработку персональных и медицинских данных согласно <a href="/privacy" className="font-bold text-[#1D4ED8] underline">политике конфиденциальности</a>.</span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1D4ED8]" /><span>Принимаю <a href="/offer" className="font-bold text-[#1D4ED8] underline">условия консультации</a>, ознакомлен со стоимостью 4 000 ₸ и условиями оплаты и возврата.</span></label>
            </div>

            {status && <p className="border-l-4 border-[#1D4ED8] bg-[#EEF2FE] p-4 text-sm font-semibold text-[#0E1F44]">{status}</p>}
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setStage('summary')} className="h-12 rounded-lg border border-slate-300 px-5 font-bold text-slate-700">Назад к резюме</button>
              <button
                onClick={createGuestUrgentRequest}
                disabled={busy || fullName.trim().length < 2 || !phoneVerificationToken || !acceptedTerms || !acceptedPrivacy || !acceptedTelemedicine}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 font-bold text-white hover:bg-[#183FAF] disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                Отправить заявку и искать врача
              </button>
            </div>
          </section>
        )}

        {stage === 'searching' && (
          <section className="space-y-7 bg-white p-6 sm:p-8" aria-live="polite">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#1D4ED8]">Поиск начат</p>
                <h2 className="mt-2 text-2xl font-black">Ищем срочного врача</h2>
                <p className="mt-2 text-sm text-[#5D6B86]">Не закрывайте страницу. Обычно подбор занимает несколько минут.</p>
              </div>
              <div className="min-w-16 rounded-lg bg-[#EEF2FE] px-3 py-2 text-center font-mono text-sm font-bold text-[#1D4ED8]">
                {String(Math.floor(searchSeconds / 60)).padStart(2, '0')}:{String(searchSeconds % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="relative mx-auto grid h-32 w-32 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full border border-[#1D4ED8]/30" />
              <span className="absolute inset-4 rounded-full bg-[#EEF2FE]" />
              <Stethoscope className="relative h-10 w-10 text-[#1D4ED8]" />
            </div>

            <ol className="space-y-3">
              {searchStatuses.map((item, index) => (
                <li key={item} className={`flex items-center gap-3 text-sm ${index <= searchStep ? 'font-bold text-[#0E1F44]' : 'text-[#8A96AD]'}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${index < searchStep ? 'bg-[#1D4ED8] text-white' : index === searchStep ? 'border-2 border-[#1D4ED8] bg-white text-[#1D4ED8]' : 'border border-[#D5DCEC] bg-white'}`}>
                    {index < searchStep ? <Check className="h-4 w-4" /> : index === searchStep ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>

            {paymentUnavailable && <p className="border-l-4 border-[#1D4ED8] bg-[#EEF2FE] p-4 text-sm font-semibold text-[#0E1F44]">Эквайринг пока не подключён. Заявка принята без списания средств.</p>}
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <div className="flex flex-col gap-3 border-t border-[#E7EBF4] pt-5 sm:flex-row sm:justify-between">
              <button onClick={cancelRequest} disabled={busy} className="rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:opacity-40">Отменить поиск</button>
              <a href="/contacts" className="inline-flex items-center justify-center gap-2 px-5 py-3 font-bold text-[#1D4ED8]"><Headphones className="h-4 w-4" /> Поддержка</a>
            </div>
          </section>
        )}

        {stage === 'matched' && matchedDoctor && (
          <section className="space-y-6">
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 text-[#1D4ED8]">
                <CheckCircle2 className="h-7 w-7" />
                <p className="text-sm font-black uppercase">Врач найден</p>
              </div>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                {matchedDoctor.avatar ? (
                  <img src={matchedDoctor.avatar} alt="" className="h-24 w-24 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-lg bg-[#EEF2FE] text-3xl font-black text-[#1D4ED8]">
                    {matchedDoctor.fullName.trim().charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-2xl font-black">{matchedDoctor.fullName}</h2>
                  <p className="mt-1 font-bold text-[#1D4ED8]">{matchedDoctor.specialty}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5D6B86]">
                    {matchedDoctor.experienceYears ? `Стаж ${matchedDoctor.experienceYears} лет` : 'Проверенный врач Takhet+'}
                    {matchedDoctor.clinicName ? ` · ${matchedDoctor.clinicName}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8">
              <h3 className="text-xl font-black">Проверка перед подключением</h3>
              <p className="mt-2 text-sm text-[#5D6B86]">Видеокомната откроется только после вашей проверки и нажатия кнопки подключения.</p>

              <div className="mt-5 overflow-hidden rounded-lg bg-[#0E1F44]">
                <video ref={previewRef} autoPlay muted playsInline className={`aspect-video w-full object-cover ${mediaState === 'ready' ? 'block' : 'hidden'}`} />
                {mediaState !== 'ready' && (
                  <div className="grid aspect-video place-items-center text-center text-white">
                    <div><Video className="mx-auto h-9 w-9 opacity-70" /><p className="mt-3 text-sm font-bold">Предпросмотр камеры</p></div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 border border-[#E7EBF4] p-3"><Video className="h-5 w-5 text-[#1D4ED8]" /><span className="text-sm font-bold">Камера</span><span className="ml-auto text-xs">{mediaState === 'ready' ? 'Готово' : '—'}</span></div>
                <div className="flex items-center gap-3 border border-[#E7EBF4] p-3"><Mic className="h-5 w-5 text-[#1D4ED8]" /><span className="text-sm font-bold">Микрофон</span><span className="ml-auto text-xs">{mediaState === 'ready' ? 'Готово' : '—'}</span></div>
                <div className="flex items-center gap-3 border border-[#E7EBF4] p-3"><Wifi className="h-5 w-5 text-[#1D4ED8]" /><span className="text-sm font-bold">Интернет</span><span className="ml-auto text-xs">{networkState === 'ready' ? 'Готово' : networkState === 'limited' ? 'Ограничено' : networkState === 'offline' ? 'Нет сети' : '—'}</span></div>
              </div>

              {networkState === 'limited' && <p className="mt-4 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Резервный TURN-канал пока не настроен. Звонок доступен, но в некоторых корпоративных и мобильных сетях соединение может быть нестабильным.</p>}
              {paymentUnavailable && <p className="mt-4 border-l-4 border-[#1D4ED8] bg-[#EEF2FE] p-4 text-sm font-semibold text-[#0E1F44]">Эквайринг пока не подключён. Списание не производится.</p>}
              {error && <p className="mt-4 border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#1D4ED8] px-5 py-3 text-center font-bold text-[#1D4ED8]">Открыть оплату</a>}
                {!paymentUrl && !paymentUnavailable && <button onClick={retryPayment} disabled={busy} className="rounded-lg border border-[#1D4ED8] px-5 py-3 font-bold text-[#1D4ED8] disabled:opacity-40">Повторить оплату</button>}
                {mediaState !== 'ready' ? (
                  <button onClick={checkConnection} disabled={mediaState === 'checking'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 font-bold text-white disabled:opacity-50">
                    {mediaState === 'checking' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
                    Проверить камеру и микрофон
                  </button>
                ) : (
                  <button onClick={joinConsultation} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0E1F44] px-5 py-3 font-bold text-white">
                    <Video className="h-5 w-5" /> Подключиться к врачу
                  </button>
                )}
              </div>
              <button onClick={cancelRequest} disabled={busy} className="mt-4 text-sm font-bold text-slate-600 underline disabled:opacity-40">Отменить консультацию</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorNowFlow;
