import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  Award,
  Cpu,
  Layers,
  Code2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/Badge';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Hero Mission */}
      <div className="rr-glass-card p-6 sm:p-8 bg-gradient-to-br from-[#171F35] via-[#121A2D] to-[#0B1020] border-l-4 border-l-[#E90074] shadow-rr-card">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E90074]/15 border border-[#E90074]/30 text-xs font-semibold text-[#E90074] mb-3">
          <Sparkles size={13} />
          <span>Rajasthan Royals • SupeRR Selector Season 2</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] tracking-tight mb-2">
          SupeRR Selector 2.0: The Science of Clutch Performance
        </h2>
        <p className="text-sm text-[#929BB2] leading-relaxed">
          Designed for the Rajasthan Royals sports science and cricket strategy think tank, SupeRR Selector 2.0 answers the definitive question in modern T20 analytics: <em className="text-[#C9C3DF]">Which players consistently rise to the occasion when the contest is on the line?</em>
        </p>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rr-glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-[#E90074]/15 text-[#E90074] flex items-center justify-center mb-3">
            <Cpu size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#F7F7FB] mb-1">State Reconstruction</h3>
          <p className="text-xs text-[#929BB2] leading-relaxed">
            Rebuilding second-by-second match context, required run rates, resources in hand, and closeness dynamics across 200,999 deliveries.
          </p>
        </div>

        <div className="rr-glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-[#7545C8]/15 text-[#7545C8] flex items-center justify-center mb-3">
            <Layers size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#F7F7FB] mb-1">Bayesian Reliability</h3>
          <p className="text-xs text-[#929BB2] leading-relaxed">
            Laplace volume shrinkage ensures low-sample anomalies cannot distort leaderboard credibility over battle-tested veterans.
          </p>
        </div>

        <div className="rr-glass-card p-5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3">
            <Code2 size={20} />
          </div>
          <h3 className="text-sm font-bold text-[#F7F7FB] mb-1">Pure Reproducibility</h3>
          <p className="text-xs text-[#929BB2] leading-relaxed">
            Fully reproducible scripts and explicit mathematical formulations with zero synthetic or fabricated data points.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="rr-glass-card p-6">
        <h3 className="text-sm font-bold text-[#F7F7FB] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Award size={16} className="text-[#E90074]" />
          Engineered Tech Stack
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
            <span className="text-[10px] text-[#929BB2] block">Frontend Framework</span>
            <span className="font-bold text-[#F7F7FB]">React 18 + Vite</span>
          </div>
          <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
            <span className="text-[10px] text-[#929BB2] block">Styling System</span>
            <span className="font-bold text-[#F7F7FB]">Tailwind CSS (RR Theme)</span>
          </div>
          <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
            <span className="text-[10px] text-[#929BB2] block">Data Visualizations</span>
            <span className="font-bold text-[#F7F7FB]">Recharts (Radar, Scatter, Bar)</span>
          </div>
          <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
            <span className="text-[10px] text-[#929BB2] block">Analytics Pipeline</span>
            <span className="font-bold text-[#F7F7FB]">Node.js Streaming Engine</span>
          </div>
        </div>
      </div>

      {/* Unstop Submission Compliance Card */}
      <div className="p-5 rounded-2xl bg-[#121A2D] border border-[#29334C] text-xs text-[#929BB2] space-y-2">
        <div className="flex items-center gap-2 text-[#F7F7FB] font-semibold text-sm">
          <CheckCircle size={16} className="text-emerald-400" />
          Round 1 Submission Checklist Verified
        </div>
        <p>
          ✔ <strong>Top 10 Batters Ordered Dropdown List:</strong> Generated and verified in Leaderboard.
        </p>
        <p>
          ✔ <strong>Top 10 Bowlers Ordered Dropdown List:</strong> Generated and verified in Leaderboard.
        </p>
        <p>
          ✔ <strong>Methodology Report:</strong> Fully accessible in-app and printable as a formal analytical submission document.
        </p>
      </div>
    </div>
  );
};

