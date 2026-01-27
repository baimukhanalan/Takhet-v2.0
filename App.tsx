
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
import DoctorsPage from './pages/DoctorsPage';
import PartnersPage from './pages/PartnersPage';
import AuthPage from './pages/AuthPage';
import PatientAppointments from './pages/PatientAppointments';

// Enhanced AppLayout for Mobile Bottom Navigation
const AppLayout: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const isPublicRoute = ['/auth', '/doctors', '/partners', '/'].includes(location.pathname);
  
  // Custom logic for full-screen pages like consultation
  const isConsultation = location.pathname.startsWith('/consultation/');

  if (user && !isPublicRoute) {
    return (
      <div className="flex min-h-screen bg-background overflow-hidden">
        {/* Sidebar handles desktop side and mobile bottom nav */}
        {!isConsultation && <Sidebar role={user.role} onLogout={onLogout} />}
        
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {!isConsultation && <Header user={user} />}
          <main className={`flex-1 overflow-y-auto ${isConsultation ? 'p-0' : 'p-4 md:p-10'} transition-all duration-500`}>
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
      [UserRole.PARTNER]: 'Clinic Admin',
      [UserRole.ADMIN]: 'Master Admin'
    };

    setUser({
      id: 'master-user-id',
      name: names[role],
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(names[role])}&background=0D47A1&color=fff`
    });
  };

  const logout = () => setUser(null);

  return (
    <HashRouter>
      <AppLayout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<AuthPage onLogin={loginAs} />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/mental" element={<MentalPage user={user || undefined} />} />
          <Route path="/community" element={<CommunityPage user={user || undefined} />} />
          
          <Route path="/dashboard" element={
            user?.role === UserRole.PATIENT 
              ? <PatientDashboard user={user} /> 
              : user?.role === UserRole.DOCTOR 
                ? <DoctorDashboard user={user} />
                : user?.role === UserRole.PARTNER 
                  ? <PartnerDashboard user={user} />
                  : <Navigate to="/auth" replace />
          } />
          
          <Route path="/appointments" element={user?.role === UserRole.PATIENT ? <PatientAppointments /> : <Navigate to="/dashboard" />} />
          <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/ai-analysis" element={user ? <AIAnalysisCenter /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <SettingsPage user={user} /> : <Navigate to="/auth" />} />
          
          {user?.role === UserRole.PATIENT && (
            <>
              <Route path="/archive" element={<MedicalArchive />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/home-visit" element={<HomeVisitPage />} />
            </>
          )}
          
          {user?.role === UserRole.DOCTOR && (
            <>
              <Route path="/patients" element={<DoctorPatients />} />
              <Route path="/consultations" element={<DoctorConsultations />} />
              <Route path="/finances" element={<DoctorFinances />} />
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
