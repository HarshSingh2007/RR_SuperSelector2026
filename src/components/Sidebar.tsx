import React from 'react';
import {
  Info,
  ChevronRight,
  ChevronLeft,
  Trophy,
  LayoutDashboard,
  Bot,
  ShieldAlert,
  Bookmark,
  Target,
} from 'lucide-react';
import { NavigationTab } from '../types';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  AllRounderIcon,
  BowlingMotionIcon,
  PitchStripIcon,
  AuctionGavelIcon,
  HiddenGemIcon,
  HeadToHeadIcon,
  YoungTalentRadarIcon,
} from './CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tag?: string;
  isNew?: boolean;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    shortlist,
    setShortlistOpen,
    activeAuctionSquad,
  } = useEcosystem();

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'overview',
          label: 'RR Command Center',
          sublabel: 'Executive KPIs & Alerts',
          icon: <LayoutDashboard size={18} className="text-[#E90074]" />,
        },
      ],
    },
    {
      title: 'PERFORMANCE INTELLIGENCE',
      items: [
        {
          id: 'player-profile',
          label: 'Player Intelligence',
          sublabel: '22-Yd Pitch Map & Deep Stats',
          icon: <Target size={18} className="text-sky-400" />,
          isNew: true,
          tag: 'Pitch Map',
        },
        {
          id: 'batting',
          label: 'Batting Leaderboard',
          sublabel: 'Runs, Avg, Boundaries & BPI',
          icon: <CricketBatIcon size={18} className="text-amber-300" />,
        },
        {
          id: 'bowling',
          label: 'Bowling Leaderboard',
          sublabel: 'Wickets, Econ, Phase Splits',
          icon: <BowlingMotionIcon size={18} className="text-purple-300" />,
        },
        {
          id: 'rankings',
          label: 'Official SupeRR 20',
          sublabel: 'Verified Top 10 Leaders',
          icon: <Trophy size={17} className="text-amber-400" />,
          tag: 'Top 20',
        },
        {
          id: 'pressure-engine',
          label: 'Pressure Intelligence',
          sublabel: 'Dual-Innings P ∈ [0,1] Sim',
          icon: <CricketStumpsIcon size={18} className="text-[#C9C3DF]" />,
          tag: 'Sim',
        },
        {
          id: 'comparison',
          label: 'Player DNA & Compare',
          sublabel: '6-Axis Fingerprint Studio',
          icon: <AllRounderIcon size={18} className="text-cyan-300" />,
        },
      ],
    },
    {
      title: 'TALENT DISCOVERY',
      items: [
        {
          id: 'hidden-gems',
          label: 'Hidden Gem Detector',
          sublabel: 'Underrated High-Impact Scout',
          icon: <HiddenGemIcon size={18} className="text-purple-300" />,
        },
        {
          id: 'young-talent',
          label: 'Young Talent Radar',
          sublabel: 'U-24 & Domestic Prospects',
          icon: <YoungTalentRadarIcon size={18} className="text-amber-400" />,
          tag: 'U-24',
        },
        {
          id: 'head-to-head',
          label: 'Matchup Intelligence Lab',
          sublabel: 'H2H, Pace/Spin & Role Lab',
          icon: <HeadToHeadIcon size={18} className="text-pink-400" />,
        },
      ],
    },
    {
      title: 'RECRUITMENT INTELLIGENCE',
      items: [
        {
          id: 'squad-gaps',
          label: 'Squad Gap Analyzer',
          sublabel: '9-Dimension Balance & Needs',
          icon: <ShieldAlert size={17} className="text-emerald-400" />,
          tag: 'NEW',
          isNew: true,
        },
        {
          id: 'ai-assistant',
          label: 'AI Recruitment Assistant',
          sublabel: 'Explainable NL Scout Chat',
          icon: <Bot size={17} className="text-[#FF47A3]" />,
          tag: 'NEW',
          isNew: true,
        },
      ],
    },
    {
      title: 'AUCTION MANAGEMENT',
      items: [
        {
          id: 'auction',
          label: 'Auction & Squad Sim',
          sublabel:
            activeAuctionSquad.length > 0
              ? `${activeAuctionSquad.length} players in active squad`
              : 'Purse, Bid & What-If Scenarios',
          icon: <AuctionGavelIcon size={18} className="text-[#E90074]" />,
          tag: activeAuctionSquad.length > 0 ? `${activeAuctionSquad.length}` : 'Sim',
        },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        {
          id: 'methodology',
          label: 'Methodology & Data Sources',
          sublabel: 'BPI Equations & CSV Provenance',
          icon: <PitchStripIcon size={18} className="text-[#C9C3DF]" />,
        },
        {
          id: 'about',
          label: 'Platform & Architecture',
          sublabel: 'Rajasthan Royals Mission',
          icon: <Info size={17} className="text-[#929BB2]" />,
        },
      ],
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
        className={`fixed lg:sticky top-[93px] left-0 h-[calc(100vh-93px)] flex-shrink-0 bg-[#0B1020]/98 lg:bg-[#0B1020]/90 backdrop-blur-md border-r border-[#29334C] flex flex-col justify-between z-50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[76px] p-2.5' : 'w-72 lg:w-[276px] p-3'
        } ${mobileMenuOpen ? 'translate-x-0 !w-72 !p-3' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Primary Module Navigation"
      >
        {/* Top Collapse Control */}
        <div className={`hidden lg:flex items-center mb-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between px-1.5'}`}>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
              11-Module Suite
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#1D2745] text-[#929BB2] hover:text-white border border-[#29334C] transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="px-2 pt-1 pb-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#64748B] flex items-center justify-between">
                  <span>{section.title}</span>
                </div>
              )}

              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    title={sidebarCollapsed && !mobileMenuOpen ? `${item.label} — ${item.sublabel}` : undefined}
                    className={`w-full flex items-center ${
                      sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-1.5 py-2.5' : 'justify-between gap-2 px-2.5 py-2'
                    } rounded-xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1E2744] to-[#141C30] text-[#F7F7FB] border border-[#29334C] shadow-md'
                        : 'text-[#929BB2] hover:text-[#F7F7FB] hover:bg-[#121A2D]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-gradient-to-b from-[#E90074] to-[#7545C8]" />
                    )}

                    <div className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center' : ''}`}>
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0 ${
                          isActive
                            ? 'bg-[#E90074]/15 border border-[#E90074]/30'
                            : 'bg-[#121A2D] group-hover:bg-[#171F35] border border-transparent'
                        }`}
                      >
                        {item.icon}
                      </div>

                      {(!sidebarCollapsed || mobileMenuOpen) && (
                        <div className="min-w-0">
                          <span className="text-xs font-bold block whitespace-nowrap truncate tracking-tight">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-[#64748B] block truncate font-mono">
                            {item.sublabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {(!sidebarCollapsed || mobileMenuOpen) && item.tag && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${
                          isActive
                            ? 'bg-[#E90074] text-white border-[#E90074]'
                            : item.isNew
                              ? 'bg-[#E90074]/15 text-[#FF47A3] border-[#E90074]/40'
                              : 'bg-[#121A2D] text-[#C9C3DF] border-[#29334C]'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Extra Shortlist Quick Access under AUCTION MANAGEMENT */}
              {section.title === 'AUCTION MANAGEMENT' && (
                <button
                  onClick={() => {
                    setShortlistOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  title={sidebarCollapsed && !mobileMenuOpen ? `Scouting Shortlist (${shortlist.length})` : undefined}
                  className={`w-full flex items-center ${
                    sidebarCollapsed && !mobileMenuOpen ? 'justify-center px-1.5 py-2.5' : 'justify-between gap-2 px-2.5 py-2'
                  } rounded-xl text-left text-[#929BB2] hover:text-[#F7F7FB] hover:bg-[#121A2D] transition-all`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#121A2D] border border-transparent flex-shrink-0 relative">
                      <Bookmark size={15} className="text-[#FF47A3]" />
                      {sidebarCollapsed && !mobileMenuOpen && shortlist.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E90074] text-[9px] font-black text-white flex items-center justify-center">
                          {shortlist.length}
                        </span>
                      )}
                    </div>
                    {(!sidebarCollapsed || mobileMenuOpen) && (
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate tracking-tight">
                          Shortlist Queue
                        </span>
                        <span className="text-[10px] text-[#64748B] block truncate font-mono">
                          Persistent Targets Drawer
                        </span>
                      </div>
                    )}
                  </div>
                  {(!sidebarCollapsed || mobileMenuOpen) && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#E90074]/20 text-[#FF47A3] border border-[#E90074]/40">
                      {shortlist.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Cricket Information Card */}
        {(!sidebarCollapsed || mobileMenuOpen) ? (
          <div className="pt-3 border-t border-[#29334C]/60 space-y-2 mt-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#171F35] to-[#0F1626] border border-[#29334C] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <CricketBallIcon size={15} />
                <span className="text-xs font-bold text-[#F7F7FB] uppercase font-sans">
                  Rajasthan Royals
                </span>
              </div>
              <p className="text-[10px] text-[#929BB2] leading-relaxed">
                SupeRR Selector 2.0 · Zero-hallucination T20 scouting ecosystem.
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] px-1">
              <span>v2.0 Ecosystem</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Verified
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-[#29334C]/60 flex justify-center mt-2" title="SupeRR Selector 2.0">
            <CricketBallIcon size={18} />
          </div>
        )}
      </aside>
    </>
  );
};
