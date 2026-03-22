export type UserRole = 'player' | 'umpire' | 'club_admin' | 'spectator';

export interface UserProfile {
  id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  club_id?: string;
  elo_rating: number;
  onboarded?: boolean;
  primary_sport?: string;
  city?: string;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  city?: string;
  created_by: string;
  created_at: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  accent_color: string;
  icon: string;
  status: 'live' | 'coming_soon';
  points_per_set: number;
  sets_per_match: number;
  win_by_margin: number;
  max_cap: number;
  sets_to_win: number;
}

export interface Match {
  id: string;
  sport_id: string;
  club_id?: string;
  player_a_id: string;
  player_b_id: string;
  umpire_id?: string;
  status: 'pending' | 'live' | 'completed' | 'cancelled';
  current_set: number;
  score_a: number;
  score_b: number;
  sets_a: number;
  sets_b: number;
  winner_id?: string;
  share_token: string;
  created_at: string;
  completed_at?: string;
  // Joined
  sport?: Sport;
  player_a?: UserProfile;
  player_b?: UserProfile;
  umpire?: UserProfile;
  set_results?: SetResult[];
}

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: 'point_a' | 'point_b' | 'fault' | 'let' | 'timeout' | 'undo' | 'set_end' | 'match_end';
  score_a_after: number;
  score_b_after: number;
  set_number: number;
  created_at: string;
  synced: boolean;
}

export interface SetResult {
  id: string;
  match_id: string;
  set_number: number;
  score_a: number;
  score_b: number;
  winner: 'a' | 'b';
}

export interface Tournament {
  id: string;
  name: string;
  sport_id: string;
  club_id?: string;
  format: 'knockout' | 'round_robin';
  status: 'draft' | 'active' | 'completed';
  created_by: string;
  created_at: string;
  sport?: Sport;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  match_id: string;
  round: number;
  position: number;
  match?: Match;
}

// Scoring state machine types
export interface ScoreState {
  matchId: string;
  sport: Sport;
  playerA: UserProfile;
  playerB: UserProfile;
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  currentSet: number;
  setResults: SetResult[];
  status: 'live' | 'completed';
  winnerId?: string;
  lastEventTime?: number;
}

export type ScoreAction =
  | { type: 'POINT_A' }
  | { type: 'POINT_B' }
  | { type: 'UNDO'; previousState: ScoreState }
  | { type: 'FAULT' }
  | { type: 'LET' }
  | { type: 'TIMEOUT' }
  | { type: 'SET_END'; winner: 'a' | 'b'; finalScoreA: number; finalScoreB: number }
  | { type: 'MATCH_END'; winnerId: string };

export interface Toast {
  id: string;
  message: string;
  type: 'action' | 'success' | 'error';
}
