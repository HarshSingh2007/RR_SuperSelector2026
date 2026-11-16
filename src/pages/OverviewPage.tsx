import React, { useState } from 'react';
import {
  Layers,
  Flame,
  Target,
  Trophy,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Award,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bookmark,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Metadata, Batter, Bowler, NavigationTab } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { CricketPitchGraphic } from '../components/CricketPitchGraphic';
import { useEcosystem } from '../context/EcosystemContext';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  BowlingMotionIcon,
  AllRounderIcon,
  PitchStripIcon,
  RoyalCrestEmblem,
  AuctionGavelIcon,
  HiddenGemIcon,
  HeadToHeadIcon,
  YoungTalentRadarIcon,
} from '../components/CricketIcons';
import top20Data from '../data/top20_identities.json';

interface OverviewPageProps {
  metadata: Metadata;
  onNavigate: (tab: NavigationTab) => void;
  onSelectPlayer: (player: Batter | Bowler, type: 'batter' | 'bowler') => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metadata,
  onNavigate,
  onSelectPlayer,
}) => {
  const { shortlist, setShortlistOpen, toggleShortlist, isShortlisted } = useEcosystem();
  const [top10Tab, setTop10Tab] = useState<'batters' | 'bowlers'>('batters');

  // Pressure Distribution Data for Recharts Donut
  const pressurePieData = [
    { name: 'Normal (<0.38)', value: metadata.pressureDistribution.Normal, color: '#384666' },
    { name: 'Moderate (0.38-0.55)', value: metadata.pressureDistribution.Moderate, color: '#7545C8' },
    { name: 'High (0.55-0.75)', value: metadata.pressureDistribution.High, color: '#E90074' },
    { name: 'Extreme (≥0.75)', value: metadata.pressureDistribution.Extreme, color: '#FF1A8C' },
  ];

  // Phase distribution comparison
  const phaseChartData = [
    {
      phase: 'Powerplay (1-6)',
      total: metadata.phaseDistribution.powerplay.total,
      pressure: metadata.phaseDistribution.powerplay.pressure,
      pressurePct: parseFloat(
        ((metadata.phaseDistribution.powerplay.pressure / metadata.phaseDistribution.powerplay.total) * 100).toFixed(1)
      ),
    },
    {
      phase: 'Middle (7-15)',
      total: metadata.phaseDistribution.middle.total,
      pressure: metadata.phaseDistribution.middle.pressure,
      pressurePct: parseFloat(
        ((metadata.phaseDistribution.middle.pressure / metadata.phaseDistribution.middle.total) * 100).toFixed(1)
      ),
    },
    {
      phase: 'Death (16-20)',
      total: metadata.phaseDistribution.death.total,
      pressure: metadata.phaseDistribution.death.pressure,
      pressurePct: parseFloat(
        ((metadata.phaseDistribution.death.pressure / metadata.phaseDistribution.death.total) * 100).toFixed(1)
      ),
    },
  ];

  // Competition Comparison Data
  const compComparisonData = [
    {
      metric: 'Pressure Ratio (%)',
      IPL: metadata.competitionComparison.IPL.pressurePct,
      T20I: metadata.competitionComparison.T20I.pressurePct,
    },
    {
      metric: 'Avg Run Rate (RPO)',
      IPL: metadata.competitionComparison.IPL.avgRunRate,
      T20I: metadata.competitionComparison.T20I.avgRunRate,
    },
  ];

  const topBatter = (top20Data.batters[0] as unknown as Batter) || metadata.topBatters[0];
  const topBowler = (top20Data.bowlers[0] as unknown as Bowler) || metadata.topBowlers[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. IMPRESSIVE CRICKET HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#171F35] via-[#121A2D] to-[#0B1020] border-2 border-[#29334C] p-6 sm:p-10 shadow-2xl">
        {/* Abstract Stadium and Pitch visual background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <CricketPitchGraphic variant="stadium" className="absolute -top-12 -right-20 w-[600px] h-[340px]" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#E90074]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#7545C8]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E90074]/15 border border-[#E90074]/30 text-xs font-bold text-[#E90074] tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#E90074] animate-pulse" />
            <span>RAJASTHAN ROYALS • SUPERR SELECTOR 2.0</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F7FB] leading-tight">
              Beyond Statistics.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E90074] to-[#C9C3DF]">
                Into Pressure.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#929BB2] leading-relaxed max-w-2xl pt-2">
              Discover who consistently rises to the occasion when the contest is on the line. Evaluating <strong className="text-[#F7F7FB]">200,999 historical deliveries</strong> across the IPL and T20 Internationals to distinguish proven match-winners from low-pressure performers.
            </p>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigate('rankings')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white text-xs sm:text-sm font-bold shadow-rr-pink hover:opacity-95 hover:translate-y-[-1px] transition-all"
            >
              <Trophy size={16} />
              Explore Top 10 Leaderboards
            </button>
            <button
              onClick={() => onNavigate('pressure-engine')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#384666] text-xs sm:text-sm font-semibold hover:translate-y-[-1px] transition-all"
            >
              <CricketStumpsIcon size={16} className="text-[#E90074]" />
              Pressure Simulator
            </button>
            <button
              onClick={() => onNavigate('batting')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#121A2D] text-[#929BB2] hover:text-white border border-[#29334C] text-xs sm:text-sm font-semibold transition-all"
            >
              <CricketBatIcon size={15} className="text-[#E90074]" />
              Batting Analytics
            </button>
            <button
              onClick={() => onNavigate('bowling')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#121A2D] text-[#929BB2] hover:text-white border border-[#29334C] text-xs sm:text-sm font-semibold transition-all"
            >
              <BowlingMotionIcon size={15} className="text-[#7545C8]" />
              Bowling Analytics
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE PRESSURE BOARD (5 MANDATORY KPIS) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#E90074]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F7F7FB]">
              THE PRESSURE BOARD
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#929BB2]">Verified Historical Datasets</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            label="Matches Analysed"
            value={metadata.totalMatches.toLocaleString()}
            subtext="IPL & T20I (2022-2026)"
            icon={<PitchStripIcon size={18} className="text-[#E90074]" />}
            accent="pink"
          />
          <StatCard
            label="Deliveries Processed"
            value={metadata.totalDeliveries.toLocaleString()}
            subtext="Ball-by-ball resolution"
            icon={<CricketBallIcon size={18} className="text-[#7545C8]" />}
            accent="purple"
          />
          <StatCard
            label="Players Evaluated"
            value={metadata.totalPlayersEvaluated.toLocaleString()}
            subtext="Comprehensive squads"
            icon={<AllRounderIcon size={18} className="text-sky-400" />}
            accent="blue"
          />
          <StatCard
            label="Pressure Deliveries"
            value={metadata.totalPressureDeliveries.toLocaleString()}
            subtext="High & Extreme leverage"
            icon={<CricketStumpsIcon size={18} className="text-[#E90074]" />}
            accent="pink"
          />
          <StatCard
            label="Competitions"
            value={metadata.totalCompetitions}
            subtext="5 IPL + 136 T20I Series"
            icon={<RoyalCrestEmblem size={20} className="text-amber-400" />}
            accent="emerald"
          />
        </div>
      </div>

      {/* STRATEGIC SCOUTING & INTELLIGENCE SUITE */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#E90074]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F7F7FB]">
              STRATEGIC SCOUTING & INTELLIGENCE SUITE
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#929BB2]">Interactive Decision Engines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: AI Auction War Room */}
          <div
            onClick={() => onNavigate('auction')}
            className="p-4 bg-gradient-to-br from-[#171F35] to-[#121A2D] border border-[#29334C] hover:border-[#E90074] rounded-2xl shadow-xl hover:shadow-[#E90074]/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#E90074]/15 border border-[#E90074]/30 rounded-xl">
                  <AuctionGavelIcon size={20} className="text-[#E90074]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1020] text-pink-300 border border-[#29334C]">
                  ₹100 Cr Purse
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F7F7FB] group-hover:text-[#E90074] transition-colors">
                  AI Auction War Room
                </h3>
                <p className="text-xs text-[#929BB2] mt-1 leading-snug">
                  Real-time IPL auction simulator. Rival franchise AI bidding, purse tracking & Dream RR squad builder.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#29334C] flex items-center justify-between text-xs text-[#E90074] font-semibold">
              <span>Enter War Room</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Hidden Gem Detector */}
          <div
            onClick={() => onNavigate('hidden-gems')}
            className="p-4 bg-gradient-to-br from-[#171F35] to-[#121A2D] border border-[#29334C] hover:border-[#7545C8] rounded-2xl shadow-xl hover:shadow-[#7545C8]/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#7545C8]/15 border border-[#7545C8]/30 rounded-xl">
                  <HiddenGemIcon size={20} className="text-purple-300" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1020] text-purple-300 border border-[#29334C]">
                  0-100 Score
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F7F7FB] group-hover:text-purple-300 transition-colors">
                  Hidden Gem Detector
                </h3>
                <p className="text-xs text-[#929BB2] mt-1 leading-snug">
                  Uncovers high-ceiling, undervalued talents based on baseline delta, volume upside & clutch efficiency.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#29334C] flex items-center justify-between text-xs text-purple-300 font-semibold">
              <span>Scout Hidden Gems</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Batter vs Bowler Intelligence */}
          <div
            onClick={() => onNavigate('head-to-head')}
            className="p-4 bg-gradient-to-br from-[#171F35] to-[#121A2D] border border-[#29334C] hover:border-pink-500 rounded-2xl shadow-xl hover:shadow-pink-500/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-pink-500/15 border border-pink-500/30 rounded-xl">
                  <HeadToHeadIcon size={20} className="text-pink-400" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1020] text-pink-300 border border-[#29334C]">
                  200k Deliveries
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F7F7FB] group-hover:text-pink-400 transition-colors">
                  Batter vs Bowler Matrix
                </h3>
                <p className="text-xs text-[#929BB2] mt-1 leading-snug">
                  Query exact head-to-head match-ups across 200,999 deliveries. Strike rates, dismissals & advantage rating.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#29334C] flex items-center justify-between text-xs text-pink-400 font-semibold">
              <span>Analyze Match-ups</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Young Talent Radar */}
          <div
            onClick={() => onNavigate('young-talent')}
            className="p-4 bg-gradient-to-br from-[#171F35] to-[#121A2D] border border-[#29334C] hover:border-amber-400 rounded-2xl shadow-xl hover:shadow-amber-400/10 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl">
                  <YoungTalentRadarIcon size={20} className="text-amber-400" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0B1020] text-amber-300 border border-[#29334C]">
                  Ages 15–24
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F7F7FB] group-hover:text-amber-300 transition-colors">
                  Young Talent Radar
                </h3>
                <p className="text-xs text-[#929BB2] mt-1 leading-snug">
                  Future Stars discovery. NEXT BIG STAR prospects, uncapped Indian jewels & personal Scout Watchlist.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#29334C] flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Track Future Stars</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. THE ELITE PERFORMERS (FEATURED PINNACLE PERFORMERS) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F7F7FB]">
              THE ELITE PERFORMERS
            </h2>
          </div>
          <span className="text-[11px] text-[#929BB2]">#1 Ranked Pressure Specialists</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Clutch Batter */}
          {topBatter && (
            <div
              onClick={() => onSelectPlayer(topBatter, 'batter')}
              className="rr-glass-card p-5 cursor-pointer hover:border-[#E90074]/60 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="pink">#1 Ranked Pressure Batter</Badge>
                  <span className="text-xs font-mono font-bold text-[#C9C3DF]">
                    {topBatter.country_flag} {topBatter.country}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#E90074] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Profile <ArrowUpRight size={13} />
                </span>
              </div>

              <div className="flex items-center gap-4">
                <PlayerAvatar
                  name={topBatter.name}
                  team={topBatter.team}
                  rank={1}
                  role={topBatter.player_role || "batter"}
                  size="xl"
                  avatarIcon={topBatter.avatar_icon}
                  countryFlag={topBatter.country_flag}
                  countryCode={topBatter.country_code}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#F7F7FB] truncate group-hover:text-[#E90074] transition-colors">
                    {topBatter.name}
                  </h3>
                  <p className="text-xs text-[#929BB2] mt-0.5">
                    {topBatter.team} • {topBatter.player_role || 'Batter'} • BPI Rating:{' '}
                    <span className="font-mono font-bold text-[#E90074] text-sm">
                      {topBatter.rating}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#C9C3DF] line-clamp-1 mt-1">
                    {topBatter.verdict}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#29334C]/60 text-xs">
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Pressure SR</span>
                  <span className="font-mono font-bold text-[#E90074]">{topBatter.pressureSR}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Baseline SR</span>
                  <span className="font-mono font-bold text-[#F7F7FB]">{topBatter.normalSR}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Improvement</span>
                  <span className="font-mono font-bold text-emerald-400">+{topBatter.srDelta}</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Clutch Bowler */}
          {topBowler && (
            <div
              onClick={() => onSelectPlayer(topBowler, 'bowler')}
              className="rr-glass-card p-5 cursor-pointer hover:border-[#7545C8]/60 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">#1 Ranked Pressure Bowler</Badge>
                  <span className="text-xs font-mono font-bold text-[#C9C3DF]">
                    {topBowler.country_flag} {topBowler.country}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#7545C8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Profile <ArrowUpRight size={13} />
                </span>
              </div>

              <div className="flex items-center gap-4">
                <PlayerAvatar
                  name={topBowler.name}
                  team={topBowler.team}
                  rank={1}
                  role={topBowler.player_role || "bowler"}
                  size="xl"
                  avatarIcon={topBowler.avatar_icon}
                  countryFlag={topBowler.country_flag}
                  countryCode={topBowler.country_code}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#F7F7FB] truncate group-hover:text-[#7545C8] transition-colors">
                    {topBowler.name}
                  </h3>
                  <p className="text-xs text-[#929BB2] mt-0.5">
                    {topBowler.team} • {topBowler.player_role || 'Bowler'} • BPI-Bowl Rating:{' '}
                    <span className="font-mono font-bold text-[#7545C8] text-sm">
                      {topBowler.rating}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#C9C3DF] line-clamp-1 mt-1">
                    {topBowler.verdict}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#29334C]/60 text-xs">
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Pressure Econ</span>
                  <span className="font-mono font-bold text-[#7545C8]">{topBowler.pressureEcon}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Baseline Econ</span>
                  <span className="font-mono font-bold text-[#F7F7FB]">{topBowler.normalEcon}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-[10px] text-[#929BB2] block">Suppression</span>
                  <span className="font-mono font-bold text-emerald-400">+{topBowler.econDelta}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3A. TOP 10 RECOMMENDED PLAYERS SHOWCASE (PROVEN LEVERAGE SPECIALISTS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F7F7FB]">
                TOP 10 RECOMMENDED PLAYERS (PROVEN LEVERAGE SPECIALISTS)
              </h2>
            </div>
            <p className="text-xs text-[#929BB2] mt-0.5">
              Verified high-pressure performers ranked by multi-factor BPI ratings across IPL & T20I matches
            </p>
          </div>

          {/* Toggle between Batters and Bowlers */}
          <div className="flex items-center bg-[#121A2D] p-1 rounded-xl border border-[#29334C]">
            <button
              onClick={() => setTop10Tab('batters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                top10Tab === 'batters'
                  ? 'bg-gradient-to-r from-[#E90074] to-[#FF47A3] text-white shadow-sm'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <CricketBatIcon size={13} />
              <span>Top 10 Batters</span>
            </button>
            <button
              onClick={() => setTop10Tab('bowlers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                top10Tab === 'bowlers'
                  ? 'bg-gradient-to-r from-[#7545C8] to-[#9D71E8] text-white shadow-sm'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <BowlingMotionIcon size={13} />
              <span>Top 10 Bowlers</span>
            </button>
          </div>
        </div>

        {/* 10 Player Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
          {top10Tab === 'batters'
            ? top20Data.batters.map((player) => {
                const isItemShortlisted = isShortlisted(player.id || player.player_id);
                const rankColor =
                  player.rank === 1
                    ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
                    : player.rank === 2
                    ? 'border-slate-300/80 bg-slate-400/15 text-slate-200'
                    : player.rank === 3
                    ? 'border-amber-600/80 bg-amber-700/15 text-amber-400'
                    : 'border-[#29334C] bg-[#0F1626] text-[#929BB2]';

                return (
                  <div
                    key={player.id}
                    className="rr-glass-card p-4 flex flex-col justify-between hover:border-[#E90074]/60 transition-all group relative overflow-hidden"
                  >
                    <div>
                      {/* Rank & Shortlist Row */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${rankColor}`}>
                          #{player.rank} {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : ''}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{player.country_flag}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShortlist(player.id, 'Top10Showcase', 'high');
                            }}
                            className="p-1 rounded-lg text-[#929BB2] hover:text-amber-400 hover:bg-[#121A2D] transition-colors"
                            title="Shortlist Player"
                          >
                            <Bookmark size={13} className={isItemShortlisted ? 'fill-amber-400 text-amber-400' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Player Identity */}
                      <div
                        onClick={() => onSelectPlayer(player as unknown as Batter, 'batter')}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <PlayerAvatar
                          name={player.name}
                          team={player.team}
                          rank={player.rank}
                          role={player.player_role || 'Batter'}
                          size="md"
                          avatarIcon={player.avatar_icon}
                          countryFlag={player.country_flag}
                          countryCode={player.country_code}
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-[#E90074] transition-colors">
                            {player.name}
                          </h4>
                          <p className="text-[11px] text-[#929BB2] truncate">{player.team}</p>
                          <span className="text-[10px] text-pink-400 font-mono font-bold block mt-0.5">
                            {player.rating} BPI
                          </span>
                        </div>
                      </div>

                      {/* Key Stats Pill */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5 text-center text-xs pt-2.5 border-t border-[#29334C]/60">
                        <div className="p-1.5 rounded-lg bg-[#121A2D]">
                          <span className="text-[9px] text-[#929BB2] block">Pressure SR</span>
                          <span className="font-mono font-bold text-[#E90074] text-[11px]">{player.pressureSR}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#121A2D]">
                          <span className="text-[9px] text-[#929BB2] block">SR Delta</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">+{player.srDelta}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Profile Action */}
                    <button
                      onClick={() => onSelectPlayer(player as unknown as Batter, 'batter')}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#121A2D] hover:bg-[#E90074] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#E90074] text-[11px] font-bold transition-all flex items-center justify-center gap-1 group-hover:bg-[#E90074] group-hover:text-white"
                    >
                      <span>Full Profile</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                );
              })
            : top20Data.bowlers.map((player) => {
                const isItemShortlisted = isShortlisted(player.id || player.player_id);
                const rankColor =
                  player.rank === 1
                    ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
                    : player.rank === 2
                    ? 'border-slate-300/80 bg-slate-400/15 text-slate-200'
                    : player.rank === 3
                    ? 'border-amber-600/80 bg-amber-700/15 text-amber-400'
                    : 'border-[#29334C] bg-[#0F1626] text-[#929BB2]';

                return (
                  <div
                    key={player.id}
                    className="rr-glass-card p-4 flex flex-col justify-between hover:border-[#7545C8]/60 transition-all group relative overflow-hidden"
                  >
                    <div>
                      {/* Rank & Shortlist Row */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${rankColor}`}>
                          #{player.rank} {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : ''}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{player.country_flag}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShortlist(player.id, 'Top10Showcase', 'high');
                            }}
                            className="p-1 rounded-lg text-[#929BB2] hover:text-amber-400 hover:bg-[#121A2D] transition-colors"
                            title="Shortlist Player"
                          >
                            <Bookmark size={13} className={isItemShortlisted ? 'fill-amber-400 text-amber-400' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Player Identity */}
                      <div
                        onClick={() => onSelectPlayer(player as unknown as Bowler, 'bowler')}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <PlayerAvatar
                          name={player.name}
                          team={player.team}
                          rank={player.rank}
                          role={player.player_role || 'Bowler'}
                          size="md"
                          avatarIcon={player.avatar_icon}
                          countryFlag={player.country_flag}
                          countryCode={player.country_code}
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-[#7545C8] transition-colors">
                            {player.name}
                          </h4>
                          <p className="text-[11px] text-[#929BB2] truncate">{player.team}</p>
                          <span className="text-[10px] text-purple-400 font-mono font-bold block mt-0.5">
                            {player.rating} BPI-Bowl
                          </span>
                        </div>
                      </div>

                      {/* Key Stats Pill */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5 text-center text-xs pt-2.5 border-t border-[#29334C]/60">
                        <div className="p-1.5 rounded-lg bg-[#121A2D]">
                          <span className="text-[9px] text-[#929BB2] block">Pressure Econ</span>
                          <span className="font-mono font-bold text-[#7545C8] text-[11px]">{player.pressureEcon}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#121A2D]">
                          <span className="text-[9px] text-[#929BB2] block">Suppression</span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">+{player.econDelta}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Profile Action */}
                    <button
                      onClick={() => onSelectPlayer(player as unknown as Bowler, 'bowler')}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#121A2D] hover:bg-[#7545C8] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#7545C8] text-[11px] font-bold transition-all flex items-center justify-center gap-1 group-hover:bg-[#7545C8] group-hover:text-white"
                    >
                      <span>Full Profile</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                );
              })}
        </div>
      </div>

      {/* 4. WHEN THE GAME GETS TOUGH: PRESSURE DISTRIBUTION & PHASES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component B: Pressure Distribution */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Pressure Delivery Distribution</h3>
              <p className="text-xs text-[#929BB2]">Classification across all 200,999 balls</p>
            </div>
            <Badge variant="pink">Context Engine</Badge>
          </div>

          <div className="h-60 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pressurePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pressurePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                  formatter={(value: any) => [value.toLocaleString() + ' balls', 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#29334C]/60 text-center">
            {pressurePieData.map((item) => (
              <div key={item.name} className="p-2 rounded-lg bg-[#121A2D]">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-[#929BB2] truncate">{item.name.split(' ')[0]}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#F7F7FB]">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase-wise Pressure Breakdown */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Pressure Concentration by Phase</h3>
              <p className="text-xs text-[#929BB2]">Powerplay vs Middle vs Death Overs</p>
            </div>
            <Badge variant="purple">Phase Frequency</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" vertical={false} />
                <XAxis dataKey="phase" stroke="#929BB2" fontSize={11} tickLine={false} />
                <YAxis stroke="#929BB2" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
                <Bar
                  dataKey="pressurePct"
                  name="Pressure Balls %"
                  fill="#E90074"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-[#929BB2] mt-3 pt-3 border-t border-[#29334C]/60 italic text-center">
            Death overs exhibit the highest concentration of pressure (32.8%), while early top-order collapses register critical survival pressure in the powerplay.
          </p>
        </div>
      </div>

      {/* 5. COMPETITION COMPARISON & SEASON TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component C: Competition Analysis (IPL vs T20I) */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Competition Benchmark: IPL vs T20I</h3>
              <p className="text-xs text-[#929BB2]">Scoring rates & pressure volatility</p>
            </div>
            <Badge variant="blue">Format Split</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#E90074]">Indian Premier League</span>
                <span className="text-[10px] font-mono text-[#929BB2]">
                  {metadata.competitionComparison.IPL.matches} Matches
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-[#F7F7FB]">
                {metadata.competitionComparison.IPL.avgRunRate}{' '}
                <span className="text-xs font-normal text-[#929BB2]">RPO</span>
              </div>
              <p className="text-[10px] text-[#929BB2] mt-1">
                Pressure Deliveries:{' '}
                <span className="font-mono text-[#E90074]">
                  {metadata.competitionComparison.IPL.pressureBalls.toLocaleString()} ({metadata.competitionComparison.IPL.pressurePct}%)
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sky-400">T20 Internationals</span>
                <span className="text-[10px] font-mono text-[#929BB2]">
                  {metadata.competitionComparison.T20I.matches} Matches
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-[#F7F7FB]">
                {metadata.competitionComparison.T20I.avgRunRate}{' '}
                <span className="text-xs font-normal text-[#929BB2]">RPO</span>
              </div>
              <p className="text-[10px] text-[#929BB2] mt-1">
                Pressure Deliveries:{' '}
                <span className="font-mono text-sky-400">
                  {metadata.competitionComparison.T20I.pressureBalls.toLocaleString()} ({metadata.competitionComparison.T20I.pressurePct}%)
                </span>
              </p>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" vertical={false} />
                <XAxis dataKey="metric" stroke="#929BB2" fontSize={11} tickLine={false} />
                <YAxis stroke="#929BB2" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="IPL" fill="#E90074" radius={[4, 4, 0, 0]} />
                <Bar dataKey="T20I" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component D: Season Trends (2022 to 2026) */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Season Trends (2022–2026)</h3>
              <p className="text-xs text-[#929BB2]">Run rate evolution and pressure delivery ratio</p>
            </div>
            <Badge variant="green">Multi-Year Evolution</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metadata.seasonTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" vertical={false} />
                <XAxis dataKey="season" stroke="#929BB2" fontSize={11} tickLine={false} />
                <YAxis stroke="#929BB2" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="runRate"
                  name="Scoring Rate (RPO)"
                  stroke="#E90074"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#E90074' }}
                />
                <Line
                  type="monotone"
                  dataKey="pressurePct"
                  name="Pressure Balls %"
                  stroke="#7545C8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7545C8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
