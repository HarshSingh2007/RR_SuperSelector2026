import React, { useState, useMemo } from 'react';
import {
  Target,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  GitCompare,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
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

  const filteredBowlers = useMemo(() => {
    return bowlers
      .filter((bw) => {
        const matchesSearch =
          bw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bw.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bw.bowlingType.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTeam = teamFilter === 'ALL' || bw.team === teamFilter || bw.teams.includes(teamFilter);

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

        return matchesSearch && matchesTeam && matchesType && matchesOvers;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [bowlers, searchTerm, teamFilter, typeFilter, rrSpotlight, minOvers, sortField, sortAsc, selectedComp, selectedSeason]);

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
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Style / Team</th>
                  <th
                    onClick={() => handleSort('rating')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      BPI-Bowl <MetricTooltip term="BPI-Bowl" /> <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pressureEcon')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Pressure Econ <MetricTooltip term="Pressure Economy" /> <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('normalEcon')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Baseline Econ <MetricTooltip term="Baseline Economy" /> <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('econDelta')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Suppression <MetricTooltip term="Economy Suppression" /> <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pressureWickets')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Pressure Wkts <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dotPct')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Dot Ball % <MetricTooltip term="Dot Ball %" /> <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pressureOvers')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Pressure Overs <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29334C]/50 text-[#F7F7FB]">
                {filteredBowlers.map((bw) => (
                  <tr
                    key={bw.id}
                    className="hover:bg-[#121A2D]/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectPlayer(bw)}
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={`inline-block w-6 h-6 rounded-md leading-6 text-center text-xs ${
                          bw.rank === 1
                            ? 'bg-amber-400 text-black font-extrabold'
                            : bw.rank === 2
                            ? 'bg-slate-300 text-black font-extrabold'
                            : bw.rank === 3
                            ? 'bg-amber-700 text-white font-extrabold'
                            : 'text-[#929BB2]'
                        }`}
                      >
                        {bw.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 flex items-center gap-2.5">
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
                    <td className="py-3 px-3 text-[#929BB2]">
                      <div>{bw.team}</div>
                      <div className="text-[10px] text-[#64748B]">{bw.bowlingType}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#7545C8] text-sm">
                      {bw.rating}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">{bw.pressureEcon}</td>
                    <td className="py-3 px-3 font-mono text-[#929BB2]">{bw.normalEcon}</td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          bw.econDelta >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {bw.econDelta >= 0 ? `+${bw.econDelta}` : bw.econDelta}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {bw.pressureWickets}
                    </td>
                    <td className="py-3 px-3 font-mono">{bw.dotPct}%</td>
                    <td className="py-3 px-3 font-mono text-[#C9C3DF]">
                      {bw.pressureOvers} ov
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPlayer(bw)}
                          className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C]"
                          title="View Full Analytical Dossier"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => onComparePlayer(bw)}
                          className="p-1.5 rounded-lg bg-[#7545C8]/15 hover:bg-[#7545C8]/30 text-[#C9C3DF] border border-[#7545C8]/40"
                          title="Compare in Studio"
                        >
                          <GitCompare size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
