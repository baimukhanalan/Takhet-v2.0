type BookingNotificationPayload = {
  doctorName: string;
  appointmentDate: string;
  appointmentSlot: string;
};

export const requestBookingNotificationPermission = async ({
  doctorName,
  appointmentDate,
  appointmentSlot
}: BookingNotificationPayload) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return;

  const title = 'Запись создана';
  const body = `${doctorName}: ${appointmentDate} в ${appointmentSlot}`;

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192.png',
        badge: '/favicon.png',
        data: { url: '/appointments' }
      });
      return;
    }
  } catch {}

  new Notification(title, { body, icon: '/pwa-192.png' });
};
