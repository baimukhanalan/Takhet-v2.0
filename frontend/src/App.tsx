import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { User, UserRole } from './types';
import { api } from '../services/api';
import { roleApi } from '../services/roleApi';

const Sidebar = lazy(() => import('./components/Sidebar'));
const Header = lazy(() => import('./components/Header'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DoctorsPage = lazy(() => import('./pages/DoctorsPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const MentalPage = lazy(() => import('./pages/MentalPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AuthConfirmEmailPage = lazy(() => import('./pages/AuthConfirmEmailPage'));
const AuthResetPasswordPage = lazy(() => import('./pages/AuthResetPasswordPage'));
const PatientAuthPage = lazy(() => import('./pages/PatientAuthPage'));
const AdminAuthPage = lazy(() => import('./pages/AdminAuthPage'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TakhetAIChat = lazy(() => import('./pages/TakhetAIChat'));
const AIHealthBrowser = lazy(() => import('./pages/AIHealthBrowser'));
const AIAnalysisCenter = lazy(() => import('./pages/AIAnalysisCenter'));
const AIConsultationRoom = lazy(() => import('./pages/AIConsultationRoom'));
const TakhetLabsPage = lazy(() => import('./pages/TakhetLabsPage'));
const TakhetLabsApp = lazy(() => import('./pages/TakhetLabsApp'));
const GuestConsultationPage = lazy(() => import('./pages/GuestConsultationPage'));
const DoctorsSearchPage = lazy(() => import('./pages/DoctorsSearchPage'));
const DoctorProfileBookingPage = lazy(() => import('./pages/DoctorProfileBookingPage'));
const DoctorBookingConfirmPage = lazy(() => import('./pages/DoctorBookingConfirmPage'));
const PatientAppointments = lazy(() => import('./pages/PatientAppointments'));
const MedicalArchive = lazy(() => import('./pages/MedicalArchive'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HomeVisitPage = lazy(() => import('./pages/HomeVisitPage'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const DoctorPatients = lazy(() => import('./pages/DoctorPatients'));
const DoctorConsultations = lazy(() => import('./pages/DoctorConsultations'));
const ConsultationRoom = lazy(() => import('./pages/ConsultationRoom'));
const DoctorFinances = lazy(() => import('./pages/DoctorFinances'));
const SwarmMedicinePage = lazy(() => import('./pages/SwarmMedicinePage'));
const PartnerDoctors = lazy(() => import('./pages/PartnerDoctors'));
const PartnerReports = lazy(() => import('./pages/PartnerReports'));
const PartnerFinances = lazy(() => import('./pages/PartnerFinances'));
const AIChatOverlay = lazy(() => import('./components/AIChatOverlay'));
const EnterpriseApp = lazy(() => import('./pages/EnterpriseApp'));

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = LoginCredentials;

type AuthSessionResponse = {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    role: 'patient' | 'doctor' | 'partner' | 'admin';
    verified: boolean;
  } | null;
};

const roleMap: Record<UserRole, 'patient' | 'doctor' | 'partner' | 'admin'> = {
  [UserRole.PATIENT]: 'patient',
  [UserRole.DOCTOR]: 'doctor',
  [UserRole.PARTNER]: 'partner',
  [UserRole.ADMIN]: 'admin'
};

const fallbackUserName: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Пациент Takhet',
  [UserRole.DOCTOR]: 'Врач Takhet',
  [UserRole.PARTNER]: 'Партнер Takhet',
  [UserRole.ADMIN]: 'Администратор Takhet'
};

const buildAvatar = (name: string, role: UserRole) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${role === UserRole.ADMIN ? '0f172a' : '0D47A1'}&color=fff`;

const normalizeUser = (role: UserRole, profile: any): User => {
  const name =
    profile?.fullName ||
    profile?.name ||
    profile?.clinicName ||
    profile?.organizationName ||
    profile?.email ||
    fallbackUserName[role];

  const verified =
    role === UserRole.DOCTOR || role === UserRole.PARTNER
      ? Boolean(profile?.verified ?? profile?.active ?? profile?.isVerified)
      : true;

  return {
    id: profile?.id || `${role.toLowerCase()}-user`,
    name,
    email: profile?.email,
    role,
    avatar: profile?.avatar || buildAvatar(name, role),
    isVerified: verified,
    isPending: role !== UserRole.ADMIN && !verified
  };
};

const loadRoleProfile = async (role: UserRole) => {
  switch (role) {
    case UserRole.PATIENT:
      return roleApi.patientProfile();
    case UserRole.DOCTOR:
      return roleApi.doctorProfile();
    case UserRole.PARTNER:
      return roleApi.partnerProfile();
    case UserRole.ADMIN:
      return null;
    default:
      return null;
  }
};

const PrivateRoute: React.FC<{ user: User | null; allowed?: UserRole[]; redirectTo?: string; children: React.ReactElement }> = ({
  user,
  allowed,
  redirectTo = '/auth',
  children
}) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location, forcePublicAuth: true }} />;
  }

  if (allowed && !allowed.includes(user.role)) {
    if (user.role === UserRole.ADMIN) return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppShell: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();

  const publicRoutes = useMemo(
    () => new Set(['/', '/doctors', '/partners', '/mental', '/community', '/services', '/takhet-labs', '/guest-consultation', '/auth', '/patient-auth', '/admin-auth', '/ai-consultation', '/takhet-ai/try']),
    []
  );
  const pathname = location.pathname;
  const isServicesRoute = pathname === '/services' || pathname.startsWith('/services/');
  const isPublic = (publicRoutes.has(pathname) || pathname.startsWith('/services/')) && !(user && isServicesRoute);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isDoctorCaseRoom = pathname.startsWith('/consultation/');
  const isTakhetAi = pathname.startsWith('/takhet-ai/');
  const isAiConsultation = pathname === '/ai-consultation';
  const isHealthBrowser = pathname === '/health-browser';
  const isEnterprise = pathname.startsWith('/enterprise');
  const isTakhetLabsNamespace = pathname.startsWith('/takhet-labs/login') || pathname.startsWith('/takhet-labs/portal');
  const shouldShowCoordinator = !user && isPublic && !isTakhetAi && !isAiConsultation;

  if (isEnterprise || isTakhetLabsNamespace) {
    return <>{children}</>;
  }

  if (!user || isPublic) {
    return (
      <>
        {children}
        {shouldShowCoordinator ? (
          <Suspense fallback={null}>
            <AIChatOverlay />
          </Suspense>
        ) : null}
      </>
    );
  }

  if (isAdmin || isDoctorCaseRoom || isTakhetAi || isHealthBrowser) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Suspense fallback={null}>
        <Sidebar role={user.role} onLogout={onLogout} />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Suspense fallback={null}>
          <Header user={user} />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 xl:p-10">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const enterpriseHost = typeof window !== 'undefined' && window.location.hostname === 'enterprise.takhet.com';

  const clearLegacyAuthStorage = () => {
    localStorage.removeItem('takhet_user');
    localStorage.removeItem('takhet_role');
    localStorage.removeItem('takhet_token');
  };

  const persistUser = (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      clearLegacyAuthStorage();
    }
  };

  const hydrateFromSession = async (authorization?: string) => {
    const session = await api<AuthSessionResponse>('/auth/session', {
      headers: authorization ? { Authorization: authorization } : undefined
    });

    if (!session?.authenticated || !session.user) {
      persistUser(null);
      return;
    }

    const role = session.user.role.toUpperCase() as UserRole;

    try {
      const profile = await loadRoleProfile(role);
      persistUser(normalizeUser(role, { ...session.user, ...profile }));
    } catch {
      persistUser(normalizeUser(role, session.user));
    }

    clearLegacyAuthStorage();
  };

  useEffect(() => {
    const hydrate = async () => {
      try {
        await hydrateFromSession();
      } catch {
        persistUser(null);
      } finally {
        setBootstrapped(true);
      }
    };

    void hydrate();
  }, []);

  const handleLogin = async (role: UserRole, credentials: LoginCredentials) => {
    const response = await api<{ user?: { id: string; email: string; role: string; verified: boolean } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        role: roleMap[role]
      })
    });

    try {
      const profile = await loadRoleProfile(role);
      persistUser(normalizeUser(role, { ...(response.user || {}), ...profile }));
    } catch {
      persistUser(normalizeUser(role, response.user || { email: credentials.email, role }));
    }
  };

  const handleRegister = async (role: UserRole, credentials: RegisterCredentials) => {
    return api<{ ok: boolean; status: string; verification?: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        role: roleMap[role]
      })
    });
  };

  const handleLogout = () => {
    void api('/auth/logout', { method: 'POST' }).catch(() => null);
    persistUser(null);
    navigate('/', { replace: true });
  };

  if (!bootstrapped) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 font-black uppercase tracking-[0.3em]">Загрузка</div>;
  }

  const showLandingForAuthedUser = new URLSearchParams(location.search).get('landing') === '1';

  return (
    <AppShell user={user} onLogout={handleLogout}>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={enterpriseHost ? <Navigate to="/enterprise" replace /> : user && !showLandingForAuthedUser ? <Navigate to={user.role === UserRole.ADMIN ? '/admin-dashboard' : '/dashboard'} replace /> : <LandingPage user={user || undefined} />} />
        <Route path="/login" element={enterpriseHost ? <Navigate to="/enterprise/login" replace /> : <Navigate to="/auth" replace />} />
        <Route path="/enterprise/login" element={<EnterpriseApp loginOnly />} />
        <Route path="/enterprise/*" element={<EnterpriseApp />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/mental" element={<MentalPage isPortal={false} user={user || undefined} />} />
        <Route path="/community" element={<CommunityPage isPortal={false} user={user || undefined} />} />
        <Route path="/takhet-labs" element={<TakhetLabsPage user={user || undefined} />} />
        <Route path="/takhet-labs/login" element={<TakhetLabsApp />} />
        <Route path="/takhet-labs/portal/*" element={<TakhetLabsApp />} />
        <Route path="/guest-consultation" element={<GuestConsultationPage />} />
        <Route path="/health-browser" element={<AIHealthBrowser user={user || undefined} />} />
        <Route path="/ai-lab" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT, UserRole.DOCTOR]}><AIAnalysisCenter user={user!} /></PrivateRoute>} />
        <Route path="/ai-consultation" element={<AIConsultationRoom />} />

        <Route path="/auth" element={!user ? <AuthPage onLogin={handleLogin} onRegister={handleRegister} /> : <Navigate to={user.role === UserRole.ADMIN ? '/admin-dashboard' : '/dashboard'} replace />} />
        <Route path="/auth/confirm-email" element={<AuthConfirmEmailPage />} />
        <Route path="/auth/reset-password" element={<AuthResetPasswordPage />} />
        <Route path="/patient-auth" element={!user ? <PatientAuthPage onLogin={handleLogin} /> : <Navigate to={user.role === UserRole.ADMIN ? '/admin-dashboard' : '/dashboard'} replace />} />
        <Route path="/admin-auth" element={!user ? <AdminAuthPage onLogin={handleLogin} /> : <Navigate to={user.role === UserRole.ADMIN ? '/admin-dashboard' : '/dashboard'} replace />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user}>
              {user?.role === UserRole.PATIENT ? (
                <PatientDashboard user={user} />
              ) : user?.role === UserRole.DOCTOR ? (
                <DoctorDashboard user={user} />
              ) : user?.role === UserRole.PARTNER ? (
                <PartnerDashboard user={user} />
              ) : (
                <Navigate to="/admin-dashboard" replace />
              )}
            </PrivateRoute>
          }
        />

        <Route path="/takhet-ai" element={<Navigate to={user?.role === UserRole.DOCTOR ? '/takhet-ai/doctor' : user?.role === UserRole.PARTNER ? '/takhet-ai/partner' : user?.role === UserRole.PATIENT ? '/takhet-ai/patient' : '/takhet-ai/try'} replace />} />
        <Route path="/takhet-ai/try" element={<TakhetAIChat trialMode />} />
        <Route path="/takhet-ai/patient" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><TakhetAIChat user={user!} /></PrivateRoute>} />
        <Route path="/takhet-ai/doctor" element={<PrivateRoute user={user} allowed={[UserRole.DOCTOR]}><TakhetAIChat user={user!} /></PrivateRoute>} />
        <Route path="/takhet-ai/partner" element={<PrivateRoute user={user} allowed={[UserRole.PARTNER]}><TakhetAIChat user={user!} /></PrivateRoute>} />

        <Route path="/portal/mental" element={<PrivateRoute user={user}><MentalPage isPortal={true} user={user!} /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute user={user}><ChatPage user={user!} /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute user={user}><SettingsPage user={user!} /></PrivateRoute>} />
        <Route path="/labs" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><TakhetLabsPage user={user!} portal /></PrivateRoute>} />

        <Route path="/doctors-search" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><DoctorsSearchPage /></PrivateRoute>} />
        <Route path="/doctors-search/:doctorId" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><DoctorProfileBookingPage /></PrivateRoute>} />
        <Route path="/doctors-search/:doctorId/confirm" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><DoctorBookingConfirmPage /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><PatientAppointments /></PrivateRoute>} />
        <Route path="/archive" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><MedicalArchive /></PrivateRoute>} />
        <Route path="/services" element={<ServicesPage isPortal={Boolean(user)} />} />
        <Route path="/services/:serviceId" element={<ServiceDetailPage isPortal={Boolean(user)} />} />
        <Route path="/home-visit" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><HomeVisitPage /></PrivateRoute>} />
        <Route path="/pharmacy" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT]} redirectTo="/patient-auth"><Pharmacy /></PrivateRoute>} />

        <Route path="/patients" element={<PrivateRoute user={user} allowed={[UserRole.DOCTOR]}><DoctorPatients /></PrivateRoute>} />
        <Route path="/consultations" element={<PrivateRoute user={user} allowed={[UserRole.DOCTOR]}><DoctorConsultations /></PrivateRoute>} />
        <Route path="/consultation/:id" element={<PrivateRoute user={user}><ConsultationRoom user={user!} /></PrivateRoute>} />
        <Route
          path="/finances"
          element={
            <PrivateRoute user={user}>
              {user?.role === UserRole.DOCTOR ? <DoctorFinances /> : user?.role === UserRole.PARTNER ? <PartnerFinances /> : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        />
        <Route path="/swarm-medicine" element={<PrivateRoute user={user} allowed={[UserRole.DOCTOR]}><SwarmMedicinePage /></PrivateRoute>} />

        <Route path="/partner-doctors" element={<PrivateRoute user={user} allowed={[UserRole.PARTNER]}><PartnerDoctors /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute user={user} allowed={[UserRole.PARTNER]}><PartnerReports /></PrivateRoute>} />

        <Route path="/admin-dashboard" element={<PrivateRoute user={user} allowed={[UserRole.ADMIN]} redirectTo="/admin-auth"><AdminDashboard user={user!} onLogout={handleLogout} /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AppShell>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;

