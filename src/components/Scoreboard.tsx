import React from 'react';
import { Badge } from './Badge';
import { CricketBallIcon, CricketBatIcon, CricketStumpsIcon } from './CricketIcons';

interface ScoreboardProps {
  target: number;
  currentScore: number;
  ballsRemaining: number;
  wicketsInHand: number;
  rrr: number;
  crr: number;
  pressureLevel: string;
  pressureScore: number;
  explanation: string;
  className?: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  target,
  currentScore,
  ballsRemaining,
  wicketsInHand,
  rrr,
  crr,
  pressureLevel,
  pressureScore,
  explanation,
  className = '',
}) => {
  const runsNeeded = Math.max(0, target - currentScore);
  const oversRemaining = (ballsRemaining / 6).toFixed(1);
  const ballsInCurrentOver = ballsRemaining % 6;

  // Pressure badge variant
  const badgeVariant =
    pressureLevel === 'Extreme'
      ? 'pink'
      : pressureLevel === 'High'
      ? 'pink'
      : pressureLevel === 'Moderate'
      ? 'purple'
      : 'slate';

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br from-[#121A2D] via-[#171F35] to-[#0B1020] border-2 border-[#29334C] p-5 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background Stadium Seam Pattern */}
      <svg
        className="absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
      >
        <path d="M0 120 Q100 60 200 0" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="100" cy="60" r="45" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* Top Broadcasting Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#29334C]/80 relative z-10">
        <div className="flex items-center gap-2">
          <CricketBallIcon size={16} className="animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F7F7FB]">
            MATCH SITUATION INTELLIGENCE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant}>{pressureLevel} Pressure</Badge>
          <span className="font-mono text-xs text-[#929BB2]">P-Index: {pressureScore}/100</span>
        </div>
      </div>

      {/* Main Scoreboard Digital Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center relative z-10">
        {/* Score & Wickets */}
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#29334C] relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <CricketStumpsIcon size={12} className="text-[#C9C3DF]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2]">
              CHASING / SCORE
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#F7F7FB] tracking-tight">
            {currentScore}
            <span className="text-sm font-normal text-[#929BB2]">/{10 - wicketsInHand}</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-[#929BB2] font-mono">
            <span>Target: {target}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{wicketsInHand} Wkts in Hand</span>
          </div>
        </div>

        {/* Runs Needed */}
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#29334C]">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <CricketBatIcon size={13} className="text-[#E90074]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2]">
              RUNS REQUIRED
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#E90074] tracking-tight">
            {runsNeeded}
          </div>
          <span className="text-[10px] text-[#929BB2] font-mono block mt-1">Needed to win</span>
        </div>

        {/* Balls Remaining with Over Ball Tracker */}
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#29334C]">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <CricketBallIcon size={13} className="text-[#7545C8]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2]">
              BALLS REMAINING
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#7545C8] tracking-tight">
            {ballsRemaining}
          </div>
          {/* Over Progression Dots (6 balls per over) */}
          <div className="flex items-center justify-center gap-1 mt-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < (ballsInCurrentOver === 0 ? 6 : ballsInCurrentOver)
                    ? 'bg-[#7545C8]'
                    : 'bg-[#29334C]'
                }`}
                title={`Ball ${i + 1}`}
              />
            ))}
            <span className="text-[10px] text-[#929BB2] font-mono ml-1">({oversRemaining} ov)</span>
          </div>
        </div>

        {/* Required Run Rate */}
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#29334C]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2] block mb-0.5">
            REQUIRED RUN RATE
          </span>
          <div className={`text-2xl sm:text-3xl font-mono font-black tracking-tight ${
            rrr >= 11 ? 'text-rose-400 animate-pulse' : rrr >= 9 ? 'text-amber-400' : 'text-[#F7F7FB]'
          }`}>
            {rrr.toFixed(2)}
          </div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#929BB2] font-mono mt-1">
            <span>CRR: {crr.toFixed(2)}</span>
            <span>•</span>
            <span className={rrr > crr ? 'text-rose-400' : 'text-emerald-400'}>
              {rrr > crr ? `+${(rrr - crr).toFixed(1)} req` : 'Under par'}
            </span>
          </div>
        </div>
      </div>

      {/* Broadcast Match Verdict Ticker */}
      <div className="mt-4 p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#29334C] flex items-start gap-3 relative z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-[#E90074] mt-1 flex-shrink-0 animate-ping" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-[#F7F7FB] block mb-0.5">Tactical Situation Assessment:</span>
          <p className="text-[#C9C3DF] font-medium">{explanation}</p>
        </div>
      </div>
    </div>
  );
};
