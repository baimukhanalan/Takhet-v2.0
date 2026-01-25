
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Stethoscope
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    onLogout();
    navigate('/');
  };

  const patientLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/community', icon: Users2, label: 'Сообщество' },
    { to: '/mental', icon: HeartPulse, label: 'Mental' },
    { to: '/appointments', icon: CalendarCheck2, label: 'Приемы' },
    { to: '/chat', icon: MessageSquare, label: 'Чаты' },
    { to: '/ai-analysis', icon: BrainCircuit, label: 'Анализ ИИ' },
    { to: '/archive', icon: History, label: 'Архив' },
    { to: '/home-visit', icon: Home, label: 'Вызов на дом' },
    { to: '/pharmacy', icon: Truck, label: 'Аптека' },
    { to: '/settings', icon: Settings, label: 'Настройки' },
  ];

  const doctorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Панель' },
    { to: '/community', icon: Users2, label: 'Сообщество' },
    { to: '/consultations', icon: CalendarCheck2, label: 'Приемы' },
    { to: '/ai-analysis', icon: BrainCircuit, label: 'Анализ ИИ' },
    { to: '/chat', icon: MessageSquare, label: 'Чаты с пациентами' },
    { to: '/finances', icon: Wallet, label: 'Биллинг' },
    { to: '/settings', icon: Settings, label: 'Настройки' },
  ];

  const links = role === UserRole.PATIENT ? patientLinks : doctorLinks;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <HeartPulse className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">Takhet<span className="text-primary">+</span></span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-secondary text-primary font-bold shadow-sm' 
                : 'text-muted-foreground hover:bg-background hover:text-foreground'}
            `}
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-slate-50 hover:text-primary rounded-xl transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Назад</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
