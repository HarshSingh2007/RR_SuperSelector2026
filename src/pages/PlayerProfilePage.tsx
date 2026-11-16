import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Target,
  Sparkles,
  ShieldCheck,
  Activity,
  Calendar,
  Layers,
  ChevronRight,
  GitCompare,
  Award,
  BarChart3,
  Bookmark,
  Dna,
  Swords,
  Gavel,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronDown,
  Info,
  TrendingUp,
  PieChart as PieChartIcon,
  Compass,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { getTeamTheme } from '../utils/teamColors';
import { downloadScoutingReport } from '../services/playerDataService';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  AllRounderIcon,
  WicketkeeperIcon,
  BowlingMotionIcon,
} from '../components/CricketIcons';
import type { PitchZoneData, ShotSectorData, MatchHistoryItem, PlayerProfileData } from '../types';

interface PlayerProfilePageProps {
  playerId?: string | null;
  onBack?: () => void;
  onSelectPlayer?: (id: string) => void;
}

export const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({
  playerId,
  onBack,
  onSelectPlayer,
}) => {
  const {
    selectedPlayerProfileId,
    previousTab,
    navigateTo,
    isShortlisted,
    toggleShortlist,
    sendToAuctionBlock,
    addToCompare,
    openMatchupLab,
  } = useEcosystem();

  const activeId = playerId || selectedPlayerProfileId || '7897';
  const profile = playerDataService.getPlayerProfile(activeId);
  const allSummaries = playerDataService.getAllPlayerSummaries();

  // Sub-tabs in profile
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'batting' | 'bowling' | 'pitch-map' | 'shot-map' | 'graphs' | 'matches' | 'compare'>('overview');

  // Pitch map state
  const [pitchViewMode, setPitchViewMode] = useState<'heatmap' | 'markers'>('heatmap');
  const [pitchFilterOutcome, setPitchFilterOutcome] = useState<'all' | 'wicket' | 'dot' | 'boundary'>('all');
  const [pitchFilterSeason, setPitchFilterSeason] = useState<string>('all');
  const [pitchFilterInnings, setPitchFilterInnings] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<PitchZoneData | null>(null);

  // Shot map state
  const [selectedSector, setSelectedSector] = useState<ShotSectorData | null>(null);

  // Match history filters
  const [matchSeasonFilter, setMatchSeasonFilter] = useState<string>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Comparison selector state
  const [compareTargetId, setCompareTargetId] = useState<string>('4926');
  const compareTargetProfile = playerDataService.getPlayerProfile(compareTargetId);

  // Player search switcher
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return allSummaries.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return allSummaries.filter(s => s.name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q)).slice(0, 20);
  }, [allSummaries, searchQuery]);

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[#171F35] rounded-2xl border border-[#29334C]">
        <AlertTriangle className="w-12 h-12 text-[#E90074] mb-4" />
        <h2 className="text-2xl font-bold text-[#F7F7FB] mb-2">Player Profile Not Found</h2>
        <p className="text-[#929BB2] max-w-md mb-6">
          The requested player data could not be located in the current database.
        </p>
        <button
          onClick={() => (onBack ? onBack() : navigateTo(previousTab || 'overview'))}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-semibold flex items-center gap-2 hover:opacity-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  const theme = getTeamTheme(profile.team);
  const shortlisted = isShortlisted(profile.id) || isShortlisted(profile.name);
  const isAllRounder = profile.primaryRole === 'All-Rounder';
  const isBowler = profile.primaryRole === 'Bowler';
  const isBatter = profile.primaryRole === 'Batter' || profile.primaryRole === 'Wicketkeeper';

  // Filtered pitch deliveries
  const filteredDeliveries = useMemo(() => {
    if (!profile.pitchMap?.deliveryLogSample) return [];
    return profile.pitchMap.deliveryLogSample.filter(d => {
      if (pitchFilterOutcome === 'wicket' && d.outcome !== 'wicket') return false;
      if (pitchFilterOutcome === 'dot' && d.outcome !== 'dot') return false;
      if (pitchFilterOutcome === 'boundary' && d.outcome !== 'boundary' && d.outcome !== 'six') return false;
      if (pitchFilterSeason !== 'all' && d.season !== pitchFilterSeason) return false;
      if (pitchFilterInnings !== 'all' && String(d.inn) !== pitchFilterInnings) return false;
      return true;
    });
  }, [profile.pitchMap?.deliveryLogSample, pitchFilterOutcome, pitchFilterSeason, pitchFilterInnings]);

  // Filtered match history
  const filteredMatches = useMemo(() => {
    if (!profile.matchHistory) return [];
    return profile.matchHistory.filter(m => {
      if (matchSeasonFilter !== 'all' && m.season !== matchSeasonFilter) return false;
      return true;
    });
  }, [profile.matchHistory, matchSeasonFilter]);

  // Unique seasons in match history
  const availableSeasons = useMemo(() => {
    const s = new Set<string>();
    profile.matchHistory?.forEach(m => { if (m.season) s.add(m.season); });
    return Array.from(s).sort();
  }, [profile.matchHistory]);

  // Runs Distribution for Donut Chart
  const battingRunsDistribution = useMemo(() => {
    const foursRuns = (profile.batting.fours || 0) * 4;
    const sixesRuns = (profile.batting.sixes || 0) * 6;
    const boundaryRuns = foursRuns + sixesRuns;
    const nonBoundaryRuns = Math.max(0, (profile.batting.runs || 0) - boundaryRuns);
    const singlesRuns = Math.round(nonBoundaryRuns * 0.84);
    const twosThreesRuns = Math.max(0, nonBoundaryRuns - singlesRuns);

    return [
      { name: 'Singles (1s)', runs: singlesRuns, color: '#38BDF8', pct: profile.batting.runs > 0 ? ((singlesRuns / profile.batting.runs) * 100).toFixed(1) : '0' },
      { name: 'Twos & Threes', runs: twosThreesRuns, color: '#7545C8', pct: profile.batting.runs > 0 ? ((twosThreesRuns / profile.batting.runs) * 100).toFixed(1) : '0' },
      { name: 'Fours (4s)', runs: foursRuns, color: '#E90074', pct: profile.batting.runs > 0 ? ((foursRuns / profile.batting.runs) * 100).toFixed(1) : '0' },
      { name: 'Sixes (6s)', runs: sixesRuns, color: '#F59E0B', pct: profile.batting.runs > 0 ? ((sixesRuns / profile.batting.runs) * 100).toFixed(1) : '0' },
    ];
  }, [profile.batting]);

  // Delivery Mix for Donut Chart
  const bowlingDeliveryDistribution = useMemo(() => {
    const totalBalls = profile.bowling.totalBalls || 0;
    const dotBalls = Math.round((totalBalls * (profile.bowling.dotPct || 0)) / 100);
    const boundaryBalls = Math.round((totalBalls * (profile.bowling.boundaryPct || 0)) / 100);
    const wickets = profile.bowling.wickets || 0;
    const scoringBalls = Math.max(0, totalBalls - dotBalls - boundaryBalls);

    return [
      { name: 'Dot Balls', balls: dotBalls, color: '#34D399', pct: totalBalls > 0 ? ((dotBalls / totalBalls) * 100).toFixed(1) : '0' },
      { name: 'Singles / Twos', balls: scoringBalls, color: '#818CF8', pct: totalBalls > 0 ? ((scoringBalls / totalBalls) * 100).toFixed(1) : '0' },
      { name: 'Boundaries (4s/6s)', balls: boundaryBalls, color: '#E90074', pct: totalBalls > 0 ? ((boundaryBalls / totalBalls) * 100).toFixed(1) : '0' },
      { name: 'Wickets', balls: wickets, color: '#EF4444', pct: totalBalls > 0 ? ((wickets / totalBalls) * 100).toFixed(1) : '0' },
    ];
  }, [profile.bowling]);

  const handleDownloadReport = () => {
    const legacy = playerDataService.resolveInspectable(profile.id);
    if (legacy) {
      downloadScoutingReport(legacy.player, legacy.type);
    }
  };

  const handleSwitchPlayer = (id: string) => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    if (onSelectPlayer) {
      onSelectPlayer(id);
    } else {
      navigateTo('player-profile');
    }
  };

  // Radar comparison data
  const comparisonRadarData = useMemo(() => {
    if (!compareTargetProfile) return [];
    return [
      {
        axis: 'Batting Avg',
        A: Math.min(100, (profile.batting.avg / 50) * 100),
        B: Math.min(100, (compareTargetProfile.batting.avg / 50) * 100),
        valA: profile.batting.avg,
        valB: compareTargetProfile.batting.avg,
      },
      {
        axis: 'Strike Rate',
        A: Math.min(100, ((profile.batting.sr - 80) / 100) * 100),
        B: Math.min(100, ((compareTargetProfile.batting.sr - 80) / 100) * 100),
        valA: profile.batting.sr,
        valB: compareTargetProfile.batting.sr,
      },
      {
        axis: 'Economy',
        A: Math.max(0, 100 - (profile.bowling.economy - 5) * 15),
        B: Math.max(0, 100 - (compareTargetProfile.bowling.economy - 5) * 15),
        valA: profile.bowling.economy,
        valB: compareTargetProfile.bowling.economy,
      },
      {
        axis: 'Wickets',
        A: Math.min(100, (profile.bowling.wickets / 30) * 100),
        B: Math.min(100, (compareTargetProfile.bowling.wickets / 30) * 100),
        valA: profile.bowling.wickets,
        valB: compareTargetProfile.bowling.wickets,
      },
      {
        axis: 'Pressure BPI',
        A: profile.rankings.pressureIndex,
        B: compareTargetProfile.rankings.pressureIndex,
        valA: profile.rankings.pressureIndex,
        valB: compareTargetProfile.rankings.pressureIndex,
      },
      {
        axis: 'Consistency',
        A: profile.rankings.consistencyScore,
        B: compareTargetProfile.rankings.consistencyScore,
        valA: profile.rankings.consistencyScore,
        valB: compareTargetProfile.rankings.consistencyScore,
      },
    ];
  }, [profile, compareTargetProfile]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Navigation & Quick Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#171F35] p-4 rounded-2xl border border-[#29334C] shadow-lg">
        <button
          onClick={() => (onBack ? onBack() : navigateTo(previousTab || 'overview'))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1626] border border-[#29334C] text-[#C9C3DF] hover:text-white hover:border-[#E90074] transition-all text-sm font-semibold group shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to {previousTab ? previousTab.toUpperCase().replace('-', ' ') : 'DASHBOARD'}</span>
        </button>

        {/* Quick Player Search Combobox */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929BB2]" />
            <input
              type="text"
              placeholder="Jump to any player (e.g. Bumrah, Klaasen, Tilak)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchDropdownOpen(true);
              }}
              onFocus={() => setSearchDropdownOpen(true)}
              className="w-full bg-[#0F1626] border border-[#29334C] rounded-xl pl-10 pr-9 py-2 text-sm text-[#F7F7FB] placeholder-[#929BB2] focus:outline-none focus:border-[#E90074] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#929BB2] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {searchDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#121A2D] border border-[#29334C] rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-[#29334C]/50">
              {filteredSummaries.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSwitchPlayer(s.id)}
                  className="p-3 hover:bg-[#1E2744] cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.countryFlag}</span>
                    <div>
                      <span className="font-bold text-white block">{s.name}</span>
                      <span className="text-[11px] text-[#929BB2]">{s.team} · {s.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#E90074] font-mono font-bold block">{s.overallScore} BPI</span>
                    <span className="text-[10px] text-[#929BB2]">Rank #{s.overallRank}</span>
                  </div>
                </div>
              ))}
              {filteredSummaries.length === 0 && (
                <div className="p-4 text-center text-xs text-[#929BB2]">No matching player found.</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleShortlist(profile.id, 'PlayerProfile', 'high')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              shortlisted
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-[#0F1626] border-[#29334C] text-[#C9C3DF] hover:border-amber-400/60'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${shortlisted ? 'fill-amber-400' : ''}`} />
            <span>{shortlisted ? 'Shortlisted' : 'Shortlist'}</span>
          </button>

          <button
            onClick={() => sendToAuctionBlock(profile.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0F1626] border border-[#29334C] text-[#C9C3DF] hover:border-[#E90074] hover:text-white transition-all"
          >
            <Gavel className="w-3.5 h-3.5 text-[#E90074]" />
            <span>Auction</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white hover:opacity-95 shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Scouting Report</span>
          </button>
        </div>
      </div>

      {/* Hero Player Identity Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#171F35] via-[#151D33] to-[#0E1528] border border-[#29334C] p-6 lg:p-8 overflow-hidden shadow-2xl">
        {/* Ambient Glow */}
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.primary }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <PlayerAvatar
              name={profile.name}
              team={profile.team}
              rank={profile.rankings.overallRank}
              role={profile.primaryRole}
              size="2xl"
              avatarIcon={profile.avatarIcon}
              countryFlag={profile.countryFlag}
              countryCode={profile.countryCode}
            />

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-2xl">{profile.countryFlag}</span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#929BB2]">
                  {profile.country} · {profile.team}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#0F1626] border border-[#29334C] text-[#E90074]">
                  {profile.primaryRole}
                </span>
                {profile.rankings.percentile >= 90 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    TOP {100 - Math.round(profile.rankings.percentile)}% ELITE
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F7F7FB] tracking-tight mb-2">
                {profile.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#C9C3DF]">
                <div className="flex items-center gap-1.5">
                  <CricketBatIcon size={14} className="text-pink-400" />
                  <span>Bat: <strong className="text-white">{profile.battingStyle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BowlingMotionIcon size={14} className="text-indigo-400" />
                  <span>Bowl: <strong className="text-white">{profile.bowlingStyle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>Span: <strong className="text-white">{profile.careerSpan}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={14} className="text-sky-400" />
                  <span>Experience: <strong className="text-white">{profile.totalMatches} Matches</strong> ({profile.seasonsCount} Seasons)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Composite Rating Pill */}
          <div className="flex items-center gap-3 bg-[#0F1626]/80 backdrop-blur-md p-4 rounded-2xl border border-[#29334C] shadow-inner self-stretch lg:self-auto justify-between lg:justify-start">
            <div className="text-center px-3 border-r border-[#29334C]">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Overall Rank</span>
              <span className="text-2xl font-black text-amber-400 font-mono">#{profile.rankings.overallRank}</span>
              <span className="text-[10px] text-[#929BB2] block">in Universe</span>
            </div>

            <div className="text-center px-3 border-r border-[#29334C]">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Pressure BPI</span>
              <span className="text-2xl font-black text-[#E90074] font-mono">{profile.rankings.pressureIndex}</span>
              <span className="text-[10px] text-emerald-400 block">{profile.rankings.percentile}th %tile</span>
            </div>

            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Consistency</span>
              <span className="text-2xl font-black text-[#7545C8] font-mono">{profile.rankings.consistencyScore}</span>
              <span className="text-[10px] text-[#929BB2] block">/ 100 Index</span>
            </div>
          </div>
        </div>

        {/* Sticky Profile Navigation Tabs */}
        <div className="sticky top-2 z-30 bg-[#171F35]/95 backdrop-blur-md flex flex-wrap items-center gap-2 py-3 px-4 rounded-2xl border border-[#29334C] shadow-xl text-xs font-semibold mt-6">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('batting')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'batting'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <CricketBatIcon size={14} className="text-pink-400" />
            <span>Batting Analytics</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bowling')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'bowling'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <BowlingMotionIcon size={14} className="text-indigo-400" />
            <span>Bowling Analytics</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pitch-map')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pitch-map'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span>22-Yard Pitch Map</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shot-map')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'shot-map'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wagon Wheel</span>
          </button>

          <button
            onClick={() => setActiveSubTab('graphs')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'graphs'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Performance Graphs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('matches')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'matches'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Match Log ({profile.matchHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('compare')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'compare'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'text-[#929BB2] hover:text-white hover:bg-[#1E2744]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-pink-400" />
            <span>DNA Compare</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE SUMMARY CARDS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Batting Summary Cards */}
          {(isBatter || isAllRounder || profile.batting.runs > 0) && (
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-500/20 text-[#E90074] border border-pink-500/30">
                    <CricketBatIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Career Batting Intelligence</h3>
                    <p className="text-xs text-[#929BB2]">
                      Verified ball-by-ball record across {profile.batting.innings} innings ({profile.batting.balls} balls faced)
                    </p>
                  </div>
                </div>

                {profile.rankings.batterRank && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0F1626] border border-[#29334C] text-pink-400">
                    Batter Rank #{profile.rankings.batterRank}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Total Runs</span>
                  <span className="text-2xl font-black text-white font-mono">{profile.batting.runs.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">{profile.batting.fifties}× 50s · {profile.batting.hundreds}× 100s</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Batting Average</span>
                  <span className="text-2xl font-black text-[#E90074] font-mono">{profile.batting.avg}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.batting.notOuts} Not Outs</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Strike Rate</span>
                  <span className="text-2xl font-black text-sky-400 font-mono">{profile.batting.sr}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">Death SR: <strong className="text-pink-400">{profile.batting.deathSR}</strong></span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Highest Score</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {profile.batting.highestScore}{profile.batting.highestScoreNotOut ? '*' : ''}
                  </span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.batting.highestScoreNotOut ? 'Unbeaten Innings' : 'Dismissed'}</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Boundaries</span>
                  <span className="text-2xl font-black text-purple-400 font-mono">{profile.batting.fours + profile.batting.sixes}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.batting.fours}× 4s · {profile.batting.sixes}× 6s ({profile.batting.boundaryPct}%)</span>
                </div>
              </div>

              {/* Sub-splits for batting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#29334C]/60 text-xs">
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">Powerplay (1-6) SR:</span>
                  <span className="font-mono font-bold text-white">{profile.batting.powerplaySR}</span>
                </div>
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">Middle (7-15) SR:</span>
                  <span className="font-mono font-bold text-white">{profile.batting.middleSR}</span>
                </div>
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">Pace vs Spin SR:</span>
                  <span className="font-mono font-bold text-white">{profile.batting.vsPaceSR} <span className="text-[#929BB2]">vs</span> {profile.batting.vsSpinSR}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bowling Summary Cards */}
          {(isBowler || isAllRounder || profile.bowling.totalBalls > 0) && (
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <BowlingMotionIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Career Bowling Intelligence</h3>
                    <p className="text-xs text-[#929BB2]">
                      Verified ball-by-ball record across {profile.bowling.innings} spells ({profile.bowling.overs} overs bowled)
                    </p>
                  </div>
                </div>

                {profile.rankings.bowlerRank && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0F1626] border border-[#29334C] text-indigo-400">
                    Bowler Rank #{profile.rankings.bowlerRank}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Total Wickets</span>
                  <span className="text-2xl font-black text-white font-mono">{profile.bowling.wickets}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">BBI: <strong className="text-white">{profile.bowling.bestBowling}</strong></span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Economy Rate</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">{profile.bowling.economy}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.bowling.runsConceded} Runs Conceded</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Bowling Average</span>
                  <span className="text-2xl font-black text-sky-400 font-mono">{profile.bowling.avg}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">SR: <strong className="text-white">{profile.bowling.sr}</strong> balls/wkt</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Dot-Ball Percentage</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{profile.bowling.dotPct}%</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.bowling.maidens} Maiden Overs</span>
                </div>

                <div className="bg-[#0F1626] p-3.5 rounded-2xl border border-[#29334C]">
                  <span className="text-[11px] font-semibold text-[#929BB2] block">Volume Bowled</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{profile.bowling.overs}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">{profile.bowling.totalBalls} Legal Deliveries</span>
                </div>
              </div>

              {/* Sub-splits for bowling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#29334C]/60 text-xs">
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">Powerplay (1-6) Econ:</span>
                  <span className="font-mono font-bold text-white">{profile.bowling.powerplayEcon}</span>
                </div>
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">Death (16-20) Econ:</span>
                  <span className="font-mono font-bold text-white">{profile.bowling.deathEcon}</span>
                </div>
                <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]/50 flex justify-between items-center">
                  <span className="text-[#929BB2]">vs RHB vs LHB Econ:</span>
                  <span className="font-mono font-bold text-white">{profile.bowling.vsRHBEcon} <span className="text-[#929BB2]">vs</span> {profile.bowling.vsLHBEcon}</span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Strengths & Weaknesses Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Verified Statistical Strengths</h3>
              </div>

              <div className="space-y-3">
                {profile.insights?.strengths?.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#0F1626] border border-[#29334C] flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-300">{s.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400">
                          {s.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#929BB2] leading-relaxed">{s.desc}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#121A2D] text-xs font-mono font-bold text-white border border-[#29334C] shrink-0">
                      {s.metric}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Development Areas & Tactical Risks</h3>
              </div>

              <div className="space-y-3">
                {profile.insights?.weaknesses?.map((w, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#0F1626] border border-[#29334C] flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-300">{w.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-400">
                          {w.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#929BB2] leading-relaxed">{w.desc}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#121A2D] text-xs font-mono font-bold text-[#C9C3DF] border border-[#29334C] shrink-0">
                      {w.metric}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEDICATED BATTING ANALYTICS & INTERACTIVE DONUT CHARTS */}
      {activeSubTab === 'batting' && (
        <div className="space-y-6">
          {/* Batting Hero Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Total Runs</span>
              <span className="text-2xl font-mono font-black text-pink-400">{profile.batting.runs.toLocaleString()}</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.batting.innings} Innings ({profile.batting.balls} Balls)</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Batting Average</span>
              <span className="text-2xl font-mono font-black text-white">{profile.batting.avg}</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.batting.notOuts} Not Outs</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Strike Rate</span>
              <span className="text-2xl font-mono font-black text-[#E90074]">{profile.batting.sr}</span>
              <span className="text-[10px] text-emerald-400 block">{profile.batting.dotPct}% Dot Balls</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Highest Score</span>
              <span className="text-2xl font-mono font-black text-amber-400">
                {profile.batting.highestScore}{profile.batting.highestScoreNotOut ? '*' : ''}
              </span>
              <span className="text-[10px] text-[#929BB2] block">Career Best</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">100s / 50s</span>
              <span className="text-2xl font-mono font-black text-purple-400">
                {profile.batting.hundreds} / {profile.batting.fifties}
              </span>
              <span className="text-[10px] text-[#929BB2] block">Milestones</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Fours / Sixes</span>
              <span className="text-2xl font-mono font-black text-sky-400">
                {profile.batting.fours} / {profile.batting.sixes}
              </span>
              <span className="text-[10px] text-pink-400 block">{profile.batting.boundaryPct}% Boundary Rate</span>
            </div>
          </div>

          {/* Interactive Donut Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart 1: Runs Scoring Breakdown */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#F7F7FB] flex items-center gap-2">
                      <CricketBatIcon size={16} className="text-[#E90074]" />
                      Interactive Runs Scoring Distribution
                    </h3>
                    <p className="text-xs text-[#929BB2]">Proportion of total career runs scored by delivery outcome</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#E90074]/15 border border-[#E90074]/30 text-[#E90074]">
                    Runs Breakdown
                  </span>
                </div>

                <div className="h-64 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={battingRunsDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="runs"
                      >
                        {battingRunsDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121A2D',
                          borderColor: '#29334C',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#F7F7FB',
                        }}
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString()} runs (${battingRunsDistribution.find(d => d.name === name)?.pct || 0}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#929BB2]">TOTAL RUNS</span>
                    <span className="text-2xl font-mono font-black text-white">{profile.batting.runs.toLocaleString()}</span>
                    <span className="text-[10px] text-pink-400 font-bold">{profile.batting.boundaryPct}% Boundaries</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[#29334C]/60 text-center">
                {battingRunsDistribution.map((item) => (
                  <div key={item.name} className="p-2 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-[#929BB2] truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white block">
                      {item.runs.toLocaleString()} <span className="text-[10px] text-[#929BB2]">({item.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Scoring & Splits */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#F7F7FB] flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" />
                      Innings Phase Strike Rates & Splits
                    </h3>
                    <p className="text-xs text-[#929BB2]">Scoring acceleration across Powerplay, Middle & Death overs</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    Phase Analysis
                  </span>
                </div>

                <div className="space-y-4 py-2">
                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Powerplay Overs (1–6)</span>
                      <span className="font-mono font-bold text-[#E90074] text-sm">{profile.batting.powerplaySR} SR</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-[#E90074] h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.batting.powerplaySR / 220) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Middle Overs (7–15)</span>
                      <span className="font-mono font-bold text-purple-400 text-sm">{profile.batting.middleSR} SR</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-[#7545C8] h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.batting.middleSR / 220) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Death Overs (16–20)</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">{profile.batting.deathSR} SR</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.batting.deathSR / 250) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowling Type Matchups */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#29334C]/60 text-center">
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                  <span className="text-[10px] text-[#929BB2] block">vs Pace Attack</span>
                  <span className="text-base font-mono font-bold text-sky-400">{profile.batting.vsPaceSR} SR</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                  <span className="text-[10px] text-[#929BB2] block">vs Spin Attack</span>
                  <span className="text-base font-mono font-bold text-emerald-400">{profile.batting.vsSpinSR} SR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEDICATED BOWLING ANALYTICS & INTERACTIVE DONUT CHARTS */}
      {activeSubTab === 'bowling' && (
        <div className="space-y-6">
          {/* Bowling Hero Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Wickets Taken</span>
              <span className="text-2xl font-mono font-black text-indigo-400">{profile.bowling.wickets}</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.bowling.innings} Innings ({profile.bowling.overs} Overs)</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Economy Rate</span>
              <span className="text-2xl font-mono font-black text-emerald-400">{profile.bowling.economy}</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.bowling.dotPct}% Dot Balls</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Bowling Average</span>
              <span className="text-2xl font-mono font-black text-white">{profile.bowling.avg}</span>
              <span className="text-[10px] text-[#929BB2] block">Runs / Wicket</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Strike Rate</span>
              <span className="text-2xl font-mono font-black text-amber-400">{profile.bowling.sr}</span>
              <span className="text-[10px] text-[#929BB2] block">Balls / Wicket</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Best Bowling</span>
              <span className="text-2xl font-mono font-black text-purple-400">{profile.bowling.bestBowling}</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.bowling.maidens} Maidens</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#171F35] border border-[#29334C] text-center">
              <span className="text-[10px] uppercase font-bold text-[#929BB2] tracking-wider block">Boundary Conceded</span>
              <span className="text-2xl font-mono font-black text-pink-400">{profile.bowling.boundaryPct}%</span>
              <span className="text-[10px] text-[#929BB2] block">{profile.bowling.runsConceded} Runs Total</span>
            </div>
          </div>

          {/* Interactive Donut Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart 1: Delivery Outcome Breakdown */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#F7F7FB] flex items-center gap-2">
                      <BowlingMotionIcon size={16} className="text-indigo-400" />
                      Delivery Outcome Distribution (Dot Balls vs Scoring)
                    </h3>
                    <p className="text-xs text-[#929BB2]">Classification across all {profile.bowling.totalBalls} bowled deliveries</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    Delivery Mix
                  </span>
                </div>

                <div className="h-64 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bowlingDeliveryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="balls"
                      >
                        {bowlingDeliveryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121A2D',
                          borderColor: '#29334C',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#F7F7FB',
                        }}
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString()} deliveries (${bowlingDeliveryDistribution.find(d => d.name === name)?.pct || 0}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#929BB2]">TOTAL BALLS</span>
                    <span className="text-2xl font-mono font-black text-white">{profile.bowling.totalBalls.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{profile.bowling.dotPct}% Dots</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[#29334C]/60 text-center">
                {bowlingDeliveryDistribution.map((item) => (
                  <div key={item.name} className="p-2 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-[#929BB2] truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white block">
                      {item.balls.toLocaleString()} <span className="text-[10px] text-[#929BB2]">({item.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Economy Breakdown */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#F7F7FB] flex items-center gap-2">
                      <Activity size={16} className="text-emerald-400" />
                      Overs Phase Economy & Containment
                    </h3>
                    <p className="text-xs text-[#929BB2]">Economy rate containment in Powerplay, Middle & Death phases</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    Economy Splits
                  </span>
                </div>

                <div className="space-y-4 py-2">
                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Powerplay Economy (Overs 1–6)</span>
                      <span className="font-mono font-bold text-sky-400 text-sm">{profile.bowling.powerplayEcon} RPO</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.bowling.powerplayEcon / 12) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Middle Overs Economy (Overs 7–15)</span>
                      <span className="font-mono font-bold text-purple-400 text-sm">{profile.bowling.middleEcon} RPO</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.bowling.middleEcon / 12) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#121A2D] border border-[#29334C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-[#F7F7FB]">Death Overs Economy (Overs 16–20)</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">{profile.bowling.deathEcon} RPO</span>
                    </div>
                    <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (profile.bowling.deathEcon / 14) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Batter Stance Matchup */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#29334C]/60 text-center">
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                  <span className="text-[10px] text-[#929BB2] block">vs Right-Hand Batters</span>
                  <span className="text-base font-mono font-bold text-white">{profile.bowling.vsRHBEcon} Econ</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]/40">
                  <span className="text-[10px] text-[#929BB2] block">vs Left-Hand Batters</span>
                  <span className="text-base font-mono font-bold text-white">{profile.bowling.vsLHBEcon} Econ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRICKET PITCH MAP – BALL-BY-BALL ANALYSIS */}
      {activeSubTab === 'pitch-map' && (
        <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#29334C] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">22-Yard Bowling Pitch Intelligence Map</h3>
              </div>
              <p className="text-xs text-[#929BB2] mt-0.5">
                Authentic line & length zone distribution mapped from {profile.bowling.totalBalls} verified deliveries
              </p>
            </div>

            {/* Pitch Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* View Mode Toggle: Heatmap vs Markers */}
              <div className="flex items-center bg-[#0F1626] p-1 rounded-xl border border-[#29334C]">
                <button
                  onClick={() => setPitchViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pitchViewMode === 'heatmap'
                      ? 'bg-[#E90074] text-white shadow-sm'
                      : 'text-[#929BB2] hover:text-white'
                  }`}
                >
                  Heatmap Mode
                </button>
                <button
                  onClick={() => setPitchViewMode('markers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pitchViewMode === 'markers'
                      ? 'bg-[#7545C8] text-white shadow-sm'
                      : 'text-[#929BB2] hover:text-white'
                  }`}
                >
                  Delivery Markers
                </button>
              </div>

              {/* Outcome filter */}
              <div className="flex items-center bg-[#0F1626] p-1 rounded-xl border border-[#29334C]">
                {(['all', 'wicket', 'dot', 'boundary'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPitchFilterOutcome(mode)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                      pitchFilterOutcome === mode
                        ? 'bg-[#E90074] text-white shadow-sm'
                        : 'text-[#929BB2] hover:text-white'
                    }`}
                  >
                    {mode === 'boundary' ? '4s & 6s' : mode}
                  </button>
                ))}
              </div>

              {/* Season filter */}
              <select
                value={pitchFilterSeason}
                onChange={(e) => setPitchFilterSeason(e.target.value)}
                className="bg-[#0F1626] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#F7F7FB] focus:outline-none"
              >
                <option value="all">All Seasons</option>
                {availableSeasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Innings filter */}
              <select
                value={pitchFilterInnings}
                onChange={(e) => setPitchFilterInnings(e.target.value)}
                className="bg-[#0F1626] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#F7F7FB] focus:outline-none"
              >
                <option value="all">All Innings</option>
                <option value="1">1st Innings</option>
                <option value="2">2nd Innings</option>
              </select>
            </div>
          </div>

          {/* Realistic Cricket Pitch Top-Down Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* The Pitch Diagram */}
            <div className="lg:col-span-2 bg-[#0B1020] rounded-2xl border border-[#29334C] p-6 relative flex flex-col items-center">
              {/* Pitch Frame (22-yard turf) */}
              <div className="relative w-full max-w-lg aspect-[1/2] max-h-[580px] bg-gradient-to-b from-[#1C2822] via-[#24352C] to-[#1C2822] rounded-xl border-4 border-[#3D5244] shadow-2xl p-4 overflow-hidden select-none">
                {/* Turf mowing stripes */}
                <div className="absolute inset-0 flex pointer-events-none opacity-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full border-r border-white/20"
                      style={{ backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                    />
                  ))}
                </div>

                {/* Bowler End Crease */}
                <div className="relative z-10 w-full border-b-2 border-white/80 pb-2 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm" />
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm" />
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm" />
                    <span className="text-[10px] font-mono text-[#929BB2] ml-2">Bowling Crease</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/60 text-emerald-400 border border-white/10">
                    20.12m (22 YDS)
                  </span>
                </div>

                {/* 16 Zones Interactive Grid */}
                <div className="relative z-10 w-full h-[82%] grid grid-rows-4 grid-cols-4 gap-1.5 p-1">
                  {profile.pitchMap.zones.map((zone) => {
                    const isSelected = selectedZone?.id === zone.id;
                    const maxZoneDeliveries = Math.max(1, ...profile.pitchMap.zones.map(z => z.deliveries));
                    const density = zone.deliveries / maxZoneDeliveries;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className={`relative rounded-lg p-1.5 cursor-pointer border transition-all flex flex-col justify-between overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-[#E90074] border-white z-20 shadow-lg'
                            : 'border-white/15 hover:border-white/50'
                        }`}
                        style={{
                          backgroundColor:
                            pitchViewMode === 'heatmap'
                              ? zone.deliveries > 0
                                ? `rgba(233, 0, 116, ${Math.max(0.12, density * 0.75)})`
                                : 'rgba(0,0,0,0.25)'
                              : 'rgba(11, 16, 32, 0.65)',
                        }}
                      >
                        {/* Marker Mode: Discrete Ball Pins */}
                        {pitchViewMode === 'markers' && zone.deliveries > 0 && (
                          <div className="absolute inset-0 p-1 flex flex-wrap content-center justify-center gap-0.5 opacity-90 pointer-events-none">
                            {Array.from({ length: Math.min(zone.deliveries, 10) }).map((_, bIdx) => {
                              const isW = bIdx < zone.wickets;
                              const isB = !isW && bIdx < Math.round((zone.deliveries * (zone.boundaryPct || 0)) / 100);
                              const isD = !isW && !isB && bIdx < Math.round((zone.deliveries * (zone.dotPct || 0)) / 100);

                              if (isW) {
                                return (
                                  <span
                                    key={bIdx}
                                    className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white text-[7px] text-white font-black flex items-center justify-center"
                                  >
                                    W
                                  </span>
                                );
                              }
                              if (isB) {
                                return (
                                  <span
                                    key={bIdx}
                                    className="w-2 h-2 rounded-full bg-pink-500 border border-pink-300"
                                  />
                                );
                              }
                              if (isD) {
                                return (
                                  <span
                                    key={bIdx}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                  />
                                );
                              }
                              return (
                                <span
                                  key={bIdx}
                                  className="w-1.5 h-1.5 rounded-full bg-sky-300/80"
                                />
                              );
                            })}
                          </div>
                        )}

                        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono">
                          <span className="text-white/80 font-bold">{zone.pct}%</span>
                          {zone.wickets > 0 && (
                            <span className="px-1 rounded bg-red-600 text-white font-bold text-[8px]">
                              {zone.wickets}w
                            </span>
                          )}
                        </div>

                        <div className="relative z-10 text-center">
                          <span className="text-xs font-mono font-extrabold text-white block">
                            {zone.deliveries}
                          </span>
                          <span className="text-[8px] text-white/70 uppercase tracking-tighter block leading-tight">
                            {zone.line.split(' ')[0]}
                          </span>
                        </div>

                        <div className="relative z-10 text-[8px] font-mono text-emerald-300 text-right">
                          {zone.dotPct}% dots
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Batter End Crease (Popping Crease & Stumps) */}
                <div className="relative z-10 w-full border-t-2 border-white/80 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#929BB2]">Popping Crease</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm shadow-md" />
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm shadow-md" />
                    <div className="w-1.5 h-4 bg-amber-200 rounded-t-sm shadow-md" />
                  </div>
                </div>
              </div>

              {/* Pitch Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[11px] text-[#929BB2]">
                {pitchViewMode === 'heatmap' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#E90074]/30 border border-[#E90074]" />
                      <span>Targeted Zone Density</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-red-600 text-[9px] text-white flex items-center justify-center font-bold">W</div>
                      <span>Wicket Deliveries</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-emerald-500 text-[9px] text-white flex items-center justify-center font-bold">•</div>
                      <span>Dot Ball %</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 text-[7px] text-white font-black flex items-center justify-center">W</span>
                      <span>Wickets</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 border border-pink-300" />
                      <span>Boundaries (4s/6s)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Dot Deliveries</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                      <span>Scoring Deliveries</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Zone Detail Inspector Card */}
            <div className="space-y-4">
              <div className="bg-[#0F1626] rounded-2xl border border-[#29334C] p-5">
                <div className="flex items-center justify-between mb-3 border-b border-[#29334C] pb-2">
                  <span className="text-xs uppercase font-bold text-[#929BB2] tracking-wider">
                    Selected Zone Analysis
                  </span>
                  <span className="text-xs text-[#E90074] font-mono font-bold">
                    {selectedZone ? `${selectedZone.length} · ${selectedZone.line}` : 'Click any zone on pitch'}
                  </span>
                </div>

                {selectedZone ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Deliveries</span>
                        <span className="text-lg font-bold text-white">{selectedZone.deliveries} ({selectedZone.pct}%)</span>
                      </div>
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Wickets</span>
                        <span className="text-lg font-bold text-red-400">{selectedZone.wickets}</span>
                      </div>
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Dot-Ball %</span>
                        <span className="text-lg font-bold text-emerald-400">{selectedZone.dotPct}%</span>
                      </div>
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Zone Economy</span>
                        <span className="text-lg font-bold text-indigo-400">{selectedZone.economy}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C] text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#929BB2]">Length Classification:</span>
                        <span className="font-semibold text-white">{selectedZone.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#929BB2]">Line Channel:</span>
                        <span className="font-semibold text-white">{selectedZone.line}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#929BB2]">Runs Conceded in Zone:</span>
                        <span className="font-semibold text-amber-400">{selectedZone.runs} runs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#929BB2]">Boundary Concession Rate:</span>
                        <span className="font-semibold text-pink-400">{selectedZone.boundaryPct}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#929BB2]">
                    <Target className="w-8 h-8 text-[#29334C] mx-auto mb-2" />
                    Click on any of the 16 line/length zones on the 22-yard pitch to inspect delivery frequency, dot ball percentage, and wicket conversion.
                  </div>
                )}
              </div>

              {/* Data Accuracy Statement */}
              <div className="p-4 rounded-2xl bg-[#0F1626]/80 border border-[#29334C] text-[11px] text-[#929BB2] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>Data Integrity & Accuracy Policy</span>
                </div>
                {profile.pitchMap.dataMethodology}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATTING SHOT MAP / WAGON WHEEL */}
      {activeSubTab === 'shot-map' && (
        <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#29334C] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Batting Wagon Wheel & Shot Distribution</h3>
              </div>
              <p className="text-xs text-[#929BB2] mt-0.5">
                Ground zones & boundary concentration derived from {profile.shotMap.totalShots} executed strokes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Stadium Ground Graphic */}
            <div className="lg:col-span-2 bg-[#0B1020] rounded-2xl border border-[#29334C] p-6 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-square rounded-full bg-gradient-to-br from-[#1A3125] via-[#213F2E] to-[#172D20] border-4 border-[#3D5244] shadow-2xl p-4 flex items-center justify-center select-none overflow-hidden">
                {/* 30-yard inner circle */}
                <div className="absolute w-[62%] h-[62%] rounded-full border-2 border-dashed border-white/30 pointer-events-none" />

                {/* 22-yard Pitch in Center */}
                <div className="absolute w-7 h-16 bg-[#2B2319] rounded-sm border border-amber-300/40 shadow-inner z-10 flex flex-col justify-between py-1 items-center">
                  <div className="w-3 h-0.5 bg-white/60" />
                  <div className="w-3 h-0.5 bg-white/60" />
                </div>

                {/* 8 Radial Sectors */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                  {profile.shotMap.sectors.map((sec, idx) => {
                    const angleMid = (sec.angleStart + sec.angleEnd) / 2;
                    const rad = (angleMid * Math.PI) / 180;
                    const x2 = 200 + 175 * Math.sin(rad);
                    const y2 = 200 - 175 * Math.cos(rad);
                    return (
                      <line
                        key={idx}
                        x1="200"
                        y1="200"
                        x2={x2}
                        y2={y2}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>

                {/* Sector Hotspot Badges */}
                {profile.shotMap.sectors.map((sec) => {
                  const angleMid = (sec.angleStart + sec.angleEnd) / 2;
                  const rad = (angleMid * Math.PI) / 180;
                  const dist = 135;
                  const left = 50 + (dist / 200) * 50 * Math.sin(rad);
                  const top = 50 - (dist / 200) * 50 * Math.cos(rad);
                  const isSelected = selectedSector?.id === sec.id;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSector(sec)}
                      style={{ left: `${left}%`, top: `${top}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all shadow-md z-20 ${
                        isSelected
                          ? 'bg-[#E90074] text-white ring-2 ring-white scale-110'
                          : 'bg-black/75 text-emerald-300 border border-emerald-500/30 hover:scale-105'
                      }`}
                    >
                      {sec.runs}r ({sec.scoringPct}%)
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-[#929BB2]">
                <span>Click any sector badge to view boundaries, sixes, and stroke distribution.</span>
              </div>
            </div>

            {/* Sector Details & Stroke Frequency Table */}
            <div className="space-y-4">
              <div className="bg-[#0F1626] rounded-2xl border border-[#29334C] p-5">
                <h4 className="text-xs uppercase font-bold text-[#929BB2] tracking-wider mb-3">
                  {selectedSector ? selectedSector.name : 'Select a Ground Sector'}
                </h4>

                {selectedSector ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Runs Scored</span>
                        <span className="text-lg font-bold text-white">{selectedSector.runs}</span>
                      </div>
                      <div className="bg-[#171F35] p-2.5 rounded-xl border border-[#29334C]">
                        <span className="text-[10px] text-[#929BB2] block">Fours / Sixes</span>
                        <span className="text-lg font-bold text-purple-400">{selectedSector.fours} / {selectedSector.sixes}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#929BB2]">Showing top execution strokes across the pitch.</p>
                )}

                {/* Top Strokes List */}
                <div className="mt-4 pt-3 border-t border-[#29334C] space-y-2">
                  <span className="text-[11px] font-bold text-white block">Verified Stroke Breakdown</span>
                  {profile.shotMap.strokeBreakdown.slice(0, 6).map((st, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#29334C]/40">
                      <span className="text-[#C9C3DF]">{st.stroke}</span>
                      <span className="font-mono font-bold text-white">
                        {st.runs} runs <span className="text-[#929BB2]">({st.count} shots)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE GRAPHS */}
      {activeSubTab === 'graphs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Runs Trend */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                Match-by-Match Runs & Strike Rate
              </h4>
              <p className="text-xs text-[#929BB2] mb-4">Chronological performance across last 12 appearances</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.trends?.matchRuns || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                    <XAxis dataKey="opposition" stroke="#929BB2" fontSize={11} />
                    <YAxis stroke="#929BB2" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#121A2D', borderColor: '#29334C', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="runs" fill="#E90074" name="Runs Scored" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="sr" stroke="#38BDF8" name="Strike Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Match Wickets Trend */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <BowlingMotionIcon size={16} className="text-indigo-400" />
                Match-by-Match Wickets & Economy
              </h4>
              <p className="text-xs text-[#929BB2] mb-4">Spell figures across recent tournament appearances</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.trends?.matchWickets || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                    <XAxis dataKey="opposition" stroke="#929BB2" fontSize={11} />
                    <YAxis stroke="#929BB2" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#121A2D', borderColor: '#29334C', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="wickets" fill="#818CF8" name="Wickets Taken" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="econ" stroke="#34D399" name="Economy Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Season Progression */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Season-by-Season Progression
              </h4>
              <p className="text-xs text-[#929BB2] mb-4">Output and Strike Rate across tournament editions</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.trends?.seasonBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                    <XAxis dataKey="season" stroke="#929BB2" fontSize={11} />
                    <YAxis stroke="#929BB2" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#121A2D', borderColor: '#29334C', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="runs" fill="#7545C8" name="Runs" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wickets" fill="#38BDF8" name="Wickets" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Opponent Analysis */}
            <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                Performance vs Opposition Franchises
              </h4>
              <p className="text-xs text-[#929BB2] mb-4">Runs scored and wickets taken against top opponents</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profile.trends?.oppositionAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                    <XAxis dataKey="team" stroke="#929BB2" fontSize={10} angle={-20} textAnchor="end" height={45} />
                    <YAxis stroke="#929BB2" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#121A2D', borderColor: '#29334C', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="battingRuns" fill="#E90074" name="Runs vs Opponent" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bowlingWkts" fill="#818CF8" name="Wickets vs Opponent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MATCH HISTORY TABLE */}
      {activeSubTab === 'matches' && (
        <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#29334C] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Verified Match-by-Match Log</h3>
              <p className="text-xs text-[#929BB2]">
                Detailed scores joined from official match IDs ({filteredMatches.length} appearances displayed)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#929BB2]" />
              <select
                value={matchSeasonFilter}
                onChange={(e) => setMatchSeasonFilter(e.target.value)}
                className="bg-[#0F1626] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#F7F7FB] focus:outline-none"
              >
                <option value="all">All Seasons</option>
                {availableSeasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1626] text-[#929BB2] uppercase text-[10px] font-mono border-b border-[#29334C]">
                <tr>
                  <th className="p-3">Date / Comp</th>
                  <th className="p-3">Opponent</th>
                  <th className="p-3 text-center">Batting Figures</th>
                  <th className="p-3 text-center">Dismissal</th>
                  <th className="p-3 text-center">Bowling Figures</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29334C]/40">
                {filteredMatches.map((m) => {
                  const isExpanded = expandedMatchId === m.matchId;

                  return (
                    <React.Fragment key={m.matchId}>
                      <tr className="hover:bg-[#1E2744]/40 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-white block">{m.date}</span>
                          <span className="text-[10px] text-[#929BB2] block">{m.compName} ({m.season})</span>
                        </td>
                        <td className="p-3 font-semibold text-[#F7F7FB]">
                          vs {m.opponent}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {m.batting ? (
                            <span className="font-bold text-pink-400">
                              {m.batting.runs} ({m.batting.balls}b) · {m.batting.sr} SR
                            </span>
                          ) : (
                            <span className="text-[#929BB2]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-[11px] text-[#C9C3DF]">
                          {m.batting?.dismissal || '—'}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {m.bowling ? (
                            <span className="font-bold text-indigo-400">
                              {m.bowling.wickets}/{m.bowling.runsConceded} ({m.bowling.overs} ov, {m.bowling.economy} econ)
                            </span>
                          ) : (
                            <span className="text-[#929BB2]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {m.ballsDetails && m.ballsDetails.length > 0 && (
                            <button
                              onClick={() => setExpandedMatchId(isExpanded ? null : m.matchId)}
                              className="px-2.5 py-1 rounded bg-[#0F1626] border border-[#29334C] text-[10px] text-[#C9C3DF] hover:text-white"
                            >
                              {isExpanded ? 'Hide Balls' : 'Inspect Balls'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Ball-by-Ball Inspection Drawer */}
                      {isExpanded && m.ballsDetails && (
                        <tr className="bg-[#0F1626]/80">
                          <td colSpan={6} className="p-4 border-b border-[#29334C]">
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                                Key Deliveries / Event Balls in Match vs {m.opponent}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                {m.ballsDetails.map((b, i) => (
                                  <div key={i} className="p-2.5 rounded-xl bg-[#171F35] border border-[#29334C] flex items-center justify-between">
                                    <div>
                                      <span className="font-mono text-[10px] text-[#929BB2] block">Over {b.over}.{b.ball}</span>
                                      <span className="font-semibold text-white">
                                        {b.type === 'batting' ? `${b.stroke || 'Shot'}` : `${b.deliveryStyle || 'Delivery'}`}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      {b.isWicket ? (
                                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">WICKET</span>
                                      ) : b.isSix ? (
                                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px]">6 RUNS</span>
                                      ) : b.isFour ? (
                                        <span className="px-2 py-0.5 rounded bg-pink-600 text-white font-bold text-[10px]">4 RUNS</span>
                                      ) : (
                                        <span className="font-mono text-white text-xs">{b.runs} runs</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PLAYER COMPARISON STUDIO INTEGRATION */}
      {activeSubTab === 'compare' && (
        <div className="bg-[#171F35] rounded-3xl border border-[#29334C] p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#29334C] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-pink-400" />
                Head-to-Head Comparative Intelligence
              </h3>
              <p className="text-xs text-[#929BB2]">
                Select any benchmark player to compare multi-metric radar and verified outputs
              </p>
            </div>

            {/* Target Player Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#929BB2]">Compare with:</span>
              <select
                value={compareTargetId}
                onChange={(e) => setCompareTargetId(e.target.value)}
                className="bg-[#0F1626] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#F7F7FB] focus:outline-none"
              >
                {allSummaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.team} · {s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {compareTargetProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Radar Comparison Chart */}
              <div className="bg-[#0B1020] rounded-2xl border border-[#29334C] p-6 h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={comparisonRadarData}>
                    <PolarGrid stroke="#29334C" />
                    <PolarAngleAxis dataKey="axis" stroke="#929BB2" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#29334C" />
                    <Radar name={profile.name} dataKey="A" stroke="#E90074" fill="#E90074" fillOpacity={0.4} />
                    <Radar name={compareTargetProfile.name} dataKey="B" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.4} />
                    <Legend />
                    <Tooltip contentStyle={{ backgroundColor: '#121A2D', borderColor: '#29334C', borderRadius: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Head-to-Head Metric Table */}
              <div className="space-y-2.5">
                {[
                  { label: 'Batting Average', a: profile.batting.avg, b: compareTargetProfile.batting.avg, higherBetter: true },
                  { label: 'Strike Rate', a: profile.batting.sr, b: compareTargetProfile.batting.sr, higherBetter: true },
                  { label: 'Career Wickets', a: profile.bowling.wickets, b: compareTargetProfile.bowling.wickets, higherBetter: true },
                  { label: 'Economy Rate', a: profile.bowling.economy, b: compareTargetProfile.bowling.economy, higherBetter: false },
                  { label: 'Pressure Index (BPI)', a: profile.rankings.pressureIndex, b: compareTargetProfile.rankings.pressureIndex, higherBetter: true },
                  { label: 'Consistency Score', a: profile.rankings.consistencyScore, b: compareTargetProfile.rankings.consistencyScore, higherBetter: true },
                ].map((row, i) => {
                  const aWins = row.higherBetter ? row.a > row.b : row.a < row.b;
                  const bWins = row.higherBetter ? row.b > row.a : row.b < row.a;

                  return (
                    <div key={i} className="p-3 rounded-xl bg-[#0F1626] border border-[#29334C] flex items-center justify-between text-xs font-mono">
                      <span className={`w-20 font-bold ${aWins ? 'text-[#E90074]' : 'text-white'}`}>{row.a}</span>
                      <span className="text-[#929BB2] font-sans text-center flex-1">{row.label}</span>
                      <span className={`w-20 text-right font-bold ${bWins ? 'text-sky-400' : 'text-white'}`}>{row.b}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
