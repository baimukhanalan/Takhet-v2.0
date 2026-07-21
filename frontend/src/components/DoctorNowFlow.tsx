import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Loader2, Send, Stethoscope } from 'lucide-react';
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

const DoctorNowFlow: React.FC<{ user?: User; trialMode?: boolean }> = ({ user, trialMode }) => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState('');
  const [stage, setStage] = useState<'questions' | 'emergency' | 'summary' | 'submitted'>('questions');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

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
    if (!user || trialMode) {
      navigate('/patient-auth', {
        state: { from: { pathname: '/takhet-ai/patient', search: '?urgent=1' }, forcePublicAuth: true }
      });
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const created = await roleApi.patientCreateCase(`[DOCTOR_NOW]\n${summary.trim()}`);
      setCaseId(created.id);
      const intent = await roleApi.createPaymentIntent(created.id);
      if (intent?.paymentUrl) window.open(intent.paymentUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black">Срочный врач</h1>
            <p className="text-xs text-slate-500">TakhetAI собирает жалобы и передаёт врачу структурированное резюме</p>
          </div>
          <Stethoscope className="h-6 w-6 text-emerald-700" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {stage === 'questions' && (
          <section className="space-y-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-700 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="text-xs font-bold uppercase text-slate-500">Вопрос {answers.length + 1} из {questions.length}</p>
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">{questions[answers.length]}</h2>
            <textarea
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submitAnswer();
              }}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white p-4 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
              placeholder="Ответьте своими словами"
            />
            <button onClick={submitAnswer} disabled={!value.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-4 font-bold text-white disabled:opacity-40 sm:w-auto">
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
            <div><h2 className="text-2xl font-black">Проверьте резюме для врача</h2><p className="mt-2 text-slate-600">Исправьте неточности перед отправкой. Стоимость срочной консультации: 4000 ₸, до 15 минут.</p></div>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={16} className="w-full rounded-lg border border-slate-300 bg-white p-4 leading-6 outline-none focus:border-emerald-700" />
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <button onClick={createUrgentRequest} disabled={busy || summary.trim().length < 20} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-4 font-bold text-white disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              {user && !trialMode ? 'Оплатить и искать врача' : 'Войти и продолжить'}
            </button>
          </section>
        )}

        {stage === 'submitted' && (
          <section className="space-y-5 bg-white p-6 sm:p-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-700" />
            <h2 className="text-2xl font-black">Заявка передана</h2>
            <p className="leading-7 text-slate-600">После подтверждения оплаты система подберёт доступного врача. Статус обращения и вход в видеокомнату появятся в личном кабинете.</p>
            {error && <p className="border-l-4 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
            <button onClick={() => navigate(caseId ? `/consultation/${caseId}` : '/appointments')} className="rounded-lg bg-slate-950 px-6 py-3 font-bold text-white">Открыть обращение</button>
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorNowFlow;
