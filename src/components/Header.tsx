import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Calendar, Menu, X, Bookmark, Search, User, ArrowUpRight } from 'lucide-react';
import { NavigationTab } from '../types';
import { RoyalCrestEmblem, CricketBallIcon } from './CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  selectedComp: string;
  onCompChange: (comp: string) => void;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  onTabChange,
  selectedComp,
  onCompChange,
  selectedSeason,
  onSeasonChange,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { shortlist, setShortlistOpen, openPlayerProfile } = useEcosystem();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const allSummaries = useMemo(() => playerDataService.getAllPlayerSummaries(), []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSummaries
      .filter((s) => s.name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allSummaries, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-clip bg-[#0B1020]/95 backdrop-blur-md border-b border-[#29334C] transition-all">
      {/* Top Cricket Broadcast Ticker */}
      <div className="bg-[#070B16] border-b border-[#1A2338] px-3 sm:px-4 lg:px-8 py-1 text-[10px] sm:text-[11px] font-mono flex items-center justify-between gap-2 text-[#929BB2]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline sm:inline">LIVE DATASET</span>
            <span className="sm:hidden">LIVE</span>
          </div>
          <span className="text-[#29334C] flex-shrink-0">|</span>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <span className="text-[#C9C3DF] truncate">883 Matches</span>
            <span className="text-[#29334C]">•</span>
            <span className="text-[#E90074] truncate">200,999 Deliveries</span>
            <span className="text-[#29334C] hidden sm:inline">•</span>
            <span className="text-purple-300 hidden sm:inline truncate">IPL (2022-2026) & T20Is</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#64748B] flex-shrink-0">
          <span>LEVERAGE ENGINE: DUAL-PHASE P ∈ [0, 1]</span>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Original Royal Cricket Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden shrink-0 p-2 rounded-xl bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C] transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            {/* Custom Original Royal Cricket Emblem */}
            <div className="relative shrink-0 transition-transform group-hover:scale-105 filter drop-shadow">
              <RoyalCrestEmblem size={36} className="text-[#E90074] sm:w-[40px] sm:h-[40px]" />
              {/* Subtle spinning cricket ball indicator on top right */}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E90074] border-2 border-[#0B1020] animate-spin flex items-center justify-center">
                <span className="w-1 h-0.5 bg-white rounded-full" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="font-black text-sm sm:text-lg lg:text-2xl tracking-tight text-[#F7F7FB] flex items-center gap-1.5 font-sans uppercase truncate">
                  Supe<span className="text-[#E90074]">RR</span> Selector
                  <span className="shrink-0 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-mono font-extrabold bg-[#7545C8]/30 text-[#C9C3DF] border border-[#7545C8]/50 shadow-sm">
                    2.0
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-[#929BB2] hidden lg:block tracking-wider font-mono uppercase truncate">
                Cricket Performance Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Fast Player Search Bar */}
        <div ref={searchRef} className="relative hidden md:block w-52 lg:w-72">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BB2]" />
            <input
              type="text"
              placeholder="Find any player (958 in DB)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-[#121A2D] border border-[#29334C] hover:border-[#E90074]/50 focus:border-[#E90074] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#F7F7FB] placeholder-[#929BB2] outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#929BB2] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#171F35] border border-[#29334C] rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-[#29334C]/50 animate-in fade-in duration-150">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    openPlayerProfile(p.id);
                  }}
                  className="p-2.5 hover:bg-[#1E2744] cursor-pointer flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{p.countryFlag}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-white group-hover:text-[#E90074] transition-colors truncate block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#929BB2] truncate block">
                        {p.team} · {p.role}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="text-[#E90074] font-bold block">{p.overallScore}</span>
                    <span className="text-[9px] text-[#929BB2]">Rank #{p.overallRank}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Global Filters with Cricket-Themed Styling */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Format / Competition Filter */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-2.5 lg:px-3 py-1.5 text-xs text-[#929BB2] hover:border-[#E90074]/50 transition-colors max-w-[180px] lg:max-w-none">
            <Filter size={13} className="text-[#E90074] shrink-0" />
            <select
              value={selectedComp}
              onChange={(e) => onCompChange(e.target.value)}
              className="bg-transparent text-[#F7F7FB] font-semibold outline-none cursor-pointer text-xs truncate"
            >
              <option value="ALL" className="bg-[#171F35] text-white">All Competitions (IPL + T20I)</option>
              <option value="IPL" className="bg-[#171F35] text-white">IPL Matches Only</option>
              <option value="T20I" className="bg-[#171F35] text-white">T20 Internationals Only</option>
            </select>
          </div>

          {/* Season Filter */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2] hover:border-[#7545C8]/50 transition-colors">
            <Calendar size={13} className="text-[#7545C8]" />
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(e.target.value)}
              className="bg-transparent text-[#F7F7FB] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35] text-white">All Seasons (2022-2026)</option>
              <option value="2026" className="bg-[#171F35] text-white">Season 2026</option>
              <option value="2025" className="bg-[#171F35] text-white">Season 2025</option>
              <option value="2024" className="bg-[#171F35] text-white">Season 2024</option>
              <option value="2023" className="bg-[#171F35] text-white">Season 2023</option>
              <option value="2022" className="bg-[#171F35] text-white">Season 2022</option>
            </select>
          </div>

          {/* Persistent Shortlist Drawer Trigger */}
          <button
            onClick={() => setShortlistOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171F35] hover:bg-[#1E2845] border border-[#29334C] hover:border-[#E90074]/50 transition-colors text-xs font-bold text-[#F7F7FB]"
            aria-label="Open Scouting Shortlist"
            data-testid="header-shortlist-btn"
          >
            <Bookmark size={14} className="text-[#E90074]" />
            <span className="hidden sm:inline">Shortlist</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#E90074]/20 text-[#FF47A3] border border-[#E90074]/40">
              {shortlist.length}
            </span>
          </button>

          {/* Quick Engine Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171F35] border border-[#29334C]">
            <CricketBallIcon size={14} className="animate-spin-slow" />
            <span className="text-[11px] font-mono font-bold text-[#F7F7FB]">
              BPI ENGINE
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Popping Crease Line across bottom of header */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#E90074]/40 to-transparent" />
    </header>
  );
};
