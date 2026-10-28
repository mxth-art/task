/*
# Create reservations table

1. New Tables
- `reservations`
  - `id` (uuid, primary key)
  - `name` (text, not null) — guest name
  - `reservation_time` (timestamptz, not null) — date + time of the reservation
  - `guests` (integer, not null, default 1) — party size
  - `special_request` (text, nullable) — optional notes from the guest
  - `status` (text, not null, default 'confirmed') — reservation status (confirmed / cancelled)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `reservations`.
- Grant SELECT to `anon` + `authenticated` so the public calendar page can read via the anon key.
- Public SELECT policy (USING true) — reservations are intentionally shared/public data for the display calendar (no sign-in on this page).
- Grant INSERT/UPDATE/DELETE to `anon` + `authenticated` so the separate booking site (and this project) can manage rows.
3. Realtime
- Add `reservations` to the `supabase_realtime` publication so the calendar updates live when rows change.
4. Indexes
- Index on `reservation_time` for fast date-range queries used by the calendar.
*/

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  reservation_time timestamptz NOT NULL,
  guests integer NOT NULL DEFAULT 1 CHECK (guests > 0),
  special_request text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','seated','no_show')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON reservations TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_reservations" ON reservations;
CREATE POLICY "public_select_reservations"
  ON reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_reservations" ON reservations;
CREATE POLICY "public_insert_reservations"
  ON reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_reservations" ON reservations;
CREATE POLICY "public_update_reservations"
  ON reservations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_reservations" ON reservations;
CREATE POLICY "public_delete_reservations"
  ON reservations FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS reservations_reservation_time_idx
  ON reservations (reservation_time);

ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
