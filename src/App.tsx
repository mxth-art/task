import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Loader2, Users, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReservationModal from '@/components/ReservationModal';
import { normalizeReservation, type Reservation, type ReservationRow } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function App() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<Reservation | null>(null);

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const fetchReservations = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      return;
    }

    const normalized = ((data ?? []) as ReservationRow[])
      .map(normalizeReservation)
      .filter((reservation): reservation is Reservation => reservation !== null)
      .filter((reservation) => {
        const date = new Date(reservation.reservationTime);
        return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
      })
      .sort((first, second) => new Date(first.reservationTime).getTime() - new Date(second.reservationTime).getTime());

    setReservations(normalized);
    setError(null);
  }, [cursor]);

  useEffect(() => {
    setLoading(true);
    fetchReservations().finally(() => setLoading(false));
  }, [fetchReservations]);

  useEffect(() => {
    const channel = supabase
      .channel('reservations-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchReservations)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  const days = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const cells: (Date | null)[] = Array.from({ length: firstOfMonth.getDay() }, () => null);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const reservationsByDay = useMemo(() => {
    const grouped = new Map<string, Reservation[]>();
    reservations.forEach((reservation) => {
      const key = new Date(reservation.reservationTime).toDateString();
      grouped.set(key, [...(grouped.get(key) ?? []), reservation]);
    });
    return grouped;
  }, [reservations]);

  const today = startOfDay(new Date());

  const setReminder = useCallback(async (reservation: Reservation, minutes: number | null) => {
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ reminder_minutes: minutes })
      .eq('id', reservation.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (minutes && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, reminderMinutes: minutes } : item));
  }, []);

  useEffect(() => {
    const timers = reservations
      .filter((reservation) => reservation.reminderMinutes && new Date(reservation.reservationTime).getTime() > Date.now())
      .map((reservation) => {
        const reminderAt = new Date(reservation.reservationTime).getTime() - (reservation.reminderMinutes ?? 0) * 60_000;
        const delay = reminderAt - Date.now();
        if (delay <= 0) return null;
        return window.setTimeout(() => {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`Upcoming reservation: ${reservation.name}`, { body: `${reservation.guests} guests at ${formatHour(reservation.reservationTime)}.` });
          }
        }, delay);
      })
      .filter((timer): timer is number => timer !== null);

    return () => timers.forEach(window.clearTimeout);
  }, [reservations]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20"><CalendarDays className="h-6 w-6" /></span>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Front Desk</span>
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Reservations.</h1>
            
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur lg:self-auto">
            {live ? <><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span><Wifi className="h-4 w-4 text-emerald-600" /><span className="font-medium text-slate-700">Live updates on</span></> : <><WifiOff className="h-4 w-4 text-slate-400" /><span className="text-slate-500">Connecting…</span></>}
          </div>
        </header>

        <section className="rounded-[30px] border border-white/80 bg-white/80 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCursor((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setCursor((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
              <button onClick={() => setCursor(startOfDay(new Date()))} className="ml-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700">Today</button>
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">{monthLabel}</h2>
          </div>

          {error && <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

          <div className="grid grid-cols-7 gap-2 overflow-x-auto">
            {WEEKDAYS.map((weekday) => <div key={weekday} className="min-w-[105px] px-2 pb-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{weekday}</div>)}
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="min-h-32 min-w-[105px] rounded-2xl bg-slate-50/60" />;
              const dayReservations = reservationsByDay.get(day.toDateString()) ?? [];
              const isToday = sameDay(day, today);
              return <div key={day.toISOString()} className={`min-h-32 min-w-[105px] rounded-2xl border p-2 transition hover:-translate-y-0.5 ${isToday ? 'border-teal-300 bg-teal-50/80 shadow-sm' : 'border-slate-100 bg-white/70 hover:border-cyan-200 hover:bg-cyan-50/40'}`}>
                <div className="mb-2 flex items-center justify-between"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-teal-700 text-white' : 'text-slate-500'}`}>{day.getDate()}</span>{dayReservations.length > 0 && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400"><Users className="h-3 w-3" />{dayReservations.reduce((total, reservation) => total + reservation.guests, 0)}</span>}</div>
                <div className="space-y-1.5">{dayReservations.slice(0, 3).map((reservation, index) => <button key={reservation.id} onClick={() => setSelected(reservation)} className={`block w-full truncate rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition hover:scale-[1.02] ${index % 2 === 0 ? 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100' : 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'}`}><span className="font-bold">{formatHour(reservation.reservationTime)}</span><span className="opacity-75"> · {reservation.name}</span></button>)}{dayReservations.length > 3 && <div className="px-1 text-[10px] font-semibold text-slate-400">+{dayReservations.length - 3} more</div>}</div>
              </div>;
            })}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">{loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-teal-600" />Refreshing reservations…</span> : <span><strong className="text-slate-800">{reservations.length}</strong> reservations this month</span>}<span className="hidden sm:inline">Select a booking to view guest details</span></div>
      </div>
      <ReservationModal reservation={selected} onClose={() => setSelected(null)} onSetReminder={setReminder} />
    </main>
  );
}
