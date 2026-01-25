
import React from 'react';
import { User } from '../types';
// Consolidate imports and add missing icons: HeartPulse, Truck, History, Users2
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Привет, {user.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Ваше здоровье под контролем.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/home-visit" className="px-6 py-3.5 bg-white border border-border text-foreground rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest">
            Вызов на дом
          </Link>
          <Link to="/appointments" className="px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-sm hover:bg-blue-800 transition-all flex items-center gap-2 shadow-xl shadow-primary/20 uppercase tracking-widest">
            <Plus className="w-5 h-5" /> Запись на прием
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link to="/appointments" className="bg-white p-8 rounded-[3rem] border border-border shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-secondary text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-success bg-success/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" /> Вовремя
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-black tracking-widest uppercase">Ближайший прием</p>
            <p className="text-3xl font-black text-foreground mt-2 tracking-tighter">14:00</p>
            <p className="text-primary font-bold mt-1">Др. Михайлов, Кардиолог</p>
          </div>
        </Link>

        <Link to="/ai-analysis" className="bg-white p-8 rounded-[3rem] border border-border shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Activity className="w-7 h-7" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-black tracking-widest uppercase">Статус ИИ-Анализа</p>
            <p className="text-3xl font-black text-foreground mt-2 tracking-tighter">Стабильно</p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"><Clock className="w-4 h-4" /> 2ч назад</p>
          </div>
        </Link>

        <div className="bg-primary p-8 rounded-[3rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <ShieldCheck className="w-10 h-10 text-accent opacity-80" />
            </div>
            <div className="mt-8">
              <p className="text-blue-100 text-[10px] font-black tracking-[0.2em] uppercase">Takhet Health Score</p>
              <div className="flex items-end gap-3 mt-1">
                <p className="text-6xl font-black tracking-tighter">88</p>
                <p className="text-lg font-black text-blue-200 mb-1 flex items-center gap-1">
                   <ArrowUpRight className="w-5 h-5" /> +4%
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col gap-8 shadow-2xl">
           <div className="relative z-10">
              <BrainCircuit className="w-12 h-12 text-accent mb-6" />
              <h3 className="text-3xl font-black tracking-tighter mb-4">ИИ-Помощник</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">Загрузите свои анализы для мгновенной расшифровки без медицинского жаргона.</p>
              <Link to="/ai-analysis" className="mt-10 inline-flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-accent/20">
                Запустить анализ <ArrowUpRight className="w-5 h-5" />
              </Link>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] border border-border shadow-sm flex flex-col gap-6">
           <h3 className="text-2xl font-black tracking-tighter">Быстрые действия</h3>
           <div className="grid grid-cols-2 gap-4">
             {[
               { to: '/mental', label: 'Mental Health', icon: HeartPulse, bg: 'bg-red-50', text: 'text-red-600' },
               { to: '/pharmacy', label: 'Аптека', icon: Truck, bg: 'bg-green-50', text: 'text-green-600' },
               { to: '/archive', label: 'Мой Архив', icon: History, bg: 'bg-blue-50', text: 'text-blue-600' },
               { to: '/community', label: 'Сообщество', icon: Users2, bg: 'bg-amber-50', text: 'text-amber-600' },
             ].map((item, i) => (
               <Link key={i} to={item.to} className={`${item.bg} ${item.text} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:scale-105 transition-all shadow-sm`}>
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
