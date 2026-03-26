
import React, { useState } from 'react';
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

const AppLayout: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
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
      [UserRole.DOCTOR]: 'Др. Михаил Михайлов',
      [UserRole.PARTNER]: 'City Medical Center Admin',
      [UserRole.ADMIN]: 'System Administrator'
    };

    setUser({
      id: 'master-user-id',
      name: names[role],
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(names[role])}&background=${role === UserRole.ADMIN ? '1e293b' : '0D47A1'}&color=fff`
    });
  };

  const logout = () => setUser(null);

  return (
    <HashRouter>
      <AppLayout user={user} onLogout={logout}>
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
