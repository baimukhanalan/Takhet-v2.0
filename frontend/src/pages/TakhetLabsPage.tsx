import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import {
  Activity,
  BarChart3,
  CalendarClock,
  ChevronRight,
  Dna,
  Download,
  FileText,
  HeartPulse,
  Microscope,
  Plus,
  ShieldCheck,
  Sparkles,
  TestTube2,
  TrendingUp,
  Users
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { User } from '../types';
import { LabsBiomarker, LabsDashboard, LabsMembership, takhetLabsApi } from '../services/takhetLabsApi';

const disclaimer =
  'Takhet Labs is an AI-powered health intelligence layer and preventive healthcare system. It provides preventive insights, educational explanations, risk awareness, monitoring and health optimization recommendations. Final medical decisions belong to licensed physicians.';

const membershipsFallback: LabsMembership[] = [
  {
    code: 'CORE',
    title: 'Core',
    priceLabel: 'Annual baseline',
    features: ['annual blood panel', 'AI report', 'health dashboard', 'biological age']
  },
  {
    code: 'PLUS',
    title: 'Plus',
    priceLabel: 'Monitoring',
    features: ['repeat testing', 'doctor review', 'protocol tracking', 'advanced monitoring']
  },
  {
    code: 'EXECUTIVE',
    title: 'Executive',
    priceLabel: 'Concierge',
    features: ['concierge', 'home blood draw', 'priority physician review', 'executive monitoring', 'advanced diagnostics']
  }
];

const dashboardFallback: LabsDashboard = {
  healthScore: 86,
  biologicalAge: 31,
  chronologicalAge: 35,
  activeIssues: 3,
  recentInsights: ['Ferritin + fatigue pattern requires monitoring', 'Vitamin D trend improved after protocol', 'hsCRP remains in a calm range'],
  alerts: ['Repeat ferritin in 8 weeks', 'Physician review recommended for thyroid trend'],
  trendSummary: 'Metabolic and inflammation markers are stable. Iron and stress systems need longitudinal monitoring.'
};

const biomarkersFallback: LabsBiomarker[] = [
  { code: 'CBC', name: 'CBC', value: 'Normal', range: 'panel', status: 'optimal', explanation: 'Baseline blood cell panel for preventive monitoring.', trend: [74, 76, 78, 80] },
  { code: 'ApoB', name: 'ApoB', value: '0.78 g/L', range: '< 0.9', status: 'optimal', explanation: 'Atherogenic particle marker for cardiovascular risk awareness.', trend: [72, 76, 82, 86] },
  { code: 'Lp(a)', name: 'Lipoprotein(a)', value: '42 nmol/L', range: '< 75', status: 'optimal', explanation: 'Genetic cardiovascular risk marker tracked over time.', trend: [68, 69, 70, 71] },
  { code: 'HbA1c', name: 'HbA1c', value: '5.2%', range: '4.8-5.6', status: 'optimal', explanation: 'Long-term glucose control and metabolic trend marker.', trend: [80, 82, 85, 87] },
  { code: 'Ferritin', name: 'ferritin', value: '32 ng/mL', range: '40-120', status: 'watch', explanation: 'Iron storage marker. Low-normal values may correlate with fatigue.', trend: [45, 39, 34, 32] },
  { code: 'Cortisol', name: 'cortisol', value: 'Morning high', range: 'context', status: 'review', explanation: 'Stress-axis marker interpreted together with sleep and symptoms.', trend: [65, 60, 58, 54] }
];

const supportedBiomarkers = [
  'CBC',
  'CMP',
  'lipids',
  'ApoB',
  'Lipoprotein(a)',
  'insulin',
  'HbA1c',
  'ferritin',
  'iron/TIBC',
  'vitamin D',
  'magnesium',
  'zinc',
  'B12',
  'thyroid',
  'testosterone',
  'cortisol',
  'hsCRP',
  'inflammatory markers',
  'hormone markers',
  'nutrient markers'
];

const labsGraphSeries = [
  {
    label: 'Ферритин + усталость',
    before: [72, 58, 44, 38, 34, 32],
    after: [42, 48, 56, 63, 71, 78],
    note: 'Система связывает показатель с жалобами, историей и сроком повторной сдачи.'
  },
  {
    label: 'Vitamin D + настроение',
    before: [36, 35, 34, 38, 41, 39],
    after: [44, 51, 59, 66, 74, 82],
    note: 'Пользователь видит не один анализ, а понятную линию улучшения.'
  },
  {
    label: 'hsCRP + нагрузка',
    before: [63, 70, 74, 78, 73, 80],
    after: [68, 62, 57, 51, 46, 42],
    note: 'Takhet Labs показывает тренд воспаления и спокойный план наблюдения.'
  }
];

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const SoftCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm', className)}>
    {children}
  </div>
);

const MiniTrend: React.FC<{ points: number[]; tone?: string }> = ({ points, tone = 'bg-primary' }) => (
  <div className="flex h-14 items-end gap-1">
    {points.map((point, index) => (
      <div key={`${point}-${index}`} className={cn('w-full rounded-t-full opacity-80', tone)} style={{ height: `${Math.max(14, point)}%` }} />
    ))}
  </div>
);

const LandingLabs = () => {
  const [memberships, setMemberships] = useState<LabsMembership[]>(membershipsFallback);
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const graphRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void takhetLabsApi.memberships().then(setMemberships).catch(() => setMemberships(membershipsFallback));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveGraphIndex((index) => (index + 1) % labsGraphSeries.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const activeGraph = labsGraphSeries[activeGraphIndex];

  useEffect(() => {
    if (!graphRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const motion = animate(graphRef.current, {
      opacity: [0.84, 1],
      translateY: [12, 0],
      scale: [0.985, 1],
      duration: 620,
      ease: 'out(3)'
    });

    return () => {
      motion.revert();
    };
  }, [activeGraphIndex]);

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <PublicHeader activePath="/takhet-labs" />
      <main className="pt-24">
        <section className="px-4 py-16 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                <Sparkles className="h-4 w-4" /> Premium built-in module
              </div>
              <h1 className="mt-8 text-5xl font-black uppercase leading-[0.86] tracking-tighter sm:text-7xl lg:text-8xl">
                Takhet <span className="text-primary">Labs</span>
              </h1>
              <p className="mt-6 max-w-3xl text-xl font-black leading-8 text-slate-700">Профилактическая аналитика здоровья внутри Takhet+.</p>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-500">
                AI-powered health intelligence layer для Казахстана и СНГ: лабораторные результаты, biomarkers, biological age, Health Scores, AI monitoring, personalized protocols и longitudinal tracking в одном медицинском OS.
              </p>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">{disclaimer}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/takhet-labs/login" className="rounded-2xl bg-slate-900 px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-slate-900/20">Войти в Takhet Labs</a>
                <a href="#memberships" className="rounded-2xl bg-primary px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-primary/20">Выбрать membership</a>
                <a href="#biomarkers" className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">Смотреть biomarkers</a>
              </div>
            </div>
            <SoftCard className="rounded-[3rem] bg-slate-50 p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">Health Score</p>
                  <p className="mt-4 text-6xl font-black tracking-tighter text-primary">86</p>
                  <MiniTrend points={[48, 62, 58, 74, 86, 82, 90]} />
                </div>
                <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl">
                  <Dna className="h-9 w-9 text-blue-200" />
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.26em] text-blue-200">Biological Age</p>
                  <p className="mt-3 text-5xl font-black">31</p>
                </div>
                <div className="sm:col-span-2 rounded-[2rem] border border-primary/10 bg-primary/5 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-primary">AI insight example</p>
                  <p className="mt-3 text-lg font-black text-slate-900">Ferritin + fatigue pattern requires monitoring. Repeat ferritin and iron/TIBC in 8 weeks.</p>
                </div>
              </div>
            </SoftCard>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto grid gap-5 md:grid-cols-3">
            {[
              ['Overview', 'Comprehensive blood analysis, biomarker intelligence and longitudinal tracking.'],
              ['How It Works', 'Membership -> QR/order -> partner lab or home blood draw -> normalized dashboard -> physician review when enabled.'],
              ['AI System', 'Biomarker interpretation engine, risk scoring engine, correlation engine, personalized protocol generator and AI health concierge.']
            ].map(([title, text]) => (
              <SoftCard key={title}>
                <Microscope className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-2xl font-black text-slate-900">{title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{text}</p>
              </SoftCard>
            ))}
          </div>
        </section>

        <section data-labs-problem-solution className="px-4 py-12 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto rounded-[3rem] border border-slate-100 bg-slate-50 p-6 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Problem / Solution</p>
                <h2 className="mt-4 text-4xl font-black tracking-tighter text-slate-900">Проблема: анализы показывают цифры, но не динамику</h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                  Результаты часто лежат в PDF, мессенджерах и разных лабораториях. Человек видит отдельные цифры, но не понимает, что меняется во времени и какой следующий шаг действительно нужен.
                </p>
                <p className="mt-4 text-sm font-black leading-7 text-slate-700">
                  Решение: Takhet Labs собирает данные в одну линию, показывает тренды, объясняет связи между маркерами и формирует план наблюдения без постановки диагноза.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {['разные PDF', 'нет истории', 'сложно понять нормы', 'нет плана пересдачи'].map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">{item}</div>
                  ))}
                </div>
              </div>
              <div data-labs-dynamic-graph ref={graphRef} className="grid gap-4">
                <SoftCard className="bg-slate-950 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Dynamic health trend</p>
                      <h3 className="mt-3 text-3xl font-black tracking-tighter">{activeGraph.label}</h3>
                    </div>
                    <BarChart3 className="h-10 w-10 text-blue-200" />
                  </div>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">До</p>
                      <MiniTrend points={activeGraph.before} tone="bg-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">После Takhet Labs</p>
                      <MiniTrend points={activeGraph.after} tone="bg-blue-300" />
                    </div>
                  </div>
                  <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-300 transition-all duration-700"
                      style={{ width: `${Math.min(96, activeGraph.after[activeGraph.after.length - 1])}%` }}
                    />
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-6 text-slate-300">{activeGraph.note}</p>
                </SoftCard>
                <SoftCard className="md:col-span-2 bg-primary/5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      ['01', 'Нормализация', 'PDF upload parsing, OCR и API приводятся к единой структуре.'],
                      ['02', 'Интерпретация', 'AI объясняет маркеры без постановки диагноза.'],
                      ['03', 'Мониторинг', 'Система показывает, что пересдать и когда.']
                    ].map(([step, title, text]) => (
                      <div key={step} className="rounded-2xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{step}</p>
                        <p className="mt-2 text-base font-black text-slate-900">{title}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p>
                      </div>
                    ))}
                  </div>
                </SoftCard>
              </div>
            </div>
          </div>
        </section>

        <section id="memberships" className="px-4 py-12 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Memberships</p>
            <h2 className="mt-4 text-4xl font-black tracking-tighter text-slate-900">CORE / PLUS / EXECUTIVE</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {memberships.map((membership) => (
                <SoftCard key={membership.code} className={membership.code === 'PLUS' ? 'ring-2 ring-primary/30' : undefined}>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-primary">{membership.code}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-900">{membership.title}</h3>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-slate-400">{membership.priceLabel}</p>
                  <div className="mt-6 space-y-3">
                    {membership.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <ShieldCheck className="h-4 w-4 text-primary" /> {feature}
                      </div>
                    ))}
                  </div>
                </SoftCard>
              ))}
            </div>
          </div>
        </section>

        <section id="biomarkers" className="px-4 py-12 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Biomarkers</p>
              <h2 className="mt-4 text-4xl font-black tracking-tighter text-slate-900">Biomarker intelligence, Health Scores and Biological Age</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                Загрузка PDF, ручной ввод, OCR-распознавание и нормализация показателей превращают результаты анализов в понятную динамику здоровья.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {supportedBiomarkers.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Health Scores', 'Metabolic, cardiovascular, hormones, liver, kidney, inflammation, stress and sleep.'],
              ['Family Health', 'Family member profiles, parent/child monitoring and family health insights.'],
              ['Executive Health', 'Concierge, home blood draw, priority physician review and executive monitoring.'],
              ['Reports & PDFs', 'Downloadable reports, AI summaries and physician-approved reports after physician review.']
            ].map(([title, text]) => (
              <SoftCard key={title}>
                <h3 className="text-xl font-black text-slate-900">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{text}</p>
              </SoftCard>
            ))}
          </div>
        </section>

        <section data-labs-final-section className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto rounded-[3rem] bg-slate-950 p-8 text-white shadow-2xl md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">Takhet Labs</p>
                <h2 className="mt-4 text-4xl font-black tracking-tighter">Соберите анализы, тренды и рекомендации в один понятный health OS</h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
                  Начните с базового профиля, загрузите результаты и получите структурированную картину без замены врача и без самодиагностики.
                </p>
              </div>
              <a href="/takhet-labs/login" className="inline-flex rounded-2xl bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-950">Войти в Labs</a>
            </div>
          </div>
        </section>
        <footer data-labs-footer className="border-t border-slate-100 bg-white px-6 py-24 text-center">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="text-4xl font-black tracking-tighter text-slate-950">Takhet<span className="text-primary">+</span></span>
              <p className="max-w-2xl text-sm font-bold leading-7 text-slate-400">
                Takhet Labs встроен в Takhet+: анализы, динамика, AI-инсайты и врачебный review остаются частью единой медицинской истории пациента.
              </p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
              © 2026 Takhet+. Все права защищены.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

const PatientLabsModule: React.FC<{ user?: User }> = ({ user }) => {
  const [dashboard, setDashboard] = useState<LabsDashboard>(dashboardFallback);
  const [memberships, setMemberships] = useState<LabsMembership[]>(membershipsFallback);
  const [biomarkers, setBiomarkers] = useState<LabsBiomarker[]>(biomarkersFallback);
  const [healthSystems, setHealthSystems] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [protocol, setProtocol] = useState<any>(null);
  const [family, setFamily] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [manualCode, setManualCode] = useState('ferritin');
  const [manualValue, setManualValue] = useState('32 ng/mL');
  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('family');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [nextMemberships, nextDashboard, nextBiomarkers, nextSystems, nextIssues, nextInsights, nextProtocol, nextFamily, nextReports] = await Promise.all([
      takhetLabsApi.memberships().catch(() => membershipsFallback),
      takhetLabsApi.dashboard().catch(() => dashboardFallback),
      takhetLabsApi.biomarkers().catch(() => biomarkersFallback),
      takhetLabsApi.healthSystems().catch(() => []),
      takhetLabsApi.issues().catch(() => []),
      takhetLabsApi.insights().catch(() => []),
      takhetLabsApi.protocol().catch(() => null),
      takhetLabsApi.family().catch(() => []),
      takhetLabsApi.reports().catch(() => [])
    ]);
    setMemberships(nextMemberships);
    setDashboard(nextDashboard);
    setBiomarkers(nextBiomarkers.length ? nextBiomarkers : biomarkersFallback);
    setHealthSystems(nextSystems);
    setIssues(nextIssues);
    setInsights(nextInsights);
    setProtocol(nextProtocol);
    setFamily(nextFamily);
    setReports(nextReports);
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (message: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setStatus(null);
    try {
      await action();
      await load();
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось выполнить действие Takhet Labs');
    } finally {
      setBusy(false);
    }
  };

  const handleMembershipOrder = (code: LabsMembership['code']) =>
    runAction('Membership активирован. QR и номер заказа готовы.', async () => {
      const nextOrder = await takhetLabsApi.subscribeMembership({ code, bloodDrawMode: code === 'EXECUTIVE' ? 'home_draw' : 'partner_lab' });
      setOrder(nextOrder);
    });

  const handleManualLabResult = () =>
    runAction('Лабораторный показатель добавлен и пересчитан.', () =>
      takhetLabsApi.uploadLabResult({
        source: 'manual',
        fileName: 'manual-biomarker-entry',
        biomarkers: { [manualCode]: manualValue }
      })
    );

  const handleGenerateReport = () =>
    runAction('Отчет Takhet Labs создан.', () => takhetLabsApi.generateReport({ reportType: 'ai_summary' }));

  const handleAddFamilyProfile = () =>
    runAction('Семейный профиль добавлен.', async () => {
      if (!familyName.trim()) return;
      await takhetLabsApi.addFamilyProfile({ fullName: familyName.trim(), relation: familyRelation.trim() || 'family' });
      setFamilyName('');
    });

  const downloadReport = (report: unknown) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `takhet-labs-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleSystems = useMemo(
    () =>
      healthSystems.length
        ? healthSystems
        : [
            { name: 'metabolic', score: 88, explanation: 'insulin, HbA1c, triglycerides', trends: [80, 83, 86, 88] },
            { name: 'cardiovascular', score: 82, explanation: 'ApoB, Lipoprotein(a), lipids', trends: [78, 80, 81, 82] },
            { name: 'hormones', score: 71, explanation: 'thyroid, testosterone, cortisol', trends: [68, 70, 72, 71] },
            { name: 'inflammation', score: 84, explanation: 'hsCRP, inflammatory markers', trends: [77, 80, 83, 84] }
          ],
    [healthSystems]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
            <Microscope className="h-4 w-4" /> Takhet Labs
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-slate-900 sm:text-6xl">
            Личный кабинет Takhet Labs
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
            {user?.name ? `${user.name}, ` : ''}профилактический модуль показывает biomarkers, biological age, Health Scores, AI Insights, Personalized Protocol и Reports & PDFs в стиле основного кабинета Takhet+.
          </p>
        </div>
        <button onClick={handleGenerateReport} disabled={busy} className="rounded-[2rem] bg-slate-900 px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] disabled:opacity-60">
          Сгенерировать отчет
        </button>
      </div>

      {status && (
        <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 text-sm font-black text-primary">
          {status}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SoftCard className="rounded-[3rem] p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">Overview Dashboard</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              ['Health Score', dashboard.healthScore],
              ['Biological Age', dashboard.biologicalAge],
              ['Monitored Issues', dashboard.activeIssues]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] bg-slate-50 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-3 text-4xl font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold leading-7 text-slate-500">{dashboard.trendSummary}</p>
        </SoftCard>
        <SoftCard className="rounded-[3rem] bg-primary/5 p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-primary">Membership / QR</p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">
            {dashboard.activeMembership?.title || order?.membership?.title || 'Выберите membership'}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {(order?.orderNumber || dashboard.activeMembership?.orderNumber) ? `Order: ${order?.orderNumber || dashboard.activeMembership?.orderNumber}` : 'QR и номер заказа появятся после выбора пакета.'}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {memberships.map((membership) => (
              <button key={membership.code} disabled={busy} onClick={() => handleMembershipOrder(membership.code)} className="rounded-2xl bg-white p-4 text-left text-xs font-black uppercase tracking-widest text-slate-900 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-60">
                {membership.code}
              </button>
            ))}
          </div>
        </SoftCard>
      </div>

      <Section title="Biomarkers" icon={TestTube2}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {biomarkers.map((biomarker) => (
            <SoftCard key={`${biomarker.code}-${biomarker.value}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{biomarker.code}</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">{biomarker.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{biomarker.value} / {biomarker.range}</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest', biomarker.status === 'optimal' ? 'bg-blue-50 text-blue-600' : biomarker.status === 'watch' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
                  {biomarker.status}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">{biomarker.explanation}</p>
              <div className="mt-4">
                <MiniTrend points={biomarker.trend} tone={biomarker.status === 'review' ? 'bg-red-400' : biomarker.status === 'watch' ? 'bg-amber-400' : 'bg-primary'} />
              </div>
            </SoftCard>
          ))}
        </div>
      </Section>

      <SoftCard className="rounded-[3rem]">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-primary" placeholder="Biomarker, например ferritin" />
          <input value={manualValue} onChange={(event) => setManualValue(event.target.value)} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-primary" placeholder="Value, например 32 ng/mL" />
          <button onClick={handleManualLabResult} disabled={busy} className="rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
            Загрузить показатель
          </button>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Manual upload подключен к backend: результат сохраняется, нормализуется, пересчитывает score и добавляет AI insight.</p>
      </SoftCard>

      <Section title="Health Systems" icon={HeartPulse}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleSystems.map((system) => (
            <SoftCard key={system.name}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{system.name}</p>
              <p className="mt-3 text-4xl font-black text-slate-900">{system.score}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{system.explanation}</p>
            </SoftCard>
          ))}
        </div>
      </Section>

      <Section title="Trends & Analytics" icon={TrendingUp}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Biomarker evolution', biomarkers.slice(0, 4).map((item) => item.trend[item.trend.length - 1] || 70)],
            ['Biological Age changes', [36, 35, 33, dashboard.biologicalAge]],
            ['Improvement tracking', [72, 76, 81, dashboard.healthScore]]
          ].map(([title, points]) => (
            <SoftCard key={title as string}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{title as string}</p>
              <div className="mt-5">
                <MiniTrend points={points as number[]} />
              </div>
            </SoftCard>
          ))}
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Monitored Issues" icon={Activity}>
          <Stack items={(issues.length ? issues.map((item) => `${item.title}: ${item.recommendation}`) : ['iron deficiency risk', 'stress overload', 'insulin resistance trend', 'hormonal imbalance'])} />
        </Section>
        <Section title="AI Insights" icon={Sparkles}>
          <Stack items={(insights.length ? insights.map((item) => item.summary) : dashboard.recentInsights)} />
        </Section>
        <Section title="Personalized Protocol" icon={CalendarClock}>
          <Stack items={[
            ...(protocol?.nutrition || ['nutrition']),
            ...(protocol?.supplements || ['supplements']),
            ...(protocol?.sleep || ['sleep']),
            ...(protocol?.workouts || ['workouts']),
            ...(protocol?.stress || ['stress optimization']),
            protocol?.retestingSchedule ? `retesting: ${protocol.retestingSchedule}` : 'retesting schedule'
          ]} />
        </Section>
        <Section title="Family Health" icon={Users}>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary" placeholder="Имя члена семьи" />
              <input value={familyRelation} onChange={(event) => setFamilyRelation(event.target.value)} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary" placeholder="Связь" />
              <button onClick={handleAddFamilyProfile} disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Stack items={(family.length ? family.map((item) => `${item.fullName} / ${item.relation}`) : ['family member profiles', 'parent/child monitoring', 'family health insights'])} />
          </div>
        </Section>
      </div>

      <Section title="Reports & PDFs" icon={Download}>
        <div className="grid gap-4 md:grid-cols-3">
          {(reports.length ? reports : [{ title: 'AI summaries', status: 'ready' }, { title: 'physician-approved reports', status: 'pending_review' }, { title: 'downloadable reports', status: 'ready' }]).map((report) => (
            <button key={`${report.title}-${report.id || report.status}`} onClick={() => downloadReport(report)} className="rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:border-primary/20">
              <FileText className="h-7 w-7 text-primary" />
              <p className="mt-4 text-lg font-black text-slate-900">{report.title}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">{report.status}</p>
            </button>
          ))}
        </div>
      </Section>

      <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 text-sm font-semibold leading-7 text-slate-600">
        {disclaimer}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
    </div>
    {children}
  </section>
);

const Stack: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="grid gap-3">
    {items.map((item) => (
      <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
        <span>{item}</span>
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>
    ))}
  </div>
);

const TakhetLabsPage: React.FC<{ user?: User; portal?: boolean }> = ({ user, portal = false }) => {
  if (portal) {
    return <PatientLabsModule user={user} />;
  }

  return <LandingLabs />;
};

export default TakhetLabsPage;
