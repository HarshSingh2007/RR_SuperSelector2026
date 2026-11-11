import React from 'react';
import {
  FileCode2,
  Info,
  ChevronRight,
  ExternalLink,
  Flame,
  Target,
  Trophy,
  GitCompare,
  Gauge,
  LayoutDashboard,
} from 'lucide-react';
import { NavigationTab } from '../types';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  AllRounderIcon,
  BowlingMotionIcon,
  PitchStripIcon,
  RoyalCrestEmblem,
  AuctionGavelIcon,
  HiddenGemIcon,
  HeadToHeadIcon,
  YoungTalentRadarIcon,
} from './CricketIcons';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navItems: Array<{
    id: NavigationTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    tag?: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      sublabel: 'Executive KPIs & Trends',
      icon: <LayoutDashboard size={18} className="text-[#E90074]" />,
    },
    {
      id: 'pressure-engine',
      label: 'Pressure Intelligence',
      sublabel: 'Context Engine & Simulator',
      icon: <CricketStumpsIcon size={19} className="text-[#C9C3DF]" />,
      tag: 'P∈[0,1]',
    },
    {
      id: 'batting',
      label: 'Batting Analytics',
      sublabel: 'Strike Rate & Finishers',
      icon: <CricketBatIcon size={19} className="text-amber-300" />,
    },
    {
      id: 'bowling',
      label: 'Bowling Analytics',
      sublabel: 'Economy & Death Overs',
      icon: <BowlingMotionIcon size={19} className="text-purple-300" />,
    },
    {
      id: 'rankings',
      label: 'Player Rankings',
      sublabel: 'Top 10 Pressure Leaders',
      icon: <Trophy size={18} className="text-amber-400" />,
      tag: 'SupeRR 20',
    },
    {
      id: 'auction',
      label: 'AI Auction War Room',
      sublabel: 'IPL Purse & Squad Simulator',
      icon: <AuctionGavelIcon size={19} className="text-[#E90074]" />,
      tag: '₹100 Cr',
    },
    {
      id: 'hidden-gems',
      label: 'Hidden Gem Detector',
      sublabel: 'Algorithmic Talent Scout',
      icon: <HiddenGemIcon size={19} className="text-purple-300" />,
      tag: 'Scout AI',
    },
    {
      id: 'head-to-head',
      label: 'Batter vs Bowler',
      sublabel: '200k Delivery Matrix',
      icon: <HeadToHeadIcon size={19} className="text-pink-400" />,
      tag: 'Clash',
    },
    {
      id: 'young-talent',
      label: 'Young Talent Radar',
      sublabel: 'Future Stars Discovery',
      icon: <YoungTalentRadarIcon size={19} className="text-amber-400" />,
      tag: 'Ages 15-24',
    },
    {
      id: 'comparison',
      label: 'Player Comparison',
      sublabel: 'Radar & Metric Studio',
      icon: <AllRounderIcon size={19} className="text-cyan-300" />,
    },
    {
      id: 'methodology',
      label: 'Methodology',
      sublabel: 'Mathematical Framework',
      icon: <PitchStripIcon size={19} className="text-[#C9C3DF]" />,
    },
    {
      id: 'about',
      label: 'About the Project',
      sublabel: 'Rajasthan Royals Mission',
      icon: <Info size={18} className="text-[#929BB2]" />,
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-[93px] left-0 h-[calc(100vh-93px)] w-72 lg:w-[288px] flex-shrink-0 bg-[#0B1020]/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-r border-[#29334C] p-3.5 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-1">
          <div className="px-2.5 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#64748B] flex items-center justify-between">
            <span>Cricket Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E90074]" />
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1E2744] to-[#141C30] text-[#F7F7FB] border border-[#29334C] shadow-md'
                    : 'text-[#929BB2] hover:text-[#F7F7FB] hover:bg-[#121A2D]'
                }`}
              >
                {/* Active Cricket Crease Line Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-gradient-to-b from-[#E90074] to-[#7545C8]" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0 ${
                      isActive
                        ? 'bg-[#E90074]/15 border border-[#E90074]/30'
                        : 'bg-[#121A2D] group-hover:bg-[#171F35] border border-transparent'
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-bold block whitespace-nowrap truncate tracking-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-[#64748B] block truncate font-mono">
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                {item.tag ? (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${
                      isActive
                        ? 'bg-[#E90074] text-white border-[#E90074]'
                        : 'bg-[#121A2D] text-[#C9C3DF] border-[#29334C]'
                    }`}
                  >
                    {item.tag}
                  </span>
                ) : (
                  <ChevronRight
                    size={13}
                    className={`text-[#64748B] transition-transform group-hover:translate-x-0.5 ${
                      isActive ? 'text-[#E90074]' : ''
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Cricket Information Card */}
        <div className="pt-4 border-t border-[#29334C]/60 space-y-3">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#171F35] to-[#0F1626] border border-[#29334C] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <CricketBallIcon size={16} />
              <span className="text-xs font-bold text-[#F7F7FB] uppercase font-sans">
                Rajasthan Royals
              </span>
            </div>
            <p className="text-[10px] text-[#929BB2] leading-relaxed">
              SupeRR Selector Season 2 • Data-driven selection science for high-leverage cricket.
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] px-1">
            <span>v2.0.0 Production</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
