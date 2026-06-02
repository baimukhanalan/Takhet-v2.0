import React, { useEffect, useState } from 'react';
import { CalendarCheck2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';
import { requestBookingNotificationPermission } from '../services/bookingNotifications';

type PublicDoctor = {
  id: string;
  fullName: string;
  specialty: string;
  avatar: string;
  pricePrimary: number;
  clinicName?: string;
};

type BookingState = {
  doctor?: PublicDoctor;
  selectedDate?: string;
  selectedSlot?: string;
  bookingNote?: string;
};

const DoctorBookingConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorId } = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<PublicDoctor | null>((location.state as BookingState | null)?.doctor || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingState = (location.state as BookingState | null) || {};
  const selectedDate = bookingState.selectedDate || '';
  const selectedSlot = bookingState.selectedSlot || '';
  const bookingNote = bookingState.bookingNote || '';

  useEffect(() => {
    const load = async () => {
      if (doctor || !doctorId) return;
      try {
        const nextDoctor = await roleApi.publicDoctor(doctorId);
        setDoctor(nextDoctor);
      } catch {
        setError('Не удалось загрузить данные для подтверждения записи');
      }
    };
    void load();
  }, [doctor, doctorId]);

  const confirmBooking = async () => {
    if (!doctor || !selectedDate || !selectedSlot) {
      setError('Выберите врача, дату и время записи');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await roleApi.patientCreateCase({
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot,
        summary: [
          'Запись к врачу',
          `Врач: ${doctor.fullName}`,
          `Специальность: ${doctor.specialty}`,
          `Дата: ${selectedDate}`,
          `Время: ${selectedSlot}`,
          `Комментарий пациента: ${bookingNote || 'Без дополнительного комментария'}`,
          'Статус оплаты: подтверждение Kaspi Pay будет подключено позже'
        ].join('\n')
      });
      await requestBookingNotificationPermission({
        doctorName: doctor.fullName,
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot
      });
      navigate('/appointments');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">
        {error || 'Подготовка подтверждения'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-28 px-3 sm:px-4 md:px-0">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-5 py-3 font-black text-[10px] uppercase tracking-widest text-slate-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад к выбору времени
      </button>

      <div className="rounded-[2.5rem] md:rounded-[3.5rem] bg-white border border-border p-6 md:p-10 shadow-sm space-y-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Подтверждение записи</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">Проверьте детали перед созданием записи</h1>
          <p className="text-slate-500 font-medium text-base md:text-lg">
            После подтверждения запись появится в портале пациента и в расписании врача. Комнату консультации можно открыть из записи.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.9fr] gap-6">
          <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-6 flex items-center gap-5">
            <img src={doctor.avatar} alt={doctor.fullName} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-lg" />
            <div>
              <p className="text-xl font-black text-slate-900">{doctor.fullName}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">{doctor.specialty}</p>
              <p className="text-sm font-medium text-slate-500 mt-2">{doctor.clinicName || 'Takhet+ Network'}</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="w-5 h-5 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Запись</p>
            </div>
            <div className="space-y-2 text-sm font-bold text-slate-700">
              <p>Дата: {selectedDate || 'Не выбрана'}</p>
              <p>Время: {selectedSlot || 'Не выбрано'}</p>
              <p>Стоимость приема врача: ₸{doctor.pricePrimary}</p>
            </div>
          </div>
        </div>

        {bookingNote && (
          <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Комментарий пациента</p>
            <p className="text-sm md:text-base font-medium text-slate-600 leading-relaxed">{bookingNote}</p>
          </div>
        )}

        <div className="rounded-[2rem] bg-primary/5 border border-primary/10 p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            Сейчас реальное списание не выполняется: запись создается без оплаты, а логика будущего подтверждения Kaspi Pay остается сохраненной.
          </p>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-600">{error}</div>}

        <button
          onClick={() => void confirmBooking()}
          disabled={submitting}
          className="w-full py-5 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-xs disabled:opacity-60"
        >
          {submitting ? 'Создание записи...' : 'Подтвердить запись'}
        </button>
      </div>
    </div>
  );
};

export default DoctorBookingConfirmPage;
