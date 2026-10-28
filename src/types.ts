export type ReservationStatus = 'confirmed' | 'cancelled' | 'seated' | 'no_show' | string;

export interface Reservation {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  reservationTime: string;
  guests: number;
  specialRequest: string | null;
  status: ReservationStatus;
  createdAt: string;
  reminderMinutes: number | null;
}

export interface ReservationRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  reservation_time?: string | null;
  date?: string | null;
  time?: string | null;
  guests: number;
  special_request?: string | null;
  special_requests?: string | null;
  status?: string | null;
  created_at?: string | null;
  reminder_minutes?: number | null;
}

export function normalizeReservation(row: ReservationRow): Reservation | null {
  const reservationTime = row.reservation_time ?? combineDateAndTime(row.date, row.time);
  if (!reservationTime || Number.isNaN(new Date(reservationTime).getTime())) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    reservationTime,
    guests: Number(row.guests) || 1,
    specialRequest: row.special_request ?? row.special_requests ?? null,
    status: row.status ?? 'confirmed',
    createdAt: row.created_at ?? reservationTime,
    reminderMinutes: row.reminder_minutes ?? null,
  };
}

function combineDateAndTime(date?: string | null, time?: string | null): string | null {
  if (!date) return null;
  return time ? `${date}T${time}` : date;
}
