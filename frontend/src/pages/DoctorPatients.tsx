import React, { useState, useEffect } from 'react';
import { Users, Search, MoreVertical, Calendar, ChevronRight } from 'lucide-react';
import { MockDB } from '../services/db';
import { Appointment } from '../types';

const DoctorPatients: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setAppointments(MockDB.getAppointments());
    const handleUpdate = () => setAppointments(MockDB.getAppointments());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  // Get unique patients
  // Fix: Added explicit 'string' type to the map parameter to resolve 'unknown' type error when calling toLowerCase()
  const uniquePatients = Array.from(new Set(appointments.map(a => a.patientName)))
    .map((name: string) => {
      const lastApp = appointments.filter(a => a.patientName === name).sort((a,b) => b.id.localeCompare(a.id))[0];
      return {
        name,
        lastVisit: lastApp.date,
        status: lastApp.status,
        id: lastApp.id
      };
    })
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Мои пациенты</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">База данных ваших пациентов и история их обращений.</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
          <Search className="w-6 h-6 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пациента по ФИО..." 
            className="bg-transparent border-none outline-none text-lg font-bold w-full" 
          />
        </div>
        <div className="divide-y divide-slate-50">
          {uniquePatients.length > 0 ? uniquePatients.map((patient, i) => (
            <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-2xl text-foreground tracking-tight">{patient.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                       <Calendar className="w-4 h-4 text-primary" /> Последний визит: {patient.lastVisit}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${patient.status === 'completed' ? 'bg-success/10 text-success' : 'bg-blue-50 text-primary'}`}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-white border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:border-primary/20 transition-all">
                  Медкарта
                </button>
                <button className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-primary transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-30 font-black uppercase tracking-[0.4em]">Пациентов не найдено</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
