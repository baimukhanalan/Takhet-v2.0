
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { 
  HeartPulse, BrainCircuit, Search, Star, Filter, 
  ArrowUpRight, Clock, Wallet, UserCheck, MessageSquare, ChevronDown, 
  Sparkles, Leaf
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

const ZenSphere = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-square flex items-center justify-center perspective-[1200px]"
    >
      <div 
        className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-1000 ease-out preserve-3d"
        style={{ transform: `rotateX(${pos.y * 30}deg) rotateY(${pos.x * 30}deg)` }}
      >
        <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-[120px] animate-pulse"></div>
        
        {/* Soft Blobs */}
        {[...Array(2)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-ping"
            style={{
              animationDuration: `${3 + i}s`,
              transform: `scale(${1.2 + i * 0.2})`,
            }}
          ></div>
        ))}

        <div className="absolute inset-[15%] bg-white/20 backdrop-blur-3xl rounded-full border border-white/40 flex items-center justify-center shadow-2xl">
           <BrainCircuit className="w-24 h-24 text-primary animate-pulse" />
        </div>
        
        {/* Floating Leaves */}
        {[...Array(4)].map((_, i) => (
          <Leaf 
            key={i}
            className="absolute text-accent w-6 h-6 animate-bounce"
            style={{
              top: `${20 + i * 15}%`,
              left: `${15 + (i % 2) * 70}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

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
      
      <main className={`max-w-7xl mx-auto px-4 ${!isPortal ? 'pt-44' : 'pt-4'} space-y-24`}>
        
        {/* Hero Section for Public Page */}
        {!isPortal && (
          <section className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-full text-xs font-black uppercase tracking-[0.2em]">
                <Leaf className="w-4 h-4 text-accent" /> Гармония ума
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tighter">
                Позаботьтесь о своём <br/><span className="text-primary italic">ментальном здоровье.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Персональная поддержка, квалифицированные психологи и психотерапевты в одно касание. Начните путь к спокойствию сегодня.
              </p>
            </div>
            <div className="flex-1">
              <ZenSphere />
            </div>
          </section>
        )}

        {isPortal && (
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-foreground">Ментальное здоровье</h1>
            <p className="text-muted-foreground font-medium max-w-2xl">Найдите квалифицированного специалиста для поддержки вашего психологического благополучия.</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm flex flex-col md:flex-row gap-6 relative z-10">
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
