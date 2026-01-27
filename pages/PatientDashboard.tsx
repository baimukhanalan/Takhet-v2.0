
import React from 'react';
import { User } from '../types';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  TrendingUp, 
  BrainCircuit, 
  Activity, 
  Clock, 
  ShieldCheck,
  HeartPulse,
  Truck,
  History,
  Users2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header Mobile Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 md:hidden">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">Привет, {user.name.split(' ')[0]}!</h1>
        </div>
        <p className="text-slate-500 text-lg font-medium">Ваше здоровье под контролем.</p>
      </div>

      {/* Main Stats Mobile Slider Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/appointments" className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <CalendarIcon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="text-[10px] font-black text-success bg-success/10 px-4 py-2 rounded-full flex items-center gap-1.5 uppercase tracking-widest border border-success/20">
              <TrendingUp className="w-4 h-4" /> Вовремя
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Ближайший прием</p>
            <p className="text-4xl font-black text-foreground mt-2 tracking-tighter">14:00</p>
            <p className="text-primary font-bold mt-1 text-sm">Др. Михайлов, Кардиолог</p>
          </div>
        </Link>

        <div className="bg-primary p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <ShieldCheck className="w-10 h-10 text-accent opacity-80" />
            </div>
            <div>
              <p className="text-blue-100 text-[10px] font-black tracking-[0.2em] uppercase">Health Score</p>
              <div className="flex items-end gap-3 mt-1">
                <p className="text-6xl font-black tracking-tighter">88</p>
                <p className="text-lg font-black text-blue-200 mb-1 flex items-center gap-1">
                   <ArrowUpRight className="w-5 h-5" /> +4%
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <Link to="/ai-analysis" className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Activity className="w-6 h-6 md:w-7 md:h-7" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Статус ИИ</p>
            <p className="text-4xl font-black text-foreground mt-2 tracking-tighter">Стабильно</p>
            <p className="text-slate-400 mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"><Clock className="w-4 h-4" /> 2ч назад</p>
          </div>
        </Link>
      </div>

      {/* Primary Action FAB Style for Mobile */}
      <Link to="/appointments" className="md:hidden fixed bottom-28 right-6 z-[110] w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-transform">
        <Plus className="w-8 h-8" />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* AI Assistant Banner */}
        <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] text-white relative overflow-hidden flex flex-col gap-6 shadow-2xl">
           <div className="relative z-10">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                <BrainCircuit className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter mb-4">ИИ-Помощник</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">Загрузите свои анализы для мгновенной расшифровки без медицинского жаргона.</p>
              <Link to="/ai-analysis" className="mt-8 inline-flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-3xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">
                Запустить <ArrowUpRight className="w-6 h-6" />
              </Link>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col gap-8">
           <h3 className="text-2xl font-black tracking-tighter">Быстрые действия</h3>
           <div className="grid grid-cols-2 gap-4">
             {[
               { to: '/mental', label: 'Mental', icon: HeartPulse, bg: 'bg-red-50', text: 'text-red-600' },
               { to: '/pharmacy', label: 'Аптека', icon: Truck, bg: 'bg-green-50', text: 'text-green-600' },
               { to: '/archive', label: 'Архив', icon: History, bg: 'bg-blue-50', text: 'text-blue-600' },
               { to: '/community', label: 'Форум', icon: Users2, bg: 'bg-amber-50', text: 'text-amber-600' },
             ].map((item, i) => (
               <Link key={i} to={item.to} className={`${item.bg} ${item.text} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-sm`}>
                 <item.icon className="w-8 h-8" />
                 <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
               </Link>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
