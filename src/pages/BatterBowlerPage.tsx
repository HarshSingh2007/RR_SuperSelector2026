import React, { useState, useMemo } from 'react';
import {
  Swords,
  Search,
  Filter,
  Shield,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Flame,
  Zap,
  RotateCcw,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  HeadToHeadRecord,
  HeadToHeadMatrixData,
  Batter,
  Bowler,
} from '../types';
import h2hMatrixData from '../data/head_to_head_matrix.json';
import battersData from '../data/batters.json';
import bowlersData from '../data/bowlers.json';
import top20Data from '../data/top20_identities.json';
import youngTalentsData from '../data/young_talents.json';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  HeadToHeadIcon,
  RoyalCrestEmblem,
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  BowlingMotionIcon,
} from '../components/CricketIcons';

type FormatFilter = 'ALL' | 'IPL' | 'T20I';

export const BatterBowlerPage: React.FC = () => {
  const matrix = useMemo(() => h2hMatrixData as unknown as HeadToHeadMatrixData, []);

  // Batter & Bowler Options
  const battersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; team: string; country_flag?: string; country?: string; role?: string }>();
    top20Data.batters.forEach((b: any) => {
      map.set(b.id, {
        id: b.id,
        name: b.name,
        team: b.team,
        country_flag: b.country_flag || '🇮🇳',
        country: b.country || 'India',
        role: b.player_role || 'Batter',
      });
    });
    (battersData as any[]).forEach((b) => {
      if (!map.has(b.id)) {
        map.set(b.id, {
          id: b.id,
          name: b.name,
          team: b.team,
          country_flag: b.country_flag || '🇮🇳',
          country: b.country || 'India',
          role: b.player_role || 'Batter',
        });
      }
    });
    (youngTalentsData as any[]).forEach((y) => {
      if (!map.has(y.id) && (y.stats?.batting?.balls >= 15 || ['Batter', 'All-Rounder', 'Wicketkeeper'].includes(y.primary_role))) {
        map.set(y.id, {
          id: y.id,
          name: y.name,
          team: y.current_teams?.[0] || 'Franchise',
          country_flag: y.country_flag || '🇮🇳',
          country: y.country || 'India',
          role: y.primary_role || 'Batter',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const bowlersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; team: string; country_flag?: string; country?: string; role?: string }>();
    top20Data.bowlers.forEach((bw: any) => {
      map.set(bw.id, {
        id: bw.id,
        name: bw.name,
        team: bw.team,
        country_flag: bw.country_flag || '🇵🇰',
        country: bw.country || 'Pakistan',
        role: bw.player_role || 'Bowler',
      });
    });
    (bowlersData as any[]).forEach((bw) => {
      if (!map.has(bw.id)) {
        map.set(bw.id, {
          id: bw.id,
          name: bw.name,
          team: bw.team,
          country_flag: bw.country_flag || '🇮🇳',
          country: bw.country || 'India',
          role: bw.player_role || 'Bowler',
        });
      }
    });
    (youngTalentsData as any[]).forEach((y) => {
      if (!map.has(y.id) && (y.stats?.bowling?.balls >= 18 || ['Fast Bowler', 'Spinner', 'All-Rounder'].includes(y.primary_role))) {
        map.set(y.id, {
          id: y.id,
          name: y.name,
          team: y.current_teams?.[0] || 'Franchise',
          country_flag: y.country_flag || '🇮🇳',
          country: y.country || 'India',
          role: y.primary_role || 'Bowler',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Selected players
  const [selectedBatterId, setSelectedBatterId] = useState<string>(battersList[0]?.id || '10478');
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>(bowlersList[0]?.id || '2833');
  const [format, setFormat] = useState<FormatFilter>('ALL');

  // Search queries for dropdowns
  const [batterSearch, setBatterSearch] = useState<string>('');
  const [bowlerSearch, setBowlerSearch] = useState<string>('');

  const selectedBatter = useMemo(
    () => battersList.find((b) => b.id === selectedBatterId) || battersList[0],
    [battersList, selectedBatterId]
  );

  const selectedBowler = useMemo(
    () => bowlersList.find((bw) => bw.id === selectedBowlerId) || bowlersList[0],
    [bowlersList, selectedBowlerId]
  );

  // Key lookup
  const h2hKey = `${selectedBatter?.id}_${selectedBowler?.id}`;
  const rawRecord: HeadToHeadRecord | undefined = matrix.matchups[h2hKey];

  // Active stats depending on format filter
  const activeStats = useMemo(() => {
    if (!rawRecord) return null;

    if (format === 'IPL') {
      if (!rawRecord.ipl || rawRecord.ipl.balls === 0) return null;
      const sr = rawRecord.ipl.balls > 0 ? parseFloat(((rawRecord.ipl.runs / rawRecord.ipl.balls) * 100).toFixed(1)) : 0;
      const avg = rawRecord.ipl.dismissals > 0 ? (rawRecord.ipl.runs / rawRecord.ipl.dismissals).toFixed(1) : 'Undefeated';
      const dotPct = rawRecord.ipl.balls > 0 ? parseFloat(((rawRecord.ipl.dots / rawRecord.ipl.balls) * 100).toFixed(1)) : 0;
      const bndPct = rawRecord.ipl.balls > 0 ? parseFloat((((rawRecord.ipl.fours + rawRecord.ipl.sixes) / rawRecord.ipl.balls) * 100).toFixed(1)) : 0;
      return {
        balls: rawRecord.ipl.balls,
        runs: rawRecord.ipl.runs,
        dismissals: rawRecord.ipl.dismissals,
        dots: rawRecord.ipl.dots,
        fours: rawRecord.ipl.fours,
        sixes: rawRecord.ipl.sixes,
        strike_rate: sr,
        average: avg,
        dot_pct: dotPct,
        boundary_pct: bndPct,
        advantage: rawRecord.ipl.advantage || rawRecord.advantage,
      };
    }

    if (format === 'T20I') {
      if (!rawRecord.t20i || rawRecord.t20i.balls === 0) return null;
      const sr = rawRecord.t20i.balls > 0 ? parseFloat(((rawRecord.t20i.runs / rawRecord.t20i.balls) * 100).toFixed(1)) : 0;
      const avg = rawRecord.t20i.dismissals > 0 ? (rawRecord.t20i.runs / rawRecord.t20i.dismissals).toFixed(1) : 'Undefeated';
      const dotPct = rawRecord.t20i.balls > 0 ? parseFloat(((rawRecord.t20i.dots / rawRecord.t20i.balls) * 100).toFixed(1)) : 0;
      const bndPct = rawRecord.t20i.balls > 0 ? parseFloat((((rawRecord.t20i.fours + rawRecord.t20i.sixes) / rawRecord.t20i.balls) * 100).toFixed(1)) : 0;
      return {
        balls: rawRecord.t20i.balls,
        runs: rawRecord.t20i.runs,
        dismissals: rawRecord.t20i.dismissals,
        dots: rawRecord.t20i.dots,
        fours: rawRecord.t20i.fours,
        sixes: rawRecord.t20i.sixes,
        strike_rate: sr,
        average: avg,
        dot_pct: dotPct,
        boundary_pct: bndPct,
        advantage: rawRecord.t20i.advantage || rawRecord.advantage,
      };
    }

    // ALL Formats
    const avg = rawRecord.dismissals > 0 ? rawRecord.batting_avg.toString() : 'Undefeated';
    return {
      balls: rawRecord.balls_faced,
      runs: rawRecord.runs_scored,
      dismissals: rawRecord.dismissals,
      dots: rawRecord.dots,
      fours: rawRecord.fours,
      sixes: rawRecord.sixes,
      strike_rate: rawRecord.strike_rate,
      average: avg,
      dot_pct: rawRecord.dot_pct,
      boundary_pct: rawRecord.boundary_pct,
      advantage: rawRecord.advantage,
    };
  }, [rawRecord, format]);

  // Toughest Opponents for the selected batter
  const toughestOpponents: HeadToHeadRecord[] = useMemo(() => {
    if (!selectedBatter?.id) return [];
    return matrix.toughest_opponents[selectedBatter.id] || [];
  }, [matrix, selectedBatter]);

  // Favourite Batters for the selected bowler
  const favouriteBatters: HeadToHeadRecord[] = useMemo(() => {
    if (!selectedBowler?.id) return [];
    return matrix.favourite_batters[selectedBowler.id] || [];
  }, [matrix, selectedBowler]);

  // Quick switch matchup handler
  const handleSelectMatchup = (batterId: string, bowlerId: string) => {
    setSelectedBatterId(batterId);
    setSelectedBowlerId(bowlerId);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#171F35] via-[#121A2D] to-[#0B1020] border border-[#29334C] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#E90074]/15 via-[#7545C8]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E90074]/15 border border-[#E90074]/30 rounded-full text-xs font-semibold text-[#E90074] tracking-wider uppercase">
              <HeadToHeadIcon size={14} className="text-[#E90074]" />
              Historical Head-to-Head Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] flex items-center gap-3">
              <RoyalCrestEmblem size={32} />
              Batter vs Bowler Intelligence
            </h1>
            <p className="text-sm text-[#929BB2] max-w-2xl leading-relaxed">
              Every single delivery across 200,999 balls analysed. Query granular head-to-head match-ups between any batter and bowler to uncover strike rates, dismissals, dot ball choking, and tactical advantages.
            </p>
          </div>

          {/* Format Segmented Tabs */}
          <div className="flex items-center p-1 bg-[#0B1020] border border-[#29334C] rounded-xl">
            {(['ALL', 'IPL', 'T20I'] as FormatFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  format === f
                    ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white shadow-md'
                    : 'text-[#929BB2] hover:text-[#F7F7FB]'
                }`}
              >
                {f === 'ALL' ? 'All Formats' : f === 'IPL' ? 'IPL Only' : 'T20I Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Selector Bar with Instant Text Filter */}
        <div className="mt-6 pt-5 border-t border-[#29334C]/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batter Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#C9C3DF] flex items-center gap-1.5 uppercase tracking-wider">
                <CricketBatIcon size={15} className="text-amber-300" />
                Select Batter
              </label>
              <input
                type="text"
                value={batterSearch}
                onChange={(e) => setBatterSearch(e.target.value)}
                placeholder="Filter batter..."
                className="w-36 sm:w-44 px-2.5 py-1 bg-[#0B1020] border border-[#29334C] rounded-lg text-[11px] text-[#F7F7FB] placeholder:text-[#6B7280] focus:outline-none focus:border-[#E90074]"
              />
            </div>
            <select
              value={selectedBatterId}
              onChange={(e) => setSelectedBatterId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs sm:text-sm text-[#F7F7FB] focus:outline-none focus:border-[#E90074] font-medium"
            >
              {battersList
                .filter(
                  (b) =>
                    !batterSearch ||
                    b.id === selectedBatterId ||
                    b.name.toLowerCase().includes(batterSearch.toLowerCase()) ||
                    (b.team || '').toLowerCase().includes(batterSearch.toLowerCase())
                )
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.country_flag} {b.country}) - {b.team}
                  </option>
                ))}
            </select>
          </div>

          {/* Bowler Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#C9C3DF] flex items-center gap-1.5 uppercase tracking-wider">
                <BowlingMotionIcon size={15} className="text-purple-300" />
                Select Bowler
              </label>
              <input
                type="text"
                value={bowlerSearch}
                onChange={(e) => setBowlerSearch(e.target.value)}
                placeholder="Filter bowler..."
                className="w-36 sm:w-44 px-2.5 py-1 bg-[#0B1020] border border-[#29334C] rounded-lg text-[11px] text-[#F7F7FB] placeholder:text-[#6B7280] focus:outline-none focus:border-[#7545C8]"
              />
            </div>
            <select
              value={selectedBowlerId}
              onChange={(e) => setSelectedBowlerId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs sm:text-sm text-[#F7F7FB] focus:outline-none focus:border-[#7545C8] font-medium"
            >
              {bowlersList
                .filter(
                  (bw) =>
                    !bowlerSearch ||
                    bw.id === selectedBowlerId ||
                    bw.name.toLowerCase().includes(bowlerSearch.toLowerCase()) ||
                    (bw.team || '').toLowerCase().includes(bowlerSearch.toLowerCase())
                )
                .map((bw) => (
                  <option key={bw.id} value={bw.id}>
                    {bw.name} ({bw.country_flag} {bw.country}) - {bw.team}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Center Clash Spotlight Card */}
      <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Batter Column */}
          <div className="flex items-center gap-4 flex-1">
            <PlayerAvatar
              name={selectedBatter?.name || 'Batter'}
              team={selectedBatter?.team || 'Team'}
              role="batter"
              countryFlag={selectedBatter?.country_flag}
              size="xl"
              showRank={false}
            />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <CricketBatIcon size={12} /> Striker
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F7F7FB]">
                {selectedBatter?.name}
              </h2>
              <div className="text-xs text-[#929BB2]">
                {selectedBatter?.country_flag} {selectedBatter?.country} • {selectedBatter?.team}
              </div>
            </div>
          </div>

          {/* VS Center Emblem */}
          <div className="flex flex-col items-center justify-center px-4 py-2 bg-[#0B1020] border border-[#29334C] rounded-2xl my-2 md:my-0 shadow-lg">
            <span className="text-xs font-extrabold text-[#E90074] tracking-widest uppercase">Duel</span>
            <span className="text-2xl font-black text-[#F7F7FB] my-0.5">VS</span>
            <span className="text-[10px] text-[#929BB2] uppercase font-semibold">200k Balls</span>
          </div>

          {/* Bowler Column */}
          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div className="space-y-1 order-2 md:order-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 justify-end">
                <BowlingMotionIcon size={12} /> Bowler
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F7F7FB]">
                {selectedBowler?.name}
              </h2>
              <div className="text-xs text-[#929BB2]">
                {selectedBowler?.country_flag} {selectedBowler?.country} • {selectedBowler?.team}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <PlayerAvatar
                name={selectedBowler?.name || 'Bowler'}
                team={selectedBowler?.team || 'Team'}
                role="bowler"
                countryFlag={selectedBowler?.country_flag}
                size="xl"
                showRank={false}
              />
            </div>
          </div>
        </div>

        {/* Advantage Banner */}
        {activeStats && (
          <div className="mt-6 pt-5 border-t border-[#29334C]">
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              activeStats.advantage === 'batter'
                ? 'bg-gradient-to-r from-[#E90074]/15 to-transparent border-[#E90074]/40'
                : activeStats.advantage === 'bowler'
                ? 'bg-gradient-to-r from-[#7545C8]/20 to-transparent border-[#7545C8]/40'
                : 'bg-[#121A2D] border-[#29334C]'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  activeStats.advantage === 'batter'
                    ? 'bg-[#E90074] text-white'
                    : activeStats.advantage === 'bowler'
                    ? 'bg-[#7545C8] text-white'
                    : 'bg-[#29334C] text-[#C9C3DF]'
                }`}>
                  {activeStats.advantage === 'batter'
                    ? '🏏 Batter Advantage'
                    : activeStats.advantage === 'bowler'
                    ? '🎯 Bowler Advantage'
                    : '⚖ Balanced Duel'}
                </span>

                <p className="text-xs text-[#C9C3DF] leading-snug">
                  {activeStats.advantage === 'batter'
                    ? `${selectedBatter?.name} dominates this match-up with a punishing Strike Rate of ${activeStats.strike_rate} and only ${activeStats.dismissals} dismissal(s).`
                    : activeStats.advantage === 'bowler'
                    ? `${selectedBowler?.name} holds psychological control with ${activeStats.dismissals} dismissal(s) and a choking ${activeStats.dot_pct}% dot ball percentage.`
                    : `Evenly contested contest. ${selectedBatter?.name} scores at ${activeStats.strike_rate} SR across ${activeStats.balls} balls facing ${selectedBowler?.name}.`}
                </p>
              </div>

              <div className="text-xs text-[#929BB2] whitespace-nowrap">
                Format: <span className="font-bold text-[#F7F7FB]">{format}</span>
              </div>
            </div>
            {activeStats.balls < 6 && (
              <div className="mt-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                <AlertCircle size={13} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Small Sample Caution ({activeStats.balls} {activeStats.balls === 1 ? 'ball' : 'balls'}):</strong> Limited historical encounter data — dominance metrics carry higher statistical variance.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Results or Fallback */}
      {activeStats ? (
        <div className="space-y-6">
          {/* Exact Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Balls Faced</span>
              <span className="text-xl font-bold text-[#F7F7FB] mt-1 block">{activeStats.balls}</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Runs Scored</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{activeStats.runs}</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Dismissals</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">{activeStats.dismissals}</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Strike Rate</span>
              <span className="text-xl font-bold text-[#E90074] mt-1 block">{activeStats.strike_rate}</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Batting Avg</span>
              <span className="text-xl font-bold text-cyan-400 mt-1 block">{activeStats.average}</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Dot Ball %</span>
              <span className="text-xl font-bold text-[#C9C3DF] mt-1 block">{activeStats.dot_pct}%</span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Boundaries</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {activeStats.fours}×4 | {activeStats.sixes}×6
              </span>
            </div>

            <div className="bg-[#171F35] border border-[#29334C] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#929BB2] uppercase block">Boundary %</span>
              <span className="text-xl font-bold text-pink-400 mt-1 block">{activeStats.boundary_pct}%</span>
            </div>
          </div>

          {/* Delivery Timeline & Run Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Timeline */}
            <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F7F7FB] uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-[#E90074]" />
                  Recent Delivery Timeline
                </span>
                <span className="text-[11px] text-[#929BB2]">Ball-by-Ball Sequence</span>
              </div>

              {rawRecord?.timeline && rawRecord.timeline.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {rawRecord.timeline.map((event, idx) => {
                    const isWicket = event === 'W';
                    const isSix = event === '6';
                    const isFour = event === '4';
                    const isDot = event === '•' || event === '0';

                    return (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shadow-md transition-all ${
                          isWicket
                            ? 'bg-red-500/20 border-red-500 text-red-400'
                            : isSix
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : isFour
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : isDot
                            ? 'bg-[#0B1020] border-[#29334C] text-[#929BB2]'
                            : 'bg-[#121A2D] border-[#29334C] text-[#F7F7FB]'
                        }`}
                      >
                        {event}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-[#929BB2] py-4">No recent timeline recorded.</div>
              )}

              <div className="flex items-center gap-4 pt-3 text-[11px] text-[#929BB2] border-t border-[#29334C]/60">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> W = Wicket</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-400" /> 6 = Six</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> 4 = Four</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#929BB2]" /> • = Dot</span>
              </div>
            </div>

            {/* Run Distribution Breakdown */}
            <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-bold text-[#F7F7FB] uppercase tracking-wider block">
                Runs Distribution by Category
              </span>

              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#929BB2]">Dot Balls ({activeStats.dots} balls)</span>
                    <span className="font-bold text-[#C9C3DF]">{activeStats.dot_pct}%</span>
                  </div>
                  <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#929BB2] h-full" style={{ width: `${activeStats.dot_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#929BB2]">Boundaries ({activeStats.fours}×4, {activeStats.sixes}×6)</span>
                    <span className="font-bold text-[#E90074]">{activeStats.boundary_pct}%</span>
                  </div>
                  <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#E90074] to-[#7545C8] h-full"
                      style={{ width: `${Math.min(100, activeStats.boundary_pct)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#929BB2]">Strike Rotation (1s / 2s / 3s)</span>
                    <span className="font-bold text-cyan-400">
                      {Math.max(0, 100 - activeStats.dot_pct - activeStats.boundary_pct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full"
                      style={{
                        width: `${Math.max(0, 100 - activeStats.dot_pct - activeStats.boundary_pct)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Honest Fallback Card when 0 balls faced */
        <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-10 text-center shadow-xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#0B1020] border border-[#29334C] flex items-center justify-center text-[#929BB2]">
            <HeadToHeadIcon size={26} className="text-[#929BB2]" />
          </div>
          <h3 className="text-base font-bold text-[#F7F7FB]">
            No Historical Head-to-Head Encounters Found
          </h3>
          <p className="text-xs text-[#929BB2] max-w-lg mx-auto leading-relaxed">
            {selectedBatter?.name} and {selectedBowler?.name} have not faced each other in {format === 'ALL' ? 'any recorded match' : format === 'IPL' ? 'IPL matches' : 'T20 Internationals'} within the 200,999 delivery dataset.
          </p>
          <div className="pt-2 text-xs text-[#C9C3DF]">
            Tip: Switch formats above or check the curated match-ups below!
          </div>
        </div>
      )}

      {/* Opponent Intelligence Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Toughest Opponents for Selected Batter */}
        <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
            <div className="flex items-center gap-2">
              <CricketBatIcon size={16} className="text-amber-300" />
              <h3 className="text-sm font-bold text-[#F7F7FB] uppercase tracking-wider">
                {selectedBatter?.name}'s Toughest Opponents
              </h3>
            </div>
            <span className="text-[11px] text-[#929BB2]">Most Dismissals</span>
          </div>

          <div className="space-y-2">
            {toughestOpponents.length > 0 ? (
              toughestOpponents.map((opp) => (
                <div
                  key={opp.bowler_id}
                  onClick={() => handleSelectMatchup(opp.batter_id, opp.bowler_id)}
                  className="p-3 bg-[#121A2D] hover:bg-[#E90074]/15 border border-[#29334C] hover:border-[#E90074]/50 rounded-xl flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#F7F7FB] group-hover:text-[#E90074] transition-colors">
                      {opp.bowler_name}
                    </h4>
                    <span className="text-[11px] text-[#929BB2]">
                      {opp.dismissals} Out • {opp.balls_faced} Balls Faced
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-purple-400 block">{opp.strike_rate} SR</span>
                      <span className="text-[10px] text-[#929BB2]">{opp.dot_pct}% Dots</span>
                    </div>
                    <ChevronRight size={14} className="text-[#929BB2] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#929BB2] py-4 text-center">
                No high-volume nemesis recorded in database for this batter.
              </div>
            )}
          </div>
        </div>

        {/* Favourite Batters for Selected Bowler */}
        <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
            <div className="flex items-center gap-2">
              <BowlingMotionIcon size={16} className="text-purple-300" />
              <h3 className="text-sm font-bold text-[#F7F7FB] uppercase tracking-wider">
                {selectedBowler?.name}'s Favourite Batters
              </h3>
            </div>
            <span className="text-[11px] text-[#929BB2]">Most Wickets Taken</span>
          </div>

          <div className="space-y-2">
            {favouriteBatters.length > 0 ? (
              favouriteBatters.map((fav) => (
                <div
                  key={fav.batter_id}
                  onClick={() => handleSelectMatchup(fav.batter_id, fav.bowler_id)}
                  className="p-3 bg-[#121A2D] hover:bg-[#7545C8]/20 border border-[#29334C] hover:border-[#7545C8]/50 rounded-xl flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#F7F7FB] group-hover:text-purple-300 transition-colors">
                      {fav.batter_name}
                    </h4>
                    <span className="text-[11px] text-[#929BB2]">
                      Dismissed {fav.dismissals}× in {fav.balls_faced} Balls
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">{fav.strike_rate} SR</span>
                      <span className="text-[10px] text-[#929BB2]">{fav.dot_pct}% Dots</span>
                    </div>
                    <ChevronRight size={14} className="text-[#929BB2] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#929BB2] py-4 text-center">
                No dominant victim profile recorded in database for this bowler.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

