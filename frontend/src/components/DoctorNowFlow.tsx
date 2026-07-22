import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Loader2, Send, ShieldCheck, Stethoscope } from 'lucide-react';
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

const DoctorNowFlow: React.FC<{ user?: User; trialMode?: boolean }> = ({ user }) => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState('');
  const [stage, setStage] = useState<'questions' | 'emergency' | 'summary' | 'contact' | 'submitted'>('questions');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
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

  const progress = useMemo(() => Math.round((answers.length / questions.length) * 100), [answers.length]);

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
      const created = await roleApi.patientCreateCase(`[DOCTOR_NOW]\n${summary.trim()}`);
      setCaseId(created.id);
      const intent = await roleApi.createPaymentIntent(created.id);
      if (intent?.paymentUrl) {
        setPaymentUrl(intent.paymentUrl);
        window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
      }
      setStage('submitted');
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
      setCaseId(created.caseId);
      setStage('submitted');

      try {
        const intent = await roleApi.createPaymentIntent(created.caseId);
        if (intent?.paymentUrl) {
          setPaymentUrl(intent.paymentUrl);
          window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
        }
      } catch {
        setError('Заявка создана, но платёжный сервис сейчас недоступен. Повторите оплату с этого экрана.');
      }
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
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <button onClick={createUrgentRequest} disabled={busy || summary.trim().length < 20} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-4 font-bold text-white hover:bg-[#183FAF] disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              {user ? 'Оплатить и искать врача' : 'Продолжить без входа'}
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
              <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1D4ED8]" /><span>Принимаю <a href="/offer" className="font-bold text-[#1D4ED8] underline">условия консультации</a>, стоимость 4 000 ₸ и условия возврата.</span></label>
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
                Оплатить 4 000 ₸ и искать врача
              </button>
            </div>
          </section>
        )}

        {stage === 'submitted' && (
          <section className="space-y-5 bg-white p-6 sm:p-8">
            <CheckCircle2 className="h-10 w-10 text-[#1D4ED8]" />
            <h2 className="text-2xl font-black">Заявка передана</h2>
            <p className="leading-7 text-slate-600">Врач подобран автоматически. После подтверждения оплаты откройте защищённую видеокомнату; логин и регистрация не требуются.</p>
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              {paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#1D4ED8] px-6 py-3 text-center font-bold text-[#1D4ED8]">Открыть оплату</a>}
              {!paymentUrl && <button onClick={retryPayment} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D4ED8] px-6 py-3 font-bold text-[#1D4ED8] disabled:opacity-40">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Повторить оплату</button>}
              <button onClick={() => caseId && window.location.assign(`/consultation/${caseId}`)} disabled={!caseId} className="rounded-lg bg-[#0E1F44] px-6 py-3 font-bold text-white disabled:opacity-40">Открыть видеокомнату</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorNowFlow;
