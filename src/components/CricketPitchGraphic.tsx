import React, { useState } from 'react';

interface CricketPitchGraphicProps {
  className?: string;
  variant?: 'pitch' | 'stadium' | 'crease' | 'interactive';
  onSelectPhase?: (phase: 'powerplay' | 'middle' | 'death') => void;
  activePhase?: 'powerplay' | 'middle' | 'death' | 'all';
}

export const CricketPitchGraphic: React.FC<CricketPitchGraphicProps> = ({
  className = '',
  variant = 'pitch',
  onSelectPhase,
  activePhase = 'all',
}) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  if (variant === 'crease') {
    return (
      <div className={`relative w-full h-12 overflow-hidden ${className}`}>
        {/* Bowling & Popping Crease line motif */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-6 opacity-40">
          <div className="w-16 h-1 bg-[#E90074] rounded-full shadow-sm" />
          <div className="flex-1 mx-4 border-t-2 border-dashed border-[#29334C]" />
          {/* Stumps */}
          <div className="flex items-center gap-1.5 p-1 bg-[#171F35] rounded border border-[#29334C]">
            <div className="w-1 h-3.5 bg-[#F7F7FB] rounded-t-sm" />
            <div className="w-1 h-3.5 bg-[#E90074] rounded-t-sm" />
            <div className="w-1 h-3.5 bg-[#F7F7FB] rounded-t-sm" />
          </div>
          <div className="flex-1 mx-4 border-t-2 border-dashed border-[#29334C]" />
          <div className="w-16 h-1 bg-[#7545C8] rounded-full shadow-sm" />
        </div>
      </div>
    );
  }

  if (variant === 'interactive') {
    return (
      <div className={`relative rounded-2xl bg-[#0F1626] border border-[#29334C] p-4 select-none ${className}`}>
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E90074] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[#F7F7FB] text-[11px]">
              22-Yard Pressure Zone Pitch Model
            </span>
          </div>
          <span className="text-[10px] text-[#929BB2] font-mono">
            Click zones to inspect match phase leverage
          </span>
        </div>

        {/* Pitch Graphic with Interactive Zones */}
        <div className="relative h-44 w-full bg-[#171F35] rounded-xl border border-[#29334C] overflow-hidden flex flex-col justify-between p-3">
          {/* Turf Mowing Lines Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex">
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full border-r border-white/20"
                style={{ backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              />
            ))}
          </div>

          {/* Bowler End (Popping & Return Crease) */}
          <div className="relative z-10 flex items-center justify-between border-b border-dashed border-[#29334C] pb-2">
            <div className="flex items-center gap-1.5">
              {/* Bowling Crease Stumps */}
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-3.5 bg-[#C9C3DF] rounded-t-sm" />
                <div className="w-1 h-3.5 bg-[#C9C3DF] rounded-t-sm" />
                <div className="w-1 h-3.5 bg-[#C9C3DF] rounded-t-sm" />
              </div>
              <span className="text-[10px] font-mono uppercase font-semibold text-[#929BB2]">
                Bowler's Crease (Over the Wicket)
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#121A2D] text-[#E90074] border border-[#29334C]">
              22 Yards (20.12m)
            </span>
          </div>

          {/* 3 Interactive Match Phase Zones */}
          <div className="relative z-10 grid grid-cols-3 gap-2 my-2">
            {/* Zone 1: Powerplay (Overs 1-6) */}
            <div
              onClick={() => onSelectPhase && onSelectPhase('powerplay')}
              onMouseEnter={() => setHoveredPhase('powerplay')}
              onMouseLeave={() => setHoveredPhase(null)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                activePhase === 'powerplay' || hoveredPhase === 'powerplay'
                  ? 'bg-gradient-to-b from-[#1E2744] to-[#171F35] border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400/30'
                  : 'bg-[#121A2D]/80 border-[#29334C] text-[#C9C3DF] hover:border-[#384666]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                Powerplay (Overs 1-6)
              </span>
              <span className="text-xs font-mono font-bold block mt-0.5 text-[#F7F7FB]">
                Top-Order Survival
              </span>
              <span className="text-[9px] text-[#929BB2] block mt-0.5 font-mono">
                P-Index: 0.38 - 0.52
              </span>
            </div>

            {/* Zone 2: Middle Overs (Overs 7-15) */}
            <div
              onClick={() => onSelectPhase && onSelectPhase('middle')}
              onMouseEnter={() => setHoveredPhase('middle')}
              onMouseLeave={() => setHoveredPhase(null)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                activePhase === 'middle' || hoveredPhase === 'middle'
                  ? 'bg-gradient-to-b from-[#1E2744] to-[#171F35] border-[#7545C8] text-purple-300 shadow-md ring-1 ring-[#7545C8]/30'
                  : 'bg-[#121A2D]/80 border-[#29334C] text-[#C9C3DF] hover:border-[#384666]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                Middle (Overs 7-15)
              </span>
              <span className="text-xs font-mono font-bold block mt-0.5 text-[#F7F7FB]">
                Spin Squeeze & Consolidation
              </span>
              <span className="text-[9px] text-[#929BB2] block mt-0.5 font-mono">
                P-Index: 0.45 - 0.68
              </span>
            </div>

            {/* Zone 3: Death Overs (Overs 16-20) */}
            <div
              onClick={() => onSelectPhase && onSelectPhase('death')}
              onMouseEnter={() => setHoveredPhase('death')}
              onMouseLeave={() => setHoveredPhase(null)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                activePhase === 'death' || hoveredPhase === 'death'
                  ? 'bg-gradient-to-b from-[#251A33] to-[#171F35] border-[#E90074] text-pink-300 shadow-md ring-1 ring-[#E90074]/30'
                  : 'bg-[#121A2D]/80 border-[#29334C] text-[#C9C3DF] hover:border-[#384666]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-[#E90074]">
                Death (Overs 16-20)
              </span>
              <span className="text-xs font-mono font-bold block mt-0.5 text-[#F7F7FB]">
                Maximum Leverage & Finisher Clutches
              </span>
              <span className="text-[9px] text-[#E90074] block mt-0.5 font-mono font-semibold">
                P-Index: 0.75 - 1.00
              </span>
            </div>
          </div>

          {/* Striker End Stumps & Popping Crease */}
          <div className="relative z-10 flex items-center justify-between border-t border-dashed border-[#29334C] pt-2">
            <span className="text-[10px] font-mono uppercase font-semibold text-[#929BB2]">
              Striker's Popping Crease (Batting Guard)
            </span>
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-3.5 bg-[#E90074] rounded-t-sm" />
              <div className="w-1 h-3.5 bg-[#E90074] rounded-t-sm" />
              <div className="w-1 h-3.5 bg-[#E90074] rounded-t-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stadium & Floodlight background graphic
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        className="w-full h-full opacity-25"
        viewBox="0 0 800 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="stadiumGlow" x1="0" y1="0" x2="800" y2="320" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E90074" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#7545C8" stopOpacity="0.4" />
            <stop offset="1" stopColor="#0B1020" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="floodlightBeam1" cx="80" cy="30" r="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="floodlightBeam2" cx="720" cy="30" r="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stadium Floodlight Cones */}
        <circle cx="80" cy="30" r="140" fill="url(#floodlightBeam1)" />
        <circle cx="720" cy="30" r="140" fill="url(#floodlightBeam2)" />

        {/* Floodlight Rig Towers */}
        <rect x="70" y="10" width="20" height="8" rx="2" fill="#29334C" stroke="#C9C3DF" strokeWidth="0.8" />
        <rect x="710" y="10" width="20" height="8" rx="2" fill="#29334C" stroke="#C9C3DF" strokeWidth="0.8" />

        {/* Stadium Boundary Oval */}
        <ellipse
          cx="400"
          cy="160"
          rx="380"
          ry="140"
          stroke="url(#stadiumGlow)"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {/* 30-Yard Circle with Field Markers */}
        <ellipse
          cx="400"
          cy="160"
          rx="230"
          ry="85"
          stroke="#384666"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />

        {/* Central 22-Yard Pitch Strip */}
        <rect
          x="330"
          y="110"
          width="140"
          height="100"
          rx="8"
          fill="#171F35"
          stroke="#29334C"
          strokeWidth="1.5"
        />

        {/* Turf Stripes */}
        <line x1="365" y1="110" x2="365" y2="210" stroke="#E90074" strokeWidth="1.5" opacity="0.8" />
        <line x1="435" y1="110" x2="435" y2="210" stroke="#7545C8" strokeWidth="1.5" opacity="0.8" />

        {/* Stumps & Crease markings */}
        <circle cx="350" cy="155" r="2.5" fill="#F7F7FB" />
        <circle cx="350" cy="160" r="2.5" fill="#F7F7FB" />
        <circle cx="350" cy="165" r="2.5" fill="#F7F7FB" />

        <circle cx="450" cy="155" r="2.5" fill="#F7F7FB" />
        <circle cx="450" cy="160" r="2.5" fill="#F7F7FB" />
        <circle cx="450" cy="165" r="2.5" fill="#F7F7FB" />

        {/* Curved Seam Flight Trajectory */}
        <path
          d="M 350 160 Q 400 120 450 160"
          stroke="#E90074"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
};
