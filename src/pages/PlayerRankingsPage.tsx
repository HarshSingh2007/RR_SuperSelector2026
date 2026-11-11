import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Target,
  Medal,
  Crown,
  Download,
  Search,
  Eye,
  GitCompare,
  ArrowUpDown,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Globe2,
} from 'lucide-react';
import { Batter, Bowler } from '../types';
import { Badge } from '../components/Badge';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { exportToCSV } from '../utils/csvExport';
import {
  CricketBatIcon,
  CricketBallIcon,
  BowlingMotionIcon,
  RoyalCrestEmblem,
} from '../components/CricketIcons';
import top20Data from '../data/top20_identities.json';

interface PlayerRankingsPageProps {
  batters: Batter[];
  bowlers: Bowler[];
  selectedComp?: string;
  selectedSeason?: string;
  onSelectPlayer: (player: Batter | Bowler, type: 'batter' | 'bowler') => void;
  onComparePlayer: (player: Batter | Bowler) => void;
}

export const PlayerRankingsPage: React.FC<PlayerRankingsPageProps> = ({
  batters,
  bowlers,
  selectedComp = 'ALL',
  selectedSeason = 'ALL',
  onSelectPlayer,
  onComparePlayer,
}) => {
  const [role, setRole] = useState<'batters' | 'bowlers'>('batters');
  const [datasetScope, setDatasetScope] = useState<'official20' | 'all'>('official20');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [rrSpotlight, setRrSpotlight] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<'rank' | 'rating' | 'delta' | 'volume'>('rank');

  const isBatters = role === 'batters';

  // Base dataset selection: Official 20 vs All
  const baseBatters = useMemo(() => {
    if (datasetScope === 'official20') {
      return (top20Data.batters as unknown as Batter[]);
    }
    return batters;
  }, [datasetScope, batters]);

  const baseBowlers = useMemo(() => {
    if (datasetScope === 'official20') {
      return (top20Data.bowlers as unknown as Bowler[]);
    }
    return bowlers;
  }, [datasetScope, bowlers]);

  // Extract unique countries
  const uniqueCountries = useMemo(() => {
    const list = isBatters ? baseBatters : baseBowlers;
    const map = new Map<string, string>();
    list.forEach((p) => {
      if (p.country && p.country_flag) {
        map.set(p.country, p.country_flag);
      }
    });
    return Array.from(map.entries());
  }, [isBatters, baseBatters, baseBowlers]);

  // Extract unique teams
  const uniqueTeams = useMemo(() => {
    const list = isBatters ? baseBatters : baseBowlers;
    const set = new Set<string>();
    list.forEach((p) => {
      if (p.team) set.add(p.team);
      if (p.teams) p.teams.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [isBatters, baseBatters, baseBowlers]);

  // Filter list by Comp, Country, Team, RR Spotlight, and Search
  const eligibleBatters = useMemo(() => {
    return baseBatters
      .filter((b) => {
        if (selectedComp === 'IPL' && b.ipl && b.ipl.balls === 0) return false;
        if (selectedComp === 'T20I' && b.t20i && b.t20i.balls === 0) return false;
        if (selectedSeason !== 'ALL') {
          const shortYr = selectedSeason.slice(-2);
          const hasSeason = Object.entries(b.seasons || {}).some(
            ([k, v]) =>
              (k === selectedSeason || k.startsWith(`${selectedSeason}/`) || k.endsWith(`/${shortYr}`)) &&
              v.balls > 0
          );
          if (!hasSeason) return false;
        }
        if (countryFilter !== 'ALL' && b.country !== countryFilter) return false;
        if (teamFilter !== 'ALL' && b.team !== teamFilter && !b.teams?.includes(teamFilter)) return false;
        if (rrSpotlight) {
          const isRR =
            b.team?.toLowerCase().includes('rajasthan') ||
            b.teams?.some((t) => t.toLowerCase().includes('rajasthan'));
          if (!isRR) return false;
        }
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const match =
            b.name.toLowerCase().includes(s) ||
            b.team?.toLowerCase().includes(s) ||
            b.country?.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'rank') return a.rank - b.rank;
        if (sortField === 'delta') return b.srDelta - a.srDelta;
        if (sortField === 'volume') return b.pressureRuns - a.pressureRuns;
        return b.rating - a.rating;
      });
  }, [baseBatters, selectedComp, selectedSeason, countryFilter, teamFilter, rrSpotlight, searchTerm, sortField]);

  const eligibleBowlers = useMemo(() => {
    return baseBowlers
      .filter((bw) => {
        if (selectedComp === 'IPL' && bw.ipl && bw.ipl.overs === 0) return false;
        if (selectedComp === 'T20I' && bw.t20i && bw.t20i.overs === 0) return false;
        if (selectedSeason !== 'ALL') {
          const shortYr = selectedSeason.slice(-2);
          const hasSeason = Object.entries(bw.seasons || {}).some(
            ([k, v]) =>
              (k === selectedSeason || k.startsWith(`${selectedSeason}/`) || k.endsWith(`/${shortYr}`)) &&
              v.balls > 0
          );
          if (!hasSeason) return false;
        }
        if (countryFilter !== 'ALL' && bw.country !== countryFilter) return false;
        if (teamFilter !== 'ALL' && bw.team !== teamFilter && !bw.teams?.includes(teamFilter)) return false;
        if (rrSpotlight) {
          const isRR =
            bw.team?.toLowerCase().includes('rajasthan') ||
            bw.teams?.some((t) => t.toLowerCase().includes('rajasthan'));
          if (!isRR) return false;
        }
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const match =
            bw.name.toLowerCase().includes(s) ||
            bw.team?.toLowerCase().includes(s) ||
            bw.country?.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'rank') return a.rank - b.rank;
        if (sortField === 'delta') return b.econDelta - a.econDelta;
        if (sortField === 'volume') return b.pressureWickets - a.pressureWickets;
        return b.rating - a.rating;
      });
  }, [baseBowlers, selectedComp, selectedSeason, countryFilter, teamFilter, rrSpotlight, searchTerm, sortField]);

  const displayBatters = datasetScope === 'official20' ? eligibleBatters.slice(0, 10) : eligibleBatters;
  const displayBowlers = datasetScope === 'official20' ? eligibleBowlers.slice(0, 10) : eligibleBowlers;

  const handleExport = () => {
    const list = isBatters ? displayBatters : displayBowlers;
    const formatted = list.map((p) => ({
      Rank: p.rank,
      Name: p.name,
      Country: p.country || 'N/A',
      Country_Flag: p.country_flag || '🏏',
      Role: p.player_role || (isBatters ? 'Batter' : 'Bowler'),
      Team: p.team,
      Pressure_Rating: p.rating,
      Matches_Analysed: p.matchesAnalysed,
      Pressure_Matches: p.pressureMatches,
      Pressure_Metric: isBatters ? (p as Batter).pressureSR : (p as Bowler).pressureEcon,
      Baseline_Metric: isBatters ? (p as Batter).normalSR : (p as Bowler).normalEcon,
      Improvement_Delta: isBatters ? (p as Batter).srDelta : (p as Bowler).econDelta,
      Verdict: p.verdict || '',
    }));

    exportToCSV(
      `supeRR_rankings_${role}_${datasetScope}_${selectedComp.toLowerCase()}`,
      formatted
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Main Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#E90074]/20 text-[#E90074] border border-[#E90074]/30">
              {datasetScope === 'official20' ? 'Official SupeRR 20 Selection' : 'Full Tournament Database'}
            </span>
            {selectedComp !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-950/60 text-purple-300 border border-purple-500/40">
                {selectedComp}
              </span>
            )}
            {selectedSeason !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                Season {selectedSeason}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#F7F7FB] flex items-center gap-2.5 tracking-tight uppercase">
            <RoyalCrestEmblem size={30} />
            SupeRR Selector 2.0 Leaderboards
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            Strict empirical pressure rankings with international country identity, custom avatars and ball-by-ball clutch analysis.
          </p>
        </div>

        {/* Role Toggle Switch & Export Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-[#171F35] p-1 rounded-xl border border-[#29334C]">
            <button
              onClick={() => {
                setRole('batters');
                setSearchTerm('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isBatters
                  ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white shadow-rr-pink'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <CricketBatIcon size={14} className="text-amber-300" />
              Top 10 Batters
            </button>
            <button
              onClick={() => {
                setRole('bowlers');
                setSearchTerm('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                !isBatters
                  ? 'bg-gradient-to-r from-[#7545C8] to-[#E90074] text-white shadow-rr-purple'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <BowlingMotionIcon size={14} className="text-purple-300" />
              Top 10 Bowlers
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#384666] text-xs font-semibold transition-all"
            title="Download Official Rankings CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dataset Scope Tabs: Official SupeRR 20 vs All Tournament Database */}
      <div className="flex items-center gap-2 border-b border-[#29334C] pb-3 text-xs">
        <button
          onClick={() => setDatasetScope('official20')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            datasetScope === 'official20'
              ? 'bg-[#E90074] text-white shadow-md shadow-pink-500/20'
              : 'bg-[#121A2D] text-[#929BB2] hover:text-white border border-[#29334C]'
          }`}
        >
          <Crown size={13} />
          <span>SupeRR 20 Official Selection (Top 10 {isBatters ? 'Batters' : 'Bowlers'})</span>
        </button>

        <button
          onClick={() => setDatasetScope('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            datasetScope === 'all'
              ? 'bg-[#7545C8] text-white shadow-md shadow-purple-500/20'
              : 'bg-[#121A2D] text-[#929BB2] hover:text-white border border-[#29334C]'
          }`}
        >
          <Globe2 size={13} />
          <span>Full Database ({isBatters ? batters.length : bowlers.length} Players)</span>
        </button>
      </div>

      {/* Interactive Filter Bar */}
      <div className="rr-glass-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[190px]">
            <Search size={14} className="absolute left-3 top-2.5 text-[#929BB2]" />
            <input
              type="text"
              placeholder={`Search ${isBatters ? 'batters' : 'bowlers'} by name or country...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F7F7FB] outline-none focus:border-[#E90074]"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2]">
            <Globe2 size={13} className="text-[#E90074]" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35]">All Countries</option>
              {uniqueCountries.map(([cName, cFlag]) => (
                <option key={cName} value={cName} className="bg-[#171F35]">
                  {cFlag} {cName}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-1 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2]">
            <Filter size={12} className="text-[#7545C8]" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35]">All Teams</option>
              {uniqueTeams.map((t) => (
                <option key={t} value={t} className="bg-[#171F35]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div className="flex items-center gap-1 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-transparent text-[#F7F7FB] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="rank" className="bg-[#171F35]">Official Rank (#1-10)</option>
              <option value="rating" className="bg-[#171F35]">Pressure Rating (BPI)</option>
              <option value="delta" className="bg-[#171F35]">Improvement Delta</option>
              <option value="volume" className="bg-[#171F35]">{isBatters ? 'Pressure Runs' : 'Pressure Wickets'}</option>
            </select>
          </div>

          {/* Rajasthan Royals Spotlight Button */}
          <button
            onClick={() => setRrSpotlight(!rrSpotlight)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              rrSpotlight
                ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white border-transparent shadow-rr-pink'
                : 'bg-[#121A2D] text-[#C9C3DF] border-[#29334C] hover:border-[#E90074]/50'
            }`}
          >
            <Sparkles size={13} />
            <span>👑 Rajasthan Royals Spotlight</span>
          </button>
        </div>

        {/* View Mode Toggle: Cards vs Table */}
        <div className="flex items-center gap-1 bg-[#121A2D] p-1 rounded-xl border border-[#29334C]">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'cards' ? 'bg-[#E90074] text-white' : 'text-[#929BB2] hover:text-white'
            }`}
            title="Card View (Primary)"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-[#E90074] text-white' : 'text-[#929BB2] hover:text-white'
            }`}
            title="Broadcasting Table View"
          >
            <TableIcon size={14} />
          </button>
        </div>
      </div>

      {/* PRIMARY PRESENTATION: INTERACTIVE RANKING CARDS */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isBatters
            ? displayBatters.map((b) => (
                <PlayerCard
                  key={b.id || b.player_id}
                  player={b}
                  type="batter"
                  onSelect={(p) => onSelectPlayer(p, 'batter')}
                  onCompare={onComparePlayer}
                />
              ))
            : displayBowlers.map((bw) => (
                <PlayerCard
                  key={bw.id || bw.player_id}
                  player={bw}
                  type="bowler"
                  onSelect={(p) => onSelectPlayer(p, 'bowler')}
                  onCompare={onComparePlayer}
                />
              ))}
        </div>
      ) : (
        /* DENSE BROADCASTING TABLE VIEW */
        <div className="rr-glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121A2D] border-b border-[#29334C] text-[#929BB2] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-3 w-14 text-center">Rank</th>
                  <th className="py-3.5 px-3">Player Identity</th>
                  <th className="py-3.5 px-3">Nationality</th>
                  <th className="py-3.5 px-3">Role</th>
                  <th className="py-3.5 px-3">Team</th>
                  <th className="py-3.5 px-3">Matches Analysed</th>
                  <th className="py-3.5 px-3">
                    {isBatters ? 'Pressure Runs (Balls)' : 'Pressure Overs (Runs)'}
                  </th>
                  <th className="py-3.5 px-3">
                    {isBatters ? 'Pressure SR' : 'Pressure Economy'}
                  </th>
                  <th className="py-3.5 px-3">
                    {isBatters ? 'Normal SR' : 'Normal Economy'}
                  </th>
                  <th className="py-3.5 px-3">Improvement</th>
                  <th className="py-3.5 px-3">
                    {isBatters ? 'BPI Rating' : 'BPI-Bowl'}
                  </th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29334C]/50 text-[#F7F7FB]">
                {(isBatters ? displayBatters : displayBowlers).map((p) => {
                  const batter = isBatters ? (p as Batter) : null;
                  const bowler = !isBatters ? (p as Bowler) : null;
                  const isTop3 = p.rank <= 3;
                  const delta = isBatters ? batter!.srDelta : bowler!.econDelta;

                  return (
                    <tr
                      key={p.id || p.player_id}
                      onClick={() => onSelectPlayer(p, isBatters ? 'batter' : 'bowler')}
                      className={`hover:bg-[#121A2D]/80 transition-colors group cursor-pointer ${
                        isTop3 ? 'bg-[#171F35]/70' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center font-mono font-bold">
                        <span
                          className={`inline-block w-6 h-6 rounded-md leading-6 text-center text-xs ${
                            p.rank === 1
                              ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                              : p.rank === 2
                              ? 'bg-slate-300 text-black font-extrabold shadow-sm'
                              : p.rank === 3
                              ? 'bg-amber-700 text-white font-extrabold shadow-sm'
                              : 'text-[#929BB2]'
                          }`}
                        >
                          {p.rank}
                        </span>
                      </td>

                      {/* Player Identity with unique Avatar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <PlayerAvatar
                            name={p.name}
                            team={p.team}
                            role={p.player_role || (isBatters ? 'batter' : 'bowler')}
                            size="sm"
                            avatarIcon={p.avatar_icon}
                            countryFlag={p.country_flag}
                            countryCode={p.country_code}
                            showFlag={false}
                            showRank={false}
                          />
                          <span className="font-bold text-[#F7F7FB] group-hover:text-[#E90074] transition-colors truncate max-w-[160px]">
                            {p.name}
                          </span>
                        </div>
                      </td>

                      {/* Country Flag & Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          <span className="text-sm">{p.country_flag || '🏏'}</span>
                          <span className="text-[#C9C3DF]">{p.country || 'International'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#121A2D] text-[#929BB2] border border-[#29334C]">
                          {p.player_role || (isBatters ? 'Batter' : 'Bowler')}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-3 text-[#929BB2] truncate max-w-[130px]">
                        {p.team}
                      </td>

                      {/* Matches Analysed */}
                      <td className="py-3.5 px-3 font-mono text-[#929BB2]">
                        {p.matchesAnalysed}{' '}
                        <span className="text-[10px] text-[#64748B]">({p.pressureMatches} Pressure)</span>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-3 font-mono">
                        {isBatters ? (
                          <>
                            {batter!.pressureRuns}{' '}
                            <span className="text-[10px] text-[#929BB2]">({batter!.pressureBalls}b)</span>
                          </>
                        ) : (
                          <>
                            {bowler!.pressureOvers} ov{' '}
                            <span className="text-[10px] text-[#929BB2]">({bowler!.pressureWickets}w)</span>
                          </>
                        )}
                      </td>

                      {/* Pressure Metric */}
                      <td className="py-3.5 px-3 font-mono font-bold text-[#E90074]">
                        {isBatters ? batter!.pressureSR : bowler!.pressureEcon}
                      </td>

                      {/* Normal Metric */}
                      <td className="py-3.5 px-3 font-mono text-[#929BB2]">
                        {isBatters ? batter!.normalSR : bowler!.normalEcon}
                      </td>

                      {/* Improvement Delta */}
                      <td className="py-3.5 px-3 font-mono font-semibold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            delta >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {delta >= 0 ? `+${delta}` : delta}
                        </span>
                      </td>

                      {/* BPI Rating */}
                      <td className="py-3.5 px-3 font-mono font-black text-sm text-[#F7F7FB]">
                        <span className={isBatters ? 'text-[#E90074]' : 'text-[#7545C8]'}>
                          {p.rating}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-normal"> / 100</span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPlayer(p, isBatters ? 'batter' : 'bowler')}
                            className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C] transition-colors"
                            title="View Full Profile"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => onComparePlayer(p)}
                            className="p-1.5 rounded-lg bg-[#E90074]/15 hover:bg-[#E90074]/30 text-[#E90074] border border-[#E90074]/30 transition-colors"
                            title="Compare in Studio"
                          >
                            <GitCompare size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
