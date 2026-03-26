import React, { useState, useEffect } from 'react';
import { FileText, ArrowUpRight, Search, Filter, Plus, Trash2, X, Archive, Download, Info, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { MedicalRecord } from '../types';
import { MockDB } from '../services/db';

const MedicalArchive: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    const load = () => setRecords(MockDB.getRecords());
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Используем кастомное подтверждение или просто удаляем, так как window.confirm может не работать в iframe
    if (window.confirm('Вы действительно хотите удалить эту запись из архива? Это действие необратимо.')) {
      MockDB.deleteRecord(id);
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  };

  const filtered = records.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20 animate-in fade-in duration-700 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Медицинский архив</h1>
          <p className="text-muted-foreground font-medium text-base md:text-lg">Результаты анализов и ИИ-диагностики хранятся здесь.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-3.5 bg-white border border-border rounded-xl md:rounded-2xl flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" /> Фильтр
          </button>
          <button className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-3.5 bg-primary text-white rounded-xl md:rounded-2xl flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4 md:gap-6">
          <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 shrink-0" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или дате..." 
            className="bg-transparent border-none outline-none text-base md:text-lg w-full font-bold placeholder:opacity-30"
          />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.length > 0 ? filtered.map((record) => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary gap-4 md:gap-6"
            >
              <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.8rem] flex items-center justify-center shadow-inner shrink-0
                  ${record.type === 'Analysis' ? 'bg-orange-50 text-orange-600' : 
                    record.type === 'Prescription' ? 'bg-green-50 text-green-600' : 
                    record.type === 'Visit' ? 'bg-blue-50 text-blue-600' : 
                    record.type === 'Photo' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                  <FileText className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-base md:text-2xl text-foreground tracking-tight break-words leading-tight">{record.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2">
                     <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{record.date}</p>
                     <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
                     <p className="text-[8px] md:text-xs font-black text-primary uppercase tracking-widest">{record.type}</p>
                  </div>
                  {record.summary && <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 font-medium line-clamp-1 italic">"{record.summary}"</p>}
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 shrink-0">
                <div className="flex flex-col items-end gap-1">
                   <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg border
                     ${record.status === 'Analyzed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                       record.status === 'New' ? 'bg-blue-50 text-primary border-primary/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                     {record.status}
                   </span>
                </div>
                
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                     onClick={(e) => handleDelete(record.id, e)}
                     className="p-2.5 md:p-4 bg-white border border-red-100 text-red-400 rounded-lg md:rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                   >
                     <Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                   </button>
                   <button className="p-2.5 md:p-4 bg-white border border-border rounded-lg md:rounded-2xl text-primary">
                     <ArrowUpRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                   </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 md:py-32 text-center space-y-4">
               <Archive className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto" />
               <p className="font-black text-base md:text-xl uppercase tracking-widest text-slate-300">Архив пуст</p>
            </div>
          )}
        </div>
      </div>
      {/* RECORD DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
              <header className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between shrink-0 gap-4">
                 <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shrink-0"><FileText className="w-5 h-5 md:w-7 md:h-7" /></div>
                    <div className="min-w-0">
                       <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-tight tracking-tight break-words">{selectedRecord.title}</h3>
                       <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedRecord.date} • {selectedRecord.type}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedRecord(null)} className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-slate-100 transition-all shrink-0"><X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12 no-scrollbar">
                 <section className="space-y-4">
                    <h4 className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                       <Zap className="w-4 h-4" /> Заключение ИИ
                    </h4>
                    <div className="bg-primary/5 p-6 md:p-8 rounded-2xl md:rounded-[3rem] text-base md:text-lg font-medium text-slate-800 border border-primary/10 leading-relaxed">
                       {selectedRecord.summary}
                    </div>
                 </section>
                 {selectedRecord.fullData?.anomalies && (
                    <section className="space-y-4 md:space-y-6">
                       <h4 className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Выявленные отклонения</h4>
                       <div className="grid gap-3 md:gap-4">
                          {selectedRecord.fullData.anomalies.map((a: string, i: number) => (
                             <div key={i} className="p-4 md:p-5 bg-white border border-orange-100 rounded-xl md:rounded-[2rem] flex items-center gap-3 md:gap-4 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i*100}ms` }}>
                                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                <span className="font-bold text-sm md:text-base text-slate-700">{a}</span>
                             </div>
                          ))}
                       </div>
                    </section>
                 )}
                 {selectedRecord.fullData?.recommendations && (
                    <section className="space-y-4 md:space-y-6">
                       <h4 className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Рекомендации по лечению</h4>
                       <div className="grid gap-3 md:gap-4">
                          {selectedRecord.fullData.recommendations.map((r: string, i: number) => (
                             <div key={i} className="p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[2rem] flex items-start gap-3 md:gap-4">
                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="font-medium text-sm md:text-base text-slate-600 leading-relaxed">{r}</span>
                             </div>
                          ))}
                       </div>
                    </section>
                 )}
              </div>
              <footer className="p-6 md:p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                 <button className="flex-1 py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                    <Download className="w-4 h-4 md:w-5 md:h-5" /> Скачать PDF
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default MedicalArchive;
