/*
# Add reservation reminder settings

1. Modified Tables
- `reservations`
  - `reminder_minutes` (integer, nullable) — optional number of minutes before the reservation when the page should remind the staff member.

2. Behavior
- A reminder is optional and can be set to any positive number of minutes.
- The calendar page can offer quick choices of 30 minutes and 1 hour plus a custom number.
- Existing reservations keep a NULL reminder until one is selected.

3. Security
- Preserve the existing single-tenant public/shared access model.
- Keep the existing anon and authenticated table grants and policies in place.

4. Data Safety
- This is an additive nullable column only; no existing reservation data is removed or renamed.
*/

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_minutes integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_reminder_minutes_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_reminder_minutes_check
      CHECK (reminder_minutes IS NULL OR reminder_minutes > 0);
  END IF;
END $$;
