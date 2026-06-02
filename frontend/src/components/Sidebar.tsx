import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, Truck, MessageSquare, Settings, CalendarCheck2, Wallet, LogOut, Archive, Users, Stethoscope, BarChart3, Menu, X, Heart, Search, Microscope } from 'lucide-react';
import { UserRole } from '../types';
import TakhetLogo from './Logo';
import { useLanguage } from '../services/useLanguage';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const takhetAiRoute = role === UserRole.DOCTOR ? '/takhet-ai/doctor' : role === UserRole.PARTNER ? '/takhet-ai/partner' : '/takhet-ai/patient';

  const handleLogout = () => {
    onLogout();
  };

  const patientLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.sidebar.panel },
    { to: '/ai-lab', icon: BrainCircuit, label: 'Анализ ИИ' },
    { to: '/ai-consultation', icon: BrainCircuit, label: 'ИИ консультация' },
    { to: takhetAiRoute, icon: MessageSquare, label: 'Takhet AI' },
    { to: '/health-browser', icon: Search, label: 'ИИ браузер' },
    { to: '/portal/mental', icon: Heart, label: t.sidebar.mental },
    { to: '/doctors-search', icon: Stethoscope, label: t.sidebar.booking },
    { to: '/appointments', icon: CalendarCheck2, label: t.sidebar.appointments },
    { to: '/chat', icon: MessageSquare, label: t.sidebar.chat },
    { to: '/archive', icon: Archive, label: t.sidebar.archive },
    { to: '/labs', icon: Microscope, label: 'Takhet Labs' },
    { to: '/services', icon: Truck, label: t.sidebar.services },
    { to: '/settings', icon: Settings, label: t.sidebar.settings }
  ];

  const doctorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.sidebar.panel },
    { to: takhetAiRoute, icon: MessageSquare, label: 'Takhet AI' },
    { to: '/health-browser', icon: Search, label: 'ИИ браузер' },
    { to: '/ai-lab', icon: BrainCircuit, label: 'Анализ ИИ' },
    { to: '/patients', icon: Users, label: t.sidebar.patients },
    { to: '/consultations', icon: CalendarCheck2, label: t.sidebar.appointments },
    { to: '/swarm-medicine', icon: BrainCircuit, label: t.sidebar.swarm },
    { to: '/chat', icon: MessageSquare, label: t.sidebar.chat },
    { to: '/finances', icon: Wallet, label: t.sidebar.billing },
    { to: '/settings', icon: Settings, label: t.sidebar.settings }
  ];

  const partnerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.sidebar.panel },
    { to: takhetAiRoute, icon: MessageSquare, label: 'Takhet AI' },
    { to: '/partner-doctors', icon: Users, label: t.sidebar.doctors },
    { to: '/finances', icon: Wallet, label: t.sidebar.billing },
    { to: '/reports', icon: BarChart3, label: t.sidebar.reports },
    { to: '/settings', icon: Settings, label: t.sidebar.settings }
  ];

  const links = role === UserRole.PATIENT ? patientLinks : role === UserRole.DOCTOR ? doctorLinks : partnerLinks;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background">
      <Link to="/?landing=1" className="p-8 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <TakhetLogo className="w-10 h-10" />
        <span className="text-2xl font-black text-foreground tracking-tighter">Takhet<span className="text-primary">+</span></span>
      </Link>
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-primary'
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider break-words">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-border">
        <button onClick={handleLogout} className="flex items-center gap-4 w-full px-5 py-4 text-muted hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold uppercase tracking-widest text-[11px]">
          <LogOut className="w-5 h-5" />
          <span>{t.common.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex flex-col w-72 bg-background border-r border-border h-screen sticky top-0 shrink-0 shadow-sm">
        <NavContent />
      </div>
      <div className="lg:hidden fixed top-3 left-3 sm:left-4 z-[60]">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-background/95 border border-border rounded-xl shadow-lg text-primary backdrop-blur-sm">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-[min(20rem,calc(100vw-1rem))] bg-background animate-in slide-in-from-left duration-300 shadow-2xl">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-6 p-2 text-muted-foreground">
              <X className="w-6 h-6" />
            </button>
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

