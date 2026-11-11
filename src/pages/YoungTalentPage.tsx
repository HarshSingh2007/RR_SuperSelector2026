import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Radar,
  Sparkles,
  Star,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Flame,
  Users,
  GitCompare,
  Plus,
  Trash2,
  Edit3,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Crown,
  Eye,
  X,
  Save,
  Download,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { YoungTalent, WatchlistItem } from '../types';
import youngTalentsData from '../data/young_talents.json';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  YoungTalentRadarIcon,
  RoyalCrestEmblem,
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  AllRounderIcon,
  WicketkeeperIcon,
  BowlingMotionIcon,
} from '../components/CricketIcons';

const WATCHLIST_STORAGE_KEY = 'superr_scout_watchlist_v1';

export const YoungTalentPage: React.FC = () => {
  const allTalents = useMemo(() => youngTalentsData as unknown as YoungTalent[], []);

  // Top 5 "NEXT BIG STAR" Prospects
  const nextBigStars = useMemo(() => allTalents.filter((t) => t.is_next_big_star), [allTalents]);

  // View Mode: 'all' | 'indian_talents' | 'watchlist'
  const [activeView, setActiveView] = useState<'all' | 'indian_talents' | 'watchlist'>('all');

  // Indian Talents Sub-Category: 'all' | 'batsmen' | 'pacers' | 'spinners' | 'allrounders' | 'keepers'
  const [indianCategory, setIndianCategory] = useState<string>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [compFilter, setCompFilter] = useState<string>('ALL');
  const [uncappedOnly, setUncappedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'talent' | 'perf' | 'potential' | 'youngest'>('talent');
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  // Scouting Watchlist State (resyncs stale cached profiles to fresh CSV-grounded records by ID or Name)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WatchlistItem[];
        const synced = parsed
          .map((item) => {
            const fresh =
              allTalents.find((t) => t.id === item.player?.id) ||
              allTalents.find((t) => t.name.toLowerCase() === item.player?.name?.toLowerCase());
            return fresh ? { ...item, player: fresh } : null;
          })
          .filter(Boolean) as WatchlistItem[];
        if (synced.length > 0) return synced;
      }
    } catch (e) {
      console.error('Error loading watchlist from localStorage:', e);
    }
    const initial = allTalents[0];
    return initial
      ? [
          {
            player: initial,
            isHighPriority: true,
            scoutingNotes: `Top priority emerging star (#${initial.id}, Age ${initial.age}). Monitor workload & leverage strike rates closely.`,
            addedAt: new Date().toLocaleDateString(),
          },
        ]
      : [];
  });

  // Save watchlist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Error saving watchlist:', e);
    }
  }, [watchlist]);

  // Comparison Queue (up to 3 players)
  const [compareQueue, setCompareQueue] = useState<YoungTalent[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Inspected Dossier Modal
  const [inspectedTalent, setInspectedTalent] = useState<YoungTalent | null>(null);

  // Note editing state for watchlist
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotesText, setTempNotesText] = useState<string>('');

  // Unique country list
  const countries = useMemo(() => {
    const list = Array.from(new Set(allTalents.map((t) => t.country))).sort();
    return ['ALL', ...list];
  }, [allTalents]);

  // Watchlist lookup set
  const watchlistPlayerIds = useMemo(
    () => new Set(watchlist.map((w) => w.player.id)),
    [watchlist]
  );

  // Toggle watchlist
  const handleToggleWatchlist = (talent: YoungTalent) => {
    if (watchlistPlayerIds.has(talent.id)) {
      setWatchlist((prev) => prev.filter((w) => w.player.id !== talent.id));
    } else {
      const newItem: WatchlistItem = {
        player: talent,
        isHighPriority: false,
        scoutingNotes: '',
        addedAt: new Date().toLocaleDateString(),
      };
      setWatchlist((prev) => [newItem, ...prev]);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#F59E0B', '#E90074'] });
    }
  };

  // Toggle high priority in watchlist
  const handleTogglePriority = (playerId: string) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.player.id === playerId ? { ...item, isHighPriority: !item.isHighPriority } : item
      )
    );
  };

  // Save scouting note
  const handleSaveNotes = (playerId: string) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.player.id === playerId ? { ...item, scoutingNotes: tempNotesText } : item
      )
    );
    setEditingNotesId(null);
  };

  // Toggle comparison queue
  const handleToggleCompare = (talent: YoungTalent) => {
    setCompareNotice(null);
    setCompareQueue((prev) => {
      const exists = prev.some((p) => p.id === talent.id);
      if (exists) return prev.filter((p) => p.id !== talent.id);
      if (prev.length >= 3) {
        setCompareNotice('Maximum 3 young prospects can be compared at once. Deselect one first.');
        return prev;
      }
      return [...prev, talent];
    });
  };

  // Filtered talents based on active view and filters
  const filteredTalents = useMemo(() => {
    let list = allTalents;

    if (activeView === 'indian_talents') {
      list = list.filter((t) => t.is_domestic_indian);
      if (indianCategory === 'batsmen') list = list.filter((t) => t.primary_role === 'Batter');
      if (indianCategory === 'pacers') list = list.filter((t) => t.primary_role === 'Fast Bowler');
      if (indianCategory === 'spinners') list = list.filter((t) => t.primary_role === 'Spinner');
      if (indianCategory === 'allrounders') list = list.filter((t) => t.primary_role === 'All-Rounder');
      if (indianCategory === 'keepers') list = list.filter((t) => t.primary_role === 'Wicketkeeper');
    }

    return list
      .filter((t) => {
        if (
          searchQuery &&
          !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.sub_role.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.current_teams.some((tm) => tm.toLowerCase().includes(searchQuery.toLowerCase()))
        ) {
          return false;
        }

        if (ageFilter === 'TEEN' && t.age > 20) return false;
        if (ageFilter === 'U23' && (t.age < 21 || t.age > 23)) return false;
        if (ageFilter === '24' && t.age !== 24) return false;

        if (roleFilter !== 'ALL' && t.primary_role !== roleFilter) return false;
        if (countryFilter !== 'ALL' && t.country !== countryFilter) return false;
        if (compFilter !== 'ALL') {
          const comps = t.competitions;
          const tours = t.youth_tournaments.join(' ').toLowerCase();
          if (compFilter === 'IPL' && !comps?.includes('IPL') && !tours.includes('ipl')) return false;
          if (compFilter === 'YOUTH' && !comps?.includes('Emerging / Rising Stars') && !tours.includes('emerging') && !tours.includes('rising') && !tours.includes('u-19')) return false;
          if (compFilter === 'T20I' && !comps?.includes('T20I')) return false;
        }
        if (uncappedOnly && !t.is_uncapped) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'talent') return b.scores.overall_talent_score - a.scores.overall_talent_score;
        if (sortBy === 'perf') return b.scores.current_performance - a.scores.current_performance;
        if (sortBy === 'potential') return b.scores.development_potential - a.scores.development_potential;
        if (sortBy === 'youngest') return a.age - b.age;
        return 0;
      });
  }, [allTalents, activeView, indianCategory, searchQuery, ageFilter, roleFilter, countryFilter, compFilter, uncappedOnly, sortBy]);

  // Export Watchlist as JSON / CSV
  const handleExportWatchlist = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Name,Age,Country,Role,Talent Score,Priority,Scouting Notes']
        .concat(
          watchlist.map(
            (w) =>
              `"${w.player.name}",${w.player.age},"${w.player.country}","${w.player.primary_role}",${w.player.scores.overall_talent_score},"${w.isHighPriority ? 'High' : 'Normal'}","${w.scoutingNotes.replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RR_Scout_Watchlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* 1. HERO HEADER WITH RADAR HUD */}
      <div className="bg-gradient-to-r from-[#171F35] via-[#121A2D] to-[#0B1020] border border-[#29334C] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        {/* Animated Sonar Sweep Background Graphic */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-purple-500/20 pointer-events-none flex items-center justify-center">
          <div className="w-72 h-72 rounded-full border border-pink-500/25 flex items-center justify-center animate-pulse">
            <div className="w-48 h-48 rounded-full border border-amber-500/20" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-full text-xs font-semibold text-amber-300 tracking-wider uppercase">
              <YoungTalentRadarIcon size={14} className="text-amber-400" />
              Next-Gen Cricket Scouting System
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] flex items-center gap-3">
              <RoyalCrestEmblem size={32} />
              Young Talent Radar
              <span className="text-sm px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-mono font-bold">
                Future Stars
              </span>
            </h1>
            <p className="text-sm text-[#929BB2] max-w-2xl leading-relaxed">
              Algorithmic scouting engine tracking the next generation of cricket prodigies (aged 15–24, prioritising U-23 &amp; uncapped stars). Evaluates domestic, youth tournament (Emerging Asia Cup, Rising Stars, U-19), and IPL data with transparent separation between CSV statistics and AI projections.
            </p>
          </div>

          {/* Quick HUD Metrics & Watchlist Pill */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="px-4 py-2.5 bg-[#0B1020]/80 border border-[#29334C] rounded-xl text-center flex-1 sm:flex-none">
              <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Tracked Prospects</span>
              <span className="text-xl font-bold text-amber-400">{allTalents.length}</span>
            </div>
            <div className="px-4 py-2.5 bg-[#0B1020]/80 border border-[#29334C] rounded-xl text-center flex-1 sm:flex-none">
              <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Uncapped Jewels</span>
              <span className="text-xl font-bold text-emerald-400">{allTalents.filter((t) => t.is_uncapped).length}</span>
            </div>
            <button
              onClick={() => setActiveView('watchlist')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-lg ${
                activeView === 'watchlist'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#E90074] text-white shadow-amber-500/20'
                  : 'bg-[#171F35] border border-[#29334C] text-[#C9C3DF] hover:text-white hover:border-[#F59E0B]/50'
              }`}
            >
              <Bookmark size={16} className="text-amber-400" />
              Scout Watchlist ({watchlist.length})
            </button>
            {compareQueue.length > 0 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg hover:brightness-110 cursor-pointer"
              >
                <GitCompare size={16} />
                Compare ({compareQueue.length})
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#29334C]/60 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveView('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'all'
                ? 'bg-[#E90074] text-white shadow-md'
                : 'bg-[#121A2D] text-[#929BB2] hover:text-white hover:bg-[#171F35]'
            }`}
          >
            All Emerging Talents ({allTalents.length})
          </button>
          <button
            onClick={() => {
              setActiveView('indian_talents');
              setIndianCategory('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeView === 'indian_talents'
                ? 'bg-[#7545C8] text-white shadow-md'
                : 'bg-[#121A2D] text-[#929BB2] hover:text-white hover:bg-[#171F35]'
            }`}
          >
            <span>🇮🇳 Emerging Indian Talent Spotlight</span>
            <span className="px-1.5 py-0.2 bg-[#0B1020] rounded text-[10px] text-amber-300 font-mono">
              {allTalents.filter((t) => t.is_domestic_indian).length}
            </span>
          </button>
          <button
            onClick={() => setActiveView('watchlist')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeView === 'watchlist'
                ? 'bg-[#F59E0B] text-slate-900 shadow-md'
                : 'bg-[#121A2D] text-[#929BB2] hover:text-white hover:bg-[#171F35]'
            }`}
          >
            <Star size={14} className={activeView === 'watchlist' ? 'text-slate-900' : 'text-amber-400'} />
            <span>My Scout Watchlist ({watchlist.length})</span>
          </button>
        </div>
      </div>

      {/* 2. UNIQUE INTERACTIVE FEATURE: NEXT BIG STAR (5 PROSPECT MARQUEE) */}
      {activeView !== 'watchlist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#E90074]/20 border border-[#E90074]/40 rounded-lg">
                <Crown size={18} className="text-[#E90074]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#F7F7FB] uppercase tracking-wider flex items-center gap-2">
                  NEXT BIG STAR: Top 5 Pinnacle Prospects
                </h2>
                <span className="text-xs text-[#929BB2]">
                  Highest overall talent projections combining verified performance and development ceiling
                </span>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold self-start sm:self-auto">
              ★ Premier Scout Shortlist
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {nextBigStars.map((player) => {
              const isOnWatchlist = watchlistPlayerIds.has(player.id);
              const isQueued = compareQueue.some((p) => p.id === player.id);

              return (
                <div
                  key={player.id}
                  className="bg-gradient-to-b from-[#1A233C] via-[#171F35] to-[#0B1020] border-2 border-[#E90074]/40 hover:border-[#F59E0B] rounded-2xl p-4 shadow-xl hover:shadow-2xl hover:shadow-[#E90074]/15 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle Radar Ring Accent */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full border border-pink-500/20 pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    {/* Top Age Badge & Talent Score */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0B1020] border border-[#F59E0B]/50 text-amber-300">
                        Age {player.age}
                      </span>
                      <div className="text-right">
                        <span className="text-[9px] text-[#929BB2] uppercase block">Talent Score</span>
                        <span className="text-base font-black text-amber-400">
                          {player.scores.overall_talent_score}
                          <span className="text-[10px] text-[#929BB2] font-normal">/100</span>
                        </span>
                      </div>
                    </div>

                    {/* Player Visual Card Presentation */}
                    <div className="text-center py-2 bg-[#0B1020]/60 rounded-xl border border-[#29334C] relative overflow-hidden">
                      <div className="flex justify-center">
                        <PlayerAvatar
                          name={player.name}
                          team={player.current_teams[0] || 'Franchise'}
                          role={player.primary_role.toLowerCase()}
                          avatarIcon={player.avatar_icon}
                          countryFlag={player.country_flag}
                          countryCode={player.country_code}
                          size="xl"
                          showRank={false}
                        />
                      </div>
                      <div className="mt-2 px-2">
                        <h3 className="text-sm font-black text-[#F7F7FB] truncate">{player.name}</h3>
                        <p className="text-[11px] text-[#C9C3DF] truncate">{player.sub_role}</p>
                        <span className="text-[10px] text-[#929BB2] block mt-0.5">
                          {player.country_flag} {player.country} • {player.current_teams[0]}
                        </span>
                      </div>
                    </div>

                    {/* Stats Highlights */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#0B1020] rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#929BB2] block uppercase">
                          {player.primary_role === 'Fast Bowler' || player.primary_role === 'Spinner' ? 'Wickets' : 'Runs (SR)'}
                        </span>
                        <span className="font-bold text-[#F7F7FB]">
                          {player.primary_role === 'Fast Bowler' || player.primary_role === 'Spinner'
                            ? `${player.stats.bowling.wickets} Wkts`
                            : `${player.stats.batting.runs} (${player.stats.batting.strike_rate})`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#929BB2] block uppercase">
                          {player.primary_role === 'Fast Bowler' || player.primary_role === 'Spinner' ? 'Economy' : 'Pressure SR'}
                        </span>
                        <span className="font-bold text-[#E90074]">
                          {player.primary_role === 'Fast Bowler' || player.primary_role === 'Spinner'
                            ? `${player.stats.bowling.economy} Econ`
                            : `${player.stats.batting.pressure_sr} SR`}
                        </span>
                      </div>
                    </div>

                    {/* Why This Player Excerpt */}
                    <p className="text-[11px] text-[#C9C3DF] line-clamp-2 leading-snug">
                      {player.why_this_player}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-[#29334C] flex items-center gap-1.5 relative z-10">
                    <button
                      onClick={() => setInspectedTalent(player)}
                      className="flex-1 py-1.5 px-2 bg-[#171F35] hover:bg-[#E90074]/20 border border-[#29334C] hover:border-[#E90074] text-[11px] font-bold text-[#F7F7FB] rounded-lg transition-all cursor-pointer text-center"
                    >
                      Dossier
                    </button>

                    <button
                      onClick={() => handleToggleWatchlist(player)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isOnWatchlist
                          ? 'bg-[#F59E0B] border-[#F59E0B] text-slate-900 shadow'
                          : 'bg-[#0B1020] border-[#29334C] text-[#929BB2] hover:text-amber-400'
                      }`}
                      title={isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Star size={14} className={isOnWatchlist ? 'fill-slate-900' : ''} />
                    </button>

                    <button
                      onClick={() => handleToggleCompare(player)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isQueued
                          ? 'bg-[#7545C8] border-[#7545C8] text-white shadow'
                          : 'bg-[#0B1020] border-[#29334C] text-[#929BB2] hover:text-purple-300'
                      }`}
                      title={isQueued ? 'Remove from comparison' : 'Add to compare'}
                    >
                      <GitCompare size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DEDICATED EMERGING INDIAN TALENT SUB-NAV */}
      {activeView === 'indian_talents' && (
        <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇮🇳</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#F7F7FB]">
                Emerging Indian Talent Categories
              </h3>
            </div>
            <span className="text-xs text-amber-300 font-medium">BCCI Domestic & Youth Tournament Prodigies</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Indian Talents', icon: <Users size={14} /> },
              { id: 'batsmen', label: 'Young Batsmen', icon: <CricketBatIcon size={14} className="text-amber-300" /> },
              { id: 'pacers', label: 'Fast Bowlers (140+ km/h)', icon: <CricketBallIcon size={14} className="text-pink-400" /> },
              { id: 'spinners', label: 'Spin Wizards', icon: <BowlingMotionIcon size={14} className="text-purple-300" /> },
              { id: 'allrounders', label: 'Dynamic All-Rounders', icon: <AllRounderIcon size={14} className="text-cyan-300" /> },
              { id: 'keepers', label: 'Wicketkeeper Prodigies', icon: <WicketkeeperIcon size={14} className="text-emerald-300" /> },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setIndianCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  indianCategory === cat.id
                    ? 'bg-gradient-to-r from-[#7545C8] to-[#E90074] text-white shadow-md'
                    : 'bg-[#0B1020] text-[#929BB2] hover:text-[#F7F7FB] hover:bg-[#1E294B]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. SCOUT WATCHLIST VIEW */}
      {activeView === 'watchlist' && (
        <div className="space-y-4">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#29334C]">
              <div>
                <h2 className="text-lg font-black text-[#F7F7FB] flex items-center gap-2">
                  <Bookmark size={20} className="text-amber-400" />
                  Personal Scout Watchlist ({watchlist.length})
                </h2>
                <p className="text-xs text-[#929BB2] mt-0.5">
                  Persisted prospects with custom scouting notes, priority flagging, and one-click comparison.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWatchlist}
                  disabled={watchlist.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B1020] border border-[#29334C] hover:border-amber-400 text-xs font-semibold text-[#F7F7FB] rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  <Download size={14} className="text-amber-400" />
                  Export CSV
                </button>
                {watchlist.length > 1 && (
                  <button
                    onClick={() => {
                      setCompareQueue(watchlist.slice(0, 3).map((w) => w.player));
                      setIsCompareModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    <GitCompare size={14} />
                    Compare Shortlist
                  </button>
                )}
              </div>
            </div>

            {watchlist.length === 0 ? (
              <div className="text-center py-12 text-[#929BB2] space-y-2">
                <Bookmark size={36} className="mx-auto text-[#29334C]" />
                <p className="text-sm font-semibold text-[#F7F7FB]">Your scouting watchlist is empty.</p>
                <p className="text-xs">Browse emerging prospects and click the star icon to save them here.</p>
                <button
                  onClick={() => setActiveView('all')}
                  className="mt-2 px-4 py-2 bg-[#E90074] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Discover Talents
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item) => (
                  <div
                    key={item.player.id}
                    className="p-4 bg-[#121A2D] border border-[#29334C] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar
                        name={item.player.name}
                        team={item.player.current_teams[0]}
                        role={item.player.primary_role.toLowerCase()}
                        avatarIcon={item.player.avatar_icon}
                        countryFlag={item.player.country_flag}
                        countryCode={item.player.country_code}
                        size="md"
                        showRank={false}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#F7F7FB]">{item.player.name}</h4>
                          <span className="text-xs">{item.player.country_flag}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B1020] text-amber-300 font-bold border border-[#29334C]">
                            Age {item.player.age}
                          </span>
                          {item.isHighPriority && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                              ★ High Priority
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#929BB2] mt-0.5">
                          {item.player.primary_role} • {item.player.sub_role} • Talent Score:{' '}
                          <span className="text-amber-400 font-bold">{item.player.scores.overall_talent_score}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scouting Notes Field */}
                    <div className="flex-1 w-full md:max-w-md bg-[#0B1020] p-2.5 rounded-xl border border-[#29334C]">
                      {editingNotesId === item.player.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNotesText}
                            onChange={(e) => setTempNotesText(e.target.value)}
                            placeholder="Add scouting notes (e.g., temperament, powerplay discipline)..."
                            className="w-full p-2 bg-[#171F35] border border-[#29334C] rounded-lg text-xs text-[#F7F7FB] focus:outline-none focus:border-[#E90074]"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2.5 py-1 text-[11px] text-[#929BB2] hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNotes(item.player.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-md cursor-pointer flex items-center gap-1"
                            >
                              <Save size={12} /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-[#C9C3DF] italic">
                            {item.scoutingNotes ? `"${item.scoutingNotes}"` : 'No scouting notes added yet.'}
                          </p>
                          <button
                            onClick={() => {
                              setEditingNotesId(item.player.id);
                              setTempNotesText(item.scoutingNotes);
                            }}
                            className="text-[#929BB2] hover:text-amber-400 p-1 flex-shrink-0 cursor-pointer"
                            title="Edit notes"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => handleTogglePriority(item.player.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          item.isHighPriority
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#0B1020] border-[#29334C] text-[#929BB2] hover:text-white'
                        }`}
                        title="Toggle High Priority Flag"
                      >
                        <Star size={15} className={item.isHighPriority ? 'fill-amber-400' : ''} />
                      </button>

                      <button
                        onClick={() => setInspectedTalent(item.player)}
                        className="p-2 bg-[#0B1020] border border-[#29334C] hover:border-[#E90074] text-[#C9C3DF] hover:text-white rounded-xl transition-all cursor-pointer"
                        title="View Full Dossier"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => handleToggleWatchlist(item.player)}
                        className="p-2 bg-[#0B1020] border border-[#29334C] hover:border-red-500/50 text-[#929BB2] hover:text-red-400 rounded-xl transition-all cursor-pointer"
                        title="Remove from Watchlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. DATABASE EXPLORER & FILTERS */}
      {activeView !== 'watchlist' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-4 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929BB2]" />
              <input
                type="text"
                placeholder="Search prospect or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#F7F7FB] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Age Filter */}
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="ALL">All Ages (15–24)</option>
              <option value="TEEN">Teen Prodigies (U-20)</option>
              <option value="U23">Core U-23 (21–23)</option>
              <option value="24">Age 24</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="ALL">All Roles</option>
              <option value="Batter">Batters</option>
              <option value="Fast Bowler">Fast Bowlers</option>
              <option value="Spinner">Spinners</option>
              <option value="All-Rounder">All-Rounders</option>
              <option value="Wicketkeeper">Wicketkeepers</option>
            </select>

            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#F59E0B]"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Nationalities' : c}
                </option>
              ))}
            </select>

            {/* Competition Filter */}
            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="ALL">All Competitions</option>
              <option value="IPL">IPL (2022–2026)</option>
              <option value="YOUTH">Youth / Emerging Cups</option>
              <option value="T20I">Senior T20Is</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="talent">Sort: Talent Score</option>
              <option value="perf">Sort: Current Performance</option>
              <option value="potential">Sort: Development Potential</option>
              <option value="youngest">Sort: Youngest First</option>
            </select>

            {/* Uncapped Checkbox */}
            <label className="flex items-center gap-2 px-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#C9C3DF] cursor-pointer hover:border-[#F59E0B]">
              <input
                type="checkbox"
                checked={uncappedOnly}
                onChange={(e) => setUncappedOnly(e.target.checked)}
                className="accent-[#F59E0B] cursor-pointer"
              />
              <span className="truncate">Uncapped Only</span>
            </label>
          </div>

          {compareNotice && (
            <div className="px-4 py-2 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
              <span>{compareNotice}</span>
              <button onClick={() => setCompareNotice(null)} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* Prospects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTalents.map((player) => {
              const isOnWatchlist = watchlistPlayerIds.has(player.id);
              const isQueued = compareQueue.some((p) => p.id === player.id);

              return (
                <div
                  key={player.id}
                  className="bg-[#171F35] border border-[#29334C] hover:border-[#F59E0B]/60 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:shadow-[#F59E0B]/10 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Header Tags & Overall Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#0B1020] border border-[#F59E0B]/50 text-amber-300">
                          Age {player.age}
                        </span>
                        {player.is_uncapped && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            Uncapped
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#121A2D] text-[#929BB2]">
                          {player.primary_role}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-[#929BB2] uppercase tracking-wider block">Talent Score</span>
                        <span className="text-xl font-black text-amber-400 group-hover:text-amber-300 transition-colors">
                          {player.scores.overall_talent_score}
                          <span className="text-xs text-[#929BB2] font-normal">/100</span>
                        </span>
                      </div>
                    </div>

                    {/* Player Info Row */}
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        name={player.name}
                        team={player.current_teams[0]}
                        role={player.primary_role.toLowerCase()}
                        avatarIcon={player.avatar_icon}
                        countryFlag={player.country_flag}
                        countryCode={player.country_code}
                        size="lg"
                        showRank={false}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-extrabold text-[#F7F7FB] truncate">{player.name}</h3>
                          <span className="text-sm">{player.country_flag}</span>
                        </div>
                        <p className="text-xs text-[#C9C3DF] truncate">{player.sub_role}</p>
                        <span className="text-[11px] text-[#929BB2] truncate block mt-0.5">
                          {player.current_teams.slice(0, 2).join(' • ')}
                        </span>
                      </div>
                    </div>

                    {/* 4 Multi-Tier Scoring Breakdown (Explicit Distinction of Stats vs AI) */}
                    <div className="p-3 bg-[#0B1020] rounded-xl border border-[#29334C] space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[#929BB2] flex items-center gap-1">
                            Current Performance
                            <span className="text-[9px] px-1 bg-[#121A2D] text-emerald-400 rounded font-mono">STAT</span>
                          </span>
                          <span className="font-bold text-[#F7F7FB]">{player.scores.current_performance}</span>
                        </div>
                        <div className="w-full bg-[#121A2D] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full" style={{ width: `${player.scores.current_performance}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[#929BB2] flex items-center gap-1">
                            Consistency Rating
                            <span className="text-[9px] px-1 bg-[#121A2D] text-cyan-400 rounded font-mono">STAT</span>
                          </span>
                          <span className="font-bold text-[#F7F7FB]">{player.scores.consistency}</span>
                        </div>
                        <div className="w-full bg-[#121A2D] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-400 h-full" style={{ width: `${player.scores.consistency}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[#929BB2] flex items-center gap-1">
                            Development Potential
                            <span className="text-[9px] px-1 bg-[#121A2D] text-purple-400 rounded font-mono">AI PROJECTION</span>
                          </span>
                          <span className="font-bold text-purple-300">{player.scores.development_potential}</span>
                        </div>
                        <div className="w-full bg-[#121A2D] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#7545C8] to-[#E90074] h-full" style={{ width: `${player.scores.development_potential}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Scouting Excerpt */}
                    <p className="text-xs text-[#929BB2] line-clamp-2 leading-relaxed">
                      {player.why_this_player}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3.5 border-t border-[#29334C] flex items-center gap-2">
                    <button
                      onClick={() => setInspectedTalent(player)}
                      className="flex-1 py-2 px-3 bg-[#121A2D] hover:bg-[#E90074]/15 border border-[#29334C] hover:border-[#E90074]/60 text-xs font-bold text-[#F7F7FB] rounded-xl transition-all cursor-pointer text-center"
                    >
                      Scouting Dossier
                    </button>

                    <button
                      onClick={() => handleToggleWatchlist(player)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isOnWatchlist
                          ? 'bg-[#F59E0B] border-[#F59E0B] text-slate-900 shadow'
                          : 'bg-[#121A2D] border-[#29334C] text-[#929BB2] hover:text-amber-400 hover:border-amber-400/50'
                      }`}
                      title={isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Star size={15} className={isOnWatchlist ? 'fill-slate-900' : ''} />
                    </button>

                    <button
                      onClick={() => handleToggleCompare(player)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isQueued
                          ? 'bg-[#7545C8] border-[#7545C8] text-white shadow'
                          : 'bg-[#121A2D] border-[#29334C] text-[#929BB2] hover:text-white hover:border-[#7545C8]/50'
                      }`}
                      title={isQueued ? 'Remove from comparison' : 'Compare prospect'}
                    >
                      <GitCompare size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. IN-DEPTH SCOUTING DOSSIER MODAL */}
      {inspectedTalent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <YoungTalentRadarIcon size={20} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Future Star Intelligence Dossier
                </span>
              </div>
              <button
                onClick={() => setInspectedTalent(null)}
                className="text-[#929BB2] hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#121A2D] rounded-xl border border-[#29334C]">
              <PlayerAvatar
                name={inspectedTalent.name}
                team={inspectedTalent.current_teams[0]}
                role={inspectedTalent.primary_role.toLowerCase()}
                avatarIcon={inspectedTalent.avatar_icon}
                countryFlag={inspectedTalent.country_flag}
                countryCode={inspectedTalent.country_code}
                size="xl"
                showRank={false}
              />
              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-[#F7F7FB]">{inspectedTalent.name}</h3>
                  <span className="text-base">{inspectedTalent.country_flag}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1020] text-amber-300 font-bold border border-[#29334C]">
                    Age {inspectedTalent.age}
                  </span>
                  {inspectedTalent.is_uncapped && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {inspectedTalent.is_domestic_indian ? 'Uncapped Indian' : 'Uncapped Prospect'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-[#C9C3DF]">{inspectedTalent.sub_role}</p>
                <div className="text-xs text-[#929BB2]">
                  DOB: {inspectedTalent.dob} • {inspectedTalent.current_teams.join(', ')}
                </div>
              </div>
            </div>

            {/* 4 Scores Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[9px] text-[#929BB2] uppercase block">Talent Score</span>
                <span className="text-xl font-black text-amber-400">{inspectedTalent.scores.overall_talent_score}</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[9px] text-emerald-400 uppercase block font-semibold">Performance (Stat)</span>
                <span className="text-xl font-black text-[#F7F7FB]">{inspectedTalent.scores.current_performance}</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[9px] text-cyan-400 uppercase block font-semibold">Consistency (Stat)</span>
                <span className="text-xl font-black text-[#F7F7FB]">{inspectedTalent.scores.consistency}</span>
              </div>
              <div className="bg-[#0B1020] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[9px] text-purple-400 uppercase block font-semibold">Potential (AI Proj)</span>
                <span className="text-xl font-black text-purple-300">{inspectedTalent.scores.development_potential}</span>
              </div>
            </div>

            {/* Verified Historical Dataset Match Snapshot */}
            <div className="p-3.5 bg-[#0B1020] rounded-xl border border-[#29334C] space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Actual Historical Dataset Statistics ({inspectedTalent.stats.matches} Matches)
                </span>
                <span className="text-[10px] text-[#929BB2]">
                  {((inspectedTalent as any).data_basis?.sample_note) || '2022–2026 ball_by_ball.csv'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-[#121A2D] rounded-lg border border-[#29334C]">
                  <span className="text-[10px] text-[#929BB2] uppercase block mb-0.5">Batting Record</span>
                  {inspectedTalent.stats.batting.runs > 0 || (inspectedTalent.stats.batting as any).balls > 0 ? (
                    <div className="text-xs text-[#F7F7FB] font-mono">
                      <strong>{inspectedTalent.stats.batting.runs}</strong> runs ({(inspectedTalent.stats.batting as any).balls ?? '-'}b) • SR{' '}
                      <strong className="text-pink-400">{inspectedTalent.stats.batting.strike_rate}</strong>
                      {inspectedTalent.stats.batting.pressure_sr !== null && (
                        <> • Pressure SR <strong className="text-amber-300">{inspectedTalent.stats.batting.pressure_sr}</strong></>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#929BB2] italic">No batting innings in 2022–2026 dataset</span>
                  )}
                </div>
                <div className="p-2.5 bg-[#121A2D] rounded-lg border border-[#29334C]">
                  <span className="text-[10px] text-[#929BB2] uppercase block mb-0.5">Bowling Record</span>
                  {(inspectedTalent.stats.bowling.balls ?? 0) > 0 ? (
                    <div className="text-xs text-[#F7F7FB] font-mono">
                      <strong>{inspectedTalent.stats.bowling.wickets}</strong> wkts ({((inspectedTalent.stats.bowling as any).balls / 6).toFixed(1)} ov) • Econ{' '}
                      <strong className="text-sky-400">{inspectedTalent.stats.bowling.economy}</strong>
                      {inspectedTalent.stats.bowling.pressure_econ !== null && (
                        <> • Pressure Econ <strong className="text-emerald-300">{inspectedTalent.stats.bowling.pressure_econ}</strong></>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#929BB2] italic">Did not bowl in 2022–2026 dataset</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#929BB2]">
                Data Provenance: Match stats computed from raw CSVs; DOBs verified via public ESPNcricinfo/BCCI profiles.
              </p>
            </div>

            {/* Development Ceiling & Floor Projection */}
            <div className="p-4 bg-[#0B1020] rounded-xl border border-[#29334C] space-y-2 text-xs">
              <div className="flex justify-between items-center text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <span>Development Ceiling & Floor Analysis</span>
                <span>Projected Peak: {inspectedTalent.ceiling_floor.projected_peak_year}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-[#121A2D] rounded-lg border border-[#29334C]">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Development Ceiling</span>
                  <p className="text-xs text-[#F7F7FB] mt-0.5">{inspectedTalent.ceiling_floor.ceiling}</p>
                </div>
                <div className="p-2.5 bg-[#121A2D] rounded-lg border border-[#29334C]">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Baseline Floor</span>
                  <p className="text-xs text-[#F7F7FB] mt-0.5">{inspectedTalent.ceiling_floor.floor}</p>
                </div>
              </div>
            </div>

            {/* Youth Tournaments Footprint */}
            <div className="p-3 bg-[#0B1020] rounded-xl border border-[#29334C]">
              <span className="text-xs font-bold text-[#F7F7FB] uppercase tracking-wider block mb-1.5">
                Tournament & Youth Footprint
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectedTalent.youth_tournaments.map((yt, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#121A2D] text-xs font-medium text-[#C9C3DF] rounded-lg border border-[#29334C]">
                    🏆 {yt}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths & Development Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#121A2D] rounded-xl border border-emerald-500/30 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 size={14} /> Key Technical Strengths
                </span>
                <ul className="text-xs text-[#C9C3DF] space-y-1 list-disc pl-4">
                  {inspectedTalent.scouting_report.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-[#121A2D] rounded-xl border border-amber-500/30 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <AlertCircle size={14} /> Development Focus
                </span>
                <ul className="text-xs text-[#C9C3DF] space-y-1 list-disc pl-4">
                  {inspectedTalent.scouting_report.development_areas.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => handleToggleWatchlist(inspectedTalent)}
                className="px-4 py-2 bg-[#0B1020] border border-[#29334C] hover:border-amber-400 text-xs font-bold text-amber-300 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Star size={14} className={watchlistPlayerIds.has(inspectedTalent.id) ? 'fill-amber-400' : ''} />
                {watchlistPlayerIds.has(inspectedTalent.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>

              <button
                onClick={() => setInspectedTalent(null)}
                className="px-5 py-2 bg-[#E90074] hover:bg-[#E90074]/90 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FUTURE STAR COMPARISON MODAL */}
      {isCompareModalOpen && compareQueue.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <GitCompare size={20} className="text-[#E90074]" />
                <h3 className="text-lg font-black text-[#F7F7FB]">
                  Future Star Comparison Studio ({compareQueue.length} Prospects)
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-[#929BB2] hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {compareQueue.map((player) => (
                <div key={player.id} className="bg-[#121A2D] border border-[#29334C] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <PlayerAvatar
                      name={player.name}
                      team={player.current_teams[0]}
                      role={player.primary_role.toLowerCase()}
                      avatarIcon={player.avatar_icon}
                      countryFlag={player.country_flag}
                      countryCode={player.country_code}
                      size="md"
                      showRank={false}
                    />
                    <button
                      onClick={() => handleToggleCompare(player)}
                      className="text-[#929BB2] hover:text-red-400 p-1 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-[#F7F7FB]">{player.name} {player.country_flag}</h4>
                    <span className="text-xs text-[#929BB2]">Age {player.age} • {player.sub_role}</span>
                  </div>

                  <div className="p-2.5 bg-[#0B1020] rounded-lg border border-[#29334C] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Overall Talent Score</span>
                      <span className="font-bold text-amber-400">{player.scores.overall_talent_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Current Performance</span>
                      <span className="font-bold text-emerald-400">{player.scores.current_performance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Consistency Score</span>
                      <span className="font-bold text-cyan-400">{player.scores.consistency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Dev Potential (AI)</span>
                      <span className="font-bold text-purple-300">{player.scores.development_potential}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#929BB2]">Projected Peak Year</span>
                      <span className="font-bold text-[#F7F7FB]">{player.ceiling_floor.projected_peak_year}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-[#0B1020]/60 rounded-lg border border-[#29334C]/60 text-[11px] space-y-1">
                    <span className="text-emerald-400 font-bold block">Development Ceiling:</span>
                    <p className="text-[#C9C3DF] leading-tight line-clamp-2">{player.ceiling_floor.ceiling}</p>
                  </div>
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

