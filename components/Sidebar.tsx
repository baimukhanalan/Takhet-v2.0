
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  BrainCircuit, 
  ArrowLeft,
  Users2,
  HeartPulse,
  Truck,
  Home,
  MessageSquare,
  Settings,
  CalendarCheck2,
  Wallet,
  Stethoscope,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    onLogout();
    navigate('/');
  };

  const patientLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
    { to: '/appointments', icon: CalendarCheck2, label: 'Приемы' },
    { to: '/chat', icon: MessageSquare, label: 'Чаты' },
    { to: '/mental', icon: HeartPulse, label: 'Mental' },
    { to: '/ai-analysis', icon: BrainCircuit, label: 'ИИ Анализ' },
  ];

  const doctorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Панель' },
    { to: '/consultations', icon: CalendarCheck2, label: 'Приемы' },
    { to: '/chat', icon: MessageSquare, label: 'Чаты' },
    { to: '/finances', icon: Wallet, label: 'Биллинг' },
    { to: '/settings', icon: Settings, label: 'Профиль' },
  ];

  const links = role === UserRole.PATIENT ? patientLinks : doctorLinks;

  // Mobile Bottom Navigation Bar
  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 bg-white/80 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      {links.slice(0, 5).map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex flex-col items-center gap-1 py-1 transition-all active:scale-90"
          >
            <div className={`p-2.5 rounded-2xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 -translate-y-1' : 'text-slate-400'}`}>
              <link.icon className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-slate-400'}`}>
              {link.label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      <MobileNav />
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-foreground tracking-tighter">Takhet<span className="text-primary">+</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300
                ${isActive 
                  ? 'bg-primary text-white font-black shadow-xl shadow-primary/20 scale-[1.02]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-foreground'}
              `}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest font-bold">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-3 w-full px-5 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm uppercase tracking-widest">Выход</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
