import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Bookmark,
  Dna,
  Crown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Batter } from '../types';
import { Badge } from '../components/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayerCard } from '../components/PlayerCard';
import { MetricTooltip } from '../components/MetricTooltip';
import { exportToCSV } from '../utils/csvExport';
import { CricketBatIcon, CricketBallIcon } from '../components/CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';

interface BattingAnalyticsPageProps {
  batters: Batter[];
  selectedComp: string;
  selectedSeason: string;
  onSelectPlayer: (player: Batter) => void;
  onComparePlayer: (player: Batter) => void;
}

export const BattingAnalyticsPage: React.FC<BattingAnalyticsPageProps> = ({
  batters,
  selectedComp,
  selectedSeason,
  onSelectPlayer,
  onComparePlayer,
}) => {
  const { isShortlisted, toggleShortlist, openPlayerDNA } = useEcosystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [rrSpotlight, setRrSpotlight] = useState(false);
  const [sortField, setSortField] = useState<keyof Batter>('rating');
  const [sortAsc, setSortAsc] = useState(false);
  const [minBalls, setMinBalls] = useState(50);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Extract unique teams & countries
  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    batters.forEach((b) => {
      if (b.team) set.add(b.team);
      b.teams.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [batters]);

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    batters.forEach((b) => {
      if (b.country) set.add(b.country);
    });
    return Array.from(set).sort();
  }, [batters]);

  // Filtered and sorted batters
  const filteredBatters = useMemo(() => {
    return batters
      .filter((b) => {
        const matchesSearch =
          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.team.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTeam = teamFilter === 'ALL' || b.team === teamFilter || b.teams.includes(teamFilter);
        const matchesCountry = countryFilter === 'ALL' || b.country === countryFilter;

        let matchesRole = true;
        if (roleFilter !== 'ALL') {
          const r = (b.player_role || '').toLowerCase();
          if (roleFilter === 'Opener') matchesRole = r.includes('opener') || r.includes('top');
          else if (roleFilter === 'Finisher') matchesRole = r.includes('finisher') || r.includes('power');
          else if (roleFilter === 'Wicketkeeper') matchesRole = r.includes('keeper') || r.includes('wk');
          else if (roleFilter === 'All-Rounder') matchesRole = r.includes('all-rounder') || r.includes('all rounder');
          else if (roleFilter === 'Middle') matchesRole = r.includes('middle') || r.includes('anchor');
        }

        const matchesBalls = b.pressureBalls >= minBalls;

        if (rrSpotlight) {
          const isRR =
            b.team.toLowerCase().includes('rajasthan') ||
            b.teams.some((t) => t.toLowerCase().includes('rajasthan'));
          if (!isRR) return false;
        }

        if (selectedComp === 'IPL' && b.ipl.balls === 0) return false;
        if (selectedComp === 'T20I' && b.t20i.balls === 0) return false;
        if (selectedSeason !== 'ALL') {
          const shortYr = selectedSeason.slice(-2);
          const hasSeason = Object.entries(b.seasons || {}).some(
            ([k, v]) =>
              (k === selectedSeason || k.startsWith(`${selectedSeason}/`) || k.endsWith(`/${shortYr}`)) &&
              v.balls > 0
          );
          if (!hasSeason) return false;
        }

        return matchesSearch && matchesTeam && matchesCountry && matchesRole && matchesBalls;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
  }, [
    batters,
    searchTerm,
    teamFilter,
    countryFilter,
    roleFilter,
    rrSpotlight,
    minBalls,
    sortField,
    sortAsc,
    selectedComp,
    selectedSeason,
  ]);

  const handleSort = (field: keyof Batter) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Top 10 SR improvement chart data
  const topImprovementData = useMemo(() => {
    return [...filteredBatters]
      .sort((a, b) => b.srDelta - a.srDelta)
      .slice(0, 10)
      .map((b) => ({
        name: b.name.split(' ').slice(-1)[0],
        fullName: b.name,
        delta: b.srDelta,
        pressureSR: b.pressureSR,
        normalSR: b.normalSR,
      }));
  }, [filteredBatters]);

  // Scatter plot data: Baseline SR vs Pressure SR
  const scatterData = useMemo(() => {
    return filteredBatters.slice(0, 30).map((b) => ({
      name: b.name,
      normalSR: b.normalSR,
      pressureSR: b.pressureSR,
      runs: b.pressureRuns,
      rating: b.rating,
    }));
  }, [filteredBatters]);

  const handleExport = () => {
    exportToCSV('supeRR_batting_analytics', filteredBatters);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F7FB] flex items-center gap-2">
            <CricketBatIcon className="text-[#E90074]" size={26} />
            BATTERS WHO DELIVER: Batting Analytics
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            Evaluating {filteredBatters.length} qualified batters against baselines and match context
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#384666] text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Visualizations: Pressure vs Normal SR & SR Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Strike Rate Delta Acceleration */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Top Strike Rate Elevation</h3>
              <p className="text-xs text-[#929BB2]">Difference: Pressure SR minus Baseline SR</p>
            </div>
            <Badge variant="pink">Clutch Delta</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topImprovementData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" vertical={false} />
                <XAxis dataKey="name" stroke="#929BB2" fontSize={10} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="#929BB2" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `+${val} (Press: ${item.payload.pressureSR} vs Norm: ${item.payload.normalSR})`,
                    'Delta SR',
                  ]}
                />
                <Bar dataKey="delta" fill="#E90074" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pressure SR vs Baseline SR Scatter */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Pressure SR vs Normal SR</h3>
              <p className="text-xs text-[#929BB2]">Batters above the diagonal line accelerate in crunch moments</p>
            </div>
            <Badge variant="purple">Baseline Correlation</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                <XAxis dataKey="normalSR" name="Normal SR" stroke="#929BB2" fontSize={11} unit="" domain={[110, 180]} />
                <YAxis dataKey="pressureSR" name="Pressure SR" stroke="#929BB2" fontSize={11} unit="" domain={[140, 240]} />
                <ZAxis dataKey="runs" range={[40, 260]} name="Pressure Runs" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                  formatter={(value: any, name: any) => [value, name]}
                />
                <Scatter name="Batters" data={scatterData} fill="#E90074" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 3 Batting Podium */}
      {filteredBatters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {filteredBatters.slice(0, 3).map((b, idx) => {
            const podiumTheme =
              idx === 0
                ? 'border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-[#121A2D] to-[#14192E]'
                : idx === 1
                  ? 'border-slate-300/40 bg-gradient-to-br from-slate-400/10 via-[#121A2D] to-[#14192E]'
                  : 'border-amber-700/50 bg-gradient-to-br from-amber-700/15 via-[#121A2D] to-[#14192E]';
            const badgeColor =
              idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white';
            return (
              <div
                key={b.id}
                onClick={() => onSelectPlayer(b)}
                className={`rr-glass-card p-4 cursor-pointer transition-all hover:scale-[1.01] ${podiumTheme}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono flex items-center gap-1 ${badgeColor}`}>
                    {idx === 0 && <Crown size={11} />} PODIUM #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E90074]">BPI {b.rating}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={b.name}
                    team={b.team}
                    role={b.player_role || 'batter'}
                    size="md"
                    avatarIcon={b.avatar_icon}
                    countryFlag={b.country_flag}
                    countryCode={b.country_code}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">{b.name}</div>
                    <div className="text-[11px] text-[#929BB2] truncate">
                      {b.country_flag} {b.team} · {b.matchesAnalysed}m
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#29334C]/60 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">RUNS</span>
                    <span className="text-xs font-bold text-white">{b.totalRuns}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">AVG</span>
                    <span className="text-xs font-bold text-white">{(b.battingAvg ?? 0).toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">HS</span>
                    <span className="text-xs font-bold text-amber-300">
                      {b.highestScore ?? 0}{b.highestScoreNotOut ? '*' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">P-SR</span>
                    <span className="text-xs font-bold text-[#FF47A3]">{b.pressureSR}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Filters Bar */}
      <div className="rr-glass-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-2.5 text-[#929BB2]" />
            <input
              type="text"
              placeholder="Search by batter name or franchise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F7F7FB] outline-none focus:border-[#E90074]"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
              aria-label="Filter batters by country"
            >
              <option value="ALL" className="bg-[#171F35]">All Countries</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c} className="bg-[#171F35]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
              aria-label="Filter batters by batting role"
            >
              <option value="ALL" className="bg-[#171F35]">All Roles</option>
              <option value="Opener" className="bg-[#171F35]">Opener / Top-Order</option>
              <option value="Middle" className="bg-[#171F35]">Middle-Order</option>
              <option value="Finisher" className="bg-[#171F35]">Finisher</option>
              <option value="Wicketkeeper" className="bg-[#171F35]">Wicketkeeper</option>
              <option value="All-Rounder" className="bg-[#171F35]">All-Rounder</option>
            </select>
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <Filter size={13} className="text-[#E90074]" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35]">All Franchises</option>
              {uniqueTeams.map((t) => (
                <option key={t} value={t} className="bg-[#171F35]">
                  {t}
                </option>
              ))}
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

          {/* Min Pressure Balls Slider */}
          <div className="flex items-center gap-2 text-xs text-[#929BB2] bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5">
            <span>Min Balls: <strong className="text-[#F7F7FB] font-mono">{minBalls}b</strong></span>
            <input
              type="range"
              min="30"
              max="150"
              step="10"
              value={minBalls}
              onChange={(e) => setMinBalls(parseInt(e.target.value, 10))}
              className="w-20 accent-[#E90074] cursor-pointer"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#121A2D] p-1 rounded-xl border border-[#29334C]">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'cards' ? 'bg-[#E90074] text-white' : 'text-[#929BB2] hover:text-white'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-[#E90074] text-white' : 'text-[#929BB2] hover:text-white'
            }`}
            title="Table View"
          >
            <TableIcon size={14} />
          </button>
        </div>
      </div>

      {/* PRESENTATION: CARDS OR TABLE */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatters.map((b) => (
            <PlayerCard
              key={b.id}
              player={b}
              type="batter"
              onSelect={(p) => onSelectPlayer(p as Batter)}
              onCompare={(p) => onComparePlayer(p as Batter)}
            />
          ))}
        </div>
      ) : (
        <div className="rr-glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121A2D] border-b border-[#29334C] text-[#929BB2] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-2.5 w-11 text-center">Rank</th>
                  <th className="py-3 px-2.5">Player</th>
                  <th className="py-3 px-2.5">Team</th>
                  <th onClick={() => handleSort('rating')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">BPI <MetricTooltip term="BPI" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('matchesAnalysed')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Mat <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalRuns')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Runs (B) <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('battingAvg')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Avg <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('highestScore')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">HS <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalSR')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">SR <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('pressureSR')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Press SR <MetricTooltip term="Pressure Strike Rate" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalSixes')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">4s/6s <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalBoundaryPct')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Bdry% <MetricTooltip term="Boundary %" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('consistencyScore')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Cons <MetricTooltip term="Consistency" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29334C]/50 text-[#F7F7FB]">
                {filteredBatters.map((b, displayIdx) => {
                  const shortlisted = isShortlisted(b.id) || isShortlisted(b.name);
                  const trend = b.trendDelta ?? 0;
                  return (
                  <tr
                    key={b.id}
                    className="hover:bg-[#121A2D]/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectPlayer(b)}
                  >
                    <td className="py-3 px-2.5 text-center font-mono font-bold">
                      <span
                        className={`inline-block w-6 h-6 rounded-md leading-6 text-center text-xs ${
                          displayIdx === 0
                            ? 'bg-amber-400 text-black font-extrabold'
                            : displayIdx === 1
                            ? 'bg-slate-300 text-black font-extrabold'
                            : displayIdx === 2
                            ? 'bg-amber-700 text-white font-extrabold'
                            : 'text-[#929BB2]'
                        }`}
                      >
                        {displayIdx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 flex items-center gap-2">
                      <PlayerAvatar
                        name={b.name}
                        team={b.team}
                        role={b.player_role || "batter"}
                        size="sm"
                        avatarIcon={b.avatar_icon}
                        countryFlag={b.country_flag}
                        countryCode={b.country_code}
                        showFlag={false}
                        showRank={false}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#F7F7FB] group-hover:text-[#E90074] transition-colors truncate">
                          {b.name}
                        </span>
                        <span className="text-[10px] text-[#929BB2] flex items-center gap-1 font-mono">
                          <span>{b.country_flag || '🏏'}</span>
                          <span className="truncate">{b.player_role || 'Batter'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2.5 text-[#929BB2] truncate max-w-[110px]">{b.team}</td>
                    <td className="py-3 px-2.5 font-mono font-bold text-[#E90074] text-sm">
                      <div className="flex items-center gap-1">
                        <span>{b.rating}</span>
                        {trend !== 0 && (
                          <span title={`Seasonal pressure SR trend: ${trend > 0 ? '+' : ''}${trend}`} className="inline-flex">
                            {trend > 0 ? <TrendingUp size={11} className="text-emerald-400" /> : <TrendingDown size={11} className="text-rose-400" />}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2.5 font-mono text-[#C9C3DF]">{b.matchesAnalysed}</td>
                    <td className="py-3 px-2.5 font-mono">
                      <span className="font-semibold text-white">{b.totalRuns}</span>{' '}
                      <span className="text-[10px] text-[#929BB2]">({b.totalBalls}b)</span>
                    </td>
                    <td className="py-3 px-2.5 font-mono font-semibold text-[#C9C3DF]">
                      {(b.battingAvg ?? 0).toFixed(1)}
                    </td>
                    <td className="py-3 px-2.5 font-mono font-bold text-amber-300">
                      {b.highestScore ?? 0}{b.highestScoreNotOut ? '*' : ''}
                    </td>
                    <td className="py-3 px-2.5 font-mono text-[#C9C3DF]">{b.totalSR.toFixed(1)}</td>
                    <td className="py-3 px-2.5 font-mono font-bold text-white">{b.pressureSR.toFixed(1)}</td>
                    <td className="py-3 px-2.5 font-mono text-[11px]">
                      <span className="text-[#C9C3DF]">{b.totalFours ?? 0}</span>
                      <span className="text-[#64748B]">/</span>
                      <span className="text-[#FF47A3] font-bold">{b.totalSixes ?? 0}</span>
                    </td>
                    <td className="py-3 px-2.5 font-mono">{(b.totalBoundaryPct ?? b.boundaryPct).toFixed(1)}%</td>
                    <td className="py-3 px-2.5 font-mono text-[#C9C3DF]">{b.consistencyScore}</td>
                    <td className="py-3 px-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleShortlist(b.id, 'Batting Leaderboard')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            shortlisted
                              ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                              : 'bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-white border-[#29334C]'
                          }`}
                          title={shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                        >
                          <Bookmark size={12} className={shortlisted ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => openPlayerDNA(b, 'batter')}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          title="Inspect 6-Axis DNA"
                        >
                          <Dna size={12} />
                        </button>
                        <button
                          onClick={() => onSelectPlayer(b)}
                          className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C]"
                          title="View Full Analytical Dossier"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => onComparePlayer(b)}
                          className="p-1.5 rounded-lg bg-[#E90074]/15 hover:bg-[#E90074]/30 text-[#E90074] border border-[#E90074]/30"
                          title="Compare in Studio"
                        >
                          <GitCompare size={12} />
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
