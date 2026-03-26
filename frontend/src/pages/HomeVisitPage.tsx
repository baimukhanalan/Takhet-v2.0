import React, { useState } from 'react';
import { Home, MapPin, Star, Clock, Search, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MockDB } from '../services/db';

const HomeVisitPage: React.FC = () => {
  const navigate = useNavigate();
  const [booked, setBooked] = useState(false);

  const handleBook = (name: string) => {
    MockDB.addAppointment({
      patientName: 'Алан Баймухан',
      doctorName: name,
      time: '14:00',
      date: 'Сегодня',
      status: 'upcoming',
      type: 'In-Person'
    });
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      navigate('/appointments');
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 px-4 md:px-0">
      {booked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
           <div className="bg-white p-8 md:p-12 rounded-3xl md:rounded-[4rem] text-center space-y-4 w-full max-w-sm">
              <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-success mx-auto" />
              <h2 className="text-2xl md:text-3xl font-black">Вызов оформлен!</h2>
              <p className="text-muted-foreground font-medium text-sm md:text-base">Врач скоро свяжется с вами.</p>
           </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-none">Врач на дом</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">Выезд терапевта или медсестры 24/7 по вашему адресу.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[
          { name: 'Др. Алиби Болат', type: 'Терапевт', price: '25,000₸', rating: '4.9' },
          { name: 'Др. Юлия Ким', type: 'Педиатр', price: '20,000₸', rating: '4.8' },
        ].map((doc, i) => (
          <div key={i} className="bg-white rounded-3xl md:rounded-[2.5rem] border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="h-40 md:h-48 bg-slate-100">
               <img src={`https://picsum.photos/seed/home-${i}/500/300`} className="w-full h-full object-cover" alt="Doctor" referrerPolicy="no-referrer" />
            </div>
            <div className="p-6 md:p-8 space-y-4 md:space-y-6">
              <div>
                <h4 className="text-lg md:text-xl font-bold break-words">{doc.name}</h4>
                <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-widest">{doc.type}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xl md:text-2xl font-black">{doc.price}</p>
                <button onClick={() => handleBook(doc.name)} className="flex-1 sm:flex-none px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">Вызвать</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeVisitPage;
