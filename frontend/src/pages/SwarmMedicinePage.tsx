import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { MockDB } from '../services/db';
import { User, SwarmCase } from '../types';
import { FadeIn, FadeInStagger } from '../components/FadeIn';

const SwarmMedicinePage: React.FC<{ user: User }> = ({ user }) => {
  const [cases, setCases] = useState<SwarmCase[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCases = () => {
      const allCases = MockDB.getSwarmCases();
      setCases(allCases);
    };
    loadCases();
    window.addEventListener('storage_update', loadCases);
    return () => window.removeEventListener('storage_update', loadCases);
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesFilter = filter === 'all' || (filter === 'open' && c.status === 'Open') || (filter === 'closed' && c.status === 'Closed');
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                Swarm Medicine
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-medium">
                Коллективный разум врачей для решения сложных клинических случаев
              </p>
            </div>
            <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 md:py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm">
              <Plus className="w-5 h-5" />
              Создать консилиум
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-12">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Поиск по диагнозу или специализации..."
                    className="w-full pl-12 pr-4 py-3.5 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                  {(['all', 'open', 'closed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 md:flex-none px-5 md:px-6 py-3 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                        filter === f 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {f === 'all' ? 'Все' : f === 'open' ? 'Открытые' : 'Закрытые'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-primary/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Активных врачей</p>
                <p className="text-xl md:text-2xl font-black text-slate-900">124</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeInStagger>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((c) => (
              <motion.div 
                key={c.id}
                className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    c.status === 'Open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {c.status === 'Open' ? 'В процессе' : 'Завершено'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{c.createdAt}</span>
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4 group-hover:text-primary transition-colors leading-tight">
                  {c.title}
                </h3>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {c.specialty}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-400 font-medium">Участников:</span>
                    <span className="text-slate-900 font-bold">{c.participants}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-400 font-medium">Сообщений:</span>
                    <span className="text-slate-900 font-bold">{c.messages}</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                  Присоединиться <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </FadeInStagger>

        {filteredCases.length === 0 && (
          <FadeIn>
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Кейсы не найдены</h3>
              <p className="text-slate-500">Попробуйте изменить параметры поиска или фильтрации</p>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
};

export default SwarmMedicinePage;
