-- ============================================================
-- SCORELY DATABASE SCHEMA
-- Run this in your Supabase SQL editor (Settings > SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- CLUBS
-- ============================================================
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists user_profiles (
  id uuid references auth.users primary key,
  display_name text not null,
  avatar_url text,
  role text default 'player' check (role in ('player', 'umpire', 'club_admin', 'spectator')),
  club_id uuid references clubs(id),
  elo_rating integer default 1200,
  created_at timestamptz default now()
);

-- ============================================================
-- SPORTS
-- ============================================================
create table if not exists sports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  accent_color text not null,
  icon text not null,
  status text default 'live' check (status in ('live', 'coming_soon')),
  points_per_set integer default 21,
  sets_per_match integer default 3,
  win_by_margin integer default 2,
  max_cap integer default 30,
  sets_to_win integer default 2
);

-- ============================================================
-- MATCHES
-- ============================================================
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id),
  club_id uuid references clubs(id),
  player_a_id uuid references user_profiles(id),
  player_b_id uuid references user_profiles(id),
  umpire_id uuid references user_profiles(id),
  status text default 'pending' check (status in ('pending', 'live', 'completed', 'cancelled')),
  current_set integer default 1,
  score_a integer default 0,
  score_b integer default 0,
  sets_a integer default 0,
  sets_b integer default 0,
  winner_id uuid references user_profiles(id),
  share_token text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================================
-- MATCH EVENTS (scoring log)
-- ============================================================
create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  event_type text not null check (event_type in (
    'point_a', 'point_b', 'fault', 'let', 'timeout', 'undo', 'set_end', 'match_end'
  )),
  score_a_after integer default 0,
  score_b_after integer default 0,
  set_number integer default 1,
  created_at timestamptz default now(),
  synced boolean default true
);

-- ============================================================
-- SET RESULTS
-- ============================================================
create table if not exists set_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  set_number integer not null,
  score_a integer not null,
  score_b integer not null,
  winner text check (winner in ('a', 'b'))
);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport_id uuid references sports(id),
  club_id uuid references clubs(id),
  format text default 'knockout' check (format in ('knockout', 'round_robin')),
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TOURNAMENT MATCHES
-- ============================================================
create table if not exists tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  match_id uuid references matches(id),
  round integer not null,
  position integer not null
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_matches_player_a on matches(player_a_id);
create index if not exists idx_matches_player_b on matches(player_b_id);
create index if not exists idx_matches_club on matches(club_id);
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_matches_share_token on matches(share_token);
create index if not exists idx_match_events_match on match_events(match_id);
create index if not exists idx_match_events_synced on match_events(synced);
create index if not exists idx_user_profiles_club on user_profiles(club_id);
create index if not exists idx_tournament_matches_tournament on tournament_matches(tournament_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table user_profiles enable row level security;
alter table clubs enable row level security;
alter table sports enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;
alter table set_results enable row level security;
alter table tournaments enable row level security;
alter table tournament_matches enable row level security;

-- Sports: read-only for all
create policy "Sports readable by anyone" on sports for select using (true);

-- User profiles: users can see and edit their own
create policy "Users can view any profile" on user_profiles for select using (true);
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles for insert with check (auth.uid() = id);

-- Clubs: readable by all authenticated
create policy "Clubs readable by authenticated" on clubs for select using (auth.role() = 'authenticated');
create policy "Admins can insert clubs" on clubs for insert with check (auth.uid() = created_by);
create policy "Admins can update own clubs" on clubs for update using (auth.uid() = created_by);

-- Matches: read by share_token (spectators), players, umpires, and club admins
create policy "Matches readable by players and umpires" on matches for select
  using (
    auth.uid() = player_a_id
    or auth.uid() = player_b_id
    or auth.uid() = umpire_id
    or share_token is not null -- allows spectator access via share token
  );

create policy "Matches readable by share token (all)" on matches for select using (share_token is not null);

create policy "Club admins can insert matches" on matches for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'club_admin'
    )
  );

create policy "Umpires and admins can update matches" on matches for update
  using (
    auth.uid() = umpire_id
    or exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'club_admin'
    )
  );

-- Match events: umpires insert, anyone who can view the match can select
create policy "Anyone can read match events" on match_events for select using (true);
create policy "Umpires can insert match events" on match_events for insert
  with check (
    exists (
      select 1 from matches
      where id = match_id and (
        umpire_id = auth.uid()
        or exists (
          select 1 from user_profiles where id = auth.uid() and role = 'club_admin'
        )
      )
    )
  );

-- Set results: same as match events
create policy "Anyone can read set results" on set_results for select using (true);
create policy "Umpires and admins can insert set results" on set_results for insert
  with check (auth.uid() is not null);

-- Tournaments and brackets
create policy "Tournaments readable by club members" on tournaments for select
  using (
    auth.uid() is not null
  );
create policy "Admins can manage tournaments" on tournaments for all
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'club_admin')
  );

create policy "Tournament matches readable" on tournament_matches for select using (true);
create policy "Admins can manage tournament matches" on tournament_matches for all
  using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'club_admin')
  );

-- ============================================================
-- REALTIME: Enable on these tables
-- ============================================================
-- Run these in the Supabase Dashboard under Database > Replication:
-- alter publication supabase_realtime add table matches;
-- alter publication supabase_realtime add table match_events;
