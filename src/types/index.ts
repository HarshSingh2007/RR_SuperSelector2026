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
  battingAvg?: number;
  highestScore?: number;
  highestScoreNotOut?: boolean;
  totalFours?: number;
  totalSixes?: number;
  totalBoundaryPct?: number;
  powerplaySR?: number;
  middleSR?: number;
  deathOverallSR?: number;
  trendDelta?: number | null;
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
  iplTotal?: { balls: number; runs: number; sr: number };
  t20iTotal?: { balls: number; runs: number; sr: number };
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
  overallBowlingAvg?: number;
  overallWicketSR?: number;
  overallDotPct?: number;
  maidenOvers?: number;
  bestBowling?: string;
  bestBowlingWkts?: number;
  bestBowlingRuns?: number;
  powerplayOvers?: number;
  powerplayEcon?: number;
  powerplayWickets?: number;
  middleOvers?: number;
  middleEcon?: number;
  middleWickets?: number;
  deathOverallOvers?: number;
  deathOverallEcon?: number;
  deathOverallWickets?: number;
  trendDelta?: number | null;
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
  | 'player-profile'
  | 'pressure-engine'
  | 'batting'
  | 'bowling'
  | 'rankings'
  | 'comparison'
  | 'squad-gaps'
  | 'ai-assistant'
  | 'auction'
  | 'hidden-gems'
  | 'head-to-head'
  | 'young-talent'
  | 'methodology'
  | 'about';

export interface ShortlistEntry {
  playerId: string;
  name: string;
  role: string;
  roleType: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  country: string;
  countryFlag: string;
  team: string;
  bpiRating: number;
  keyMetric: string;
  sourceModule: string;
  notes: string;
  priority: 'critical' | 'high' | 'watch';
  addedAt: string;
}

export interface RecruitmentScenario {
  id: string;
  name: string;
  description: string;
  startingPurseCr: number;
  minSquad: number;
  maxSquad: number;
  maxOverseas: number;
  squad: SquadPlayer[];
}

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

export interface PitchZoneData {
  id: string;
  length: 'Yorker' | 'Full' | 'Good Length' | 'Short / Bouncer';
  line: 'Wide Outside Off' | 'Off Stump Corridor' | 'Middle & Stumps' | 'Down Leg';
  x: number;
  y: number;
  deliveries: number;
  pct: number;
  runs: number;
  wickets: number;
  dotBalls: number;
  boundaries: number;
  dotPct: number;
  boundaryPct: number;
  economy: number;
}

export interface ShotSectorData {
  id: string;
  name: string;
  angleStart: number;
  angleEnd: number;
  shots: number;
  runs: number;
  fours: number;
  sixes: number;
  dismissals: number;
  scoringPct: number;
}

export interface MatchHistoryItem {
  matchId: string;
  date: string;
  compName: string;
  season: string;
  opponent: string;
  venue?: string;
  result: string;
  batting?: {
    runs: number;
    balls: number;
    sr: number;
    fours: number;
    sixes: number;
    dismissal: string;
  };
  bowling?: {
    overs: string;
    maidens: number;
    runsConceded: number;
    wickets: number;
    economy: number;
    dots: number;
  };
  ballsDetails?: Array<{
    type: 'batting' | 'bowling';
    inn: number;
    over: number;
    ball: number;
    runs: number;
    isFour: boolean;
    isSix: boolean;
    isWicket: boolean;
    dismissalType?: string;
    bowlerName?: string;
    strikerName?: string;
    stroke?: string;
    deliveryStyle?: string;
    speed?: number;
  }>;
}

export interface PlayerProfileData {
  id: string;
  name: string;
  team: string;
  teams: string[];
  country: string;
  countryCode: string;
  countryFlag: string;
  avatarIcon: string;
  primaryRole: string;
  battingStyle: string;
  bowlingStyle: string;
  careerSpan: string;
  seasonsCount: number;
  totalMatches: number;
  totalBatInnings: number;
  totalBowlInnings: number;

  batting: {
    matches: number;
    innings: number;
    runs: number;
    balls: number;
    avg: number;
    sr: number;
    highestScore: number;
    highestScoreNotOut: boolean;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
    notOuts: number;
    dotPct: number;
    boundaryPct: number;
    powerplaySR: number;
    middleSR: number;
    deathSR: number;
    vsPaceSR: number;
    vsSpinSR: number;
  };

  bowling: {
    matches: number;
    innings: number;
    overs: string;
    totalBalls: number;
    runsConceded: number;
    wickets: number;
    avg: number;
    economy: number;
    sr: number;
    bestBowling: string;
    maidens: number;
    dotPct: number;
    boundaryPct: number;
    powerplayEcon: number;
    middleEcon: number;
    deathEcon: number;
    vsRHBEcon: number;
    vsLHBEcon: number;
  };

  rankings: {
    overallRank: number;
    batterRank: number | null;
    bowlerRank: number | null;
    allRounderRank: number | null;
    percentile: number;
    battingImpactScore: number;
    bowlingEffectivenessScore: number;
    consistencyScore: number;
    pressureIndex: number;
    ratingsFormula: string;
  };

  trends: {
    matchRuns: Array<{ matchId: string; date: string; opposition: string; runs: number; balls: number; sr: number }>;
    matchWickets: Array<{ matchId: string; date: string; opposition: string; wickets: number; runs: number; overs: number; econ: number }>;
    seasonBreakdown: Array<{ season: string; runs: number; battingSR: number; wickets: number; bowlingEcon: number }>;
    oppositionAnalysis: Array<{ team: string; battingRuns: number; battingSR: number; bowlingWkts: number; bowlingEcon: number }>;
    inningsSplit: {
      firstInn: { runs: number; avg: number; sr: number; wickets: number; econ: number };
      secondInn: { runs: number; avg: number; sr: number; wickets: number; econ: number };
    };
  };

  pitchMap: {
    hasData: boolean;
    totalDeliveries: number;
    dataMethodology: string;
    zones: PitchZoneData[];
    deliveryLogSample: Array<{
      ballId: string;
      over: number;
      ball: number;
      length: string;
      line: string;
      outcome: string;
      runs: number;
      speed: number;
      style: string;
      opposition: string;
      season: string;
      inn: number;
    }>;
  };

  shotMap: {
    hasData: boolean;
    totalShots: number;
    sectors: ShotSectorData[];
    strokeBreakdown: Array<{
      stroke: string;
      count: number;
      runs: number;
      fours: number;
      sixes: number;
    }>;
  };

  matchHistory: MatchHistoryItem[];
  insights: {
    strengths: Array<{ title: string; desc: string; metric: string; tag: string }>;
    weaknesses: Array<{ title: string; desc: string; metric: string; tag: string }>;
  };
}

export interface PlayerSummary {
  id: string;
  name: string;
  team: string;
  country: string;
  countryFlag: string;
  role: string;
  overallRank: number;
  overallScore: number;
  runs: number;
  wickets: number;
  matches: number;
}

