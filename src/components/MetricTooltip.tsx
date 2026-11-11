import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface MetricTooltipProps {
  term: string;
  simpleExplanation?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const METRIC_GLOSSARY: Record<string, string> = {
  'Pressure Strike Rate': 'How quickly a batter scores when the match becomes difficult and demanding.',
  'Pressure SR': 'How quickly a batter scores when the match becomes difficult and demanding.',
  'Baseline Strike Rate': "The batter's usual scoring rate in low or normal pressure match situations.",
  'Normal SR': "The batter's usual scoring rate in low or normal pressure match situations.",
  'SR Improvement': 'How much faster a batter scores under pressure compared with their normal baseline.',
  'SR Delta': 'How much faster a batter scores under pressure compared with their normal baseline.',
  'Pressure Economy': 'How many runs a bowler concedes per over during high-leverage and death situations.',
  'Pressure Econ': 'How many runs a bowler concedes per over during high-leverage and death situations.',
  'Baseline Economy': "The bowler's typical runs conceded per over under normal, low-pressure conditions.",
  'Normal Econ': "The bowler's typical runs conceded per over under normal, low-pressure conditions.",
  'Economy Suppression': 'The run rate difference: how many fewer runs per over the bowler concedes under pressure.',
  'Econ Delta': 'The run rate difference: how many fewer runs per over the bowler concedes under pressure.',
  'Consistency': 'How reliably and regularly a player delivers across different high-pressure matches.',
  'Boundary %': 'The percentage of deliveries struck for 4 or 6 in critical match moments.',
  'Dot Ball %': 'The percentage of pressure balls where the bowler allows zero runs.',
  'Dismissal Rate': 'Average runs scored between dismissals in high-pressure match situations.',
  'BPI': 'Batting Pressure Index: Comprehensive rating (0-100) weighing strike rate acceleration, boundary power, baseline uplift, and sample volume.',
  'BPI-Bowl': 'Bowling Pressure Index: Comprehensive rating (0-100) weighing economy containment, dot balls, wicket punch, and sample volume.',
  'Confidence Weight': 'Bayesian sample-size adjustment ensuring reliable rankings with enough balls faced/bowled.',
};

export const MetricTooltip: React.FC<MetricTooltipProps> = ({
  term,
  simpleExplanation,
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const text = simpleExplanation || METRIC_GLOSSARY[term] || 'Statistical cricket metric calculated from ball-by-ball match states.';

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center text-[#929BB2] hover:text-[#C9C3DF] cursor-help transition-colors ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      role="tooltip"
      aria-label={text}
    >
      <HelpCircle size={12} className="opacity-70 hover:opacity-100" />

      {isOpen && (
        <div
          className={`absolute z-50 w-52 sm:w-60 p-2.5 rounded-xl bg-[#171F35] border border-[#29334C] text-[#F7F7FB] text-[11px] leading-relaxed shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 ${positionClasses[position]}`}
        >
          <div className="flex items-center gap-1.5 font-bold text-[#E90074] mb-1 text-[11px]">
            <Info size={12} />
            <span>{term}</span>
          </div>
          <p className="text-[#929BB2] font-normal">{text}</p>
        </div>
      )}
    </div>
  );
};

