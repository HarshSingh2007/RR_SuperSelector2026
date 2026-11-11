import React from 'react';

interface PressureMeterProps {
  value: number; // 0 to 100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showNeedle?: boolean;
  className?: string;
}

export const PressureMeter: React.FC<PressureMeterProps> = ({
  value,
  label = 'Pressure Rating',
  size = 'md',
  showNeedle = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Determine category
  const category =
    clampedValue >= 75
      ? { text: 'Extreme Pressure', color: '#FF1A8C', bg: 'bg-pink-500/15 border-pink-500/30' }
      : clampedValue >= 55
      ? { text: 'High Pressure', color: '#E90074', bg: 'bg-[#E90074]/15 border-[#E90074]/30' }
      : clampedValue >= 38
      ? { text: 'Moderate', color: '#7545C8', bg: 'bg-[#7545C8]/15 border-[#7545C8]/30' }
      : { text: 'Normal Baseline', color: '#64748B', bg: 'bg-slate-500/15 border-slate-500/30' };

  // Angle for gauge needle: 180 degrees sweep from -90 to +90 degrees
  const angle = -90 + (clampedValue / 100) * 180;

  const dimensions = {
    sm: { width: 120, height: 75, r: 45, stroke: 8, font: 'text-lg', labelFont: 'text-[9px]' },
    md: { width: 180, height: 110, r: 70, stroke: 12, font: 'text-2xl', labelFont: 'text-[11px]' },
    lg: { width: 240, height: 145, r: 95, stroke: 15, font: 'text-3xl', labelFont: 'text-xs' },
  };

  const dim = dimensions[size];

  // SVG Gauge calculations
  const cx = dim.width / 2;
  const cy = dim.height - 10;
  const radius = dim.r;

  // Polar to cartesian helper for arc paths
  const polarToCartesian = (centerX: number, centerY: number, rad: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, rad: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, rad, endAngle);
    const end = polarToCartesian(x, y, rad, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', rad, rad, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative" style={{ width: dim.width, height: dim.height }}>
        <svg width={dim.width} height={dim.height} className="overflow-visible">
          {/* Background Arc Sectors */}
          {/* Normal: 0 to 38% -> 0 to 68.4 deg */}
          <path
            d={describeArc(cx, cy, radius, 0, 68.4)}
            fill="none"
            stroke="#29334C"
            strokeWidth={dim.stroke}
            strokeLinecap="round"
          />
          {/* Moderate: 38 to 55% -> 68.4 to 99 deg */}
          <path
            d={describeArc(cx, cy, radius, 68.4, 99)}
            fill="none"
            stroke="#7545C8"
            strokeWidth={dim.stroke}
          />
          {/* High: 55 to 75% -> 99 to 135 deg */}
          <path
            d={describeArc(cx, cy, radius, 99, 135)}
            fill="none"
            stroke="#E90074"
            strokeWidth={dim.stroke}
          />
          {/* Extreme: 75 to 100% -> 135 to 180 deg */}
          <path
            d={describeArc(cx, cy, radius, 135, 180)}
            fill="none"
            stroke="#FF1A8C"
            strokeWidth={dim.stroke}
            strokeLinecap="round"
          />

          {/* Value Progress Glow Overlay */}
          <path
            d={describeArc(cx, cy, radius, 0, (clampedValue / 100) * 180)}
            fill="none"
            stroke="url(#meterGlowGrad)"
            strokeWidth={dim.stroke - 2}
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Needle Indicator */}
          {showNeedle && (
            <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
              {/* Needle line */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={-radius + 4}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-md"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={-radius + 4}
                stroke={category.color}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Pivot Hub with cricket ball motif */}
              <circle cx="0" cy="0" r="5" fill="#E90074" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          <defs>
            <linearGradient id="meterGlowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7545C8" />
              <stop offset="60%" stopColor="#E90074" />
              <stop offset="100%" stopColor="#FF1A8C" />
            </linearGradient>
          </defs>
        </svg>

        {/* Value Display in Center Base */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center pointer-events-none">
          <div className={`font-mono font-black text-[#F7F7FB] leading-none tracking-tight ${dim.font}`}>
            {clampedValue}
            <span className="text-[10px] text-[#64748B] font-mono font-normal ml-0.5">/100</span>
          </div>
        </div>
      </div>

      {/* Category Pill Tag */}
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${category.bg}`}
          style={{ color: category.color }}
        >
          {category.text}
        </span>
      </div>
      <span className={`text-[#929BB2] uppercase font-bold tracking-wider mt-0.5 ${dim.labelFont}`}>
        {label}
      </span>
    </div>
  );
};

