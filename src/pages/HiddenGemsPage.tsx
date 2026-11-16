import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  X,
  ChevronRight,
  Bookmark,
  Dna,
  Eye,
  Gavel,
} from 'lucide-react';
import { HiddenGemPlayer } from '../types';
import hiddenGemsData from '../data/hidden_gems.json';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  HiddenGemIcon,
  RoyalCrestEmblem,
  CricketBatIcon,
  CricketBallIcon,
} from '../components/CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';

export const HiddenGemsPage: React.FC = () => {
  const { isShortlisted, toggleShortlist, openPlayerProfile, openPlayerDNA, sendToAuctionBlock } = useEcosystem();
  const allGems = useMemo(() => hiddenGemsData as HiddenGemPlayer[], []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [expFilter, setExpFilter] = useState<string>('ALL');
  const [minGemScore, setMinGemScore] = useState<number>(65);
  const [sortBy, setSortBy] = useState<'gemScore' | 'bpi' | 'delta' | 'leastMatches'>('gemScore');

  // Selected player for "Why This Player?" detailed scout report modal
  const [inspectedGem, setInspectedGem] = useState<HiddenGemPlayer | null>(null);

  // Compare queue (up to 3 players)
  const [compareQueue, setCompareQueue] = useState<HiddenGemPlayer[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [gemNotice, setGemNotice] = useState<string | null>(null);
  const [showVeterans, setShowVeterans] = useState<boolean>(false);

  // Extract unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(allGems.map((g) => g.country))).sort();
    return ['ALL', ...list];
  }, [allGems]);

  // Filtered gems
  const filteredGems = useMemo(() => {
    return allGems.filter((g) => {
      if (!showVeterans && (g.gem_tag || '').includes('Marquee')) return false;
      if (g.hidden_gem_score < minGemScore) return false;

      if (
        searchQuery &&
        !g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.country.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.gem_tag.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (roleFilter === 'BATTER' && g.role_type !== 'batter') return false;
      if (roleFilter === 'BOWLER' && g.role_type !== 'bowler') return false;
      if (
        roleFilter === 'ALLROUNDER' &&
        !g.player_role.toLowerCase().includes('all-rounder')
      )
        return false;

      if (countryFilter !== 'ALL' && g.country !== countryFilter) return false;

      if (expFilter === 'EMERGING' && g.matches_analysed >= 15) return false;
      if (expFilter === 'DEVELOPING' && (g.matches_analysed < 15 || g.matches_analysed > 30))
        return false;
      if (expFilter === 'EXPERIENCED' && g.matches_analysed <= 30) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'gemScore') return b.hidden_gem_score - a.hidden_gem_score;
      if (sortBy === 'bpi') return b.bpi_rating - a.bpi_rating;
      if (sortBy === 'delta') return b.delta - a.delta;
      if (sortBy === 'leastMatches') return a.matches_analysed - b.matches_analysed;
      return 0;
    });
  }, [allGems, minGemScore, searchQuery, roleFilter, countryFilter, expFilter, sortBy, showVeterans]);

  // Queue toggle
  const toggleCompare = (gem: HiddenGemPlayer) => {
    setCompareQueue((prev) => {
      const exists = prev.some((p) => p.player_id === gem.player_id);
      if (exists) {
        return prev.filter((p) => p.player_id !== gem.player_id);
      }
      if (prev.length >= 3) {
        setGemNotice('Compare queue holds up to 3 hidden gems at a time — remove one to add another.');
        return prev;
      }
      setGemNotice(null);
      return [...prev, gem];
    });
  };

  const getGemBadgeColor = (tag: string) => {
    if (tag.includes('Diamond')) return 'from-pink-500/20 to-purple-500/20 border-pink-500/40 text-pink-300';
    if (tag.includes('Finisher') || tag.includes('Value Striker')) return 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300';
    if (tag.includes('Mystery') || tag.includes('Emerging')) return 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300';
    if (tag.includes('Stifler') || tag.includes('Containment')) return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300';
    if (tag.includes('Marquee')) return 'from-slate-600/20 to-slate-800/30 border-slate-500/40 text-slate-300';
    return 'from-[#29334C]/40 to-[#121A2D] border-[#29334C] text-[#C9C3DF]';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#171F35] via-[#121A2D] to-[#0B1020] border border-[#29334C] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#7545C8]/20 via-[#E90074]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#7545C8]/15 border border-[#7545C8]/30 rounded-full text-xs font-semibold text-purple-300 tracking-wider uppercase">
              <HiddenGemIcon size={14} className="text-[#7545C8]" />
              Algorithmic Scouting Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] flex items-center gap-3">
              <RoyalCrestEmblem size={32} />
              Hidden Gem Detector
            </h1>
            <p className="text-sm text-[#929BB2] max-w-2xl leading-relaxed">
              Detects high-ceiling, undervalued cricket talents before the broader market recognizes them. The algorithm rewards exceptional clutch delta over normal baseline, high boundary/dot conversion in high-pressure matches, and undiscovered sample size upside.
            </p>
          </div>

          {/* Quick Metrics & Compare Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 bg-[#0B1020]/80 border border-[#29334C] rounded-xl text-center">
              <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Identified Gems</span>
              <span className="text-xl font-bold text-purple-300">{filteredGems.length}</span>
            </div>
            <div className="px-4 py-3 bg-[#0B1020]/80 border border-[#29334C] rounded-xl text-center">
              <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Avg Gem Score</span>
              <span className="text-xl font-bold text-amber-400">
                {filteredGems.length > 0
                  ? (filteredGems.reduce((s, g) => s + g.hidden_gem_score, 0) / filteredGems.length).toFixed(1)
                  : 0}
              </span>
            </div>
            {compareQueue.length > 0 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                <GitCompare size={16} />
                Compare Gems ({compareQueue.length})
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-[#29334C]/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929BB2]" />
            <input
              type="text"
              placeholder="Search talent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#F7F7FB] placeholder-[#929BB2]/60 focus:outline-none focus:border-[#7545C8]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#7545C8]"
          >
            <option value="ALL">All Roles</option>
            <option value="BATTER">Batters</option>
            <option value="BOWLER">Bowlers</option>
            <option value="ALLROUNDER">All-Rounders</option>
          </select>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#7545C8]"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Countries' : c}
              </option>
            ))}
          </select>

          {/* Experience Filter */}
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#7545C8]"
          >
            <option value="ALL">Any Sample Size</option>
            <option value="EMERGING">Emerging (&lt; 15 matches)</option>
            <option value="DEVELOPING">Developing (15–30 matches)</option>
            <option value="EXPERIENCED">Established (30+ matches)</option>
          </select>

          {/* Min Gem Score Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B1020] border border-[#29334C] rounded-xl">
            <span className="text-[11px] text-[#929BB2] whitespace-nowrap">Min Score: {minGemScore}</span>
            <input
              type="range"
              min="50"
              max="90"
              step="1"
              value={minGemScore}
              onChange={(e) => setMinGemScore(parseInt(e.target.value, 10))}
              className="w-full accent-[#7545C8] cursor-pointer"
            />
          </div>
        </div>

        {/* Toggle Veterans + Notice Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-[#C9C3DF] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showVeterans}
              onChange={(e) => setShowVeterans(e.target.checked)}
              className="accent-[#7545C8] rounded cursor-pointer"
            />
            <span>Include Marquee Veterans (38+ matches)</span>
          </label>
          {gemNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertCircle size={14} />
              <span>{gemNotice}</span>
              <button onClick={() => setGemNotice(null)} className="ml-1 text-amber-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGems.map((gem, idx) => {
          const isQueued = compareQueue.some((p) => p.player_id === gem.player_id);
          const isBatter = gem.role_type === 'batter';

          return (
            <div
              key={gem.player_id}
              className="bg-[#171F35] border border-[#29334C] hover:border-[#7545C8]/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:shadow-[#7545C8]/10 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Top Badge & Score */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-gradient-to-r ${getGemBadgeColor(
                      gem.gem_tag
                    )}`}
                  >
                    <HiddenGemIcon size={12} className="text-[#E90074]" />
                    {gem.gem_tag}
                  </span>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Gem Score</span>
                    <span className="text-xl font-black text-purple-300 group-hover:text-pink-300 transition-colors">
                      {gem.hidden_gem_score}
                      <span className="text-xs font-normal text-[#929BB2]">/100</span>
                    </span>
                  </div>
                </div>

                {/* Player Identity Row */}
                <div
                  onClick={() => openPlayerProfile(gem.player_id, gem.role_type)}
                  className="flex items-center gap-3 cursor-pointer group/identity"
                  title="Click to open Full Player Intelligence Profile & Pitch Map"
                >
                  <PlayerAvatar
                    name={gem.name}
                    team={gem.team}
                    role={gem.role_type}
                    avatarIcon={gem.avatar_icon}
                    countryFlag={gem.country_flag}
                    countryCode={gem.country_code}
                    size="lg"
                    showRank={false}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-extrabold text-[#F7F7FB] group-hover/identity:text-[#E90074] transition-colors truncate">
                        {gem.name}
                      </h3>
                      <span className="text-sm">{gem.country_flag}</span>
                    </div>
                    <div className="text-xs text-[#929BB2] flex items-center gap-2 mt-0.5">
                      <span>{gem.country}</span>
                      <span>•</span>
                      <span className="text-[#C9C3DF] font-medium">{gem.player_role}</span>
                    </div>
                  </div>
                </div>

                {/* Statistical Matrix Row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#0B1020]/70 rounded-xl border border-[#29334C]/80 text-center">
                  <div>
                    <span className="text-[10px] text-[#929BB2] uppercase block">Clutch Metric</span>
                    <span className="text-xs font-bold text-[#F7F7FB]">{gem.pressure_metric}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929BB2] uppercase block">Normal Delta</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {gem.delta >= 0 ? `+${gem.delta}` : gem.delta}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929BB2] uppercase block">Volume</span>
                    <span className="text-xs font-bold text-amber-400">{gem.matches_analysed} M</span>
                  </div>
                </div>

                {/* Brief Scouting Punchline */}
                <p className="text-xs text-[#929BB2] line-clamp-2 leading-relaxed">
                  {gem.why_scout}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-5 pt-4 border-t border-[#29334C] flex items-center gap-1.5">
                <button
                  onClick={() => setInspectedGem(gem)}
                  className="flex-1 py-2 px-3 bg-[#121A2D] hover:bg-[#E90074]/15 border border-[#29334C] hover:border-[#E90074]/50 text-xs font-semibold text-[#F7F7FB] rounded-xl transition-all cursor-pointer text-center"
                >
                  Why This Gem?
                </button>

                <button
                  onClick={() => toggleShortlist(gem.player_id, 'Hidden Gem Detector', 'high')}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isShortlisted(gem.player_id) || isShortlisted(gem.name)
                      ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                      : 'bg-[#121A2D] border-[#29334C] text-[#929BB2] hover:text-white hover:border-[#E90074]/40'
                  }`}
                  title={isShortlisted(gem.player_id) ? 'Remove from Shortlist' : 'Shortlist Gem'}
                >
                  <Bookmark size={15} className={isShortlisted(gem.player_id) ? 'fill-current' : ''} />
                </button>

                <button
                  onClick={() => openPlayerDNA(gem.player_id, gem.role_type)}
                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-all cursor-pointer"
                  title="Inspect 6-Axis Player DNA"
                >
                  <Dna size={15} />
                </button>

                <button
                  onClick={() => toggleCompare(gem)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isQueued
                      ? 'bg-[#7545C8] border-[#7545C8] text-white shadow-lg'
                      : 'bg-[#121A2D] border-[#29334C] text-[#929BB2] hover:text-white hover:border-[#7545C8]/40'
                  }`}
                  title={isQueued ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                >
                  <GitCompare size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why This Player?" In-Depth Scouting Modal */}
      {inspectedGem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <HiddenGemIcon size={20} className="text-[#E90074]" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Scouting Intelligence Dossier
                </span>
              </div>
              <button
                onClick={() => setInspectedGem(null)}
                className="text-[#929BB2] hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-[#121A2D] rounded-xl border border-[#29334C]">
              <PlayerAvatar
                name={inspectedGem.name}
                team={inspectedGem.team}
                role={inspectedGem.role_type}
                avatarIcon={inspectedGem.avatar_icon}
                countryFlag={inspectedGem.country_flag}
                countryCode={inspectedGem.country_code}
                size="xl"
                showRank={false}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#F7F7FB]">{inspectedGem.name}</h3>
                  <span>{inspectedGem.country_flag}</span>
                </div>
                <div className="text-xs text-[#929BB2]">
                  {inspectedGem.country} • {inspectedGem.player_role}
                </div>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E90074]/15 border border-[#E90074]/30 text-[#E90074]">
                  {inspectedGem.gem_tag}
                </div>
              </div>
            </div>

            {/* Key Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] uppercase block">Hidden Gem Score</span>
                <span className="text-lg font-black text-purple-300">{inspectedGem.hidden_gem_score}/100</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] uppercase block">Pressure vs Normal</span>
                <span className="text-lg font-black text-emerald-400">+{inspectedGem.delta}</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] uppercase block">BPI Index</span>
                <span className="text-lg font-black text-amber-400">{inspectedGem.bpi_rating}</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] uppercase block">Sample Size</span>
                <span className="text-lg font-black text-cyan-400">{inspectedGem.matches_analysed} M</span>
              </div>
            </div>

            {/* In-depth Analytical Verdict */}
            <div className="p-4 bg-[#0B1020] rounded-xl border border-[#29334C] space-y-2">
              <span className="text-xs font-bold text-[#F7F7FB] uppercase tracking-wider block">
                Algorithmic Scout Justification
              </span>
              <p className="text-xs text-[#C9C3DF] leading-relaxed">
                {inspectedGem.why_scout}
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#121A2D] rounded-xl border border-emerald-500/25 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Tactical Strengths
                </span>
                <ul className="text-xs text-[#C9C3DF] space-y-1 list-disc pl-4">
                  {inspectedGem.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-[#121A2D] rounded-xl border border-amber-500/25 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Development Gaps
                </span>
                <ul className="text-xs text-[#C9C3DF] space-y-1 list-disc pl-4">
                  {inspectedGem.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Structured Qualification Factor Breakdown */}
            <div className="p-4 bg-[#121A2D] rounded-xl border border-purple-500/30 space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                Why This Player Qualifies as a Hidden Gem
              </span>
              <ul className="text-xs text-[#C9C3DF] space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-white">Pressure-to-Baseline Outperformance:</strong> Delivers{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {inspectedGem.delta >= 0 ? `+${inspectedGem.delta}` : inspectedGem.delta}
                  </span>{' '}
                  delta ({inspectedGem.pressure_metric} under pressure vs {inspectedGem.baseline_metric} baseline).
                </li>
                <li>
                  <strong className="text-white">Peer-Group Value Gap:</strong> Combines BPI{' '}
                  <span className="font-mono text-amber-300">{inspectedGem.bpi_rating}</span> and consistency{' '}
                  <span className="font-mono text-cyan-300">{inspectedGem.consistency}/100</span> across{' '}
                  <span className="font-mono">{inspectedGem.matches_analysed}</span> matches ({inspectedGem.pressure_matches} pressure).
                </li>
                <li>
                  <strong className="text-white">Control / Boundary Signature:</strong>{' '}
                  {inspectedGem.role_type === 'batter'
                    ? `${inspectedGem.dot_or_boundary_pct}% boundary ball conversion under leverage`
                    : `${inspectedGem.dot_or_boundary_pct}% dot ball containment under leverage`}
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const id = inspectedGem.player_id;
                    const rt = inspectedGem.role_type;
                    setInspectedGem(null);
                    openPlayerProfile(id, rt);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#121A2D] hover:bg-[#1D2745] text-[#C9C3DF] border border-[#29334C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={13} className="text-[#E90074]" /> Full Profile
                </button>
                <button
                  onClick={() => {
                    const id = inspectedGem.player_id;
                    const rt = inspectedGem.role_type;
                    setInspectedGem(null);
                    openPlayerDNA(id, rt);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Dna size={13} /> 6-Axis DNA
                </button>
                <button
                  onClick={() => toggleShortlist(inspectedGem.player_id, 'Hidden Gem Detector', 'high')}
                  className="px-3 py-2 rounded-xl bg-[#121A2D] hover:bg-[#1D2745] text-[#FF47A3] border border-[#E90074]/40 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark size={13} /> {isShortlisted(inspectedGem.player_id) ? 'Shortlisted' : 'Shortlist'}
                </button>
                {playerDataService.findAuctionCandidate(inspectedGem.player_id) && (
                  <button
                    onClick={() => {
                      const id = inspectedGem.player_id;
                      setInspectedGem(null);
                      sendToAuctionBlock(id);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gavel size={13} /> Auction Block
                  </button>
                )}
              </div>
              <button
                onClick={() => setInspectedGem(null)}
                className="px-5 py-2 bg-[#E90074] hover:bg-[#E90074]/90 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && compareQueue.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <GitCompare size={20} className="text-[#E90074]" />
                <h3 className="text-lg font-black text-[#F7F7FB]">
                  Head-to-Head Hidden Gem Comparison ({compareQueue.length} Players)
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-[#929BB2] hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {compareQueue.map((gem) => (
                <div key={gem.player_id} className="bg-[#121A2D] border border-[#29334C] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <PlayerAvatar
                      name={gem.name}
                      team={gem.team}
                      role={gem.role_type}
                      avatarIcon={gem.avatar_icon}
                      countryFlag={gem.country_flag}
                      countryCode={gem.country_code}
                      size="md"
                      showRank={false}
                    />
                    <button
                      onClick={() => toggleCompare(gem)}
                      className="text-[#929BB2] hover:text-red-400 p-1 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-[#F7F7FB]">{gem.name} {gem.country_flag}</h4>
                    <span className="text-xs text-[#929BB2]">{gem.country} • {gem.player_role}</span>
                  </div>

                  <div className="p-2 bg-[#0B1020] rounded-lg border border-[#29334C] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Hidden Gem Score</span>
                      <span className="font-bold text-purple-300">{gem.hidden_gem_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Clutch Metric</span>
                      <span className="font-bold text-[#F7F7FB]">{gem.pressure_metric}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Baseline Delta</span>
                      <span className="font-bold text-emerald-400">+{gem.delta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">BPI Rating</span>
                      <span className="font-bold text-amber-400">{gem.bpi_rating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Sample Matches</span>
                      <span className="font-bold text-cyan-400">{gem.matches_analysed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Consistency</span>
                      <span className="font-bold text-[#C9C3DF]">{gem.consistency}/100</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#929BB2] leading-relaxed line-clamp-3">
                    {gem.why_scout}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#29334C] flex justify-between items-center">
              <button
                onClick={() => setCompareQueue([])}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
              >
                Clear All Comparison
              </button>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-5 py-2 bg-[#E90074] hover:bg-[#E90074]/90 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

