import React from 'react';
import { Crown, Sparkles, ChevronRight, GitCompare, Bookmark, Dna } from 'lucide-react';
import { Batter, Bowler } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { getTeamTheme } from '../utils/teamColors';
import { useEcosystem } from '../context/EcosystemContext';
import { Badge } from './Badge';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  BowlingMotionIcon,
  AllRounderIcon,
  WicketkeeperIcon,
} from './CricketIcons';

interface PlayerCardProps {
  player: Batter | Bowler;
  type: 'batter' | 'bowler';
  onSelect: (player: Batter | Bowler) => void;
  onCompare: (player: Batter | Bowler) => void;
  className?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  type,
  onSelect,
  onCompare,
  className = '',
}) => {
  const isBatter = type === 'batter';
  const batter = isBatter ? (player as Batter) : null;
  const bowler = !isBatter ? (player as Bowler) : null;

  const { isShortlisted, toggleShortlist, openPlayerDNA } = useEcosystem();
  const shortlisted = isShortlisted(player.id) || isShortlisted(player.name);
  const theme = getTeamTheme(player.team);

  const country = player.country || 'International';
  const countryFlag = player.country_flag || '🏏';
  const countryCode = player.country_code || 'INT';
  const playerRole = player.player_role || (isBatter ? 'Batter' : (bowler?.bowlingType || 'Bowler'));
  const avatarIcon = player.avatar_icon;

  const isGold = player.rank === 1;
  const isSilver = player.rank === 2;
  const isBronze = player.rank === 3;

  const cardBorder = isGold
    ? 'border-amber-400/70 bg-gradient-to-b from-[#1E2744] to-[#141C30] shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
    : isSilver
    ? 'border-slate-300/60 bg-gradient-to-b from-[#1B233A] to-[#141C30] shadow-md ring-1 ring-slate-300/20'
    : isBronze
    ? 'border-amber-700/60 bg-gradient-to-b from-[#1A2137] to-[#141C30] shadow-md ring-1 ring-amber-700/20'
    : 'border-[#29334C] bg-[#171F35] hover:border-[#E90074]/60 hover:shadow-rr-card';

  const deltaValue = isBatter ? batter!.srDelta : bowler!.econDelta;
  const isDeltaPositive = deltaValue >= 0;

  // Render role icon
  const renderRoleIcon = () => {
    const roleLower = playerRole.toLowerCase();
    if (roleLower.includes('keeper') || roleLower.includes('wicket')) {
      return <WicketkeeperIcon size={12} className="text-emerald-400 inline mr-1" />;
    }
    if (roleLower.includes('all-rounder')) {
      return <AllRounderIcon size={12} className="text-purple-400 inline mr-1" />;
    }
    if (roleLower.includes('bowler')) {
      return <BowlingMotionIcon size={12} className="text-indigo-400 inline mr-1" />;
    }
    return <CricketBatIcon size={12} className="text-pink-400 inline mr-1" />;
  };

  return (
    <div
      onClick={() => onSelect(player)}
      className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between overflow-hidden ${cardBorder} ${className}`}
    >
      {/* Background Subtle Cricket Ball Seam Watermark */}
      <svg
        className="absolute -bottom-8 -right-8 w-36 h-36 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="48" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M 15 85 Q 50 50 85 15" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="5 5" />
      </svg>

      {/* Top Team Color Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-90 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent || '#E90074'}, ${theme.secondary})`,
        }}
      />

      {/* Podium Pinnacle Tag */}
      {isGold && (
        <div className="absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wider flex items-center gap-1 shadow-md">
          <Crown size={11} className="stroke-[2.5]" /> #1 PINNACLE
        </div>
      )}
      {isSilver && (
        <div className="absolute top-3 right-4 px-2 py-0.5 rounded-full bg-slate-200 text-black font-bold text-[10px] tracking-wider">
          #2 SILVER
        </div>
      )}
      {isBronze && (
        <div className="absolute top-3 right-4 px-2 py-0.5 rounded-full bg-amber-800 text-white font-bold text-[10px] tracking-wider">
          #3 BRONZE
        </div>
      )}

      <div>
        {/* Country Flag & Country Name Header */}
        <div className="flex items-center gap-2 mb-3 text-xs tracking-wider font-bold text-[#C9C3DF]">
          <span className="text-base select-none">{countryFlag}</span>
          <span className="uppercase text-[11px] font-mono tracking-widest text-[#929BB2] group-hover:text-white transition-colors">
            {country}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B1020] text-[#64748B] font-mono border border-[#29334C]">
            {countryCode}
          </span>
        </div>

        {/* Player Identity Row: Avatar + Name + Role + Team */}
        <div className="flex items-start gap-4 mb-4">
          {/* Unique Circular Avatar */}
          <PlayerAvatar
            name={player.name}
            team={player.team}
            rank={player.rank}
            role={playerRole}
            size="lg"
            avatarIcon={avatarIcon}
            countryFlag={countryFlag}
            countryCode={countryCode}
            showFlag={false}
            showRank={true}
          />

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-[#F7F7FB] tracking-tight truncate uppercase font-sans group-hover:text-[#E90074] transition-colors">
              {player.name}
            </h3>

            {/* Role Badge & Team */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center ${
                  playerRole.toLowerCase().includes('all-rounder')
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    : playerRole.toLowerCase().includes('keeper')
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : isBatter
                    ? 'bg-pink-950/60 text-pink-300 border-pink-500/40'
                    : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {renderRoleIcon()}
                {playerRole}
              </span>

              <span className="text-xs text-[#929BB2] truncate flex items-center gap-1 font-medium">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: theme.primary }}
                />
                <span className="truncate max-w-[130px]">{player.team}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Pressure Rating Card */}
        <div className="p-3.5 rounded-xl bg-[#0F1626] border border-[#29334C] mb-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2] flex items-center gap-1">
              {isBatter ? (
                <>
                  <CricketBatIcon size={12} className="text-[#E90074]" />
                  Batting Pressure Rating
                </>
              ) : (
                <>
                  <CricketBallIcon size={12} className="text-[#7545C8]" />
                  Bowling Pressure Rating
                </>
              )}
            </span>
            <span
              className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                isDeltaPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isDeltaPositive ? '+' : ''}
              {deltaValue} {isBatter ? 'SR Delta' : 'Econ Delta'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-black text-[#F7F7FB] tracking-tight">
                {player.rating}
              </span>
              <span className="text-xs text-[#64748B] font-mono">/100</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#929BB2] block">Clutch Index</span>
              <span className="text-xs font-mono font-bold text-[#C9C3DF]">
                {isDeltaPositive ? 'Clutch Surge' : 'Baseline Hold'}
              </span>
            </div>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-[#1A2338] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, player.rating))}%`,
                background: isBatter
                  ? 'linear-gradient(90deg, #7545C8, #E90074)'
                  : 'linear-gradient(90deg, #E90074, #7545C8)',
              }}
            />
          </div>
        </div>

        {/* Key Real Dataset Statistics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
          <div className="p-2.5 rounded-lg bg-[#0F1626]/80 border border-[#29334C]/50">
            <span className="text-[10px] text-[#929BB2] block font-sans truncate">
              Matches Analysed
            </span>
            <span className="font-bold text-[#F7F7FB] text-sm">
              {player.matchesAnalysed} <span className="text-[10px] text-[#64748B] font-normal">({player.pressureMatches} Pressure)</span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0F1626]/80 border border-[#29334C]/50">
            <span className="text-[10px] text-[#929BB2] block font-sans truncate">
              {isBatter ? 'Pressure SR' : 'Pressure Econ'}
            </span>
            <span
              className={`font-bold text-sm ${
                isBatter ? 'text-[#E90074]' : 'text-[#7545C8]'
              }`}
            >
              {isBatter
                ? `${batter!.pressureSR} SR`
                : `${bowler!.pressureEcon} Econ`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div
        className="pt-3 border-t border-[#29334C]/70 flex items-center justify-between gap-2 text-xs mt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onSelect(player)}
          className="text-[#929BB2] hover:text-[#F7F7FB] flex items-center gap-1 font-semibold group-hover:text-[#E90074] transition-colors"
        >
          <span>Profile</span>
          <ChevronRight size={13} />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openPlayerDNA(player, type)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0F1626] hover:bg-[#1C253E] text-[#C9C3DF] hover:text-white border border-[#29334C] transition-colors"
            title="Inspect 6-Axis Player DNA"
          >
            <Dna size={12} className="text-cyan-400" />
            <span className="text-[11px]">DNA</span>
          </button>

          <button
            onClick={() => toggleShortlist(player.id, isBatter ? 'Batting Leaderboard' : 'Bowling Leaderboard')}
            className={`p-1.5 rounded-lg border transition-colors ${
              shortlisted
                ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                : 'bg-[#0F1626] hover:bg-[#1C253E] text-[#929BB2] hover:text-white border-[#29334C]'
            }`}
            title={shortlisted ? 'Remove from Shortlist' : 'Add to Recruitment Shortlist'}
            aria-label={shortlisted ? `Remove ${player.name} from Shortlist` : `Add ${player.name} to Shortlist`}
          >
            <Bookmark size={12} className={shortlisted ? 'fill-current' : ''} />
          </button>

          <button
            onClick={() => onCompare(player)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1626] hover:bg-[#1C253E] text-[#C9C3DF] hover:text-white border border-[#29334C] transition-colors"
            title="Add to Head-to-Head Comparison"
          >
            <GitCompare size={12} className="text-[#E90074]" />
            <span className="text-[11px]">Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
};
