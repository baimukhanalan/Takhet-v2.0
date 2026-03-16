
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Star, Clock, Wallet, ChevronRight, Stethoscope, 
  X, CheckCircle2, Award, BookOpen, UserCheck, Calendar as CalendarIcon, Info, MapPin, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MockDB } from '../services/db';
import { roleApi } from '../services/roleApi';
import { Doctor, TimeSlot } from '../types';

const DoctorsSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(today.toISOString().split('T')[0]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const apiDoctors = await roleApi.publicDoctors();
        const mapped = (apiDoctors || []).map((d: any) => ({
          id: d.id,
          name: d.fullName || 'Doctor',
          specialty: d.specialty || 'General',
          experience: 5,
          rating: 4.8,
          reputationPoints: 1000,
          reviewsCount: 0,
          pricePrimary: 15000,
          priceSecondary: 10000,
          education: [],
          biography: d.bio || '',
          accepts: 'Всех',
          category: 'Первая',
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
          participatesInCommunity: false,
          schedule: {},
          edsVerified: Boolean(d.active)
        }));
        setDoctors(mapped.filter((d: any) => d.edsVerified));
      } catch {
        setDoctors(MockDB.getVerifiedDoctors());
      }
    };

    handleUpdate();
    window.addEventListener('storage_update', handleUpdate as any);
    return () => window.removeEventListener('storage_update', handleUpdate as any);
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleBookingConfirm = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    try {
      const createdCase = await roleApi.patientCreateCase(`Booking with ${selectedDoctor.name} on ${selectedDateStr} slot ${selectedSlot}`);
      await roleApi.createPaymentIntent(createdCase?.id, selectedDoctor.pricePrimary || 15000);
    } catch {
      // fallback to local booking only
    }

    const result = MockDB.bookSlot(
      selectedDoctor.id,
      selectedDateStr,
      selectedSlot,
      MockDB.getProfile().name || 'Пациент'
    );

    if (result) {
      setShowSuccess(true);
      setSelectedDoctor(null);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/appointments');
      }, 2000);
    }
  };



  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32">
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
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in slide-in-from-bottom-10">
            <button onClick={() => setSelectedDoctor(null)} className="absolute top-8 right-8 z-10 p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>

            <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-10 no-scrollbar border-r border-slate-50 bg-slate-50/20">
              <div className="flex items-center gap-8">
                 <img src={selectedDoctor.avatar} className="w-32 h-32 rounded-[2.5rem] shadow-xl border-4 border-white" alt={selectedDoctor.name} />
                 <div>
                    <h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">{selectedDoctor.name}</h2>
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mt-2">{selectedDoctor.specialty} • {selectedDoctor.category} категория</p>
                    <div className="flex items-center gap-4 mt-4">
                       <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-black">{selectedDoctor.rating}</span>
                       </div>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedDoctor.reviewsCount} отзывов</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Стаж работы</span>
                    <p className="text-xl font-black text-foreground">{selectedDoctor.experience} лет</p>
                 </div>
                 <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Принимает</span>
                    <p className="text-xl font-black text-foreground">{selectedDoctor.accepts}</p>
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

            <div className="w-full md:w-[480px] bg-white p-10 md:p-14 flex flex-col overflow-y-auto no-scrollbar">
               <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                 <CalendarIcon className="w-6 h-6 text-primary" /> Выбор даты
               </h3>
               
               <div className="space-y-10 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-lg font-black capitalize">{monthName} {currentYear}</h4>
                      <div className="flex gap-1">
                         <button onClick={() => setCurrentMonth(prev => prev - 1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                         <button onClick={() => setCurrentMonth(prev => prev + 1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors rotate-180"><ChevronLeft className="w-5 h-5"/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center">
                       {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(d => (
                         <div key={d} className="text-[9px] font-black text-slate-400 uppercase py-2">{d}</div>
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
                             className={`aspect-square flex items-center justify-center rounded-2xl text-xs font-black transition-all
                               ${isSelected ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 
                                 isPast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`}
                           >
                             {date.getDate()}
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доступные слоты на {new Date(selectedDateStr).toLocaleDateString('ru-RU')}</p>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            disabled={slot.isBooked}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`py-3.5 rounded-2xl text-xs font-black transition-all border-2
                              ${slot.isBooked ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' : 
                                selectedSlot === slot.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/20'}`}
                          >
                            {slot.time}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="pt-10">
                  <button 
                    onClick={handleBookingConfirm}
                    disabled={!selectedSlot}
                    className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-30 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Забронировать прием
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 px-2">
        <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
          <Stethoscope className="w-10 h-10 text-primary" /> Специалисты Takhet+
        </h1>
        <p className="text-muted-foreground font-medium text-lg">Запишитесь к лучшим врачам страны на видео-консультацию.</p>
      </div>

      <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl p-8 rounded-[3.5rem] border border-border shadow-xl">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по имени, специальности или категории..." 
            className="w-full pl-16 pr-6 py-6 bg-slate-50 border-none rounded-[2rem] font-bold text-lg outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.map(doc => (
          <div 
            key={doc.id} 
            onClick={() => setSelectedDoctor(doc)}
            className="bg-white p-8 rounded-[4rem] border border-border shadow-sm hover:shadow-2xl transition-all group flex flex-col cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-xl group-hover:scale-110 transition-transform">
                <img src={doc.avatar} className="w-full h-full object-cover" alt={doc.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-black text-foreground truncate">{doc.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">{doc.specialty}</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="flex items-center gap-1 text-amber-500">
                     <Star className="w-4 h-4 fill-current" />
                     <span className="text-sm font-black">{doc.rating}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
               <div className="p-5 bg-slate-50 rounded-3xl text-center space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Стаж</span>
                  <p className="text-lg font-black">{doc.experience} лет</p>
               </div>
               <div className="p-5 bg-slate-50 rounded-3xl text-center space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Прием от</span>
                  <p className="text-lg font-black">{doc.pricePrimary}₸</p>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <UserCheck className="w-4 h-4 text-success" /> {doc.accepts}
               </div>
               <button className="px-8 py-4 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-800 shadow-lg shadow-primary/10 transition-all">
                  Выбрать дату
               </button>
            </div>
          </div>
        ))}
        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-[0.5em]">Врачи не найдены</div>
        )}
      </div>
    </div>
  );
};

export default DoctorsSearchPage;
