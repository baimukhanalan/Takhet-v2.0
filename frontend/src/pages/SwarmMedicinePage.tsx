import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Search, Shield } from 'lucide-react';
import { User } from '../types';
import { roleApi } from '../../services/roleApi';

type SwarmCase = {
  id: string;
  summary?: string;
  status?: string;
  createdAt?: string;
};

const SwarmMedicinePage: React.FC<{ user: User }> = ({ user }) => {
  const [summary, setSummary] = useState('');
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState<SwarmCase[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const nextCases = await roleApi.doctorCases();
      setCases(nextCases.filter((item: SwarmCase) => String(item.summary || '').startsWith('Swarm Medicine')));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить Swarm-кейсы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cases;
    return cases.filter((item) => `${item.id} ${item.summary || ''} ${item.status || ''}`.toLowerCase().includes(normalized));
  }, [cases, query]);

  const handleCreate = async () => {
    const cleanSummary = summary.trim();
    if (cleanSummary.length < 5) {
      setError('Опишите клинический вопрос минимум в 5 символов');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const created = await roleApi.doctorCreateCase(cleanSummary);
      setCases((current) => [created, ...current]);
      setSummary('');
      setNotice('Swarm Medicine кейс создан и доступен в очереди врача.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Не удалось создать Swarm-кейс');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Swarm Medicine</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">
              Консилиумный рабочий слой для сложных клинических вопросов. Врач создает кейс, фиксирует контекст и передает его в дальнейший review workflow.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-700">
            <Shield className="w-4 h-4" />
            Active workflow
          </div>
        </div>

        <div className="mb-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Создание кейса</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{user.name || 'Doctor'}</p>
          </div>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Кратко опишите клинический вопрос, данные пациента, риски и что нужно обсудить с коллегами."
            className="w-full min-h-28 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 outline-none font-medium resize-none text-slate-700 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Создать Swarm-кейс
          </button>
          {notice ? <p className="text-sm font-bold text-blue-600">{notice}</p> : null}
          {error ? <p className="text-sm font-bold text-red-500">{error}</p> : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по Swarm-кейсам"
                  className="w-full pl-12 pr-4 py-3.5 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl border-none font-medium text-sm md:text-base text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {filteredCases.length} cases
              </div>
            </div>
          </div>
          <div className="bg-primary/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Статус раздела</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">Working</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-black uppercase tracking-[0.24em]">Загрузка кейсов</div>
        ) : filteredCases.length ? (
          <div className="grid gap-4">
            {filteredCases.map((item) => (
              <article key={item.id} className="rounded-[2rem] bg-white border border-slate-100 p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Swarm case #{item.id.slice(0, 8)}</p>
                    <h3 className="mt-2 text-lg font-black text-slate-900">{String(item.summary || '').replace('Swarm Medicine', '').trim() || 'Клинический вопрос'}</h3>
                  </div>
                  <span className="rounded-xl bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{item.status || 'open'}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Swarm-кейсов пока нет</h3>
            <p className="text-slate-500 max-w-xl mx-auto">Создайте первый консилиумный кейс выше. Он появится здесь и в общей очереди врача.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwarmMedicinePage;
