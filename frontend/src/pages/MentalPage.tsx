import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, ChevronRight, Maximize2, Minimize2, Search, Send, ShieldAlert, Sparkles, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { advancedChatStream } from '../services/gemini';
import { User } from '../types';
import PublicHeader from '../components/PublicHeader';
import { roleApi } from '../../services/roleApi';

type Specialist = {
  id: string;
  fullName: string;
  specialty: string;
  experienceYears: number;
  verified: boolean;
  avatar: string;
  pricePrimary: number;
  rating: number;
  reviewsCount?: number;
  headline?: string;
  catalogAudience?: 'doctor' | 'mental' | 'both';
  availability?: { date: string; slots: string[] }[];
};

const soulPrompt =
  'You are Takhet AI in soulful mode. Reply in Russian. Be calm, supportive and non-judgmental. Help with anxiety, overload, stress, psychosomatic tension and sleep difficulties. Keep replies warm, useful and concise.';

const isMentalSpecialist = (specialty: string) => {
  const value = specialty.toLowerCase();
  return value.includes('псих') || value.includes('терап') || value.includes('psych');
};
const canShowInMental = (specialist: Specialist) =>
  specialist.catalogAudience === 'mental' || specialist.catalogAudience === 'both' || isMentalSpecialist(specialist.specialty);

const SoulAssistant: React.FC<{ onOpenFull: () => void; publicMode: boolean }> = ({ onOpenFull, publicMode }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { role: 'user', text: value }]);
    setInput('');
    setIsTyping(true);
    const aiMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'ai', text: 'Душевный режим отвечает...' }]);

    try {
      const reply = await advancedChatStream(value, {
        systemInstruction: soulPrompt,
        useSearch: false,
        onDelta: (_delta, fullText) => {
          setMessages((prev) =>
            prev.map((message, index) => (index === aiMessageIndex ? { ...message, text: fullText } : message))
          );
        }
      });
      setMessages((prev) => prev.map((message, index) => (index === aiMessageIndex ? { ...message, text: reply } : message)));
    } catch {
      setMessages((prev) => [
        ...prev.filter((_message, index) => index !== aiMessageIndex),
        { role: 'ai', text: 'Я рядом. Давайте спокойно разберем, что вы чувствуете сейчас, и выберем мягкий следующий шаг.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const shell = (
    <div className="w-full h-full bg-white rounded-[4rem] shadow-[0_0_100px_rgba(15,23,42,0.16)] flex flex-col overflow-hidden border border-white/20">
      <div className="p-8 md:p-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_32%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.22),transparent_34%)]" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/30 shadow-xl">
            <BrainCircuit className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">Душевный режим Takhet AI</h3>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] opacity-80 mt-1.5">{publicMode ? 'Попробовать сейчас' : 'Поддержка рядом'}</p>
          </div>
        </div>
        <button onClick={() => setIsExpanded((value) => !value)} className="p-4 md:p-5 bg-white/10 hover:bg-white/20 border-2 border-white/40 rounded-3xl transition-all flex items-center justify-center shadow-xl relative z-10">
          {isExpanded ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-[linear-gradient(180deg,rgba(236,253,245,0.55),rgba(255,255,255,0.9))] no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-16">
            <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center relative">
              <Sparkles className="w-14 h-14 text-emerald-500 animate-pulse" />
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
            </div>
            <div className="space-y-4 max-w-xl">
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Спокойное пространство для первого шага</h4>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">Подходит, когда сложно собраться, хочется выговориться, снизить тревогу или спокойно понять, что делать дальше.</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[80%] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-sm text-base md:text-lg font-medium leading-relaxed ${message.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Душевный режим отвечает...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 md:p-10 border-t border-slate-100 bg-white shrink-0 space-y-4">
        <div className="flex items-center gap-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] md:rounded-[4rem] p-3 pl-8 md:pl-10 transition-all focus-within:ring-8 focus-within:ring-emerald-500/5 focus-within:bg-white focus-within:border-emerald-100">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void handleSend()} placeholder="Напишите, что вы чувствуете..." className="flex-1 bg-transparent border-none outline-none text-base md:text-xl font-bold py-4 md:py-6 placeholder:text-slate-300" />
          <button onClick={() => void handleSend()} disabled={!input.trim() || isTyping} className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all disabled:opacity-30">
            <Send className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        </div>
        <button onClick={onOpenFull} className="w-full py-4 rounded-[2rem] bg-emerald-500 text-white font-black uppercase tracking-widest text-xs md:text-sm">Открыть полный Takhet AI</button>
      </div>
    </div>
  );

  if (isExpanded) {
    return <div className="fixed inset-0 z-[10001] p-3 sm:p-4 md:p-10 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center">{shell}</div>;
  }
  return <div className="relative w-full h-[min(720px,calc(100vh-10rem))] min-h-[560px]">{shell}</div>;
};

const MentalPage: React.FC<{ user?: User; isPortal: boolean }> = ({ user, isPortal }) => {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Specialist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPortal) return;
    const load = async () => {
      try {
        const list = await roleApi.publicDoctors();
        setSpecialists(list.filter((item) => canShowInMental(item)));
      } catch {
        setSpecialists([]);
      }
    };
    void load();
  }, [isPortal]);

  const specialtyOptions = useMemo(() => ['all', ...Array.from(new Set(specialists.map((item) => item.specialty))).sort()], [specialists]);
  const filteredSpecialists = useMemo(
    () => {
      const query = searchTerm.toLowerCase().replace(/\s+/g, ' ').trim();
      return specialists.filter((item) => {
        const index = `${item.fullName} ${item.specialty} ${item.headline || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
        return (selectedSpecialty === 'all' || item.specialty === selectedSpecialty) && (!query || index.includes(query));
      });
    },
    [searchTerm, selectedSpecialty, specialists]
  );

  const openSoulfulMode = () => {
    if (!isPortal || !user) {
      navigate('/takhet-ai/try?mode=soulful', { state: { mode: 'soulful' } });
      return;
    }
    navigate('/takhet-ai/patient?mode=soulful', { state: { mode: 'soulful' } });
  };

  const openDoctor = (doctor: Specialist) => {
    setSelectedDoctor(doctor);
    setSelectedDate(doctor.availability?.[0]?.date || '');
    setSelectedSlot(doctor.availability?.[0]?.slots?.[0] || '');
    setBookingNote('');
  };

  const confirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    try {
      const created = await roleApi.patientCreateCase({
        summary: `Запрос на ментальную консультацию\nСпециалист: ${selectedDoctor.fullName}\nНаправление: ${selectedDoctor.specialty}\nДата: ${selectedDate}\nВремя: ${selectedSlot}\nКомментарий: ${bookingNote || 'Без дополнительного комментария'}`,
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot
      });
      setSelectedDoctor(null);
      navigate(`/consultation/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${!isPortal ? 'pt-0' : 'pt-0 pb-24'}`}>
      {!isPortal && <PublicHeader activePath="/mental" />}

      {selectedDoctor && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 md:p-10">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setSelectedDoctor(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
            <button onClick={() => setSelectedDoctor(null)} className="absolute top-6 right-6 z-20 p-3 bg-slate-100 rounded-2xl"><X className="w-5 h-5 text-slate-500" /></button>
            <div className="p-8 md:p-10 space-y-8">
              <div className="flex items-center gap-5">
                <img src={selectedDoctor.avatar} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl" alt={selectedDoctor.fullName} />
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedDoctor.fullName}</h2>
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mt-2">{selectedDoctor.specialty}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center gap-1 text-amber-500 px-2 py-1 bg-amber-50 rounded-xl"><Star className="w-3 h-3 fill-current" /><span className="text-xs font-black">{selectedDoctor.rating}</span></div>
                    <span className="text-xs font-black text-slate-400">{selectedDoctor.reviewsCount || 0} отзывов</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[2rem] text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Опыт</p><p className="text-lg font-black text-slate-800">{selectedDoctor.experienceYears} лет</p></div>
                <div className="p-5 bg-slate-50 rounded-[2rem] text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Сессия</p><p className="text-lg font-black text-primary">₸{selectedDoctor.pricePrimary}</p></div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-3">Доступные даты</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedDoctor.availability || []).map((item) => (
                      <button key={item.date} onClick={() => { setSelectedDate(item.date); setSelectedSlot(item.slots[0] || ''); }} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${selectedDate === item.date ? 'bg-primary text-white' : 'bg-slate-50 text-slate-700'}`}>
                        {item.date}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedDate && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-3">Доступное время</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedDoctor.availability || []).find((item) => item.date === selectedDate)?.slots.map((slot) => (
                        <button key={slot} onClick={() => setSelectedSlot(slot)} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${selectedSlot === slot ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'}`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <textarea value={bookingNote} onChange={(e) => setBookingNote(e.target.value)} placeholder="Коротко опишите запрос или то, с чем хотите прийти на сессию..." className="w-full min-h-36 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium outline-none resize-y" />
              <button onClick={() => void confirmBooking()} disabled={submitting || !selectedDate || !selectedSlot} className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30 disabled:opacity-60">
                {submitting ? 'Создание...' : 'Создать запись'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10 ${!isPortal ? 'pt-28 sm:pt-32 pb-20 sm:pb-24 space-y-16 sm:space-y-20 lg:space-y-24' : 'pt-6 sm:pt-8 pb-20 sm:pb-24 space-y-12 sm:space-y-16'}`}>
        {!isPortal ? (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 space-y-12">
                <div className="space-y-10">
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border border-emerald-200 shadow-sm"><Sparkles className="w-5 h-5" /> Mental</div>
                  <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-950 leading-[0.9] tracking-tighter uppercase break-words">
                    Takhet AI <br />
                    <span className="text-emerald-500 italic lowercase font-normal break-words">Mental</span>
                  </h1>
                  <p className="text-lg sm:text-xl md:text-3xl text-slate-500 max-w-3xl font-medium leading-relaxed">
                    Контроль состояния, а не просто разговор. Пойми, что с тобой происходит, за 2–3 минуты и при необходимости сразу перейди к специалисту.
                  </p>
                  <button onClick={openSoulfulMode} className="px-8 sm:px-12 md:px-16 py-5 sm:py-6 md:py-8 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(0,0,0,0.2)] hover:bg-emerald-600 transition-all">Начать сейчас</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center"><ShieldAlert className="w-8 h-8 text-emerald-500" /></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Когда это полезно</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Тревога без причины, выгорание и усталость, проблемы со сном, напряжение в теле и ощущение, что с состоянием что-то не так, но непонятно насколько это серьёзно.</p>
                  </div>
                  <div className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center"><BrainCircuit className="w-8 h-8 text-indigo-500" /></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Как это работает</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Сначала ты описываешь состояние. Потом система помогает понять уровень тревоги, возможные причины и следующий шаг: продолжить самому или перейти к специалисту.</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5"><SoulAssistant onOpenFull={openSoulfulMode} publicMode={true} /></div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Психологи', text: 'Работают с тревогой, выгоранием, отношениями и самооценкой. Это первый маршрут, если нужно безопасно разобраться в состоянии.' },
                { title: 'Психосоматологи', text: 'Подключаются, когда стресс уже отражается на теле: бессонница, усталость, зажимы и боль без понятной причины.' },
                { title: 'Психотерапевты', text: 'Нужны для более глубокой работы: тревожные расстройства, депрессивные состояния и повторяющиеся кризисы.' }
              ].map((item) => (
                <div key={item.title} className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-5">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{item.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-5">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Почему это работает</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Обычный путь — игнор, ухудшение и позднее обращение. Здесь сначала появляется понимание, затем действие и только потом решение о специалисте.</p>
              </div>
              <div className="p-10 bg-slate-900 rounded-[4rem] border border-slate-900 shadow-xl space-y-5 text-white">
                <h3 className="text-2xl font-black uppercase tracking-tight">Главное преимущество</h3>
                <p className="text-slate-300 font-medium leading-relaxed">Ты не обязан сразу идти к врачу. Сначала понимаешь своё состояние и только потом принимаешь решение без давления.</p>
              </div>
            </section>
          </>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.35em] font-black text-primary">Mental</p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 leading-none">Каталог специалистов и душевный режим Takhet AI</h1>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">Выберите специалиста по вашему запросу или начните с душевного режима, если сначала хочется выговориться и собрать мысли.</p>
              </div>
              <SoulAssistant onOpenFull={openSoulfulMode} publicMode={false} />
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><Search className="w-5 h-5 text-primary" /><h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Фильтры</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Поиск по имени, специализации или фокусу..." className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none" />
                  </div>
                  <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="px-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-slate-700">
                    {specialtyOptions.map((item) => <option key={item} value={item}>{item === 'all' ? 'Все направления' : item}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSpecialists.map((doctor) => (
                  <div key={doctor.id} className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="flex items-center gap-5 mb-6">
                      <img src={doctor.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-xl" alt={doctor.fullName} />
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{doctor.fullName}</h3>
                        <p className="text-primary font-black uppercase tracking-[0.3em] text-[9px] mt-1 break-words">{doctor.specialty}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex items-center gap-1 text-amber-500 px-2 py-1 bg-amber-50 rounded-xl"><Star className="w-3 h-3 fill-current" /><span className="text-xs font-black">{doctor.rating}</span></div>
                          <span className="text-xs font-black text-slate-400">{doctor.reviewsCount || 0} отзывов</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{doctor.headline || 'Поддержка, глубокий разбор состояния и понятный маршрут следующего шага.'}</p>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="p-4 bg-slate-50 rounded-[1.5rem] text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Опыт</p><p className="text-base font-black text-slate-800">{doctor.experienceYears} лет</p></div>
                      <div className="p-4 bg-slate-50 rounded-[1.5rem] text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Сессия</p><p className="text-base font-black text-primary">₸{doctor.pricePrimary}</p></div>
                    </div>

                    <button onClick={() => openDoctor(doctor)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest mt-6 group-hover:bg-primary shadow-xl transition-all flex items-center justify-center gap-2">
                      Записаться на сессию <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MentalPage;
