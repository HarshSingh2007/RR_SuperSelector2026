import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Bookmark,
  Dna,
  Eye,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Scoreboard } from '../components/Scoreboard';
import { PressureMeter } from '../components/PressureMeter';
import { CricketPitchGraphic } from '../components/CricketPitchGraphic';
import { CricketStumpsIcon, CricketBatIcon, CricketBallIcon } from '../components/CricketIcons';
import pressureMatchesData from '../data/pressure_matches.json';
import { PressureMatch } from '../types';
import { ballsToOversDisplay, computeChasePressure, computeFirstInningsPressure } from '../utils/analyticsEngine';
import { playerDataService } from '../services/playerDataService';
import { useEcosystem } from '../context/EcosystemContext';

export const PressureIntelligencePage: React.FC = () => {
  const {
    pressureContextFocus,
    clearPressureContextFocus,
    openPlayerProfile,
    openPlayerDNA,
    isShortlisted,
    toggleShortlist,
  } = useEcosystem();
  const [innings, setInnings] = useState<'1' | '2'>('2');

  useEffect(() => {
    if (pressureContextFocus) {
      setInnings(pressureContextFocus.innings === 1 ? '1' : '2');
      clearPressureContextFocus();
    }
  }, [pressureContextFocus, clearPressureContextFocus]);
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

  const computedPressure = computeChasePressure({
    runsRequired: runsNeeded,
    ballsRemaining,
    wicketsLost,
    isKnockout,
  });

  // Compute Innings 1 Math
  const firstInnOversCompleted = firstInnOvers;
  const firstInnCrr = firstInnOversCompleted > 0 ? parseFloat((firstInnScore / firstInnOversCompleted).toFixed(2)) : 0;
  const computedFirstInnPressure = computeFirstInningsPressure({
    oversCompleted: firstInnOversCompleted,
    overid: Math.min(20, firstInnOversCompleted + 1),
    currentScore: firstInnScore,
    wicketsLost: firstInnWickets,
    isKnockout,
  });

  const activePressure = innings === '2' ? computedPressure : computedFirstInnPressure;

  // Match context specialists derived purely from audited JSON stats
  const contextSpecialists = useMemo(() => {
    const batters = playerDataService.getBatters();
    const bowlers = playerDataService.getBowlers();
    const isDeathContext =
      (innings === '2' && ballsRemaining <= 36) || (innings === '1' && firstInnOvers >= 15);
    const isEarlyCollapse =
      (innings === '2' && ballsRemaining >= 78 && wicketsLost >= 3) ||
      (innings === '1' && firstInnOvers <= 6 && firstInnWickets >= 3);

    let batterModeLabel = 'Chase & High-Pressure Specialists';
    let sortedBatters = [...batters];
    if (isEarlyCollapse) {
      batterModeLabel = 'Collapse Stabilizers (High Consistency & Rotation)';
      sortedBatters.sort((a, b) => b.consistencyScore * 0.6 + b.rating * 0.4 - (a.consistencyScore * 0.6 + a.rating * 0.4));
    } else if (innings === '2') {
      batterModeLabel = isDeathContext
        ? '2nd Innings Chase Finishers (Death & Chase SR)'
        : '2nd Innings Run-Chase Pacing Leaders';
      sortedBatters.sort((a, b) => (b.chaseSR * 0.4 + b.deathSR * 0.35 + b.rating) - (a.chaseSR * 0.4 + a.deathSR * 0.35 + a.rating));
    } else {
      batterModeLabel = isDeathContext
        ? '1st Innings Death Accelerators (16-20 Ov Surge)'
        : '1st Innings Foundation & Momentum Leaders';
      sortedBatters.sort((a, b) => (b.deathOverallSR ?? b.deathSR) + b.rating - ((a.deathOverallSR ?? a.deathSR) + a.rating));
    }

    let bowlerModeLabel = 'Pressure Containment Specialists';
    let sortedBowlers = [...bowlers];
    if (isDeathContext) {
      bowlerModeLabel = 'Death Overs Specialists (Lowest Death Economy)';
      sortedBowlers = sortedBowlers
        .filter((b) => (b.deathEcon > 0 || (b.deathOverallEcon ?? 0) > 0) && b.pressureOvers >= 8)
        .sort((a, b) => (a.deathEcon || a.deathOverallEcon || 12) - (b.deathEcon || b.deathOverallEcon || 12));
    } else if (isEarlyCollapse) {
      bowlerModeLabel = 'New-Ball Strike Threat (Powerplay Wickets & Economy)';
      sortedBowlers.sort((a, b) => (b.powerplayWickets ?? 0) * 2 + b.rating - ((a.powerplayWickets ?? 0) * 2 + a.rating));
    } else {
      sortedBowlers.sort((a, b) => b.rating - a.rating);
    }

    return {
      batterModeLabel,
      bowlerModeLabel,
      batters: sortedBatters.slice(0, 3),
      bowlers: sortedBowlers.slice(0, 3),
    };
  }, [innings, ballsRemaining, wicketsLost, firstInnOvers, firstInnWickets]);
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

                {/* Overs Completed & Balls Remaining */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#929BB2] mb-1">
                      <span>Overs Completed</span>
                      <span className="font-mono text-cyan-300">
                        {ballsToOversDisplay(120 - ballsRemaining)} / 20.0
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="119"
                      value={Math.max(0, 120 - ballsRemaining)}
                      onChange={(e) => setBallsRemaining(Math.max(1, 120 - parseInt(e.target.value, 10)))}
                      className="w-full accent-cyan-400 bg-[#121A2D] rounded-lg cursor-pointer"
                      aria-label="Overs Completed"
                    />
                  </div>
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
                      aria-label="Balls Remaining"
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
                      aria-label="Wickets Lost"
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

      {/* Dataset-Backed Specialists for Active Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CricketBatIcon size={16} className="text-[#E90074]" />
                {contextSpecialists.batterModeLabel}
              </h4>
              <p className="text-[11px] text-[#929BB2]">
                Ranked strictly from audited CSV chase, death &amp; consistency splits
              </p>
            </div>
            <Badge variant="pink">{categoryLabel.split(' ')[0]}</Badge>
          </div>
          <div className="space-y-2.5">
            {contextSpecialists.batters.map((b) => {
              const shortlisted = isShortlisted(b.id) || isShortlisted(b.name);
              return (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{b.country_flag}</span>
                      <span className="text-xs font-bold text-white truncate">{b.name}</span>
                      <span className="text-[10px] font-mono text-[#E90074]">BPI {b.rating}</span>
                    </div>
                    <p className="text-[10px] text-[#929BB2] font-mono mt-0.5">
                      Press SR {b.pressureSR} · Chase SR {b.chaseSR} · Death SR {(b.deathOverallSR ?? b.deathSR).toFixed(1)} · Cons {b.consistencyScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openPlayerProfile(b, 'batter')}
                      className="p-1.5 rounded-lg bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C]"
                      title="Open Profile"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => openPlayerDNA(b, 'batter')}
                      className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                      title="Open Player DNA"
                    >
                      <Dna size={12} />
                    </button>
                    <button
                      onClick={() => toggleShortlist(b.id, 'Pressure Intelligence')}
                      className={`p-1.5 rounded-lg border ${
                        shortlisted
                          ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                          : 'bg-[#171F35] text-[#929BB2] border-[#29334C]'
                      }`}
                      title="Shortlist"
                    >
                      <Bookmark size={12} className={shortlisted ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rr-glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CricketBallIcon size={16} className="text-[#7545C8]" />
                {contextSpecialists.bowlerModeLabel}
              </h4>
              <p className="text-[11px] text-[#929BB2]">
                Ranked strictly from recorded death economy, powerplay wickets &amp; BPI
              </p>
            </div>
            <Badge variant="purple">Dataset Grounded</Badge>
          </div>
          <div className="space-y-2.5">
            {contextSpecialists.bowlers.map((bw) => {
              const shortlisted = isShortlisted(bw.id) || isShortlisted(bw.name);
              return (
                <div
                  key={bw.id}
                  className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{bw.country_flag}</span>
                      <span className="text-xs font-bold text-white truncate">{bw.name}</span>
                      <span className="text-[10px] font-mono text-[#7545C8]">BPI {bw.rating}</span>
                    </div>
                    <p className="text-[10px] text-[#929BB2] font-mono mt-0.5">
                      Press Econ {bw.pressureEcon} · Death {(bw.deathEcon || bw.deathOverallEcon || 0).toFixed(2)} · {bw.deathPressureWickets} Dth Press Wkts
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openPlayerProfile(bw, 'bowler')}
                      className="p-1.5 rounded-lg bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C]"
                      title="Open Profile"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => openPlayerDNA(bw, 'bowler')}
                      className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                      title="Open Player DNA"
                    >
                      <Dna size={12} />
                    </button>
                    <button
                      onClick={() => toggleShortlist(bw.id, 'Pressure Intelligence')}
                      className={`p-1.5 rounded-lg border ${
                        shortlisted
                          ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                          : 'bg-[#171F35] text-[#929BB2] border-[#29334C]'
                      }`}
                      title="Shortlist"
                    >
                      <Bookmark size={12} className={shortlisted ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
