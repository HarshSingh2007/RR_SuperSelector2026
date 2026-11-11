import React from 'react';
import {
  FileCode2,
  Printer,
  ShieldCheck,
  Calculator,
  Database,
  Layers,
  AlertTriangle,
  Award,
  Flame,
} from 'lucide-react';
import { Badge } from '../components/Badge';

export const MethodologyPage: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Title & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#29334C]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E90074]/15 border border-[#E90074]/30 text-xs font-semibold text-[#E90074] mb-2">
            <ShieldCheck size={13} />
            Reproducible & Statistically Defensible
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] tracking-tight">
            Methodology & Technical Transparency Report
          </h2>
          <p className="text-xs text-[#929BB2] mt-1">
            SupeRR Selector Season 2: Scientific framework for evaluating cricket performance under pressure
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white text-xs font-bold shadow-rr-pink hover:opacity-95 transition-all self-start sm:self-auto no-print"
        >
          <Printer size={14} />
          Print / Save PDF Dossier
        </button>
      </div>

      {/* Section: How Our Rankings Are Calculated */}
      <div className="rr-glass-card p-6 border-l-4 border-l-[#E90074]">
        <h3 className="text-lg font-bold text-[#F7F7FB] mb-2">
          How Our Rankings Are Calculated
        </h3>
        <p className="text-xs text-[#929BB2] leading-relaxed mb-3">
          Traditional cricket statistics suffer from severe leverage blindness: a boundary hit when needing 12 off 3 balls is statistically recorded the same as a boundary hit in an uncompetitive dead rubber.
        </p>
        <p className="text-xs text-[#929BB2] leading-relaxed">
          SupeRR Selector 2.0 introduces a dual-phase, ball-by-ball leverage engine that dynamically reconstructs match state across <strong>200,999 historical deliveries</strong>. Every single delivery is assigned a continuous <strong>Pressure Index (P ∈ [0, 1])</strong> based on required run rate steepness, resource scarcity (wickets in hand), stage urgency (death overs), and match closeness. Players are then evaluated strictly on their performance during high-leverage deliveries contrasted against their personal baseline.
        </p>
      </div>

      {/* 1. Dataset Sources & Preprocessing */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#F7F7FB] flex items-center gap-2">
          <Database size={18} className="text-[#E90074]" />
          1. Dataset Sources & Preprocessing Pipeline
        </h3>
        <div className="rr-glass-card p-5 space-y-3 text-xs text-[#929BB2] leading-relaxed">
          <p>
            The analytical framework ingests six relational tables supplied by the Rajasthan Royals analytics data pack:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 font-mono text-[11px] text-[#C9C3DF]">
            <li><strong>ball_by_ball.csv (200,999 rows):</strong> Granular delivery records including striker, bowler, runs, extras type, and dismissal modes.</li>
            <li><strong>matches.csv (883 rows):</strong> Match metadata, toss, venues, revised overs, DLS targets, and winners.</li>
            <li><strong>competitions.csv (141 rows):</strong> 5 IPL editions (2022-2026) and 136 T20 Internationals.</li>
            <li><strong>teams.csv (354 rows):</strong> Multi-competition team identifiers.</li>
            <li><strong>playing_eleven.csv (28,382 rows):</strong> Validated match lineups and batting orders.</li>
            <li><strong>competition_team_player_mapping.csv (6,414 rows):</strong> Global player identity mapping.</li>
          </ul>
          <p className="pt-2 border-t border-[#29334C]/60">
            <strong className="text-[#F7F7FB]">Extras & Dismissals Disambiguation:</strong> Extras are mathematically partitioned: Wides and No-Balls add runs to the bowling total and do not consume a legal delivery. Byes and Leg-Byes count as legal deliveries and add to team totals but are excluded from bowler runs conceded. Crucially, non-bowler dismissals (Run Outs, Retired Out, Obstructing the Field) are separated to ensure bowling strike rates reward pure bowler execution.
          </p>
        </div>
      </section>

      {/* 2. Match-State Reconstruction & Pressure Formulation */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#F7F7FB] flex items-center gap-2">
          <Calculator size={18} className="text-[#7545C8]" />
          2. Match-State Reconstruction & Pressure Index Formulation
        </h3>
        <div className="rr-glass-card p-5 space-y-4 text-xs text-[#929BB2] leading-relaxed">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E90074] mb-1">
              Second Innings: Chase Pressure Formula
            </h4>
            <p className="mb-2">
              For chasing innings, pressure is modeled as a joint function of Required Run Rate (RRR) leverage, wicket scarcity, and stage urgency, modulated by an Anti-Climax Closeness modifier:
            </p>
            <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#29334C] font-mono text-center text-xs text-[#F7F7FB] my-2">
              P_chase = [ 0.42 · f(RRR) + 0.30 · (W_lost / 10) + 0.28 · PhaseUrgency(Balls_rem) ] · ClosenessModifier
            </div>
            <p className="text-[11px] text-[#929BB2]">
              Where <strong>f(RRR)</strong> is benchmarked against T20 par (8.5 rpo) and scales up to 1.0; <strong>ClosenessModifier</strong> prevents stat-padding by applying 0.35x when victory is virtually assured (&le;12 runs with 6+ wickets in hand) and 1.25x during genuine cliffhangers (&le;36 balls, &le;50 runs, &ge;3 wickets).
            </p>
          </div>

          <div className="pt-3 border-t border-[#29334C]/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7545C8] mb-1">
              First Innings: Target-Setting Pressure Formula
            </h4>
            <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#29334C] font-mono text-center text-xs text-[#F7F7FB] my-2">
              P_first = 0.40 · CollapseFactor(W, Overs) + 0.45 · DeathPhase(Overs, W_hand) + 0.15 · ScoringHealth(CRR)
            </div>
            <p className="text-[11px] text-[#929BB2]">
              Losing 3+ wickets in the powerplay registers a high CollapseFactor (0.65). Death overs (overs 16-20) demand boundary maximization, while playoff/knockout fixtures receive an additional 1.15x championship stakes multiplier.
            </p>
          </div>

          {/* 4 Classification Tiers */}
          <div className="pt-3 border-t border-[#29334C]/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9C3DF] mb-2">
              Classification Thresholds
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] block font-sans">Normal Baseline</span>
                <span className="font-bold text-slate-300">P &lt; 0.38</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] block font-sans">Moderate</span>
                <span className="font-bold text-[#7545C8]">0.38 &le; P &lt; 0.55</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] block font-sans">High Pressure</span>
                <span className="font-bold text-[#E90074]">0.55 &le; P &lt; 0.75</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121A2D] border border-[#29334C]">
                <span className="text-[10px] text-[#929BB2] block font-sans">Extreme Pressure</span>
                <span className="font-bold text-pink-400">P &ge; 0.75</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Batting Pressure Index (BPI) Formula */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#F7F7FB] flex items-center gap-2">
          <Flame size={18} className="text-[#E90074]" />
          3. Batting Pressure Index (BPI) Mathematical Model
        </h3>
        <div className="rr-glass-card p-5 space-y-3 text-xs text-[#929BB2] leading-relaxed">
          <p>
            The Batting Pressure Index synthesizes five distinct dimensions of clutch performance into a standardized 0–100 scale:
          </p>
          <div className="p-4 rounded-xl bg-[#0B1020] border border-[#29334C] font-mono text-xs text-[#F7F7FB] leading-loose">
            BPI_raw = 0.35 · min(100, (SR_pressure / 165) · 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.25 · clamp(50 + 1.4 · (SR_pressure - SR_baseline), 0, 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 · min(100, (Runs_per_dismissal / 42) · 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 · min(100, (Boundary% / 24) · 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 · ConsistencyScore
          </div>
          <p className="text-[11px]">
            Final BPI incorporates an <strong>Empirical Bayesian Shrinkage Weight (W_conf)</strong> based on sample volume:
            <code className="text-[#E90074] ml-1">BPI = BPI_raw · [ 0.68 + 0.32 · sqrt(min(Balls, 240) / 240) ]</code>.
            This mathematically ensures that small-sample outliers (e.g. 10 balls at SR 300) cannot usurp consistent performers with hundreds of deliveries under pressure.
          </p>
        </div>
      </section>

      {/* 4. Bowling Pressure Index (BPI-Bowl) Formula */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#F7F7FB] flex items-center gap-2">
          <Award size={18} className="text-[#7545C8]" />
          4. Bowling Pressure Index (BPI-Bowl) Mathematical Model
        </h3>
        <div className="rr-glass-card p-5 space-y-3 text-xs text-[#929BB2] leading-relaxed">
          <p>
            The Bowling Pressure Index rewards run suppression, baseline improvement, and wicket-taking under death/chase constraints:
          </p>
          <div className="p-4 rounded-xl bg-[#0B1020] border border-[#29334C] font-mono text-xs text-[#F7F7FB] leading-loose">
            BPI_bowl_raw = 0.35 · clamp(((12.0 - Econ_pressure) / 5.2) · 100, 0, 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.25 · clamp(50 + 14 · (Econ_baseline - Econ_pressure), 0, 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 · clamp(((30 - min(30, WicketSR)) / 20) · 100, 0, 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 · min(100, (Dot% / 46) · 100) <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 · ConsistencyScore
          </div>
          <p className="text-[11px]">
            Scaled by Bayesian volume shrinkage: <code className="text-[#7545C8]">BPI_bowl = BPI_bowl_raw · [ 0.68 + 0.32 · sqrt(min(Balls, 240) / 240) ]</code>.
          </p>
        </div>
      </section>

      {/* 5. Eligibility & Limitations */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#F7F7FB] flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" />
          5. Minimum Eligibility Thresholds & Limitations
        </h3>
        <div className="rr-glass-card p-5 space-y-3 text-xs text-[#929BB2] leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
              <span className="text-xs font-bold text-[#E90074] block mb-1">Batter Minimums</span>
              <span>Minimum <strong>50 legal pressure deliveries faced</strong> and at least <strong>4 separate pressure matches</strong> across the 2022-2026 dataset.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
              <span className="text-xs font-bold text-[#7545C8] block mb-1">Bowler Minimums</span>
              <span>Minimum <strong>54 legal pressure deliveries bowled (9 overs)</strong> and at least <strong>4 separate pressure matches</strong>.</span>
            </div>
          </div>
          <p className="pt-2 border-t border-[#29334C]/60">
            <strong className="text-[#F7F7FB]">Statistical Limitations:</strong> Incomplete tracking data for boundary dimensions, dew factor variation, and precise field placement configurations could not be reconstructed without fabrication. Consequently, the model operates strictly on verifiable match outcomes, avoiding speculative heuristics.
          </p>
        </div>
      </section>
    </div>
  );
};
