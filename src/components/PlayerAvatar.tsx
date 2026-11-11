import React from 'react';
import {
  Zap,
  Flame,
  Target,
  Crosshair,
  Award,
  Sparkles,
  Shield,
  Activity,
  Compass,
  Gauge,
  Wind,
  Disc,
  Navigation,
  Rocket,
  Sun,
  Swords,
  Clover,
  Radio,
} from 'lucide-react';
import { getPlayerInitials, getTeamTheme } from '../utils/teamColors';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  AllRounderIcon,
  WicketkeeperIcon,
  BowlingMotionIcon,
} from './CricketIcons';

interface PlayerAvatarProps {
  name: string;
  team: string;
  rank?: number;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  avatarIcon?: string;
  countryFlag?: string;
  countryCode?: string;
  showFlag?: boolean;
  showRank?: boolean;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  team,
  rank,
  role = 'batter',
  size = 'md',
  avatarIcon,
  countryFlag,
  countryCode,
  showFlag = true,
  showRank = true,
  className = '',
}) => {
  const initials = getPlayerInitials(name);
  const theme = getTeamTheme(team);

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 30,
    '2xl': 36,
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-[9px] -bottom-1 -right-1',
    md: 'w-5 h-5 text-[10px] -bottom-1 -right-1',
    lg: 'w-6 h-6 text-xs -bottom-1 -right-1',
    xl: 'w-7 h-7 text-xs -bottom-1.5 -right-1.5',
    '2xl': 'w-8 h-8 text-sm -bottom-2 -right-2',
  };

  const flagSizeClasses = {
    sm: 'text-xs -top-1 -left-1',
    md: 'text-sm -top-1.5 -left-1.5',
    lg: 'text-base -top-2 -left-2',
    xl: 'text-lg -top-2.5 -left-2.5',
    '2xl': 'text-xl -top-3 -left-3',
  };

  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  const podiumRing = isGold
    ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/25 border-amber-400/80'
    : isSilver
    ? 'ring-2 ring-slate-300 shadow-md border-slate-300/80'
    : isBronze
    ? 'ring-2 ring-amber-700 shadow-md border-amber-600/80'
    : 'ring-1 ring-[#29334C] border-[#29334C]';

  // Distinct icon renderer for each player with cricket-specific SVGs
  const renderSpecializedIcon = () => {
    const iconSize = iconSizes[size];

    switch (avatarIcon) {
      case 'zap': // Vipraj Nigam
        return <Zap size={iconSize} className="text-amber-300 animate-pulse drop-shadow" />;
      case 'shield-lightning': // Shamar Springer
        return <Shield size={iconSize} className="text-teal-300 drop-shadow" />;
      case 'flame': // Ashutosh Sharma
        return <Flame size={iconSize} className="text-orange-400 animate-pulse drop-shadow" />;
      case 'award': // Angelo Mathews
        return <Award size={iconSize} className="text-yellow-400 drop-shadow" />;
      case 'sparkles': // Tim David
        return <Sparkles size={iconSize} className="text-amber-200 drop-shadow" />;
      case 'sword': // Shashank Singh
        return <Swords size={iconSize} className="text-rose-400 drop-shadow" />;
      case 'target': // Tom Banton
        return <Target size={iconSize} className="text-red-400 drop-shadow" />;
      case 'crosshair': // Naman Dhir
        return <Crosshair size={iconSize} className="text-cyan-400 drop-shadow" />;
      case 'shield-check': // Dinesh Karthik (Wicketkeeper Gloves & Stumps)
        return <WicketkeeperIcon size={iconSize} className="text-emerald-400 drop-shadow" />;
      case 'zap-fast': // Mohammad Haris
        return <Zap size={iconSize} className="text-yellow-300 drop-shadow" />;
      case 'radar': // Sufiyan Muqeem
        return <Radio size={iconSize} className="text-emerald-400 drop-shadow" />;
      case 'activity': // Iftikhar Ahmed
        return <Activity size={iconSize} className="text-violet-400 drop-shadow" />;
      case 'compass': // Abrar Ahmed
        return <Compass size={iconSize} className="text-sky-400 drop-shadow" />;
      case 'gauge': // Mohammad Nawaz
        return <Gauge size={iconSize} className="text-teal-400 drop-shadow" />;
      case 'clover': // George Dockrell
        return <Clover size={iconSize} className="text-emerald-300 drop-shadow" />;
      case 'wind': // Shahnawaz Dhani
        return <Wind size={iconSize} className="text-indigo-300 drop-shadow" />;
      case 'disc': // Sunil Narine
        return <Disc size={iconSize} className="text-amber-400 drop-shadow" />;
      case 'navigation': // Saim Ayub
        return <Navigation size={iconSize} className="text-lime-300 drop-shadow" />;
      case 'rocket': // Ahmed Daniyal
        return <Rocket size={iconSize} className="text-pink-400 drop-shadow" />;
      case 'sun': // George Linde
        return <Sun size={iconSize} className="text-amber-300 drop-shadow" />;
      default:
        // Role fallback with authentic custom cricket SVGs
        if (role.toLowerCase().includes('keeper') || role.toLowerCase().includes('wicket')) {
          return <WicketkeeperIcon size={iconSize} color="#10B981" />;
        } else if (role.toLowerCase().includes('all-rounder')) {
          return <AllRounderIcon size={iconSize} color="#7545C8" />;
        } else if (role.toLowerCase().includes('bowler')) {
          return <BowlingMotionIcon size={iconSize} color="#E90074" />;
        }
        return <CricketBatIcon size={iconSize} color="#FBBF24" />;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {/* Team/Country Colored Circular Avatar Container */}
      <div
        className={`${sizeClasses[size]} rounded-2xl flex flex-col items-center justify-center font-bold tracking-tight select-none relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${podiumRing}`}
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, #121A2D 70%, ${theme.secondary} 100%)`,
        }}
      >
        {/* Abstract Cricket Pitch & Ball Seam Visual Graphics */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Seam curve */}
          <path
            d="M 5 55 Q 30 30 55 5"
            stroke="white"
            strokeWidth="2.5"
            strokeDasharray="3 3"
          />
          {/* Cricket Pitch Return Crease */}
          <line x1="15" y1="45" x2="45" y2="45" stroke="white" strokeWidth="1" opacity="0.3" />
          <circle cx="30" cy="30" r="22" stroke="white" strokeWidth="1" opacity="0.15" />
        </svg>

        {/* Distinctive Unique Avatar Icon */}
        <div className="relative z-10 flex items-center justify-center mb-0.5">
          {renderSpecializedIcon()}
        </div>

        {/* Bold Athletic Initials */}
        <span
          className="font-mono font-extrabold text-[10px] sm:text-xs relative z-10 tracking-wider text-white drop-shadow-md leading-none"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
        >
          {initials}
        </span>
      </div>

      {/* Country Flag Badge (Top Left Pill) */}
      {showFlag && countryFlag && (
        <div
          className={`absolute ${flagSizeClasses[size]} rounded-full flex items-center justify-center z-20 shadow-md filter drop-shadow hover:scale-110 transition-transform`}
          title={`${countryCode || 'Country'}`}
        >
          <span>{countryFlag}</span>
        </div>
      )}

      {/* Rank Badge (Bottom Right Pill) */}
      {showRank && rank !== undefined && (
        <div
          className={`absolute ${badgeSizeClasses[size]} rounded-lg font-mono font-extrabold flex items-center justify-center shadow-md z-20 ${
            isGold
              ? 'bg-amber-400 text-black border border-amber-300'
              : isSilver
              ? 'bg-slate-200 text-black border border-slate-300'
              : isBronze
              ? 'bg-amber-800 text-white border border-amber-700'
              : 'bg-[#171F35] text-[#C9C3DF] border border-[#29334C]'
          }`}
          title={`Rank #${rank}`}
        >
          {rank}
        </div>
      )}
    </div>
  );
};
