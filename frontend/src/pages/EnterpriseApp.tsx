import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { animate } from 'animejs';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  User,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import {
  EnterpriseCheckInput,
  EnterpriseRole,
  EnterpriseSession,
  EnterpriseUser,
  enterpriseApi
} from '../services/enterpriseApi';
import PublicHeader from '../components/PublicHeader';
import TakhetLogo from '../components/Logo';

const LEGAL_COPY =
  'Takhet Enterprise помогает компаниям дать сотрудникам доступ к врачу, психологической поддержке и AI-помощи 24/7. Работодатель видит только агрегированные данные и не получает личные медицинские данные сотрудников.';

const roleHome: Record<EnterpriseRole, string> = {
  employee: '/enterprise/employee',
  employer_admin: '/enterprise/employer',
  doctor: '/enterprise/provider',
  psychologist: '/enterprise/psychologist',
  takhet_admin: '/enterprise/takhet-admin',
  clinical_supervisor: '/enterprise/supervisor'
};

const enterpriseRoleConfigs: Record<
  EnterpriseRole,
  { title: string; shortTitle: string; icon: React.ElementType; description: string }
> = {
  employee: {
    title: 'Employee',
    shortTitle: 'Employee',
    icon: User,
    description: 'Личный доступ к корпоративным услугам здоровья, AI-поддержке и консультациям.',
  },
  employer_admin: {
    title: 'Employer / HR',
    shortTitle: 'HR',
    icon: Building2,
    description: 'Агрегированная аналитика, сотрудники, пакет, лимиты и приватность.',
  },
  doctor: {
    title: 'Doctor',
    shortTitle: 'Doctor',
    icon: Stethoscope,
    description: 'Корпоративные консультации, расписание, triage summary и медицинские записи.',
  },
  psychologist: {
    title: 'Psychologist',
    shortTitle: 'Psychologist',
    icon: Brain,
    description: 'Сессии, risk flags, заметки, эскалации и обучение.',
  },
  takhet_admin: {
    title: 'Takhet Admin',
    shortTitle: 'Admin',
    icon: ShieldCheck,
    description: 'Компании, планы, врачи, лимиты, billing, payouts и compliance.',
  },
  clinical_supervisor: {
    title: 'Clinical Supervisor',
    shortTitle: 'Supervisor',
    icon: UserCheck,
    description: 'Quality Review, flagged cases, notes audit, escalations и clinical protocols.',
  }
};

const navByRole: Record<EnterpriseRole, Array<{ label: string; path: string; icon: React.ElementType }>> = {
  employee: [
    { label: 'Главная', path: '/enterprise/employee', icon: LayoutDashboard },
    { label: 'AI поддержка 24/7', path: '/enterprise/employee/ai-support', icon: Brain },
    { label: 'Срочно к врачу', path: '/enterprise/employee/duty-doctor', icon: HeartPulse },
    { label: 'Записаться к специалисту', path: '/enterprise/employee/specialist', icon: Stethoscope },
    { label: 'Психологическая поддержка', path: '/enterprise/employee/psychology', icon: MessageSquareText },
    { label: 'Мои лимиты', path: '/enterprise/employee/limits', icon: CreditCard },
    { label: 'История консультаций', path: '/enterprise/employee/history', icon: History },
    { label: 'Рекомендации', path: '/enterprise/employee/recommendations', icon: ClipboardCheck },
    { label: 'Профиль', path: '/enterprise/employee/profile', icon: User },
    { label: 'Помощь', path: '/enterprise/employee/help', icon: Bell },
    { label: 'Risk / Pre-check', path: '/enterprise/employee/risk-precheck', icon: AlertTriangle }
  ],
  employer_admin: [
    { label: 'Dashboard', path: '/enterprise/employer', icon: LayoutDashboard },
    { label: 'Сотрудники', path: '/enterprise/employer/employees', icon: Users },
    { label: 'Подразделения', path: '/enterprise/employer/departments', icon: Building2 },
    { label: 'Активация', path: '/enterprise/employer/activation', icon: UserCheck },
    { label: 'Использование сервиса', path: '/enterprise/employer/utilization', icon: Activity },
    { label: 'Burnout/Stressor Trends', path: '/enterprise/employer/trends', icon: BarChart3 },
    { label: 'Финансы', path: '/enterprise/employer/finance', icon: CreditCard },
    { label: 'Пакет и лимиты', path: '/enterprise/employer/plan', icon: ClipboardCheck },
    { label: 'Отчёты', path: '/enterprise/employer/reports', icon: FileText },
    { label: 'Privacy & Compliance', path: '/enterprise/employer/privacy', icon: ShieldCheck },
    { label: 'Настройки', path: '/enterprise/employer/settings', icon: Settings }
  ],
  doctor: [
    { label: 'Очередь консультаций', path: '/enterprise/provider', icon: LayoutDashboard },
    { label: 'Расписание', path: '/enterprise/provider/schedule', icon: CalendarDays },
    { label: 'Пациенты', path: '/enterprise/provider/patients', icon: Users },
    { label: 'Консультации', path: '/enterprise/provider/consultations', icon: Stethoscope },
    { label: 'Triage Summary', path: '/enterprise/provider/triage-summary', icon: ClipboardCheck },
    { label: 'Медицинские записи', path: '/enterprise/provider/notes', icon: FileText },
    { label: 'Выплаты', path: '/enterprise/provider/payouts', icon: CreditCard },
    { label: 'Обучение', path: '/enterprise/provider/training', icon: BookOpen },
    { label: 'Профиль', path: '/enterprise/provider/profile', icon: User }
  ],
  psychologist: [
    { label: 'Сессии', path: '/enterprise/psychologist', icon: LayoutDashboard },
    { label: 'Расписание', path: '/enterprise/psychologist/schedule', icon: CalendarDays },
    { label: 'Клиенты', path: '/enterprise/psychologist/clients', icon: Users },
    { label: 'Risk Flags', path: '/enterprise/psychologist/risk-flags', icon: AlertTriangle },
    { label: 'Заметки', path: '/enterprise/psychologist/notes', icon: FileText },
    { label: 'Эскалации', path: '/enterprise/psychologist/escalations', icon: Bell },
    { label: 'Выплаты', path: '/enterprise/psychologist/payouts', icon: CreditCard },
    { label: 'Обучение', path: '/enterprise/psychologist/training', icon: BookOpen }
  ],
  takhet_admin: [
    { label: 'Компании', path: '/enterprise/takhet-admin', icon: BriefcaseBusiness },
    { label: 'Планы', path: '/enterprise/takhet-admin/plans', icon: ClipboardCheck },
    { label: 'Сотрудники', path: '/enterprise/takhet-admin/employees', icon: Users },
    { label: 'Врачи', path: '/enterprise/takhet-admin/doctors', icon: Stethoscope },
    { label: 'Верификация', path: '/enterprise/takhet-admin/verification', icon: UserCheck },
    { label: 'Тарифы врачей', path: '/enterprise/takhet-admin/tariffs', icon: CreditCard },
    { label: 'Лимиты', path: '/enterprise/takhet-admin/limits', icon: BarChart3 },
    { label: 'Billing', path: '/enterprise/takhet-admin/billing', icon: FileText },
    { label: 'Payouts', path: '/enterprise/takhet-admin/payouts', icon: CreditCard },
    { label: 'AI Sessions', path: '/enterprise/takhet-admin/ai-sessions', icon: Brain },
    { label: 'Reports', path: '/enterprise/takhet-admin/reports', icon: FileText },
    { label: 'Audit Logs', path: '/enterprise/takhet-admin/audit', icon: ShieldCheck },
    { label: 'Compliance', path: '/enterprise/takhet-admin/compliance', icon: ShieldCheck },
    { label: 'Settings', path: '/enterprise/takhet-admin/settings', icon: Settings }
  ],
  clinical_supervisor: [
    { label: 'Quality Review', path: '/enterprise/supervisor', icon: ClipboardCheck },
    { label: 'Flagged Cases', path: '/enterprise/supervisor/flagged-cases', icon: AlertTriangle },
    { label: 'Escalations', path: '/enterprise/supervisor/escalations', icon: Bell },
    { label: 'Doctor Notes Audit', path: '/enterprise/supervisor/notes-audit', icon: FileText },
    { label: 'Risk Monitoring', path: '/enterprise/supervisor/risk-monitoring', icon: BarChart3 },
    { label: 'Clinical Protocols', path: '/enterprise/supervisor/protocols', icon: ShieldCheck }
  ]
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const cardClass = 'rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm';
const formatCell = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const LegalNotice = () => (
  <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4 text-xs font-semibold leading-relaxed text-slate-500">
    {LEGAL_COPY}
  </div>
);

const MetricCard: React.FC<{ title: string; value: React.ReactNode; caption?: string; icon?: React.ElementType }> = ({ title, value, caption, icon: Icon = Activity }) => (
  <div className={cardClass}>
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{title}</p>
    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    {caption ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{caption}</p> : null}
  </div>
);

const EmptyState = () => <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500">Данных пока нет.</div>;
const LoadingState = () => <div className="py-20 text-center text-xs font-black uppercase tracking-[0.3em] text-slate-500">Загрузка Enterprise</div>;

const SafeTable: React.FC<{ rows: any[]; columns?: string[] }> = ({ rows, columns }) => {
  const resolvedColumns = columns || Object.keys(rows[0] || {}).slice(0, 5);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
            {resolvedColumns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.id || index} className="text-sm font-bold text-slate-600">
              {resolvedColumns.map((column) => <td key={column} className="px-4 py-4">{formatCell(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <EmptyState /> : null}
    </div>
  );
};

const deriveMonthlyLoss = (employees: number) => {
  if (employees < 80) return 120000;
  if (employees < 250) return 155000;
  if (employees < 600) return 185000;
  return 210000;
};

const deriveReduction = (employees: number) => {
  if (employees < 80) return 12;
  if (employees < 250) return 16;
  if (employees < 600) return 20;
  return 23;
};

const EnterpriseRoiCalculator = () => {
  const [employees, setEmployees] = useState(120);
  const derivedMonthlyLoss = deriveMonthlyLoss(employees);
  const derivedReduction = deriveReduction(employees);
  const monthlySavings = Math.round(employees * derivedMonthlyLoss * (derivedReduction / 100));
  const yearlySavings = monthlySavings * 12;
  const previousSavingsRef = useRef({ monthly: monthlySavings, yearly: yearlySavings });
  const [displayedMonthlySavings, setDisplayedMonthlySavings] = useState(monthlySavings);
  const [displayedYearlySavings, setDisplayedYearlySavings] = useState(yearlySavings);

  useEffect(() => {
    const animatedValue = {
      monthly: previousSavingsRef.current.monthly,
      yearly: previousSavingsRef.current.yearly
    };

    const motion = animate(animatedValue, {
      monthly: monthlySavings,
      yearly: yearlySavings,
      duration: 520,
      ease: 'out(3)',
      onUpdate: () => {
        setDisplayedMonthlySavings(Math.round(animatedValue.monthly));
        setDisplayedYearlySavings(Math.round(animatedValue.yearly));
      },
      onComplete: () => {
        previousSavingsRef.current = { monthly: monthlySavings, yearly: yearlySavings };
      }
    });

    return () => {
      motion.revert();
    };
  }, [monthlySavings, yearlySavings]);

  return (
    <div data-enterprise-roi-calculator className="mt-8 grid gap-6 rounded-[2.5rem] border border-slate-100 bg-slate-50 p-6 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.26em] text-primary">ROI calculator</p>
        <h2 className="mt-3 text-3xl font-black text-slate-950">Оцените эффект пилота</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          Только количество сотрудников. Остальные параметры модель подстраивает сама, потому что HR не обязан заранее знать скрытые потери или точный процент снижения.
        </p>
        <div className="mt-6 space-y-4">
          <label className="block rounded-3xl bg-white p-4">
            <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Сотрудников
              <span className="text-primary">{employees.toLocaleString('ru-RU')}</span>
            </span>
            <input
              type="range"
              min={20}
              max={1000}
              step={1}
              value={employees}
              onChange={(event) => setEmployees(Number(event.target.value))}
              className="mt-4 w-full accent-primary"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Модельная потеря</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{derivedMonthlyLoss.toLocaleString('ru-RU')} ₸</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">на сотрудника в месяц</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Снижение потерь</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{derivedReduction}%</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">расчетный сценарий</p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Ориентир</p>
        <p className="mt-5 text-5xl font-black tracking-tighter">{displayedMonthlySavings.toLocaleString('ru-RU')} ₸</p>
        <p className="mt-2 text-sm font-semibold text-slate-400">потенциальная экономия в месяц</p>
        <div className="mt-6 rounded-3xl bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">За год</p>
          <p className="mt-2 text-3xl font-black">{displayedYearlySavings.toLocaleString('ru-RU')} ₸</p>
        </div>
      </div>
    </div>
  );
};

const EnterpriseLanding: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
    <PublicHeader activePath="/enterprise" />
    <main>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Takhet Enterprise</p>
            <h1 className="mt-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tighter text-slate-950 sm:text-6xl lg:text-7xl">
              Цифровое медицинское сопровождение предприятий
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-500">
              Корпоративная телемедицина, психологическая поддержка, AI-поддержка 24/7 и обезличенная аналитика для HR: компания видит тренды, а не личные медицинские данные.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#lead" className="rounded-2xl bg-primary px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-primary/20">Запросить пилот</a>
              <a href="#roi" className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-primary shadow-sm">Посчитать эффект</a>
              <button onClick={onLogin} className="rounded-2xl border border-slate-200 bg-slate-50 px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-700">Войти</button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricCard title="AI support" value="24/7" caption="Первичная поддержка и triage." icon={Brain} />
              <MetricCard title="Privacy" value="0" caption="Личных медданных в HR-дашборде." icon={ShieldCheck} />
              <MetricCard title="Pilot" value="30 дней" caption="Быстрый запуск на 50 сотрудников." icon={BriefcaseBusiness} />
            </div>
          </div>
          <div className="rounded-[3rem] border border-slate-100 bg-slate-50 p-6 shadow-2xl shadow-slate-200/70">
            <div className="rounded-[2.5rem] bg-white p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Anonymous HR dashboard</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Команда видна без нарушения приватности</h2>
              {[
                ['Activation', '72%', 'Доступ активирован сотрудниками'],
                ['Stress trend', '+14%', 'Только агрегированный сигнал'],
                ['Usage', '38%', 'Обращения без персональных деталей']
              ].map(([label, value, caption]) => (
                <div key={label} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{caption}</p>
                  </div>
                  <p className="text-2xl font-black text-primary">{value}</p>
                </div>
              ))}
              <LegalNotice />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ['Боль бизнеса', 'Больничные, выгорание, текучка, задержка доступа к врачу и слепые зоны HR создают скрытые потери.'],
            ['Решение', 'Сотрудник получает врача, психолога и AI support, а компания видит только обезличенную динамику использования и рисков.'],
            ['Как работает', 'Компания подключает сотрудников, платформа маршрутизирует случаи, HR видит агрегированный dashboard.']
          ].map(([title, text]) => (
            <div key={title} className={cardClass}>
              <h3 className="text-2xl font-black text-slate-950">{title}</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roi" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ['Starter', 'Базовое сопровождение', 'AI support 24/7, дежурный врач по лимиту и обезличенная HR-аналитика.'],
              ['Business', 'Расширенная поддержка', 'Дежурный врач, психологическая поддержка по лимитам, triage к специалистам и отчеты.'],
              ['Enterprise', 'Индивидуальная программа', 'SLA, выделенный менеджер, кастомные лимиты, интеграции и отчеты для HR/CFO.']
            ].map(([title, price, text]) => (
              <div key={title} className={cx(cardClass, title === 'Business' && 'ring-2 ring-primary')}>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">{title}</p>
                <h3 className="mt-3 text-3xl font-black text-slate-950">{price}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
          <EnterpriseRoiCalculator />
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Privacy</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Работодатель не видит личные медицинские данные</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
              В HR-портале доступны только агрегированные данные. Если группа меньше 10 сотрудников, аналитика по подразделению скрывается.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {['Нет переписок', 'Нет диагнозов', 'Нет консультационных заметок', 'Только агрегированные данные'].map((item) => (
              <div key={item} className={cardClass}>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <p className="mt-4 text-lg font-black text-slate-950">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lead" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">FAQ</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Частые вопросы</h2>
            <div className="mt-6 space-y-3">
              {[
                ['Это wellness?', 'Нет. Это корпоративный доступ к медицинской помощи, AI-поддержке и обезличенной аналитике использования.'],
                ['Что видит компания?', 'Только агрегированные тренды, usage и финансовые показатели пакета.'],
                ['Можно начать быстро?', 'Да. Рекомендуемый старт — 30-дневный пилот на 50 сотрудников.']
              ].map(([q, a]) => (
                <div key={q} className={cardClass}>
                  <p className="font-black text-slate-950">{q}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
          <B2BLeadForm />
        </div>
      </section>

      <section data-enterprise-final-section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[3rem] bg-slate-950 p-8 text-white shadow-2xl lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">Next step</p>
              <h2 className="mt-4 text-4xl font-black tracking-tighter">Запустите пилот без доступа к личным медданным сотрудников</h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
                Takhet Enterprise помогает собрать пакет, лимиты, правила приватности и первый отчет для руководства без превращения заботы о здоровье в слежку.
              </p>
            </div>
            <a href="#lead" className="inline-flex rounded-2xl bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-950">Запросить пилот</a>
          </div>
        </div>
      </section>
      <footer data-enterprise-footer className="border-t border-slate-100 bg-white px-6 py-24 text-center">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-4xl font-black tracking-tighter text-slate-950">Takhet<span className="text-primary">+</span></span>
            <p className="max-w-2xl text-sm font-bold leading-7 text-slate-400">
              Enterprise остается частью Takhet+: медицинское сопровождение, приватность сотрудников и понятная аналитика для руководства в одном контуре.
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

const B2BLeadForm = () => {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', employees: 50, message: '' });
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('idle');
    try {
      await enterpriseApi.createLead(form);
      setStatus('sent');
      setForm({ companyName: '', contactName: '', email: '', phone: '', employees: 50, message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/70">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">B2B lead form</p>
      <h3 className="mt-3 text-3xl font-black text-slate-950">Запросить пилот</h3>
      <div className="mt-6 grid gap-3">
        {[
          ['companyName', 'Компания'],
          ['contactName', 'Контактное лицо'],
          ['email', 'Email'],
          ['phone', 'Телефон']
        ].map(([key, placeholder]) => (
          <input
            key={key}
            value={(form as any)[key]}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            placeholder={placeholder}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none focus:border-primary"
          />
        ))}
        <input
          type="number"
          value={form.employees}
          onChange={(event) => setForm({ ...form, employees: Number(event.target.value) })}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none focus:border-primary"
        />
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Что важно в пилоте"
          className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 outline-none focus:border-primary"
        />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white">Отправить заявку</button>
      {status === 'sent' ? <p className="mt-3 text-sm font-bold text-blue-600">Заявка сохранена.</p> : null}
      {status === 'error' ? <p className="mt-3 text-sm font-bold text-red-500">Не удалось отправить. Повторите позже.</p> : null}
    </form>
  );
};

const EnterpriseLogin: React.FC<{ onSession: (session: EnterpriseSession) => void }> = ({ onSession }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<EnterpriseRole>('employee');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const config = enterpriseRoleConfigs[role];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await enterpriseApi.register({ identifier, password, role });
      }
      const session = await enterpriseApi.login(identifier, password, role);
      onSession(session);
    } catch {
      setError(mode === 'login' ? 'Не удалось войти.' : 'Заявка отправлена, но вход пока не активирован.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-[#101827] text-white p-12 xl:p-20 flex-col justify-center">
        <button onClick={() => navigate('/enterprise')} className="mb-auto flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
        <div>
          <p className="text-4xl font-black tracking-tight">Takhet<span className="text-primary">+</span></p>
          <h1 className="mt-8 text-6xl font-black leading-[0.9] tracking-tighter">
            {mode === 'login' ? 'Вход в Enterprise' : 'Регистрация Enterprise'}
          </h1>
          <p className="mt-6 max-w-md text-base font-semibold leading-7 text-slate-400">{config.description}</p>
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <form onSubmit={submit} className="w-full max-w-xl">
            <button type="button" onClick={() => navigate('/enterprise')} className="mb-12 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <h2 className="text-5xl font-black tracking-tight text-slate-950">{mode === 'login' ? 'Вход' : 'Зарегистрироваться'}</h2>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Выберите роль и войдите в существующий аккаунт</p>
            <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 md:grid-cols-3">
              {(Object.keys(enterpriseRoleConfigs) as EnterpriseRole[]).map((nextRole) => {
                const RoleIcon = enterpriseRoleConfigs[nextRole].icon;
                return (
                  <button
                    type="button"
                    key={nextRole}
                    onClick={() => setRole(nextRole)}
                    className={cx('rounded-xl px-3 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition', role === nextRole ? 'bg-white text-primary shadow-lg' : 'text-slate-500 hover:text-primary')}
                  >
                    <RoleIcon className="mx-auto mb-2 h-5 w-5" />
                    {enterpriseRoleConfigs[nextRole].title}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-xs font-bold leading-5 text-slate-500">{config.description}</p>
            <div className="mt-6 space-y-3">
              <input name="enterprise-identifier" type="text" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email или Employee ID" className="w-full rounded-2xl bg-blue-50 px-5 py-5 text-base font-bold text-slate-950 outline-none focus:ring-2 focus:ring-primary" />
              <input name="enterprise-password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" className="w-full rounded-2xl bg-blue-50 px-5 py-5 text-base font-bold text-slate-950 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-[2rem] bg-primary px-8 py-5 text-lg font-black text-white shadow-xl shadow-primary/20">
              {mode === 'login' ? 'Войти' : 'Перейти к регистрации'}
              <ChevronRight className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-6 w-full text-center text-xs font-black uppercase tracking-[0.18em] text-primary">
              {mode === 'login' ? 'Зарегистрироваться' : 'Уже есть аккаунт'}
            </button>
            {error ? <p className="mt-4 text-sm font-bold text-red-500">{error}</p> : null}
          </form>
        </div>
      </div>
    </div>
  );
};

const EnterpriseShell: React.FC<{ user: EnterpriseUser; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = navByRole[user.role] || [];

  const NavContent = () => (
    <div className="flex h-full w-full flex-col bg-background">
      <button onClick={() => navigate(roleHome[user.role])} className="flex items-center gap-3 p-8 text-left hover:opacity-80">
        <TakhetLogo className="h-10 w-10" />
        <div>
          <span className="text-2xl font-black tracking-tighter text-foreground">Takhet<span className="text-primary">+</span></span>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Enterprise</p>
        </div>
      </button>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4 no-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate(item.path);
              }}
              className={cx('flex w-full items-center gap-4 rounded-2xl px-5 py-3.5 text-left transition-all', active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-primary')}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-6">
        <button onClick={onLogout} className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex flex-col w-72 bg-background border-r border-border h-screen sticky top-0 shrink-0 shadow-sm">
        <NavContent />
      </div>
      <button onClick={() => setIsMobileMenuOpen(true)} className="fixed left-4 top-4 z-[70] rounded-xl border border-border bg-background/95 p-3 text-primary shadow-lg lg:hidden">
        <Menu className="h-6 w-6" />
      </button>
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[min(20rem,calc(100vw-1rem))] bg-background shadow-2xl">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute right-6 top-8 p-2 text-muted-foreground">
              <X className="h-6 w-6" />
            </button>
            <NavContent />
          </div>
        </div>
      ) : null}
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="bg-background/70 backdrop-blur-xl border-b border-border flex items-center justify-between gap-3 px-5 py-3 sticky top-0 z-50">
          <div className="relative ml-14 flex-1 lg:ml-0 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Поиск по Enterprise..." className="w-full rounded-full bg-secondary/50 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-black text-foreground">{user.fullName}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{enterpriseRoleConfigs[user.role]?.title}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-primary text-xs font-black text-white">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 xl:p-10">{children}</main>
      </div>
    </div>
  );
};

const PortalHeader: React.FC<{ eyebrow: string; title: string; text?: string }> = ({ eyebrow, title, text }) => (
  <div className="mb-8">
    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
    <h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-slate-950 sm:text-5xl">{title}</h1>
    {text ? <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500">{text}</p> : null}
  </div>
);

const GenericDataPage: React.FC<{ title: string; eyebrow: string; text?: string; loader: () => Promise<any> }> = ({ title, eyebrow, text, loader }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => void loader().then(setData).catch(() => setData([])), [loader]);
  if (data === null) return <LoadingState />;
  const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [data];
  return (
    <div>
      <PortalHeader eyebrow={eyebrow} title={title} text={text} />
      <div className={cardClass}>
        <SafeTable rows={rows} />
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => void enterpriseApi.employeeDashboard().then(setData).catch(() => setData({})), []);
  if (!data) return <LoadingState />;
  return (
    <div>
      <PortalHeader eyebrow="Employee Portal" title="Корпоративное здоровье" text="Включённые услуги, быстрый доступ к врачу и AI-поддержка 24/7." />
      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard title="Лимит врача" value={data?.benefits?.dutyDoctorRemaining ?? 0} icon={HeartPulse} />
        <MetricCard title="Психология" value={data?.benefits?.psychologyCredits ?? 0} icon={Brain} />
        <MetricCard title="Co-pay" value={data?.benefits?.copayRequired ? 'Да' : 'Нет'} icon={CreditCard} />
        <MetricCard title="AI support" value="24/7" icon={MessageSquareText} />
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <ActionCard title="Срочно к врачу" text="Создать запрос дежурному врачу." action="Запросить" onClick={() => enterpriseApi.requestConsultation({ serviceType: 'duty_doctor' })} />
        <ActionCard title="Психологическая поддержка" text="Использовать корпоративный лимит или co-pay." action="Записаться" onClick={() => enterpriseApi.requestConsultation({ serviceType: 'psychologist' })} />
        <ActionCard title="AI поддержка 24/7" text="Начать приватную AI-сессию." action="Начать" onClick={() => enterpriseApi.startAiSession({ mode: 'mental_support' })} />
      </div>
      <div className="mt-8">
        <LegalNotice />
      </div>
    </div>
  );
};

const ActionCard: React.FC<{ title: string; text: string; action: string; onClick: () => void }> = ({ title, text, action, onClick }) => (
  <button onClick={onClick} className="rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <p className="text-lg font-black text-slate-950">{title}</p>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p>
    <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
      {action} <ChevronRight className="h-4 w-4" />
    </span>
  </button>
);

const EmployerDashboard = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => void enterpriseApi.employerDashboard().then(setData).catch(() => setData({})), []);
  if (!data) return <LoadingState />;
  return (
    <div>
      <PortalHeader eyebrow="Employer / HR Portal" title="Aggregate dashboard" text="HR видит использование, активацию и тренды только в обезличенном виде." />
      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard title="Сотрудники" value={data?.metrics?.employees ?? 0} icon={Users} />
        <MetricCard title="Активация" value={`${data?.metrics?.activationRate ?? 0}%`} icon={UserCheck} />
        <MetricCard title="Использование" value={`${data?.metrics?.utilizationRate ?? 0}%`} icon={Activity} />
        <MetricCard title="Privacy" value=">=10" caption="Минимальный размер группы." icon={ShieldCheck} />
      </div>
      <div className="mt-8">
        <LegalNotice />
      </div>
    </div>
  );
};

const ProviderDashboard: React.FC<{ type: 'doctor' | 'psychologist' }> = ({ type }) => {
  const [queue, setQueue] = useState<any[]>([]);
  useEffect(() => void enterpriseApi.providerQueue().then(setQueue).catch(() => setQueue([])), []);
  return (
    <div>
      <PortalHeader eyebrow={type === 'doctor' ? 'Doctor Portal' : 'Psychologist Portal'} title={type === 'doctor' ? 'Очередь консультаций' : 'Сессии'} text="Корпоративные обращения, triage summary, заметки и выплаты." />
      <div className={cardClass}>
        <SafeTable rows={queue} />
      </div>
    </div>
  );
};

const TakhetAdminDashboard = () => (
  <GenericDataPage title="Компании" eyebrow="Takhet Admin Portal" loader={enterpriseApi.takhetAdminCompanies} text="Управление компаниями, планами, лимитами, врачами, тарифами, billing и compliance." />
);

const SupervisorDashboard = () => (
  <GenericDataPage title="Quality Review" eyebrow="Clinical Supervisor Portal" loader={enterpriseApi.supervisorQualityReview} text="Аудит качества консультаций, flagged cases, escalations и clinical protocols." />
);

const RiskPrecheckPage = () => {
  const [result, setResult] = useState<any>(null);
  const [payload, setPayload] = useState<EnterpriseCheckInput>({ fatigueLevel: 3, sleepHours: 7, dizziness: false, stressLevel: 4 });
  return (
    <div>
      <PortalHeader eyebrow="Internal tool" title="Risk / Pre-check" text="Старый pre-shift flow сохранён как внутренний инструмент, но больше не является главным Enterprise UX." />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={cardClass}>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Fatigue level</label>
          <input type="range" min={0} max={10} value={payload.fatigueLevel || 0} onChange={(event) => setPayload({ ...payload, fatigueLevel: Number(event.target.value) })} className="mt-4 w-full" />
          <label className="mt-6 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sleep hours</label>
          <input type="number" value={payload.sleepHours || 0} onChange={(event) => setPayload({ ...payload, sleepHours: Number(event.target.value) })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold" />
          <button onClick={() => enterpriseApi.riskPrecheck(payload).then(setResult)} className="mt-6 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">Run internal pre-check</button>
        </div>
        <div className={cardClass}>
          {result ? <pre className="whitespace-pre-wrap text-sm font-bold text-slate-600">{JSON.stringify(result, null, 2)}</pre> : <EmptyState />}
        </div>
      </div>
    </div>
  );
};

const EnterpriseApp: React.FC<{ loginOnly?: boolean }> = ({ loginOnly }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<EnterpriseSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void enterpriseApi.session().then((nextSession) => {
      setSession(nextSession.authenticated ? nextSession : null);
    }).catch(() => setSession(null)).finally(() => setLoading(false));
  }, []);

  const handleSession = (nextSession: EnterpriseSession) => {
    setSession(nextSession);
    navigate(roleHome[nextSession.user.role], { replace: true });
  };

  const logout = async () => {
    await enterpriseApi.logout().catch(() => null);
    setSession(null);
    navigate('/', { replace: true });
  };

  const genericPages: Record<string, { title: string; eyebrow: string; loader: () => Promise<any>; text?: string }> = {
    '/enterprise/employee/ai-support': { title: 'AI поддержка 24/7', eyebrow: 'Employee Portal', loader: () => enterpriseApi.startAiSession({ mode: 'mental_support' }).then((data) => [data]), text: 'Приватная поддержка тревоги, стресса и маршрутизация к специалисту.' },
    '/enterprise/employee/duty-doctor': { title: 'Срочно к врачу', eyebrow: 'Employee Portal', loader: () => enterpriseApi.requestConsultation({ serviceType: 'duty_doctor' }).then((data) => [data]), text: 'Запрос дежурному врачу в рамках корпоративного пакета.' },
    '/enterprise/employee/specialist': { title: 'Записаться к специалисту', eyebrow: 'Employee Portal', loader: () => enterpriseApi.requestConsultation({ serviceType: 'specialist', specialty: 'терапевт' }).then((data) => [data]), text: 'Узкие специалисты доступны по лимитам, triage и premium/co-pay правилам.' },
    '/enterprise/employee/psychology': { title: 'Психологическая поддержка', eyebrow: 'Employee Portal', loader: () => enterpriseApi.requestConsultation({ serviceType: 'psychologist' }).then((data) => [data]), text: 'Психологи и AI mental support в рамках корпоративного доступа.' },
    '/enterprise/employee/limits': { title: 'Мои лимиты', eyebrow: 'Employee Portal', loader: enterpriseApi.employeeBenefits },
    '/enterprise/employee/history': { title: 'История консультаций', eyebrow: 'Employee Portal', loader: enterpriseApi.employeeHistory },
    '/enterprise/employee/recommendations': { title: 'Рекомендации', eyebrow: 'Employee Portal', loader: enterpriseApi.employeeRecommendations },
    '/enterprise/employee/profile': { title: 'Профиль', eyebrow: 'Employee Portal', loader: enterpriseApi.employeeProfile },
    '/enterprise/employee/help': { title: 'Помощь', eyebrow: 'Employee Portal', loader: enterpriseApi.employeeNotifications },
    '/enterprise/employer/employees': { title: 'Сотрудники', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerEmployees },
    '/enterprise/employer/departments': { title: 'Подразделения', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerDepartments },
    '/enterprise/employer/activation': { title: 'Активация', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerActivation },
    '/enterprise/employer/utilization': { title: 'Использование сервиса', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerUtilization },
    '/enterprise/employer/trends': { title: 'Burnout/Stressor Trends', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerTrends },
    '/enterprise/employer/finance': { title: 'Финансы', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerFinance },
    '/enterprise/employer/plan': { title: 'Пакет и лимиты', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerPlan },
    '/enterprise/employer/reports': { title: 'Отчёты', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerReports },
    '/enterprise/employer/privacy': { title: 'Privacy & Compliance', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerPrivacy },
    '/enterprise/employer/settings': { title: 'Настройки', eyebrow: 'Employer / HR Portal', loader: enterpriseApi.employerSettings },
    '/enterprise/provider/schedule': { title: 'Расписание', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerSchedule },
    '/enterprise/provider/patients': { title: 'Пациенты', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerPatients },
    '/enterprise/provider/consultations': { title: 'Консультации', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerConsultations },
    '/enterprise/provider/triage-summary': { title: 'Triage Summary', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerTriageSummary },
    '/enterprise/provider/notes': { title: 'Медицинские записи', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerNotes },
    '/enterprise/provider/payouts': { title: 'Выплаты', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerPayouts },
    '/enterprise/provider/training': { title: 'Обучение', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerTraining },
    '/enterprise/provider/profile': { title: 'Профиль', eyebrow: 'Doctor Portal', loader: enterpriseApi.providerProfile },
    '/enterprise/psychologist/schedule': { title: 'Расписание', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerSchedule },
    '/enterprise/psychologist/clients': { title: 'Клиенты', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerPatients },
    '/enterprise/psychologist/risk-flags': { title: 'Risk Flags', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerTriageSummary },
    '/enterprise/psychologist/notes': { title: 'Заметки', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerNotes },
    '/enterprise/psychologist/escalations': { title: 'Эскалации', eyebrow: 'Psychologist Portal', loader: enterpriseApi.supervisorEscalations },
    '/enterprise/psychologist/payouts': { title: 'Выплаты', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerPayouts },
    '/enterprise/psychologist/training': { title: 'Обучение', eyebrow: 'Psychologist Portal', loader: enterpriseApi.providerTraining },
    '/enterprise/takhet-admin/plans': { title: 'Планы', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminPlans },
    '/enterprise/takhet-admin/employees': { title: 'Сотрудники', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminEmployees },
    '/enterprise/takhet-admin/doctors': { title: 'Врачи', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminDoctors },
    '/enterprise/takhet-admin/verification': { title: 'Верификация', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminVerification },
    '/enterprise/takhet-admin/tariffs': { title: 'Тарифы врачей', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminTariffs },
    '/enterprise/takhet-admin/limits': { title: 'Лимиты', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminLimits },
    '/enterprise/takhet-admin/billing': { title: 'Billing', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminBilling },
    '/enterprise/takhet-admin/payouts': { title: 'Payouts', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminPayouts },
    '/enterprise/takhet-admin/ai-sessions': { title: 'AI Sessions', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminAiSessions },
    '/enterprise/takhet-admin/reports': { title: 'Reports', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminReports },
    '/enterprise/takhet-admin/audit': { title: 'Audit Logs', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminAudit },
    '/enterprise/takhet-admin/compliance': { title: 'Compliance', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminCompliance },
    '/enterprise/takhet-admin/settings': { title: 'Settings', eyebrow: 'Takhet Admin Portal', loader: enterpriseApi.takhetAdminSettings },
    '/enterprise/supervisor/flagged-cases': { title: 'Flagged Cases', eyebrow: 'Clinical Supervisor Portal', loader: enterpriseApi.supervisorFlaggedCases },
    '/enterprise/supervisor/escalations': { title: 'Escalations', eyebrow: 'Clinical Supervisor Portal', loader: enterpriseApi.supervisorEscalations },
    '/enterprise/supervisor/notes-audit': { title: 'Doctor Notes Audit', eyebrow: 'Clinical Supervisor Portal', loader: enterpriseApi.supervisorNotesAudit },
    '/enterprise/supervisor/risk-monitoring': { title: 'Risk Monitoring', eyebrow: 'Clinical Supervisor Portal', loader: enterpriseApi.supervisorRiskMonitoring },
    '/enterprise/supervisor/protocols': { title: 'Clinical Protocols', eyebrow: 'Clinical Supervisor Portal', loader: enterpriseApi.supervisorProtocols }
  };

  if (loading) return <LoadingState />;
  if (loginOnly) return <EnterpriseLogin onSession={handleSession} />;
  if (!session?.user) return <EnterpriseLanding onLogin={() => navigate('/enterprise/login')} />;

  const path = location.pathname;
  const page = (() => {
    if (path === '/enterprise' || path === '/enterprise/') return <Navigate to={roleHome[session.user.role]} replace />;
    if (path === '/enterprise/employee') return <EmployeeDashboard />;
    if (path === '/enterprise/employer') return <EmployerDashboard />;
    if (path === '/enterprise/provider') return <ProviderDashboard type="doctor" />;
    if (path === '/enterprise/psychologist') return <ProviderDashboard type="psychologist" />;
    if (path === '/enterprise/takhet-admin') return <TakhetAdminDashboard />;
    if (path === '/enterprise/supervisor') return <SupervisorDashboard />;
    if (path === '/enterprise/employee/risk-precheck') return <RiskPrecheckPage />;
    const generic = genericPages[path];
    if (generic) return <GenericDataPage {...generic} />;
    return <Navigate to={roleHome[session.user.role]} replace />;
  })();

  return (
    <EnterpriseShell user={session.user} onLogout={logout}>
      {page}
    </EnterpriseShell>
  );
};

export default EnterpriseApp;
