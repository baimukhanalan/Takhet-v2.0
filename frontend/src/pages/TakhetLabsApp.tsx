import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  ChevronRight,
  Dna,
  FileText,
  HeartPulse,
  LogOut,
  Menu,
  Microscope,
  Search,
  Settings,
  ShieldCheck,
  TestTube2,
  User,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import TakhetLogo from '../components/Logo';
import { LabsPortalDashboard, LabsRole, LabsSession, takhetLabsApi } from '../services/takhetLabsApi';

const roleHome: Record<LabsRole, string> = {
  member: '/takhet-labs/portal/member',
  physician: '/takhet-labs/portal/physician',
  admin: '/takhet-labs/portal/admin',
  family: '/takhet-labs/portal/family'
};

const roleConfigs: Record<LabsRole, { title: string; label: string; icon: React.ElementType; description: string }> = {
  member: {
    title: 'Member',
    label: 'Пациент',
    icon: User,
    description: 'Личный кабинет Takhet Labs: health score, biomarkers, biological age, protocol и reports.'
  },
  physician: {
    title: 'Physician Reviewer',
    label: 'Врач-reviewer',
    icon: UserCheck,
    description: 'Врачебный review: biomarker review, AI insight review, protocol approval и comments.'
  },
  admin: {
    title: 'Labs Admin',
    label: 'Админ',
    icon: ShieldCheck,
    description: 'Labs Admin: memberships, lab management, biomarker management, billing и physician approvals.'
  },
  family: {
    title: 'Family Health',
    label: 'Семья',
    icon: Users,
    description: 'Family Health: family profiles, parent/child monitoring и family health insights.'
  }
};

const navByRole: Record<LabsRole, Array<{ label: string; path: string; icon: React.ElementType }>> = {
  member: [
    { label: 'Dashboard', path: '/takhet-labs/portal/member', icon: BarChart3 },
    { label: 'Biomarkers', path: '/takhet-labs/portal/member/biomarkers', icon: TestTube2 },
    { label: 'Health Scores', path: '/takhet-labs/portal/member/scores', icon: HeartPulse },
    { label: 'AI Insights', path: '/takhet-labs/portal/member/insights', icon: Brain },
    { label: 'Reports', path: '/takhet-labs/portal/member/reports', icon: FileText },
    { label: 'Settings', path: '/takhet-labs/portal/member/settings', icon: Settings }
  ],
  physician: [
    { label: 'Review Queue', path: '/takhet-labs/portal/physician', icon: Microscope },
    { label: 'Biomarker Review', path: '/takhet-labs/portal/physician/biomarkers', icon: TestTube2 },
    { label: 'Protocol Approval', path: '/takhet-labs/portal/physician/protocols', icon: ShieldCheck },
    { label: 'Comments', path: '/takhet-labs/portal/physician/comments', icon: FileText }
  ],
  admin: [
    { label: 'Overview', path: '/takhet-labs/portal/admin', icon: BarChart3 },
    { label: 'Memberships', path: '/takhet-labs/portal/admin/memberships', icon: Dna },
    { label: 'Lab Management', path: '/takhet-labs/portal/admin/labs', icon: Microscope },
    { label: 'Biomarkers', path: '/takhet-labs/portal/admin/biomarkers', icon: TestTube2 },
    { label: 'Billing', path: '/takhet-labs/portal/admin/billing', icon: FileText }
  ],
  family: [
    { label: 'Family Dashboard', path: '/takhet-labs/portal/family', icon: Users },
    { label: 'Profiles', path: '/takhet-labs/portal/family/profiles', icon: User },
    { label: 'Insights', path: '/takhet-labs/portal/family/insights', icon: Brain },
    { label: 'Reports', path: '/takhet-labs/portal/family/reports', icon: FileText }
  ]
};

const loginRoleOptions: LabsRole[] = ['member', 'physician', 'admin'];

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const fallbackDashboard = (role: LabsRole): LabsPortalDashboard => ({
  role,
  title: roleConfigs[role].description,
  metrics: [
    { title: 'Health Score', value: 86, caption: 'Последний расчет' },
    { title: 'Biological Age', value: 31, caption: 'Текущая оценка' },
    { title: 'Reports', value: 2, caption: 'Готовые файлы' }
  ],
  sections: [
    { title: roleConfigs[role].title, text: roleConfigs[role].description },
    { title: 'Preventive monitoring', text: 'AI provides preventive insights and monitoring. Final decisions belong to licensed physicians.' }
  ],
  rows: []
});

const LabsLogin: React.FC<{ onSession: (session: LabsSession) => void }> = ({ onSession }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<LabsRole>('member');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const config = roleConfigs[role];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const session = await takhetLabsApi.labsLogin({ identifier, password, role });
      onSession(session);
    } catch {
      setError('Не удалось войти в Takhet Labs.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-[#101827] text-white p-12 xl:p-20 flex-col justify-center">
        <button onClick={() => navigate('/takhet-labs')} className="mb-auto flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
        <div>
          <p className="text-4xl font-black tracking-tight">Takhet<span className="text-primary">+</span></p>
          <h1 className="mt-8 text-6xl font-black leading-[0.9] tracking-tighter">Вход в Takhet Labs</h1>
          <p className="mt-6 max-w-md text-base font-semibold leading-7 text-slate-400">{config.description}</p>
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <form onSubmit={submit} className="w-full max-w-xl">
            <button type="button" onClick={() => navigate('/takhet-labs')} className="mb-12 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <h2 className="text-5xl font-black tracking-tight text-slate-950">Вход</h2>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Выберите роль Takhet Labs и войдите в портал</p>
            <div className="mt-8 grid grid-cols-1 gap-2 rounded-2xl bg-slate-100 p-2 sm:grid-cols-3 md:grid-cols-3">
              {loginRoleOptions.map((nextRole) => {
                const RoleIcon = roleConfigs[nextRole].icon;
                return (
                  <button
                    type="button"
                    key={nextRole}
                    onClick={() => setRole(nextRole)}
                    className={cx('rounded-xl px-3 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition', role === nextRole ? 'bg-white text-primary shadow-lg' : 'text-slate-500 hover:text-primary')}
                  >
                    <RoleIcon className="mx-auto mb-2 h-5 w-5" />
                    {roleConfigs[nextRole].title}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-xs font-bold leading-5 text-slate-500">{config.description}</p>
            <div className="mt-6 space-y-3">
              <input name="labs-identifier" type="text" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Email или Labs ID" className="w-full rounded-2xl bg-blue-50 px-5 py-5 text-base font-bold text-slate-950 outline-none focus:ring-2 focus:ring-primary" />
              <input name="labs-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" className="w-full rounded-2xl bg-blue-50 px-5 py-5 text-base font-bold text-slate-950 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-[2rem] bg-primary px-8 py-5 text-lg font-black text-white shadow-xl shadow-primary/20">
              Войти
              <ChevronRight className="h-5 w-5" />
            </button>
            {error ? <p className="mt-4 text-sm font-bold text-red-500">{error}</p> : null}
          </form>
        </div>
      </div>
    </div>
  );
};

const LabsShell: React.FC<{ session: LabsSession; onLogout: () => void; children: React.ReactNode }> = ({ session, onLogout, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const role = session.user?.role || 'member';
  const items = navByRole[role];

  const NavContent = () => (
    <div className="flex h-full w-full flex-col bg-background">
      <button onClick={() => navigate(roleHome[role])} className="flex items-center gap-3 p-8 text-left hover:opacity-80">
        <TakhetLogo className="h-10 w-10" />
        <div>
          <span className="text-2xl font-black tracking-tighter text-foreground">Takhet<span className="text-primary">+</span></span>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Labs</p>
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
            <input placeholder="Поиск по Takhet Labs..." className="w-full rounded-full bg-secondary/50 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-black text-foreground">{session.user?.fullName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{roleConfigs[role].title}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 xl:p-10">{children}</main>
      </div>
    </div>
  );
};

const LabsPortalPage: React.FC<{ role: LabsRole }> = ({ role }) => {
  const [dashboard, setDashboard] = useState<LabsPortalDashboard | null>(null);

  useEffect(() => {
    void takhetLabsApi.labsPortalDashboard().then(setDashboard).catch(() => setDashboard(fallbackDashboard(role)));
  }, [role]);

  const data = dashboard || fallbackDashboard(role);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Takhet Labs</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tighter text-slate-950 sm:text-5xl">
          {role === 'member' ? 'Личный кабинет Takhet Labs' : data.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500">{roleConfigs[role].description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <div key={metric.title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <Activity className="mb-5 h-8 w-8 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{metric.title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
            {metric.caption ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{metric.caption}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {data.sections.map((section) => (
          <div key={section.title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TakhetLabsApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<LabsSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void takhetLabsApi.labsSession()
      .then((nextSession) => setSession(nextSession.authenticated ? nextSession : null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSession = (nextSession: LabsSession) => {
    setSession(nextSession);
    navigate(roleHome[nextSession.user?.role || 'member'], { replace: true });
  };

  const logout = async () => {
    await takhetLabsApi.labsLogout().catch(() => null);
    setSession(null);
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 font-black uppercase tracking-[0.3em]">Загрузка Labs</div>;
  }

  if (location.pathname === '/takhet-labs/login') {
    return <LabsLogin onSession={handleSession} />;
  }

  if (!session?.user) {
    return <Navigate to="/takhet-labs/login" replace />;
  }

  const role = session.user.role;
  const requestedRole = (location.pathname.split('/')[3] as LabsRole | undefined) || role;
  if (!requestedRole || !(requestedRole in roleHome) || requestedRole !== role) {
    return <Navigate to={roleHome[role]} replace />;
  }

  return (
    <LabsShell session={session} onLogout={logout}>
      <LabsPortalPage role={role} />
    </LabsShell>
  );
};

export default TakhetLabsApp;
