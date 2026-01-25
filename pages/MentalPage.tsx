
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  HeartPulse, BrainCircuit, Search, Star, Filter, 
  ArrowUpRight, Clock, Wallet, UserCheck, MessageSquare, ChevronDown
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

interface Specialist {
  id: string;
  name: string;
  type: 'Психолог' | 'Психосоматолог' | 'Психотерапевт';
  experience: number;
  price: number;
  rating: number;
  isTop: boolean;
  avatar: string;
}

const SPECIALISTS: Specialist[] = [
  { id: '1', name: 'Др. Алиханова А.', type: 'Психотерапевт', experience: 12, price: 15000, rating: 5.0, isTop: true, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Марат Смагулов', type: 'Психолог', experience: 5, price: 8000, rating: 4.8, isTop: true, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Елена Ким', type: 'Психосоматолог', experience: 8, price: 10000, rating: 4.9, isTop: false, avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Игорь Волк', type: 'Психотерапевт', experience: 20, price: 25000, rating: 5.0, isTop: false, avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'Айя Бекова', type: 'Психолог', experience: 3, price: 5000, rating: 4.5, isTop: false, avatar: 'https://i.pravatar.cc/150?u=5' },
];

const MentalPage: React.FC<{ user?: User }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(30000);
  
  const isPortal = !!user;

  const filtered = SPECIALISTS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'All' || s.type === activeType;
    const matchesPrice = s.price <= maxPrice;
    return matchesSearch && matchesType && matchesPrice;
  });

  const topSpecialists = filtered.filter(s => s.isTop);
  const otherSpecialists = filtered.filter(s => !s.isTop);

  return (
    <div className="min-h-screen bg-background pb-20">
      {!isPortal && <PublicHeader activePath="/mental" />}
      
      <main className={`max-w-7xl mx-auto px-4 ${!isPortal ? 'pt-32' : 'pt-4'} space-y-12`}>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-foreground">Ментальное здоровье</h1>
          <p className="text-muted-foreground font-medium max-w-2xl">Найдите квалифицированного специалиста для поддержки вашего психологического благополучия.</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по имени..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 font-bold"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Психолог', 'Психосоматолог', 'Психотерапевт'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeType === t ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-muted-foreground'}`}
              >
                {t === 'All' ? 'Все' : t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 px-4 bg-slate-50 rounded-xl">
             <Wallet className="w-4 h-4 text-primary" />
             <input 
               type="range" min="5000" max="30000" step="1000" 
               value={maxPrice}
               onChange={(e) => setMaxPrice(parseInt(e.target.value))}
               className="w-32 accent-primary"
             />
             <span className="text-[10px] font-black uppercase text-muted-foreground w-20">до {maxPrice}₸</span>
          </div>
        </div>

        {/* Top Specialists */}
        {topSpecialists.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-amber-500 fill-current" />
              <h2 className="text-2xl font-black">Топ специалисты</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topSpecialists.map(s => (
                <SpecialistCard key={s.id} specialist={s} />
              ))}
            </div>
          </section>
        )}

        {/* Full Catalog */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Filter className="w-6 h-6 text-primary" /> Каталог специалистов
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherSpecialists.map(s => (
              <SpecialistCard key={s.id} specialist={s} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <p className="text-muted-foreground font-bold">Специалисты не найдены. Попробуйте изменить фильтры.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const SpecialistCard: React.FC<{ specialist: Specialist }> = ({ specialist }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
        <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="font-black text-lg text-foreground leading-tight">{specialist.name}</h4>
        <div className="flex items-center gap-1.5 text-amber-500 mt-1">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-black">{specialist.rating}</span>
        </div>
      </div>
    </div>
    
    <div className="flex-1 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-primary/5 text-primary text-[10px] font-black rounded uppercase tracking-widest">{specialist.type}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-muted-foreground">
        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {specialist.experience} лет</div>
        <div className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-primary" /> {specialist.price}₸</div>
      </div>
    </div>

    <button className="w-full py-4 bg-background text-primary border border-primary/20 rounded-2xl font-black text-xs mt-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
      Записаться <ArrowUpRight className="w-4 h-4 inline-block ml-1" />
    </button>
  </div>
);

export default MentalPage;
