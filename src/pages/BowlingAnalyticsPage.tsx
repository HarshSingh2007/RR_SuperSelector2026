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
import { Bowler } from '../types';
import { Badge } from '../components/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayerCard } from '../components/PlayerCard';
import { MetricTooltip } from '../components/MetricTooltip';
import { exportToCSV } from '../utils/csvExport';
import { BowlingMotionIcon, CricketBallIcon } from '../components/CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';

interface BowlingAnalyticsPageProps {
  bowlers: Bowler[];
  selectedComp: string;
  selectedSeason: string;
  onSelectPlayer: (player: Bowler) => void;
  onComparePlayer: (player: Bowler) => void;
}

export const BowlingAnalyticsPage: React.FC<BowlingAnalyticsPageProps> = ({
  bowlers,
  selectedComp,
  selectedSeason,
  onSelectPlayer,
  onComparePlayer,
}) => {
  const { isShortlisted, toggleShortlist, openPlayerDNA } = useEcosystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [rrSpotlight, setRrSpotlight] = useState(false);
  const [sortField, setSortField] = useState<keyof Bowler>('rating');
  const [sortAsc, setSortAsc] = useState(false);
  const [minOvers, setMinOvers] = useState(8);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    bowlers.forEach((bw) => {
      if (bw.team) set.add(bw.team);
      bw.teams.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [bowlers]);

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    bowlers.forEach((bw) => {
      if (bw.country) set.add(bw.country);
    });
    return Array.from(set).sort();
  }, [bowlers]);

  const filteredBowlers = useMemo(() => {
    return bowlers
      .filter((bw) => {
        const matchesSearch =
          bw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bw.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bw.bowlingType.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTeam = teamFilter === 'ALL' || bw.team === teamFilter || bw.teams.includes(teamFilter);
        const matchesCountry = countryFilter === 'ALL' || bw.country === countryFilter;

        let matchesType = true;
        if (typeFilter === 'PACE') {
          matchesType =
            bw.bowlingType.toLowerCase().includes('fast') ||
            bw.bowlingType.toLowerCase().includes('medium') ||
            bw.bowlingType.toLowerCase().includes('pace');
        } else if (typeFilter === 'SPIN') {
          matchesType =
            bw.bowlingType.toLowerCase().includes('spin') ||
            bw.bowlingType.toLowerCase().includes('orthodox') ||
            bw.bowlingType.toLowerCase().includes('leg-break');
        }

        const matchesOvers = bw.pressureOvers >= minOvers;

        if (rrSpotlight) {
          const isRR =
            bw.team.toLowerCase().includes('rajasthan') ||
            bw.teams.some((t) => t.toLowerCase().includes('rajasthan'));
          if (!isRR) return false;
        }

        if (selectedComp === 'IPL' && bw.ipl.overs === 0) return false;
        if (selectedComp === 'T20I' && bw.t20i.overs === 0) return false;
        if (selectedSeason !== 'ALL') {
          const shortYr = selectedSeason.slice(-2);
          const hasSeason = Object.entries(bw.seasons || {}).some(
            ([k, v]) =>
              (k === selectedSeason || k.startsWith(`${selectedSeason}/`) || k.endsWith(`/${shortYr}`)) &&
              v.balls > 0
          );
          if (!hasSeason) return false;
        }

        return matchesSearch && matchesTeam && matchesCountry && matchesType && matchesOvers;
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
  }, [bowlers, searchTerm, teamFilter, countryFilter, typeFilter, rrSpotlight, minOvers, sortField, sortAsc, selectedComp, selectedSeason]);

  const handleSort = (field: keyof Bowler) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Top Economy Suppression Chart Data
  const topSuppressionData = useMemo(() => {
    return [...filteredBowlers]
      .sort((a, b) => b.econDelta - a.econDelta)
      .slice(0, 10)
      .map((bw) => ({
        name: bw.name.split(' ').slice(-1)[0],
        fullName: bw.name,
        delta: bw.econDelta,
        pressureEcon: bw.pressureEcon,
        normalEcon: bw.normalEcon,
      }));
  }, [filteredBowlers]);

  // Scatter plot: Economy vs Wickets
  const scatterData = useMemo(() => {
    return filteredBowlers.slice(0, 30).map((bw) => ({
      name: bw.name,
      pressureEcon: bw.pressureEcon,
      wickets: bw.pressureWickets,
      dotPct: bw.dotPct,
      rating: bw.rating,
    }));
  }, [filteredBowlers]);

  const handleExport = () => {
    exportToCSV('supeRR_bowling_analytics', filteredBowlers);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F7FB] flex items-center gap-2">
            <BowlingMotionIcon className="text-[#7545C8]" size={26} />
            BOWLERS WHO CONTROL THE GAME: Bowling Analytics
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            Evaluating {filteredBowlers.length} qualified bowlers across economy containment and clutch wickets
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

      {/* Visualizations: Economy Delta & Wickets vs Economy Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Economy Suppression Delta */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Top Economy Suppression</h3>
              <p className="text-xs text-[#929BB2]">Difference: Baseline Economy minus Pressure Economy</p>
            </div>
            <Badge variant="purple">Run Containment</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppressionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                    `+${val} rpo saved (Press: ${item.payload.pressureEcon} vs Norm: ${item.payload.normalEcon})`,
                    'Economy Delta',
                  ]}
                />
                <Bar dataKey="delta" fill="#7545C8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Economy vs Dot Ball % Scatter */}
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">Pressure Economy vs Dot Ball %</h3>
              <p className="text-xs text-[#929BB2]">Elite death-over bowlers maintain high dot percentages</p>
            </div>
            <Badge variant="pink">Execution Quality</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" />
                <XAxis dataKey="pressureEcon" name="Pressure Economy" stroke="#929BB2" fontSize={11} domain={[4, 12]} />
                <YAxis dataKey="dotPct" name="Dot Ball %" stroke="#929BB2" fontSize={11} unit="%" domain={[25, 60]} />
                <ZAxis dataKey="wickets" range={[40, 260]} name="Pressure Wickets" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
                <Scatter name="Bowlers" data={scatterData} fill="#7545C8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 3 Bowling Podium */}
      {filteredBowlers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {filteredBowlers.slice(0, 3).map((bw, idx) => {
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
                key={bw.id}
                onClick={() => onSelectPlayer(bw)}
                className={`rr-glass-card p-4 cursor-pointer transition-all hover:scale-[1.01] ${podiumTheme}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono flex items-center gap-1 ${badgeColor}`}>
                    {idx === 0 && <Crown size={11} />} PODIUM #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#7545C8]">BPI {bw.rating}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={bw.name}
                    team={bw.team}
                    role={bw.player_role || 'bowler'}
                    size="md"
                    avatarIcon={bw.avatar_icon}
                    countryFlag={bw.country_flag}
                    countryCode={bw.country_code}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">{bw.name}</div>
                    <div className="text-[11px] text-[#929BB2] truncate">
                      {bw.country_flag} {bw.team} · {bw.bowlingType}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#29334C]/60 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">WKTS</span>
                    <span className="text-xs font-bold text-white">{bw.totalWickets}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">ECON</span>
                    <span className="text-xs font-bold text-white">{bw.totalEcon.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">BEST</span>
                    <span className="text-xs font-bold text-amber-300">{bw.bestBowling ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#929BB2] block">P-ECON</span>
                    <span className="text-xs font-bold text-[#7545C8]">{bw.pressureEcon}</span>
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
              placeholder="Search by bowler, team or style..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F7F7FB] outline-none focus:border-[#7545C8]"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
              aria-label="Filter bowlers by country"
            >
              <option value="ALL" className="bg-[#171F35]">All Countries</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c} className="bg-[#171F35]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Style Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-[#F7F7FB] outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35]">All Styles (Pace & Spin)</option>
              <option value="PACE" className="bg-[#171F35]">Pace / Fast Bowlers</option>
              <option value="SPIN" className="bg-[#171F35]">Spin / Orthodox</option>
            </select>
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 py-1.5 text-xs text-[#929BB2]">
            <Filter size={13} className="text-[#7545C8]" />
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

          {/* Min Overs Slider */}
          <div className="flex items-center gap-2 text-xs text-[#929BB2] bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5">
            <span>Min Overs: <strong className="text-[#F7F7FB] font-mono">{minOvers} ov</strong></span>
            <input
              type="range"
              min="5"
              max="25"
              step="2"
              value={minOvers}
              onChange={(e) => setMinOvers(parseInt(e.target.value, 10))}
              className="w-20 accent-[#7545C8] cursor-pointer"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#121A2D] p-1 rounded-xl border border-[#29334C]">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'cards' ? 'bg-[#7545C8] text-white' : 'text-[#929BB2] hover:text-white'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-[#7545C8] text-white' : 'text-[#929BB2] hover:text-white'
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
          {filteredBowlers.map((bw) => (
            <PlayerCard
              key={bw.id}
              player={bw}
              type="bowler"
              onSelect={(p) => onSelectPlayer(p as Bowler)}
              onCompare={(p) => onComparePlayer(p as Bowler)}
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
                  <th className="py-3 px-2.5">Style / Team</th>
                  <th onClick={() => handleSort('rating')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">BPI <MetricTooltip term="BPI-Bowl" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('matchesAnalysed')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Mat <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalWickets')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Wkts (Ov) <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('totalEcon')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Econ <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('pressureEcon')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Press Econ <MetricTooltip term="Pressure Economy" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('overallBowlingAvg')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Avg / SR <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('overallDotPct')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Dot% <MetricTooltip term="Dot Ball %" /> <ArrowUpDown size={10} /></div>
                  </th>
                  <th onClick={() => handleSort('maidenOvers')} className="py-3 px-2.5 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">Mdn / Best <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3 px-2.5">PP / Mid / Dth</th>
                  <th className="py-3 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29334C]/50 text-[#F7F7FB]">
                {filteredBowlers.map((bw, displayIdx) => {
                  const shortlisted = isShortlisted(bw.id) || isShortlisted(bw.name);
                  const trend = bw.trendDelta ?? 0;
                  return (
                  <tr
                    key={bw.id}
                    className="hover:bg-[#121A2D]/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectPlayer(bw)}
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
                        name={bw.name}
                        team={bw.team}
                        role={bw.player_role || "bowler"}
                        size="sm"
                        avatarIcon={bw.avatar_icon}
                        countryFlag={bw.country_flag}
                        countryCode={bw.country_code}
                        showFlag={false}
                        showRank={false}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#F7F7FB] group-hover:text-[#7545C8] transition-colors truncate">
                          {bw.name}
                        </span>
                        <span className="text-[10px] text-[#929BB2] flex items-center gap-1 font-mono">
                          <span>{bw.country_flag || '🏏'}</span>
                          <span>{bw.country || 'International'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2.5 text-[#929BB2]">
                      <div className="truncate max-w-[110px]">{bw.team}</div>
                      <div className="text-[10px] text-[#64748B] truncate max-w-[110px]">{bw.bowlingType}</div>
                    </td>
                    <td className="py-3 px-2.5 font-mono font-bold text-[#7545C8] text-sm">
                      <div className="flex items-center gap-1">
                        <span>{bw.rating}</span>
                        {trend !== 0 && (
                          <span title={`Pressure economy trend: ${trend > 0 ? '+' : ''}${trend}`} className="inline-flex">
                            {trend > 0 ? <TrendingUp size={11} className="text-emerald-400" /> : <TrendingDown size={11} className="text-rose-400" />}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2.5 font-mono text-[#C9C3DF]">{bw.matchesAnalysed}</td>
                    <td className="py-3 px-2.5 font-mono">
                      <span className="font-bold text-amber-400">{bw.totalWickets}</span>{' '}
                      <span className="text-[10px] text-[#929BB2]">({bw.totalOvers}ov)</span>
                    </td>
                    <td className="py-3 px-2.5 font-mono text-[#C9C3DF]">{bw.totalEcon.toFixed(2)}</td>
                    <td className="py-3 px-2.5 font-mono font-bold text-white">{bw.pressureEcon.toFixed(2)}</td>
                    <td className="py-3 px-2.5 font-mono text-[11px] text-[#C9C3DF]">
                      {bw.overallBowlingAvg?.toFixed(1) ?? 'N/A'} <span className="text-[#64748B]">/</span> {bw.overallWicketSR?.toFixed(1) ?? 'N/A'}b
                    </td>
                    <td className="py-3 px-2.5 font-mono">{(bw.overallDotPct ?? bw.dotPct).toFixed(1)}%</td>
                    <td className="py-3 px-2.5 font-mono text-[11px]">
                      <span className="text-[#929BB2]">{bw.maidenOvers ?? 0}m</span>{' '}
                      <span className="text-amber-300 font-bold">{bw.bestBowling ?? 'N/A'}</span>
                    </td>
                    <td className="py-3 px-2.5 font-mono text-[10px] text-[#C9C3DF] whitespace-nowrap">
                      {(bw.powerplayEcon ?? 0).toFixed(1)} / {(bw.middleEcon ?? 0).toFixed(1)} / {(bw.deathOverallEcon ?? bw.deathEcon).toFixed(1)}
                    </td>
                    <td className="py-3 px-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleShortlist(bw.id, 'Bowling Leaderboard')}
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
                          onClick={() => openPlayerDNA(bw, 'bowler')}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          title="Inspect 6-Axis DNA"
                        >
                          <Dna size={12} />
                        </button>
                        <button
                          onClick={() => onSelectPlayer(bw)}
                          className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C]"
                          title="View Full Analytical Dossier"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => onComparePlayer(bw)}
                          className="p-1.5 rounded-lg bg-[#7545C8]/15 hover:bg-[#7545C8]/30 text-[#C9C3DF] border border-[#7545C8]/40"
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
