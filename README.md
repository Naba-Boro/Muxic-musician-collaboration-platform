# Muxics

Muxics helps musicians across India discover collaborators and hiring opportunities, apply to gigs, build public work profiles, and continue accepted work in shared project spaces.

## Local setup

1. Create a Supabase project for development. Keep production data in a separate Supabase project.
2. In the Supabase Dashboard, open **Project Settings → API** and copy the project URL, publishable key, and secret key.
3. Copy `.env.example` to `.env.local` and fill in:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   The secret key is server-only. Never prefix it with `NEXT_PUBLIC_` or expose it in browser code.

4. In the Supabase Dashboard, enable **Integrations → Cron** before applying the migration. The migration schedules the hourly job that sends 24-hour gig deadline reminders and closes expired gigs. If Cron is enabled after applying the migration, schedule `select public.process_gig_deadlines();` to run hourly.
5. Open **SQL Editor** in the Supabase Dashboard, paste and run [`supabase/migrations/202610250001_initial_schema.sql`](./supabase/migrations/202610250001_initial_schema.sql).
6. In **Authentication → URL Configuration**, set the site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
7. To allow immediate account access without email verification, open **Authentication → Sign In / Providers → Email** and turn off **Confirm email**. The signup flow checks for an immediate session and removes the newly created Auth user if this setting is still enabled.
8. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Implemented in this starter

- Email and username sign-in, signup with a required short demo upload, immediate access after signup, and password reset.
- Public-to-members musician profiles, profile editing, demo playback, and discovery by specialty/location.
- Opportunity creation, search/filtering, applications, poster decisions, and applicant status tracking.
- Direct project proposals with replies and mutual acceptance.
- Shared project pages with realtime text chat, poster completion, collaborator departure/removal, and private exit history.
- In-app notifications, deadline extension before any contributor is accepted, and scheduled deadline closure.
- Row-level security and a private Supabase Storage bucket for audio demos.

## Current setup limits

- No Supabase credentials are committed. The app shows setup guidance until `.env.local` is configured and the migration is applied.
- Supabase Cron must be enabled for deadline reminders and automatic gig closure.
- Account deletion/reactivation, scheduled 60-day permanent cleanup, avatar uploads, adding portfolio links, email notification delivery, and a server-side audio-duration check still need implementation before release.
- The UI and flows have not yet been run against a live Supabase project.
