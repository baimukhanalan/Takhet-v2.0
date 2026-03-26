import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserRole, User } from './types';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ConsultationRoom from './pages/ConsultationRoom';
import MedicalArchive from './pages/MedicalArchive';
import Pharmacy from './pages/Pharmacy';
import DoctorPatients from './pages/DoctorPatients';
import DoctorConsultations from './pages/DoctorConsultations';
import DoctorFinances from './pages/DoctorFinances';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommunityPage from './pages/CommunityPage';
import MentalPage from './pages/MentalPage';
import HomeVisitPage from './pages/HomeVisitPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerDoctors from './pages/PartnerDoctors';
import PartnerReports from './pages/PartnerReports';
import PartnerFinances from './pages/PartnerFinances';
import DoctorsPage from './pages/DoctorsPage';
import AIConsultationRoom from './pages/AIConsultationRoom';
import DoctorsSearchPage from './pages/DoctorsSearchPage';
import PartnersPage from './pages/PartnersPage';
import PatientAuthPage from './pages/PatientAuthPage';
import TakhetAIChat from './pages/TakhetAIChat';
import AuthPage from './pages/AuthPage';
import PatientAppointments from './pages/PatientAppointments';
import ServicesPage from './pages/ServicesPage';
import AdminAuthPage from './pages/AdminAuthPage';
import AdminDashboard from './pages/AdminDashboard';
import SwarmMedicinePage from './pages/SwarmMedicinePage';
import AIHealthBrowser from './pages/AIHealthBrowser';
import AIChatOverlay from './components/AIChatOverlay';
import { MockDB } from './services/db';
import { AlertTriangle, Hammer, ShieldAlert } from 'lucide-react';

const MaintenanceGuard: React.FC<{ children: React.ReactNode; isAdmin: boolean }> = ({ children, isAdmin }) => {
  const [isMaintenance, setIsMaintenance] = useState(MockDB.getSystemConfig().maintenanceMode);

  React.useEffect(() => {
    const check = () => setIsMaintenance(MockDB.getSystemConfig().maintenanceMode);
    window.addEventListener('storage_update', check);
    return () => window.removeEventListener('storage_update', check);
  }, []);

  if (isMaintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-amber-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/30">
            <Hammer className="w-12 h-12 text-amber-500" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Технические работы</h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Мы проводим плановое обновление системы Takhet. Сервис будет доступен в ближайшее время. Приносим извинения за неудобства.
            </p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 text-left">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Доступ ограничен администратором платформы
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const PendingApproval: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
    <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
        <ShieldAlert className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Ожидание проверки</h1>
        <p className="text-slate-500 font-medium leading-relaxed">
          Ваш аккаунт находится на стадии модерации. Администратор Takhet+ проверяет ваши документы. Обычно это занимает до 24 часов.
        </p>
      </div>
      <button 
        onClick={onLogout}
        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
      >
        Выйти из системы
      </button>
    </div>
  </div>
);

const AppLayout: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const isPublicRoute = ['/auth', '/doctors', '/partners', '/', '/admin-auth', '/takhet-ai', '/mental', '/ai-consultation', '/patient-auth', '/health-browser'].includes(location.pathname);
  const isConsultation = location.pathname.startsWith('/consultation/') || location.pathname === '/ai-consultation' || location.pathname === '/takhet-ai';
  const isAdmin = user?.role === UserRole.ADMIN;
  
  // Check approval for Doctors and Partners
  const isUnapproved = user && (user.role === UserRole.DOCTOR || user.role === UserRole.PARTNER) && !user.isVerified;

  if (isUnapproved && !isPublicRoute) {
    return <PendingApproval onLogout={onLogout} />;
  }

  // Portal view check
  const isPortalView = location.pathname.startsWith('/portal/');
  if (user && (isPortalView || (!isPublicRoute && !isAdmin))) {
    return (
      <div className={`flex min-h-screen ${isAdmin ? '' : 'bg-background'} overflow-hidden`}>
        {!isConsultation && !isAdmin && <Sidebar role={user.role} onLogout={onLogout} />}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {!isConsultation && !isAdmin && <Header user={user} />}
          <main className={`flex-1 overflow-y-auto ${isConsultation || isAdmin ? 'p-0' : 'p-4 md:p-10'} transition-all duration-500`}>
            {children}
          </main>
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-background">{children}</div>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const loginAs = (role: UserRole) => {
    const names = {
      [UserRole.PATIENT]: 'Alan Baimukhan',
      [UserRole.DOCTOR]: 'Тестовый Врач (WebRTC)',
      [UserRole.PARTNER]: 'City Medical Center Admin',
      [UserRole.ADMIN]: 'System Administrator'
    };
    const ids = {
      [UserRole.PATIENT]: 'master-user-id',
      [UserRole.DOCTOR]: 'doc_test',
      [UserRole.PARTNER]: 'partner_1',
      [UserRole.ADMIN]: 'admin_1'
    };
    setUser({
      id: ids[role],
      name: names[role],
      role,
      isVerified: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(names[role])}&background=${role === UserRole.ADMIN ? '1e293b' : '0D47A1'}&color=fff`
    });
  };
  const logout = () => setUser(null);

  return (
    <HashRouter>
      <AppContent user={user} loginAs={loginAs} logout={logout} />
    </HashRouter>
  );
};

const AppContent: React.FC<{ user: User | null; loginAs: (role: UserRole) => void; logout: () => void }> = ({ user, loginAs, logout }) => {
  const location = useLocation();
  const isPublicLanding = ['/', '/doctors', '/partners', '/auth', '/admin-auth', '/patient-auth', '/health-browser'].includes(location.pathname);
  const isTakhetAI = location.pathname === '/takhet-ai' || location.pathname === '/portal/takhet-ai';
  const isPortal = location.pathname.startsWith('/portal/') || ['/dashboard', '/chat', '/settings', '/archive', '/pharmacy', '/patients', '/consultations'].includes(location.pathname);

  return (
    <>
      {isPublicLanding && <AIChatOverlay />}
      <MaintenanceGuard isAdmin={user?.role === UserRole.ADMIN}>
        <AppLayout user={user} onLogout={logout}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage user={user || undefined} />} />
            <Route path="/health-browser" element={<AIHealthBrowser user={user || undefined} />} />
            <Route path="/takhet-ai" element={user ? <TakhetAIChat user={user} /> : <Navigate to="/patient-auth" state={{ from: location }} replace />} />
            <Route path="/patient-auth" element={!user ? <PatientAuthPage onLogin={loginAs} /> : <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />} />
            <Route path="/mental" element={<MentalPage isPortal={false} />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/ai-consultation" element={<AIConsultationRoom />} />
            
            <Route path="/auth" element={!user ? <AuthPage onLogin={loginAs} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin-auth" element={!user ? <AdminAuthPage onLogin={loginAs} /> : <Navigate to="/admin-dashboard" replace />} />
            {/* Portal Routes (Authenticated) */}
            <Route path="/dashboard" element={
              user?.role === UserRole.PATIENT 
                ? <PatientDashboard user={user} /> 
                : user?.role === UserRole.DOCTOR 
                  ? <DoctorDashboard user={user} />
                  : user?.role === UserRole.PARTNER 
                    ? <PartnerDashboard user={user} />
                    : user?.role === UserRole.ADMIN
                      ? <Navigate to="/admin-dashboard" replace />
                      : <Navigate to="/auth" replace />
            } />
            <Route path="/portal/mental" element={user ? <MentalPage user={user} isPortal={true} /> : <Navigate to="/auth" />} />
            
            <Route path="/admin-dashboard" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/admin-auth" replace />} />
            <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/auth" />} />
            <Route path="/settings" element={user ? <SettingsPage user={user} /> : <Navigate to="/auth" />} />
            <Route path="/appointments" element={user?.role === UserRole.PATIENT ? <PatientAppointments /> : <Navigate to="/dashboard" />} />
            <Route path="/doctors-search" element={user ? <DoctorsSearchPage /> : <Navigate to="/auth" />} />
            <Route path="/partner-doctors" element={user?.role === UserRole.PARTNER ? <PartnerDoctors /> : <Navigate to="/dashboard" />} />
            <Route path="/reports" element={user?.role === UserRole.PARTNER ? <PartnerReports /> : <Navigate to="/dashboard" />} />
            <Route path="/finances" element={
              user?.role === UserRole.DOCTOR ? <DoctorFinances /> : user?.role === UserRole.PARTNER ? <PartnerFinances /> : <Navigate to="/dashboard" />
            } />
            <Route path="/swarm-medicine" element={user?.role === UserRole.DOCTOR ? <SwarmMedicinePage user={user} /> : <Navigate to="/dashboard" />} />
            {user?.role === UserRole.PATIENT && (
              <>
                <Route path="/archive" element={<MedicalArchive />} />
                <Route path="/pharmacy" element={<Pharmacy />} />
                <Route path="/home-visit" element={<HomeVisitPage />} />
                <Route path="/services" element={<ServicesPage />} />
              </>
            )}
            {user?.role === UserRole.DOCTOR && (
              <>
                <Route path="/patients" element={<DoctorPatients />} />
                <Route path="/consultations" element={<DoctorConsultations />} />
              </>
            )}
            <Route path="/consultation/:id" element={user ? <ConsultationRoom user={user} /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </MaintenanceGuard>
    </>
  );
};

export default App;
