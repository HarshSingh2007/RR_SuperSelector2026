import React from 'react';
import { Filter, Calendar, Activity, Menu, X, Sparkles, Database } from 'lucide-react';
import { NavigationTab } from '../types';
import { RoyalCrestEmblem, CricketBallIcon, PitchStripIcon } from './CricketIcons';

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
  activeTab,
  onTabChange,
  selectedComp,
  onCompChange,
  selectedSeason,
  onSeasonChange,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-b border-[#29334C] transition-all">
      {/* Top Cricket Broadcast Ticker */}
      <div className="bg-[#070B16] border-b border-[#1A2338] px-4 lg:px-8 py-1 text-[11px] font-mono flex items-center justify-between text-[#929BB2]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE DATASET SYNC</span>
          </div>
          <span className="text-[#29334C]">|</span>
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#C9C3DF]">883 Matches Analysed</span>
            <span className="text-[#29334C]">•</span>
            <span className="text-[#E90074]">200,999 Historical Deliveries</span>
            <span className="text-[#29334C]">•</span>
            <span className="text-purple-300">IPL (2022-2026) & T20Is</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#64748B]">
          <span>LEVERAGE ENGINE: DUAL-PHASE P ∈ [0, 1]</span>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Original Royal Cricket Brand Identity */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C] transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Custom Original Royal Cricket Emblem */}
            <div className="relative transition-transform group-hover:scale-105 filter drop-shadow">
              <RoyalCrestEmblem size={40} className="text-[#E90074]" />
              {/* Subtle spinning cricket ball indicator on top right */}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E90074] border-2 border-[#0B1020] animate-spin flex items-center justify-center">
                <span className="w-1 h-0.5 bg-white rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg lg:text-2xl tracking-tight text-[#F7F7FB] flex items-center gap-1.5 font-sans uppercase">
                  Supe<span className="text-[#E90074]">RR</span> Selector
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-extrabold bg-[#7545C8]/30 text-[#C9C3DF] border border-[#7545C8]/50 shadow-sm">
                    2.0
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-[#929BB2] hidden sm:block tracking-wider font-mono uppercase">
                Cricket Performance Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right: Global Filters with Cricket-Themed Styling */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Format / Competition Filter */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2] hover:border-[#E90074]/50 transition-colors">
            <Filter size={13} className="text-[#E90074]" />
            <select
              value={selectedComp}
              onChange={(e) => onCompChange(e.target.value)}
              className="bg-transparent text-[#F7F7FB] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#171F35] text-white">All Competitions (IPL + T20I)</option>
              <option value="IPL" className="bg-[#171F35] text-white">IPL Matches Only</option>
              <option value="T20I" className="bg-[#171F35] text-white">T20 Internationals Only</option>
            </select>
          </div>

          {/* Season Filter */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-1.5 text-xs text-[#929BB2] hover:border-[#7545C8]/50 transition-colors">
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

          {/* Quick Engine Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171F35] border border-[#29334C]">
            <CricketBallIcon size={14} className="animate-spin-slow" />
            <span className="text-[11px] font-mono font-bold text-[#F7F7FB] hidden sm:inline">
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
