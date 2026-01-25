
import React from 'react';
import { Home, MapPin, Star, Calendar, Phone, Clock, Search } from 'lucide-react';

const HomeVisitPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-primary rounded-full text-xs font-bold border border-blue-100 uppercase tracking-widest">
            <Home className="w-3.5 h-3.5" /> Healthcare at Home
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Call a Doctor Home</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Experienced therapists and nurses available for home visits in Almaty and Astana.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input type="text" placeholder="Your area (e.g. Medeu district)" className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-2xl text-sm shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { name: 'Dr. Alibi Bolat', type: 'General Therapist', exp: '15 years', rating: '4.9', price: '25,000₸', avail: 'Today' },
          { name: 'Dr. Julia Kim', type: 'Pediatrician', exp: '10 years', rating: '4.8', price: '20,000₸', avail: 'Tomorrow' },
          { name: 'Dr. Ruslan Omarov', type: 'Geriatric Expert', exp: '20 years', rating: '5.0', price: '30,000₸', avail: 'Today' },
        ].map((doc, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="h-48 bg-slate-100 relative">
              <img src={`https://picsum.photos/seed/doc-home-${i}/500/300`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {doc.rating}
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-success text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                Available {doc.avail}
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-foreground">{doc.name}</h4>
                <p className="text-sm font-bold text-primary">{doc.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" /> {doc.exp} exp
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" /> Almaty Only
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Visit Fee</p>
                  <p className="text-2xl font-extrabold text-foreground">{doc.price}</p>
                </div>
                <button className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-primary/20">
                  Book Visit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="relative z-10 space-y-6 max-w-xl">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Need urgent help at home?</h2>
          <p className="text-slate-400 text-lg">Our rapid response nurse team can be at your door within 45 minutes for injections, ECG, or blood sampling.</p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-accent text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-accent/20">
              Request Emergency Nurse
            </button>
            <button className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all">
              <Phone className="w-5 h-5 inline-block mr-2" /> Support 24/7
            </button>
          </div>
        </div>
        <div className="relative w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-32 -mb-32"></div>
        <div className="w-80 h-80 bg-primary/20 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
           <Home className="w-32 h-32 text-white/10" />
        </div>
      </div>
    </div>
  );
};

export default HomeVisitPage;
