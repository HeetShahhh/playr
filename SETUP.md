# Scorely — Setup Guide

## 1. Configure Supabase

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Run the database schema

In the [Supabase SQL Editor](https://supabase.com/dashboard), paste and run:
1. `supabase/schema.sql` — creates all tables, indexes, and RLS policies
2. `supabase/seed.sql` — inserts the 6 sports (Badminton, Pickleball, Tennis + 3 coming soon)

## 3. Enable Realtime

In Supabase Dashboard → Database → Replication → add these tables to `supabase_realtime`:
- `matches`
- `match_events`

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Deploy to Vercel

```bash
npx vercel
```

Add the same env vars in Vercel Dashboard → Settings → Environment Variables.

---

## App structure

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth` | Sign up / sign in (OTP email) |
| `/dashboard` | Home — role-aware |
| `/match/[id]/score` | Live scoring screen (umpire) |
| `/watch/[token]` | Spectator view (no auth needed) |
| `/profile/[id]` | Public player profile |
| `/matches` | Match history |
| `/score` | Umpire assignment picker |
| `/manage` | Club admin panel |
| `/manage/matches/new` | Create a match |
| `/manage/tournaments/new` | Create a tournament |
| `/manage/tournaments/[id]` | Tournament bracket view |
| `/settings` | Account settings |

## Roles

| Role | Access |
|---|---|
| `player` | Home, Matches, Profile, Settings |
| `umpire` | + Score tab when assigned |
| `club_admin` | + Manage tab, full org control |
| `spectator` | Read-only via share link |
