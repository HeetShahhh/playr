-- ============================================================
-- SCORELY SEED DATA
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- Seed sports
insert into sports (name, slug, accent_color, icon, status, points_per_set, sets_per_match, win_by_margin, max_cap, sets_to_win)
values
  ('Badminton',   'badminton',   '#00A86B', '🏸', 'live',         21,  3, 2, 30, 2),
  ('Pickleball',  'pickleball',  '#FF6B35', '🥒', 'live',         11,  3, 2, 15, 2),
  ('Tennis',      'tennis',      '#E8A020', '🎾', 'live',          6,  5, 2,  7, 3),
  ('Cricket',     'cricket',     '#1A5CFF', '🏏', 'coming_soon',   0,  0, 0,  0, 0),
  ('Basketball',  'basketball',  '#E83038', '🏀', 'coming_soon',   0,  0, 0,  0, 0),
  ('Squash',      'squash',      '#8B5CF6', '🎱', 'coming_soon',  11,  5, 2, 15, 3)
on conflict (slug) do nothing;
