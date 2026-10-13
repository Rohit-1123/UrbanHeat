// The app serves Tamil Nadu, so show India time regardless of the browser's timezone.
const IST = 'Asia/Kolkata';
export const istTime = (d = new Date()) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: IST });
export const istDate = (d = new Date(), opts) => d.toLocaleDateString([], { ...opts, timeZone: IST });
export const istHour = (d = new Date()) => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: IST }).format(d));

// 135 -> "2 hr 15 min", 60 -> "1 hr", 28 -> "28 min"
export const formatDuration = (mins) => {
  const total = Math.max(1, Math.round(mins));
  const h = Math.floor(total / 60), m = total % 60;
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
};
