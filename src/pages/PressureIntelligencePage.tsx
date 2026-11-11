import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Scoreboard } from '../components/Scoreboard';
import { MetricTooltip } from '../components/MetricTooltip';
import { PressureMeter } from '../components/PressureMeter';
import { CricketPitchGraphic } from '../components/CricketPitchGraphic';
import { CricketStumpsIcon, CricketBatIcon, CricketBallIcon } from '../components/CricketIcons';
import pressureMatchesData from '../data/pressure_matches.json';
import { PressureMatch } from '../types';

export const PressureIntelligencePage: React.FC = () => {
  const [innings, setInnings] = useState<'1' | '2'>('2');
  const [activePitchPhase, setActivePitchPhase] = useState<'powerplay' | 'middle' | 'death' | 'all'>('all');

  // Second Innings Simulator State (default example from prompt: 180 target, 144 score, 18 balls left, 3 wickets down)
  const [target, setTarget] = useState<number>(180);
  const [currentScore, setCurrentScore] = useState<number>(144);
  const [ballsRemaining, setBallsRemaining] = useState<number>(18);
  const [wicketsLost, setWicketsLost] = useState<number>(7); // 3 wickets in hand

  // First Innings Simulator State
  const [firstInnOvers, setFirstInnOvers] = useState<number>(16);
  const [firstInnScore, setFirstInnScore] = useState<number>(128);
  const [firstInnWickets, setFirstInnWickets] = useState<number>(4);
  const [isKnockout, setIsKnockout] = useState<boolean>(false);

  // Selected Preset Match
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<PressureMatch>(
    (pressureMatchesData as PressureMatch[])[0]
  );

  // Compute Innings 2 Real-time Math
  const runsNeeded = Math.max(0, target - currentScore);
  const wicketsInHand = Math.max(0, 10 - wicketsLost);
  const oversRemaining = ballsRemaining / 6;
  const rrr = oversRemaining > 0 ? parseFloat((runsNeeded / oversRemaining).toFixed(2)) : runsNeeded * 6;
  const legalBallsBowled = Math.max(1, 120 - ballsRemaining);
  const crr = parseFloat((currentScore / (legalBallsBowled / 6)).toFixed(2));

  // Innings 2 Pressure Formula
  let rrrFactor = 0;
  if (rrr <= 6) rrrFactor = 0.10;
  else if (rrr <= 8.5) rrrFactor = 0.10 + (rrr - 6) * 0.12;
  else if (rrr <= 12) rrrFactor = 0.40 + (rrr - 8.5) * 0.10;
  else if (rrr <= 16) rrrFactor = 0.75 + (rrr - 12) * 0.05;
  else rrrFactor = 0.95 + Math.min(0.05, (rrr - 16) * 0.01);

  const wicketFactor = wicketsLost / 10;
  let phaseUrgency = 0;
  if (ballsRemaining <= 24) phaseUrgency = 0.40;
  else if (ballsRemaining <= 48) phaseUrgency = 0.22;
  else phaseUrgency = 0.08;

  let closenessModifier = 1.0;
  if (runsNeeded <= 12 && wicketsInHand >= 6) closenessModifier = 0.35;
  else if (rrr > 26 && wicketsInHand <= 2) closenessModifier = 0.55;
  else if (ballsRemaining <= 36 && runsNeeded <= 50 && wicketsInHand >= 3) closenessModifier = 1.25;

  let computedPressure = (0.42 * rrrFactor + 0.30 * wicketFactor + 0.28 * phaseUrgency) * closenessModifier;
  if (isKnockout) computedPressure *= 1.15;
  computedPressure = Math.min(1.0, Math.max(0.0, computedPressure));

  // Compute Innings 1 Math
  const firstInnOversCompleted = firstInnOvers;
  const firstInnCrr = firstInnOversCompleted > 0 ? parseFloat((firstInnScore / firstInnOversCompleted).toFixed(2)) : 0;
  let firstInnCollapse = 0;
  if (firstInnWickets >= 3 && firstInnOversCompleted <= 6) firstInnCollapse = 0.65;
  else if (firstInnWickets >= 5 && firstInnOversCompleted <= 12) firstInnCollapse = 0.55;
  else firstInnCollapse = (firstInnWickets / 10) * 0.45;

  let firstInnPhase = 0;
  if (firstInnOversCompleted >= 16) firstInnPhase = 0.50 + ((10 - firstInnWickets) >= 4 ? 0.15 : -0.10);
  else if (firstInnOversCompleted <= 6) firstInnPhase = 0.15;
  else firstInnPhase = 0.22;

  let firstInnHealth = 0;
  if (firstInnOversCompleted >= 8 && firstInnCrr < 7.0) firstInnHealth = 0.22;

  let computedFirstInnPressure = 0.40 * firstInnCollapse + 0.45 * firstInnPhase + 0.15 * firstInnHealth;
  if (isKnockout) computedFirstInnPressure *= 1.15;
  computedFirstInnPressure = Math.min(1.0, Math.max(0.0, computedFirstInnPressure));

  const activePressure = innings === '2' ? computedPressure : computedFirstInnPressure;
  const pressureScore100 = Math.round(activePressure * 100);

  // Classification Category
  let categoryLabel = 'Normal Situation';
  let categoryVariant: 'slate' | 'purple' | 'pink' = 'slate';
  let categoryColor = '#384666';

  if (activePressure >= 0.75) {
    categoryLabel = 'Extreme Pressure';
    categoryVariant = 'pink';
    categoryColor = '#FF1A8C';
  } else if (activePressure >= 0.55) {
    categoryLabel = 'High Pressure';
    categoryVariant = 'pink';
    categoryColor = '#E90074';
  } else if (activePressure >= 0.38) {
    categoryLabel = 'Moderate Pressure';
    categoryVariant = 'purple';
    categoryColor = '#7545C8';
  }

  const generateExplanation = (): string => {
    if (innings === '2') {
      if (activePressure >= 0.75) {
        return `High leverage scenario: Chasing team requires ${runsNeeded} runs off ${ballsRemaining} balls (RRR: ${rrr.toFixed(2)}), with only ${wicketsInHand} wickets in hand. Every dot ball exponentially increases delivery pressure.`;
      } else if (activePressure >= 0.55) {
        return `Elevated leverage: Requiring ${runsNeeded} runs off ${ballsRemaining} deliveries at ${rrr.toFixed(2)} RPO. The batting side needs consistent boundary strikes while preserving the remaining ${wicketsInHand} wickets.`;
      } else if (activePressure >= 0.38) {
        return `Balanced middle-overs chase: ${runsNeeded} runs needed from ${ballsRemaining} balls at ${rrr.toFixed(2)} RPO. Normal match volatility.`;
      } else {
        return `Comfortable victory path: Target is within reach (${runsNeeded} off ${ballsRemaining} balls, ${wicketsInHand} wickets remaining). Anti-climax dampener active.`;
      }
    } else {
      if (activePressure >= 0.75) {
        return `Severe first-innings jeopardy: ${firstInnWickets} wickets down at over ${firstInnOvers}. Death overs acceleration required under acute wicket scarcity.`;
      } else if (activePressure >= 0.55) {
        return `Competitive target-setting phase: Scoring rate is ${firstInnCrr} RPO with ${10 - firstInnWickets} wickets in hand. High execution required.`;
      } else {
        return `Standard first-innings baseline: Foundation overs with adequate batting resources intact.`;
      }
    }
  };

  const applyPreset = (match: PressureMatch) => {
    setSelectedCaseStudy(match);
    setInnings('2');
    setTarget(180);
    setCurrentScore(180 - match.runsNeeded);
    setBallsRemaining(match.ballsRemaining);
    setWicketsLost(10 - match.wicketsInHand);
  };

  const handlePitchPhaseSelect = (phase: 'powerplay' | 'middle' | 'death') => {
    setActivePitchPhase(phase);
    setInnings('2');
    if (phase === 'powerplay') {
      setBallsRemaining(96);
      setCurrentScore(36);
      setTarget(185);
      setWicketsLost(3);
    } else if (phase === 'middle') {
      setBallsRemaining(48);
      setCurrentScore(95);
      setTarget(185);
      setWicketsLost(4);
    } else if (phase === 'death') {
      setBallsRemaining(18);
      setCurrentScore(145);
      setTarget(185);
      setWicketsLost(7);
    }
  };

  const resetToDefault = () => {
    setTarget(180);
    setCurrentScore(144);
    setBallsRemaining(18);
    setWicketsLost(7);
    setIsKnockout(false);
    setActivePitchPhase('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F7FB] flex items-center gap-2">
            <CricketStumpsIcon size={24} className="text-[#E90074]" />
            Pressure Intelligence Engine & Match Simulator
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            Real-time cricket leverage modeling across Required Run Rate, resource scarcity, and stage urgency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={categoryVariant}>{categoryLabel}</Badge>
          <div className="px-3 py-1 rounded-lg bg-[#171F35] border border-[#29334C] text-xs font-mono font-bold text-[#F7F7FB]">
            P-Index: {activePressure.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Broadcast Style Scoreboard */}
      <Scoreboard
        target={target}
        currentScore={currentScore}
        ballsRemaining={ballsRemaining}
        wicketsInHand={wicketsInHand}
        rrr={rrr}
        crr={crr}
        pressureLevel={categoryLabel.split(' ')[0]}
        pressureScore={pressureScore100}
        explanation={generateExplanation()}
      />

      {/* 22-Yard Interactive Pitch Zone Model */}
      <CricketPitchGraphic
        variant="interactive"
        activePhase={activePitchPhase}
        onSelectPhase={handlePitchPhaseSelect}
      />

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Scenario Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rr-glass-card p-5">
            <div className="flex items-center justify-between border-b border-[#29334C] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#E90074]" />
                <span className="text-sm font-bold text-[#F7F7FB]">Match Situation Simulator Controls</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefault}
                  className="p-1.5 rounded-lg bg-[#121A2D] hover:bg-[#171F35] text-[#929BB2] hover:text-[#F7F7FB] border border-[#29334C] text-xs transition-colors"
                  title="Reset to Benchmark Scenario"
                >
                  <RotateCcw size={13} />
                </button>

                {/* Innings Toggle */}
                <div className="flex items-center bg-[#0B1020] p-1 rounded-xl border border-[#29334C]">
                  <button
                    onClick={() => setInnings('2')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      innings === '2'
                        ? 'bg-[#E90074] text-white shadow-rr-pink'
                        : 'text-[#929BB2] hover:text-white'
                    }`}
                  >
                    2nd Innings (Chase)
                  </button>
                  <button
                    onClick={() => setInnings('1')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      innings === '1'
                        ? 'bg-[#7545C8] text-white shadow-rr-purple'
                        : 'text-[#929BB2] hover:text-white'
                    }`}
                  >
                    1st Innings (Setting)
                  </button>
                </div>
              </div>
            </div>

            {innings === '2' ? (
              <div className="space-y-4">
                {/* Target & Score */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Target Score</span>
                      <span className="font-mono text-[#F7F7FB]">{target}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="260"
                      value={target}
                      onChange={(e) => setTarget(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E90074] bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Current Score</span>
                      <span className="font-mono text-[#F7F7FB]">{currentScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={target}
                      value={currentScore}
                      onChange={(e) => setCurrentScore(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E90074] bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Balls Remaining & Wickets */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Balls Remaining</span>
                      <span className="font-mono text-[#E90074]">
                        {ballsRemaining}b ({(ballsRemaining / 6).toFixed(1)} ov)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={ballsRemaining}
                      onChange={(e) => setBallsRemaining(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E90074] bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Wickets Lost</span>
                      <span className="font-mono text-amber-400">
                        {wicketsLost} / 10 ({wicketsInHand} in hand)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={wicketsLost}
                      onChange={(e) => setWicketsLost(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-400 bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Knockout Multiplier */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <div>
                    <span className="text-xs font-semibold text-[#F7F7FB] block">Playoff / Knockout Match Stakes</span>
                    <span className="text-[10px] text-[#929BB2]">Applies a 1.15x championship pressure multiplier</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isKnockout}
                    onChange={(e) => setIsKnockout(e.target.checked)}
                    className="w-4 h-4 accent-[#E90074] rounded cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Innings 1 Controls */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Overs Completed</span>
                      <span className="font-mono text-[#7545C8]">{firstInnOvers} / 20</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="19"
                      value={firstInnOvers}
                      onChange={(e) => setFirstInnOvers(parseInt(e.target.value, 10))}
                      className="w-full accent-[#7545C8] bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Score</span>
                      <span className="font-mono text-[#F7F7FB]">{firstInnScore}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="240"
                      value={firstInnScore}
                      onChange={(e) => setFirstInnScore(parseInt(e.target.value, 10))}
                      className="w-full accent-[#7545C8] bg-[#121A2D] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                    <span>Wickets Lost</span>
                    <span className="font-mono text-amber-400">{firstInnWickets} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={firstInnWickets}
                    onChange={(e) => setFirstInnWickets(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 bg-[#121A2D] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <div>
                    <span className="text-xs font-semibold text-[#F7F7FB] block">Playoff / Knockout Match Stakes</span>
                    <span className="text-[10px] text-[#929BB2]">Applies a 1.15x championship pressure multiplier</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isKnockout}
                    onChange={(e) => setIsKnockout(e.target.checked)}
                    className="w-4 h-4 accent-[#7545C8] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Historical Case Studies Selector */}
          <div className="rr-glass-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#929BB2] mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#E90074]" />
              Historical High-Pressure Case Studies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(pressureMatchesData as PressureMatch[]).map((match) => (
                <div
                  key={match.id}
                  onClick={() => applyPreset(match)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedCaseStudy.id === match.id
                      ? 'bg-[#171F35] border-[#E90074] shadow-sm'
                      : 'bg-[#121A2D] border-[#29334C] hover:border-[#384666]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#F7F7FB] truncate">{match.name}</span>
                    <span className="text-[10px] font-mono font-bold text-[#E90074]">P: {match.pressureIndex}</span>
                  </div>
                  <p className="text-[10px] text-[#929BB2] line-clamp-2 leading-relaxed">{match.situation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Gauge & Mathematical Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {/* Pressure Gauge Card */}
          <div className="rr-glass-card p-6 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#929BB2] block mb-2">
              Calculated Pressure Index
            </span>

            {/* Authentic Stadium Pressure Gauge */}
            <div className="my-3">
              <PressureMeter
                value={pressureScore100}
                size="md"
                label="Situation Index"
              />
            </div>

            <p className="text-xs text-[#929BB2] max-w-xs mx-auto leading-relaxed mt-2">
              {activePressure >= 0.75
                ? 'Extreme match criticality: outcome variance per delivery is maximal. Deliveries under this threshold heavily weight player ratings.'
                : activePressure >= 0.55
                ? 'High pressure situation: demanding required run rate or resource constraint requiring above-average execution.'
                : activePressure >= 0.38
                ? 'Moderate pressure situation: steady contest with balanced resource parity.'
                : 'Normal baseline situation: standard match conditions used for baseline metric calibration.'}
            </p>

            {/* Threshold Legend */}
            <div className="grid grid-cols-4 gap-1.5 mt-5 pt-4 border-t border-[#29334C]/60 text-[10px] w-full">
              <div className="p-1.5 rounded bg-[#121A2D]">
                <span className="block text-[#929BB2]">Normal</span>
                <span className="font-mono text-slate-400">&lt;38</span>
              </div>
              <div className="p-1.5 rounded bg-[#121A2D]">
                <span className="block text-[#929BB2]">Moderate</span>
                <span className="font-mono text-[#7545C8]">38-55</span>
              </div>
              <div className="p-1.5 rounded bg-[#121A2D]">
                <span className="block text-[#929BB2]">High</span>
                <span className="font-mono text-[#E90074]">55-75</span>
              </div>
              <div className="p-1.5 rounded bg-[#121A2D]">
                <span className="block text-[#929BB2]">Extreme</span>
                <span className="font-mono text-pink-400">&ge;75</span>
              </div>
            </div>
          </div>

          {/* Context Safeguards Card */}
          <div className="rr-glass-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9C3DF] mb-2 flex items-center gap-1.5">
              <CheckCircle size={15} className="text-[#E90074]" />
              Anti-Climax & Context Safeguards
            </h4>
            <div className="space-y-2 text-xs text-[#929BB2] leading-relaxed">
              <p>
                <strong className="text-[#F7F7FB]">Not all death overs are extreme pressure:</strong> If a chasing team requires 10 runs off 30 balls with 8 wickets intact, the engine dampens the score via a 0.35x closeness modifier to avoid artificially rewarding stat-padding.
              </p>
              <p>
                <strong className="text-[#F7F7FB]">DLS & Target Reconstruction:</strong> DLS revised targets and revised overs are strictly respected from match records, ensuring required rates accurately reflect target adjustments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
