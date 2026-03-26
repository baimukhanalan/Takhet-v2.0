import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Star, Clock, Wallet, ChevronRight, Stethoscope, 
  X, CheckCircle2, Award, BookOpen, UserCheck, Calendar as CalendarIcon, Info, MapPin, ChevronLeft,
  BrainCircuit, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MockDB } from '../services/db';
import { Doctor, TimeSlot } from '../types';

const DoctorsSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(today.toISOString().split('T')[0]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Only show verified doctors
    setDoctors(MockDB.getVerifiedDoctors());
    setClinics(MockDB.get().partners.filter(p => p.status === 'Active'));
    
    const handleUpdate = () => {
      setDoctors(MockDB.getVerifiedDoctors());
      setClinics(MockDB.get().partners.filter(p => p.status === 'Active'));
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const specialties = useMemo(() => {
    const s = new Set(doctors.map(d => d.specialty));
    return Array.from(s);
  }, [doctors]);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClinic = !selectedClinicId || doc.clinicId === selectedClinicId;
    const matchesPrice = doc.pricePrimary <= maxPrice;
    const matchesExperience = doc.experience >= minExperience;
    const matchesSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty;
    
    return matchesSearch && matchesClinic && matchesPrice && matchesExperience && matchesSpecialty;
  });

  const availableSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    return MockDB.getDoctorSchedule(selectedDoctor.id, selectedDateStr);
  }, [selectedDoctor, selectedDateStr]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    return days;
  }, [currentMonth, currentYear]);

  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(currentYear, currentMonth));

  const handleBookingConfirm = () => {
    if (!selectedDoctor || !selectedSlot) return;
    
    try {
      const profile = MockDB.getProfile();
      const result = MockDB.bookSlot(
        selectedDoctor.id, 
        selectedDateStr, 
        selectedSlot, 
        profile.id,
        profile.name || 'Пациент'
      );
      if (result) {
        setShowSuccess(true);
        setSelectedDoctor(null);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/appointments');
        }, 2000);
      }
    } catch (error: any) {
      alert(error.message || 'Ошибка при бронировании');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-40 px-4 lg:px-0">
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-4 shadow-2xl scale-in-center border-4 border-success/10">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-16 h-16 text-success animate-bounce" />
            </div>
            <h2 className="text-4xl font-black tracking-tight">Запись подтверждена!</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ваше время забронировано в системе Takhet+</p>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in slide-in-from-bottom-10">
            <button onClick={() => setSelectedDoctor(null)} className="absolute top-4 md:top-8 right-4 md:right-8 z-20 p-3 md:p-4 bg-slate-100/80 backdrop-blur-md rounded-xl md:rounded-2xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
            </button>
            <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-8 md:space-y-10 no-scrollbar border-b md:border-b-0 md:border-r border-slate-50 bg-slate-50/20">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 md:gap-8">
                 <img src={selectedDoctor.avatar} className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border-4 border-white" alt={selectedDoctor.name} />
                 <div>
                    <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">{selectedDoctor.name}</h2>
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px] mt-2">{selectedDoctor.specialty} • {selectedDoctor.category} категория</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                       <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-black">{selectedDoctor.rating}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDoctor.reviewsCount} отзывов</span>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl md:rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest">Стаж работы</span>
                    <p className="text-lg md:text-xl font-black text-foreground">{selectedDoctor.experience} лет</p>
                 </div>
                 <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl md:rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest">Принимает</span>
                    <p className="text-lg md:text-xl font-black text-foreground">{selectedDoctor.accepts}</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Образование
                 </h4>
                 <div className="space-y-2">
                   {selectedDoctor.education.map((edu, i) => (
                     <div key={i} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <Award className="w-5 h-5 text-primary shrink-0" />
                       <p className="text-sm font-bold text-slate-700">{edu}</p>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4" /> О враче
                 </h4>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed bg-white border border-slate-100 p-8 rounded-3xl">
                   {selectedDoctor.biography}
                 </p>
              </div>
            </div>
            <div className="w-full md:w-[480px] bg-white p-6 md:p-14 flex flex-col overflow-y-auto no-scrollbar">
               <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 flex items-center gap-3">
                 <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Выбор даты
               </h3>
               
               <div className="space-y-8 md:space-y-10 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-base md:text-lg font-black capitalize">{monthName} {currentYear}</h4>
                      <div className="flex gap-1">
                         <button onClick={() => setCurrentMonth(prev => prev - 1)} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5"/></button>
                         <button onClick={() => setCurrentMonth(prev => prev + 1)} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-xl transition-colors rotate-180"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5"/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center">
                       {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(d => (
                         <div key={d} className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase py-1 md:py-2">{d}</div>
                       ))}
                       {calendarDays.map((date, idx) => {
                         if (!date) return <div key={`empty-${idx}`} />;
                         const dateStr = date.toISOString().split('T')[0];
                         const isSelected = selectedDateStr === dateStr;
                         const isPast = date < new Date(new Date().setHours(0,0,0,0));
                         
                         return (
                           <button
                             key={dateStr}
                             disabled={isPast}
                             onClick={() => { setSelectedDateStr(dateStr); setSelectedSlot(null); }}
                             className={`aspect-square flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all
                               ${isSelected ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 
                                 isPast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`}
                           >
                             {date.getDate()}
                           </button>
                         );
                       })}
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-6">
                     <div className="flex items-center justify-between">
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Доступные слоты на {new Date(selectedDateStr).toLocaleDateString('ru-RU')}</p>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            disabled={slot.isBooked}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all border-2
                              ${slot.isBooked ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' : 
                                selectedSlot === slot.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/20'}`}
                          >
                            {slot.time}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="pt-8 md:pt-10">
                  <button 
                    onClick={handleBookingConfirm}
                    disabled={!selectedSlot}
                    className="w-full py-4 md:py-6 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-30 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Забронировать прием
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* LEFT CONTENT: DOCTORS LIST */}
        <div className="w-full lg:flex-1 order-2 lg:order-1 space-y-12">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Поиск <span className="text-primary italic">специалиста</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
              {filteredDoctors.length} доступных врачей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Doctor Card */}
            <div 
              onClick={() => navigate('/takhet-ai')}
              className="bg-slate-950 p-10 rounded-[4rem] border border-white/10 shadow-2xl group flex flex-col cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-12 h-12 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-black text-white break-words">AI Doctor Takhet+</h3>
                  <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">Интеллектуальный помощник</p>
                  <div className="flex items-center gap-2 mt-4">
                     <div className="flex items-center gap-1 text-primary">
                       <Star className="w-4 h-4 fill-current" />
                       <span className="text-sm font-black">5.0</span>
                     </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                 <div className="p-6 bg-white/5 rounded-[2rem] text-center space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Ожидание</span>
                    <p className="text-lg font-black text-white">0 мин</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-[2rem] text-center space-y-1">
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Стоимость</span>
                    <p className="text-lg font-black text-white">300 ₸</p>
                 </div>
              </div>
              <button className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest mt-10 hover:bg-slate-200 shadow-lg transition-all">
                Начать сейчас
              </button>
            </div>

            {filteredDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                onClick={() => setSelectedDoctor(doctor)}
                className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col cursor-pointer"
              >
                <div className="flex items-center gap-6 md:gap-8 mb-8 md:mb-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white group-hover:scale-105 transition-transform">
                    <img src={doctor.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{doctor.name}</h3>
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px] mt-1">{doctor.specialty}</p>
                    <div className="flex items-center gap-2 mt-3 md:mt-4">
                      <div className="flex items-center gap-1 text-amber-500 px-2 py-1 bg-amber-50 rounded-lg md:rounded-xl">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] md:text-xs font-black">{doctor.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
                  <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] text-center">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Опыт</p>
                    <p className="text-base md:text-lg font-black text-slate-800">{doctor.experience} лет</p>
                  </div>
                  <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] text-center">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Прием</p>
                    <p className="text-base md:text-lg font-black text-primary">{doctor.pricePrimary}₸</p>
                  </div>
                </div>

                <button 
                  className="w-full py-5 md:py-6 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest mt-8 md:mt-10 group-hover:bg-primary shadow-xl transition-all"
                >
                  Записаться
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: STICKY FILTERS & BOOKING */}
        <div className="w-full lg:w-96 lg:sticky lg:top-24 order-1 lg:order-2 space-y-8">
           <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-10">
            <div className="space-y-6">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Фильтры
              </h3>
              
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Имя врача..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 md:pl-16 pr-6 py-4 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] md:rounded-[2rem] font-bold text-slate-900 focus:bg-white focus:border-primary/20 transition-all outline-none text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Специальность</p>
                  <select 
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Все специальности</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Клиника</p>
                  <select 
                    value={selectedClinicId || ''}
                    onChange={(e) => setSelectedClinicId(e.target.value || null)}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 focus:bg-white focus:border-primary/20 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Все клиники</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Опыт (от {minExperience} лет)</p>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={minExperience}
                    onChange={(e) => setMinExperience(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>0 лет</span>
                    <span>40+ лет</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Цена (до {maxPrice}₸)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[10000, 20000, 30000, 50000].map(price => (
                      <button 
                        key={price} 
                        onClick={() => setMaxPrice(price)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${maxPrice === price ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                      >
                        {price}₸
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setSearchTerm(''); setSelectedClinicId(null); setMaxPrice(50000); setMinExperience(0); setSelectedSpecialty(''); }}
              className="w-full py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
            >
              Сбросить всё
            </button>
          </div>

          <div className="bg-primary p-10 rounded-[4rem] text-white space-y-6 shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-black uppercase tracking-tight leading-tight">Нужна помощь <br/>в выборе?</h4>
              <p className="text-xs text-white/60 font-bold leading-relaxed">Наш ИИ-ассистент подберет идеального врача на основе ваших симптомов.</p>
              <button onClick={() => navigate('/takhet-ai')} className="w-full py-4 bg-white text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Спросить Takhet AI</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsSearchPage;
