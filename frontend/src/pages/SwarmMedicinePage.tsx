import React from 'react';
import { AlertCircle, Clock, Shield } from 'lucide-react';
import { User } from '../types';

const SwarmMedicinePage: React.FC<{ user: User }> = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Swarm Medicine</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">
              Раздел временно отключён. Интерфейс сохранён как заглушка без активных кейсов и действий.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-amber-700">
            <Clock className="w-4 h-4" />
            В разработке
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Создание кейсов</p>
          <textarea
            value="Функция временно недоступна."
            readOnly
            className="w-full min-h-28 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 outline-none font-medium resize-none text-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск временно недоступен"
                  className="w-full pl-12 pr-4 py-3.5 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl border-none font-medium text-sm md:text-base text-slate-400"
                  value=""
                  readOnly
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {(['Все', 'Открытые', 'Закрытые'] as const).map((value) => (
                  <button
                    key={value}
                    disabled
                    className="flex-1 md:flex-none px-5 md:px-6 py-3 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap bg-slate-50 text-slate-300 cursor-not-allowed"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-primary/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Статус раздела</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">Paused</p>
            </div>
          </div>
        </div>

        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Раздел в разработке</h3>
          <p className="text-slate-500 max-w-xl mx-auto">
            Все действия и кейсы в Swarm Medicine временно отключены. Экран оставлен только как заглушка, без активных сценариев и без тестовых данных.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwarmMedicinePage;
