import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, Clock3, Mail, MessageSquareText, Phone, Users, X } from 'lucide-react';
import type { Reservation } from '@/types';

interface ReservationModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onSetReminder: (reservation: Reservation, minutes: number | null) => Promise<void>;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  seated: { label: 'Seated', className: 'bg-sky-100 text-sky-700 ring-sky-200' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700 ring-rose-200' },
  no_show: { label: 'No-show', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function ReservationModal({ reservation, onClose, onSetReminder }: ReservationModalProps) {
  const [customMinutes, setCustomMinutes] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (!reservation) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setCustomMinutes(reservation.reminderMinutes && ![30, 60].includes(reservation.reminderMinutes) ? String(reservation.reminderMinutes) : '');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [reservation, onClose]);

  if (!reservation) return null;
  const status = statusStyles[reservation.status] ?? { label: reservation.status.replace('_', ' '), className: 'bg-slate-100 text-slate-600 ring-slate-200' };

  const saveReminder = async (minutes: number | null) => {
    setSavingReminder(true);
    await onSetReminder(reservation, minutes);
    setSavingReminder(false);
  };

  const customValue = Number(customMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white shadow-2xl shadow-slate-900/20 animate-[scaleIn_0.18s_ease-out]" onClick={(event) => event.stopPropagation()}>
        <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-teal-50"><CalendarCheck className="h-5 w-5" /> Reservation details</div>
            <button onClick={onClose} className="rounded-full p-2 text-teal-50 transition hover:bg-white/15 hover:text-white" aria-label="Close reservation details"><X className="h-5 w-5" /></button>
          </div>
          <h2 className="mt-7 text-3xl font-semibold tracking-tight">{reservation.name}</h2>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${status.className}`}>{status.label}</span>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-orange-50 p-4"><Clock3 className="mb-3 h-5 w-5 text-orange-500" /><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">When</p><p className="mt-1 text-sm font-medium leading-6 text-slate-800">{formatDateTime(reservation.reservationTime)}</p></div>
            <div className="rounded-2xl bg-cyan-50 p-4"><Users className="mb-3 h-5 w-5 text-cyan-600" /><p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Party size</p><p className="mt-1 text-sm font-medium text-slate-800">{reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}</p></div>
          </div>

          {(reservation.email || reservation.phone) && <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">{reservation.email && <div className="flex items-center gap-3 text-sm text-slate-700"><Mail className="h-4 w-4 text-teal-600" />{reservation.email}</div>}{reservation.phone && <div className="flex items-center gap-3 text-sm text-slate-700"><Phone className="h-4 w-4 text-teal-600" />{reservation.phone}</div>}</div>}

          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800"><Bell className="h-4 w-4" /> Booking reminder</div>
            <p className="mb-3 text-sm leading-5 text-slate-600">Choose when this page should remind you before the reservation.</p>
            <div className="flex flex-wrap gap-2">
              {[30, 60].map((minutes) => <button key={minutes} onClick={() => void saveReminder(minutes)} disabled={savingReminder} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${reservation.reminderMinutes === minutes ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-teal-800 ring-1 ring-inset ring-teal-200 hover:bg-teal-100'}`}>{minutes === 60 ? '1 hour' : '30 minutes'}</button>)}
              <button onClick={() => void saveReminder(null)} disabled={savingReminder} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100">Off</button>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value.replace(/[^0-9]/g, ''))} type="number" min="1" placeholder="Custom minutes" className="min-w-0 flex-1 rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-inset ring-teal-200 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500" />
              <button onClick={() => customValue > 0 && void saveReminder(customValue)} disabled={savingReminder || customValue <= 0} className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">Set custom</button>
            </div>
            {reservation.reminderMinutes && <p className="mt-3 text-xs font-medium text-teal-700">Reminder set for {reservation.reminderMinutes} minutes before arrival.</p>}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><MessageSquareText className="h-4 w-4 text-orange-500" /> Special request</div><p className="text-sm leading-6 text-slate-700">{reservation.specialRequest?.trim() || 'No special request provided.'}</p></div>
        </div>
      </div>
    </div>
  );
}
