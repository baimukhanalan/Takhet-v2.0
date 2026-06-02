import React from 'react';
import { AlertTriangle, Clock, Home } from 'lucide-react';

const HomeVisitPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-none">Врач на дом</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            Сервис временно приостановлен из-за проблем с логистикой и маршрутизацией выездных бригад.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900 font-bold flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        Мы временно не принимаем новые заявки на вызов врача на дом. Причина: логистический контур проходит переработку, и пока нельзя гарантировать точное время прибытия специалиста.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[
          { name: 'Выезд терапевта на дом', type: 'Терапевт', price: '25 000 ₸' },
          { name: 'Выезд педиатра на дом', type: 'Педиатр', price: '20 000 ₸' }
        ].map((doctor) => (
          <div key={doctor.name} className="bg-white rounded-3xl md:rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
            <div className="h-40 md:h-48 bg-slate-100 flex items-center justify-center">
              <Home className="w-16 h-16 text-slate-300" />
            </div>
            <div className="p-6 md:p-8 space-y-4 md:space-y-6">
              <div>
                <h4 className="text-lg md:text-xl font-bold break-words">{doctor.name}</h4>
                <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-widest">{doctor.type}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</p>
                  <p className="text-sm font-bold text-slate-900">Прием новых заявок временно отключен</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xl md:text-2xl font-black">{doctor.price}</p>
                <button
                  disabled
                  className="flex-1 sm:flex-none px-6 md:px-8 py-3 md:py-4 bg-slate-200 text-slate-500 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest cursor-not-allowed"
                >
                  Приостановлено
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeVisitPage;
