
import React, { useState, useEffect, useRef } from 'react';
import { FileText, ArrowUpRight, Search, Filter, Plus, Trash2, ShieldCheck, X, Archive, Download, Info, ChevronRight, Zap } from 'lucide-react';
import { MedicalRecord } from '../types';
import { MockDB } from '../services/db';
import { roleApi } from '../services/roleApi';

const MedicalArchive: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => setRecords(MockDB.getRecords());
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Вы действительно хотите удалить эту запись из архива? Это действие необратимо.')) {
      MockDB.deleteRecord(id);
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  };


  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      await roleApi.uploadMedicalFile({ fileName: file.name, mimeType: file.type || 'application/octet-stream', base64 });
      MockDB.addRecord({
        title: file.name,
        date: new Date().toISOString().slice(0, 10),
        type: 'Analysis',
        summary: 'Файл загружен и ожидает анализа.',
        status: 'New'
      });
      setRecords(MockDB.getRecords());
    } catch {
      MockDB.addRecord({
        title: file.name,
        date: new Date().toISOString().slice(0, 10),
        type: 'Analysis',
        summary: 'Локальное сохранение (offline fallback).',
        status: 'New'
      });
      setRecords(MockDB.getRecords());
    }
  };

  const filtered = records.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Медицинский архив</h1>
          <p className="text-muted-foreground mt-1 font-medium text-lg">Результаты анализов и ИИ-диагностики хранятся здесь.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white border border-border rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" /> Фильтр
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3.5 bg-primary text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" /> Добавить файл
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-6">
          <Search className="w-6 h-6 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или дате..." 
            className="bg-transparent border-none outline-none text-lg w-full font-bold placeholder:opacity-30"
          />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.length > 0 ? filtered.map((record) => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary"
            >
              <div className="flex items-center gap-8 flex-1 min-w-0">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-inner shrink-0
                  ${record.type === 'Analysis' ? 'bg-orange-50 text-orange-600' : 
                    record.type === 'Prescription' ? 'bg-green-50 text-green-600' : 
                    record.type === 'Visit' ? 'bg-blue-50 text-blue-600' : 
                    record.type === 'Photo' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                  <FileText className="w-8 h-8" />
                </div>
                <div className="min-w-0 pr-4">
                  <h4 className="font-black text-2xl text-foreground tracking-tight truncate leading-tight">{record.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{record.date}</p>
                     <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                     <p className="text-xs font-black text-primary uppercase tracking-widest">{record.type}</p>
                  </div>
                  {record.summary && <p className="text-sm text-slate-500 mt-4 font-medium line-clamp-1 italic">"{record.summary}"</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col items-end gap-1">
                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg border
                     ${record.status === 'Analyzed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                       record.status === 'New' ? 'bg-blue-50 text-primary border-primary/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                     {record.status}
                   </span>
                   {record.isSigned && (
                     <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> Подписано ЭЦП
                     </span>
                   )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                     onClick={(e) => handleDelete(record.id, e)}
                     className="p-4 bg-white border border-red-100 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <button className="p-4 bg-white border border-border rounded-2xl text-primary">
                     <ArrowUpRight className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center space-y-4">
               <Archive className="w-16 h-16 text-slate-200 mx-auto" />
               <p className="font-black text-xl uppercase tracking-widest text-slate-300">Архив пуст</p>
            </div>
          )}
        </div>
      </div>

      {/* RECORD DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
              <header className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><FileText className="w-7 h-7" /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{selectedRecord.title}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedRecord.date} • {selectedRecord.type}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedRecord(null)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                       <Zap className="w-4 h-4" /> Заключение ИИ
                    </h4>
                    <div className="bg-primary/5 p-8 rounded-[3rem] text-lg font-medium text-slate-800 border border-primary/10 leading-relaxed">
                       {selectedRecord.summary}
                    </div>
                 </section>

                 {selectedRecord.fullData?.anomalies && (
                    <section className="space-y-6">
                       <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Выявленные отклонения</h4>
                       <div className="grid gap-4">
                          {selectedRecord.fullData.anomalies.map((a: string, i: number) => (
                             <div key={i} className="p-5 bg-white border border-orange-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i*100}ms` }}>
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="font-bold text-slate-700">{a}</span>
                             </div>
                          ))}
                       </div>
                    </section>
                 )}

                 {selectedRecord.fullData?.recommendations && (
                    <section className="space-y-6">
                       <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Рекомендации по лечению</h4>
                       <div className="grid gap-4">
                          {selectedRecord.fullData.recommendations.map((r: string, i: number) => (
                             <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="font-medium text-slate-600 leading-relaxed">{r}</span>
                             </div>
                          ))}
                       </div>
                    </section>
                 )}
              </div>

              <footer className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                 <button className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                    <Download className="w-5 h-5" /> Скачать отчет PDF
                 </button>
                 {selectedRecord.isSigned && (
                    <div className="px-8 py-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3">
                       <ShieldCheck className="w-6 h-6 text-emerald-600" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Подписано ЭЦП</span>
                    </div>
                 )}
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default MedicalArchive;
