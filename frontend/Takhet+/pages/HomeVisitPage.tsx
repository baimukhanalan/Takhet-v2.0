
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
    <div className="max-w-7xl mx-auto space-y-10">
      {booked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white p-12 rounded-[4rem] text-center space-y-4">
              <CheckCircle2 className="w-20 h-20 text-success mx-auto" />
              <h2 className="text-3xl font-black">Вызов оформлен!</h2>
              <p className="text-muted-foreground font-medium">Врач скоро свяжется с вами.</p>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Врач на дом</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Выезд терапевта или медсестры 24/7 по вашему адресу.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: 'Др. Алиби Болат', type: 'Терапевт', price: '25,000₸', rating: '4.9' },
          { name: 'Др. Юлия Ким', type: 'Педиатр', price: '20,000₸', rating: '4.8' },
        ].map((doc, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="h-48 bg-slate-100">
               <img src={`https://picsum.photos/seed/home-${i}/500/300`} className="w-full h-full object-cover" alt="Doctor" />
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h4 className="text-xl font-bold">{doc.name}</h4>
                <p className="text-sm font-bold text-primary">{doc.type}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black">{doc.price}</p>
                <button onClick={() => handleBook(doc.name)} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-lg">Вызвать</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeVisitPage;
