export interface Batter {
  rank: number;
  id: string;
  name: string;
  team: string;
  teams: string[];
  matchesAnalysed: number;
  pressureMatches: number;
  totalBalls: number;
  totalRuns: number;
  totalSR: number;
  normalBalls: number;
  normalRuns: number;
  normalSR: number;
  pressureBalls: number;
  pressureRuns: number;
  pressureSR: number;
  srDelta: number;
  boundaryPct: number;
  fours: number;
  sixes: number;
  dismissalRate: number;
  dismissals: number;
  dotPct: number;
  deathSR: number;
  chaseSR: number;
  consistencyScore: number;
  confidenceWeight: number;
  rating: number;
  verdict: string;
  seasons?: Record<string, any>;
  ipl: { balls: number; runs: number; sr: number };
  t20i: { balls: number; runs: number; sr: number };
  player_id?: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  avatar_icon?: string;
  player_role?: string;
  pressure_rating?: number;
  keyMetric?: string;
}

export interface Bowler {
  rank: number;
  id: string;
  name: string;
  team: string;
  teams: string[];
  bowlingType: string;
  matchesAnalysed: number;
  pressureMatches: number;
  totalOvers: number;
  totalEcon: number;
  totalWickets: number;
  normalOvers: number;
  normalEcon: number;
  pressureLegalBalls: number;
  pressureOvers: number;
  pressureRunsConceded: number;
  pressureEcon: number;
  econDelta: number;
  pressureWickets: number;
  dotPct: number;
  wicketSR: number;
  bowlingAvg: number;
  deathEcon: number;
  deathPressureWickets: number;
  consistencyScore: number;
  confidenceWeight: number;
  rating: number;
  verdict: string;
  seasons?: Record<string, any>;
  ipl: { balls: number; overs: number; runs: number; wickets: number; econ: number };
  t20i: { balls: number; overs: number; runs: number; wickets: number; econ: number };
  player_id?: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  avatar_icon?: string;
  player_role?: string;
  pressure_rating?: number;
  keyMetric?: string;
}

export interface Competition {
  comp_id: string;
  comp_name: string;
  match_format: string;
  season: string;
  is_ipl: boolean;
}

export interface Metadata {
  totalMatches: number;
  matchesWithBalls: number;
  totalDeliveries: number;
  totalPressureDeliveries: number;
  totalPlayersEvaluated: number;
  totalCompetitions: number;
  pressureDistribution: {
    Normal: number;
    Moderate: number;
    High: number;
    Extreme: number;
  };
  phaseDistribution: {
    powerplay: { total: number; pressure: number; runs: number; wickets: number };
    middle: { total: number; pressure: number; runs: number; wickets: number };
    death: { total: number; pressure: number; runs: number; wickets: number };
  };
  competitionComparison: {
    IPL: { matches: number; balls: number; pressureBalls: number; pressurePct: number; avgRunRate: number; wickets: number };
    T20I: { matches: number; balls: number; pressureBalls: number; pressurePct: number; avgRunRate: number; wickets: number };
  };
  seasonTrends: Array<{
    season: string;
    totalBalls: number;
    pressureBalls: number;
    pressurePct: number;
    runRate: number;
    wickets: number;
  }>;
  topBatters: Batter[];
  topBowlers: Bowler[];
}

export interface PressureMatch {
  id: string;
  name: string;
  situation: string;
  result: string;
  ballsRemaining: number;
  runsNeeded: number;
  wicketsInHand: number;
  pressureIndex: number;
  pressureCategory: string;
}

export type NavigationTab = 
  | 'overview'
  | 'pressure-engine'
  | 'batting'
  | 'bowling'
  | 'rankings'
  | 'comparison'
  | 'auction'
  | 'hidden-gems'
  | 'head-to-head'
  | 'young-talent'
  | 'methodology'
  | 'about';

export interface AuctionPlayer {
  player_id: string;
  name: string;
  country: string;
  country_code: string;
  country_flag: string;
  is_overseas: boolean;
  player_role: string;
  role_type: 'batter' | 'bowler';
  current_franchise: string;
  avatar_icon: string;
  bpi_rating: number;
  base_price_cr: number;
  estimated_valuation_cr: number;
  key_stat: string;
  clutch_delta: number;
  matches_analysed: number;
  scouting_summary: string;
}

export interface SquadPlayer extends AuctionPlayer {
  purchase_price_cr: number;
  acquired_at: string;
}

export interface SquadAnalytics {
  totalSpentCr: number;
  purseRemainingCr: number;
  totalPlayers: number;
  overseasCount: number;
  domesticCount: number;
  roles: {
    batters: number;
    bowlers: number;
    allRounders: number;
    wicketKeepers: number;
  };
  squadStrengthScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface HiddenGemPlayer {
  player_id: string;
  name: string;
  country: string;
  country_code: string;
  country_flag: string;
  player_role: string;
  role_type: 'batter' | 'bowler';
  team: string;
  avatar_icon: string;
  bpi_rating: number;
  hidden_gem_score: number;
  gem_tag: string;
  matches_analysed: number;
  pressure_matches: number;
  pressure_metric: string;
  baseline_metric: string;
  delta: number;
  consistency: number;
  dot_or_boundary_pct: number;
  why_scout: string;
  strengths: string[];
  weaknesses: string[];
}

export interface HeadToHeadStats {
  balls: number;
  advantage?: string;
  runs: number;
  dismissals: number;
  dots: number;
  fours: number;
  sixes: number;
  strike_rate: number;
}

export interface HeadToHeadRecord {
  batter_id: string;
  batter_name: string;
  bowler_id: string;
  bowler_name: string;
  balls_faced: number;
  runs_scored: number;
  dismissals: number;
  dots: number;
  fours: number;
  sixes: number;
  timeline: string[];
  ipl: HeadToHeadStats;
  t20i: HeadToHeadStats;
  strike_rate: number;
  dot_pct: number;
  boundary_pct: number;
  batting_avg: number;
  advantage: 'batter' | 'bowler' | 'balanced';
}

export interface HeadToHeadMatrixData {
  matchups: Record<string, HeadToHeadRecord>;
  toughest_opponents: Record<string, HeadToHeadRecord[]>;
  favourite_batters: Record<string, HeadToHeadRecord[]>;
}

export interface YoungTalentStats {
  matches: number;
  batting: {
    runs: number;
    strike_rate: number;
    average: number;
    boundaries_count: number;
    boundary_pct: number;
    pressure_sr: number | null;
    balls?: number;
  };
  bowling: {
    wickets: number;
    economy: number;
    bowling_avg: number;
    dot_pct: number;
    pressure_econ: number | null;
    balls?: number;
  };
}

export interface YoungTalentScores {
  current_performance: number; // Statistical score from historical match data
  consistency: number;         // Statistical score from match variations
  development_potential: number; // AI projection score
  overall_talent_score: number; // Weighted composite
}

export interface YoungTalent {
  id: string;
  name: string;
  dob: string;
  age: number;
  country: string;
  country_code: string;
  country_flag: string;
  is_domestic_indian: boolean;
  is_uncapped: boolean;
  primary_role: 'Batter' | 'Fast Bowler' | 'Spinner' | 'All-Rounder' | 'Wicketkeeper';
  sub_role: string;
  current_teams: string[];
  youth_tournaments: string[];
  avatar_icon: string;
  is_next_big_star: boolean;
  stats: YoungTalentStats;
  scores: YoungTalentScores;
  ceiling_floor: {
    ceiling: string;
    floor: string;
    projected_peak_year: number;
  };
  why_this_player: string;
  competitions?: string[];
  data_basis?: {
    stats_source: string;
    dob_source: string;
    sample_size_flag: 'robust' | 'moderate' | 'limited' | string;
    sample_note?: string;
  };
  scouting_report: {
    strengths: string[];
    development_areas: string[];
  };
}

export interface WatchlistItem {
  player: YoungTalent;
  isHighPriority: boolean;
  scoutingNotes: string;
  addedAt: string;
}
