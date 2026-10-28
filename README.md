# Reservations Calendar

A live restaurant reservation calendar powered by Supabase Realtime.

## Supabase environment variables

Use `.env.example` as the deployment template.

- Public browser access: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Private admin access: `SUPABASE_SERVICE_ROLE_KEY`
- Vercel placeholder values: `VERCEL_SUPABASE_URL`, `VERCEL_SUPABASE_ANON_KEY`, and `VERCEL_SUPABASE_SERVICE_ROLE_KEY`

The service-role key is for server-side use only and should never be exposed in the browser. The public `anon` key is the one used by the client app.

The page supports both the current `reservation_time` / `special_request` fields and the separate `date` / `time` / `special_requests` fields shown in the reservation table layout.

## Vercel deployment guide

Use these exact steps in Vercel when you are ready to deploy.

1. Open your Vercel project dashboard.
2. Select the project and open the Project Settings page.
3. Go to Environment Variables.
4. Add the following variables for Production and Preview (and optionally Development if you use it locally):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. For the values, copy the same keys from your Supabase project:
   - `VITE_SUPABASE_URL` = your Supabase project URL, for example `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the public anon key from Supabase Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` = the service role key from the same API page, but keep it private and never expose it in the frontend
6. If you want to match another project’s naming convention, you can also keep the placeholder variables in the repo as:
   - `VERCEL_SUPABASE_URL`
   - `VERCEL_SUPABASE_ANON_KEY`
   - `VERCEL_SUPABASE_SERVICE_ROLE_KEY`
   - These are placeholders only and are not read by the app unless you explicitly change the code to use them.
7. Redeploy the app from the Vercel dashboard after saving the environment variables.
8. Confirm the deploy succeeds and the calendar loads without the PostCSS/Tailwind error.

### Example values

Use the same pattern as your other project:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

If your other project uses different names, copy that exact naming convention into Vercel, but keep the code in this app aligned with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` unless you intentionally update the app to read different names.

## Vercel deployment placeholder

The included `vercel.json` is configured for a Vite build. Import this project into Vercel, keep the framework as Vite, and add the Supabase values before deploying. The `VERCEL_*` names are left as placeholders only, and you will replace them with the real keys when you have them.
