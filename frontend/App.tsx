
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { UserRole, User } from './types';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ConsultationRoom from './pages/ConsultationRoom';
import AIAnalysisCenter from './pages/AIAnalysisCenter';
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
import DoctorsSearchPage from './pages/DoctorsSearchPage';
import PartnersPage from './pages/PartnersPage';
import AuthPage from './pages/AuthPage';
import PatientAppointments from './pages/PatientAppointments';
import ServicesPage from './pages/ServicesPage';
import AdminAuthPage from './pages/AdminAuthPage';
import AdminDashboard from './pages/AdminDashboard';
import DigitalTwinPage from './pages/DigitalTwinPage';
import { roleApi } from './services/roleApi';

const AppLayout: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode; backendOnline: boolean | null; backendCheckedAt: string }> = ({ user, onLogout, children, backendOnline, backendCheckedAt }) => {
  const location = useLocation();
  const isPublicRoute = ['/auth', '/doctors', '/partners', '/', '/admin-auth', '/community', '/mental'].includes(location.pathname);
  const isConsultation = location.pathname.startsWith('/consultation/');
  const isAdmin = user?.role === UserRole.ADMIN;

  // Portal view check
  const isPortalView = location.pathname.startsWith('/portal/');

  if (user && (isPortalView || (!isPublicRoute && !isAdmin))) {
    return (
      <div className={`flex min-h-screen ${isAdmin ? '' : 'bg-background'} overflow-hidden`}>
        {!isConsultation && !isAdmin && <Sidebar role={user.role} onLogout={onLogout} />}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {backendOnline !== null && (
            <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${backendOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              Backend {backendOnline ? 'online' : 'offline'} • last check {backendCheckedAt}
            </div>
          )}
          {!isConsultation && !isAdmin && <Header user={user} />}
          <main className={`flex-1 overflow-y-auto ${isConsultation || isAdmin ? 'p-0' : 'p-4 md:p-10'} transition-all duration-500`}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-background">{backendOnline !== null && <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${backendOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>Backend {backendOnline ? 'online' : 'offline'} • last check {backendCheckedAt}</div>}{children}</div>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [backendCheckedAt, setBackendCheckedAt] = useState('-');

  useEffect(() => {
    const role = localStorage.getItem('takhet_role') as UserRole | null;
    const token = localStorage.getItem('takhet_token');
    if (role && token) {
      loginAs(role, token);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const pingBackend = async () => {
      try {
        await roleApi.health();
        if (!cancelled) {
          setBackendOnline(true);
          setBackendCheckedAt(new Date().toLocaleTimeString());
        }
      } catch {
        if (!cancelled) {
          setBackendOnline(false);
          setBackendCheckedAt(new Date().toLocaleTimeString());
        }
      }
    };

    pingBackend();
    const timer = window.setInterval(pingBackend, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user?.role]);

  const loginAs = (role: UserRole, token?: string) => {
    const names = {
      [UserRole.PATIENT]: 'Alan Baimukhan',
      [UserRole.DOCTOR]: 'Др. Михаил Михайлов',
      [UserRole.PARTNER]: 'City Medical Center Admin',
      [UserRole.ADMIN]: 'System Administrator'
    };

    if (token) {
      localStorage.setItem('takhet_token', token);
    }
    localStorage.setItem('takhet_role', role);

    setUser({
      id: 'master-user-id',
      name: names[role],
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(names[role])}&background=${role === UserRole.ADMIN ? '1e293b' : '0D47A1'}&color=fff`
    });
  };

  const logout = () => {
    localStorage.removeItem('takhet_token');
    localStorage.removeItem('takhet_role');
    setUser(null);
  };

  return (
    <HashRouter>
      <AppLayout user={user} onLogout={logout} backendOnline={backendOnline} backendCheckedAt={backendCheckedAt}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage user={user || undefined} />} />
          <Route path="/community" element={<CommunityPage isPortal={false} />} />
          <Route path="/mental" element={<MentalPage isPortal={false} />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          
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

          <Route path="/portal/community" element={user ? <CommunityPage user={user} isPortal={true} /> : <Navigate to="/auth" />} />
          <Route path="/portal/mental" element={user ? <MentalPage user={user} isPortal={true} /> : <Navigate to="/auth" />} />
          
          <Route path="/admin-dashboard" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/admin-auth" replace />} />
          <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/ai-analysis" element={user ? <AIAnalysisCenter /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <SettingsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/appointments" element={user?.role === UserRole.PATIENT ? <PatientAppointments /> : <Navigate to="/dashboard" />} />
          <Route path="/doctors-search" element={user ? <DoctorsSearchPage /> : <Navigate to="/auth" />} />
          <Route path="/digital-twin" element={user ? <DigitalTwinPage user={user} /> : <Navigate to="/auth" />} />

          {user?.role === UserRole.PARTNER && (
            <>
              <Route path="/partner-doctors" element={<PartnerDoctors />} />
              <Route path="/reports" element={<PartnerReports />} />
            </>
          )}

          <Route path="/finances" element={
            user?.role === UserRole.DOCTOR ? <DoctorFinances /> : user?.role === UserRole.PARTNER ? <PartnerFinances /> : <Navigate to="/dashboard" />
          } />

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
    </HashRouter>
  );
};

export default App;
