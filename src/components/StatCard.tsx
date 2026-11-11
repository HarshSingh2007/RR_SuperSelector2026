import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accent?: 'pink' | 'purple' | 'blue' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  trendPositive,
  accent = 'pink',
}) => {
  const accentClasses = {
    pink: 'text-[#E90074] border-l-[#E90074]',
    purple: 'text-[#7545C8] border-l-[#7545C8]',
    blue: 'text-sky-400 border-l-sky-400',
    emerald: 'text-emerald-400 border-l-emerald-400',
  };

  // Check if value is numeric or string of digits with commas
  const numericVal =
    typeof value === 'number'
      ? value
      : parseFloat(value.toString().replace(/,/g, ''));
  const hasDecimals = !isNaN(numericVal) && numericVal % 1 !== 0;
  const isPureNumber = !isNaN(numericVal) && /^\d[\d,]*(\.\d+)?$/.test(value.toString().trim());

  return (
    <div
      className={`rr-glass-card p-4 sm:p-5 border-l-4 ${accentClasses[accent]} relative overflow-hidden transition-all hover:translate-y-[-2px] shadow-rr-card`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#929BB2] mb-1">
            {label}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F7F7FB] font-mono">
            {isPureNumber ? (
              <AnimatedCounter
                value={numericVal}
                formatter={(val) =>
                  hasDecimals ? val.toFixed(1) : Math.round(val).toLocaleString('en-US')
                }
              />
            ) : (
              value
            )}
          </h3>
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-[#121A2D] border border-[#29334C] text-[#C9C3DF]">
            {icon}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold font-mono px-1.5 py-0.5 rounded ${trendPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
                }`}
            >
              {trend}
            </span>
          )}
          {subtext && <span className="text-[#929BB2] text-[11px]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
