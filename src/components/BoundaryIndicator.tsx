import React from 'react';

interface BoundaryIndicatorProps {
  fours: number;
  sixes: number;
  boundaryPct: number;
  totalPressureRuns?: number;
  className?: string;
}

export const BoundaryIndicator: React.FC<BoundaryIndicatorProps> = ({
  fours,
  sixes,
  boundaryPct,
  totalPressureRuns = 0,
  className = '',
}) => {
  const boundaryRuns = fours * 4 + sixes * 6;
  const runningRuns = Math.max(0, totalPressureRuns - boundaryRuns);
  const boundaryRunPct = totalPressureRuns > 0 ? Math.round((boundaryRuns / totalPressureRuns) * 100) : Math.round(boundaryPct * 1.5);

  const totalBoundaries = fours + sixes;
  const fourRatio = totalBoundaries > 0 ? Math.round((fours / totalBoundaries) * 100) : 50;
  const sixRatio = 100 - fourRatio;

  return (
    <div className={`p-3.5 rounded-xl bg-[#0F1626] border border-[#29334C] text-xs space-y-2.5 ${className}`}>
      {/* Header with Cricket Boundary Rope Visual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Boundary Rope Marker */}
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#E90074]" />
            <span className="w-3 h-0.5 bg-[#E90074]" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#929BB2]">
            Boundary Dynamics
          </span>
        </div>
        <span className="font-mono font-bold text-amber-400 text-xs">
          {boundaryPct}% of Pressure Balls
        </span>
      </div>

      {/* 4s vs 6s Visual Pill Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
          <span className="text-[#C9C3DF] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7545C8]" />
            Fours: <strong>{fours}</strong> <span className="text-[10px] text-[#64748B]">({fours * 4} runs)</span>
          </span>
          <span className="text-amber-300 flex items-center gap-1">
            Sixes: <strong>{sixes}</strong> <span className="text-[10px] text-[#64748B]">({sixes * 6} runs)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </span>
        </div>

        {/* Dual Color Segment Bar */}
        <div className="w-full h-2 rounded-full bg-[#1A2338] overflow-hidden flex">
          <div
            className="h-full bg-[#7545C8] transition-all duration-500"
            style={{ width: `${fourRatio}%` }}
            title={`Fours: ${fourRatio}% of boundaries`}
          />
          <div
            className="h-full bg-gradient-to-r from-[#E90074] to-amber-400 transition-all duration-500"
            style={{ width: `${sixRatio}%` }}
            title={`Sixes: ${sixRatio}% of boundaries`}
          />
        </div>
      </div>

      {/* Runs Distribution in Pressure (Boundaries vs Singles/Doubles) */}
      {totalPressureRuns > 0 && (
        <div className="pt-2 border-t border-[#29334C]/50 flex items-center justify-between text-[10px] font-mono text-[#929BB2]">
          <span>
            Boundary Runs: <strong className="text-[#F7F7FB]">{boundaryRuns}</strong> ({boundaryRunPct}%)
          </span>
          <span>
            Running Runs: <strong className="text-[#F7F7FB]">{runningRuns}</strong> ({100 - boundaryRunPct}%)
          </span>
        </div>
      )}
    </div>
  );
};

