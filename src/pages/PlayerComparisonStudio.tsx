import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Bookmark,
  Dna,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Batter, Bowler } from '../types';
import { Badge } from '../components/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { MetricTooltip } from '../components/MetricTooltip';
import {
  CricketBatIcon,
  AllRounderIcon,
  BowlingMotionIcon,
} from '../components/CricketIcons';
import { useEcosystem } from '../context/EcosystemContext';
import { computeBatterDNA, computeBowlerDNA } from '../utils/analyticsEngine';
import { downloadScoutingReport } from '../services/playerDataService';

interface PlayerComparisonStudioProps {
  batters: Batter[];
  bowlers: Bowler[];
  comparisonQueue: Array<Batter | Bowler>;
  onClearQueue: () => void;
}

export const PlayerComparisonStudio: React.FC<PlayerComparisonStudioProps> = ({
  batters,
  bowlers,
  comparisonQueue,
  onClearQueue: _onClearQueue,
}) => {
  const { dnaFocusPlayer, clearDnaFocus, isShortlisted, toggleShortlist } = useEcosystem();
  const [role, setRole] = useState<'batter' | 'bowler'>('batter');
  const [compareCount, setCompareCount] = useState<1 | 2 | 3>(2);

  // Select player A, B, and C
  const [playerAId, setPlayerAId] = useState<string>(() => {
    if (comparisonQueue.length >= 1) return comparisonQueue[0].id;
    return batters[0]?.id || '';
  });

  const [playerBId, setPlayerBId] = useState<string>(() => {
    if (comparisonQueue.length >= 2) return comparisonQueue[1].id;
    return batters[1]?.id || '';
  });

  const [playerCId, setPlayerCId] = useState<string>(() => {
    if (comparisonQueue.length >= 3) return comparisonQueue[2].id;
    return batters[2]?.id || '';
  });

  useEffect(() => {
    if (dnaFocusPlayer) {
      setRole(dnaFocusPlayer.type);
      setPlayerAId(dnaFocusPlayer.id);
      setCompareCount(1);
      clearDnaFocus();
    }
  }, [dnaFocusPlayer, clearDnaFocus]);

  const isBatter = role === 'batter';

  const playerA = useMemo(() => {
    return isBatter
      ? batters.find((b) => b.id === playerAId) || batters[0]
      : bowlers.find((bw) => bw.id === playerAId) || bowlers[0];
  }, [isBatter, playerAId, batters, bowlers]);

  const playerB = useMemo(() => {
    return isBatter
      ? batters.find((b) => b.id === playerBId) || batters[1]
      : bowlers.find((bw) => bw.id === playerBId) || bowlers[1];
  }, [isBatter, playerBId, batters, bowlers]);

  const playerC = useMemo(() => {
    return isBatter
      ? batters.find((b) => b.id === playerCId) || batters[2]
      : bowlers.find((bw) => bw.id === playerCId) || bowlers[2];
  }, [isBatter, playerCId, batters, bowlers]);

  const dnaA = useMemo(
    () => (playerA ? (isBatter ? computeBatterDNA(playerA as Batter) : computeBowlerDNA(playerA as Bowler)) : null),
    [playerA, isBatter]
  );
  const dnaB = useMemo(
    () => (playerB ? (isBatter ? computeBatterDNA(playerB as Batter) : computeBowlerDNA(playerB as Bowler)) : null),
    [playerB, isBatter]
  );
  const dnaC = useMemo(
    () => (playerC ? (isBatter ? computeBatterDNA(playerC as Batter) : computeBowlerDNA(playerC as Bowler)) : null),
    [playerC, isBatter]
  );

  // Construct 6-Axis Player DNA Radar Chart Data
  const radarData = useMemo(() => {
    if (!dnaA || !playerA) return [];
    return dnaA.dimensions.map((dim, idx) => ({
      dimension: dim.axis,
      [playerA.name]: dim.score,
      ...(compareCount >= 2 && playerB && dnaB ? { [playerB.name]: dnaB.dimensions[idx]?.score ?? 50 } : {}),
      ...(compareCount === 3 && playerC && dnaC ? { [playerC.name]: dnaC.dimensions[idx]?.score ?? 50 } : {}),
      fullMark: 100,
    }));
  }, [dnaA, dnaB, dnaC, playerA, playerB, playerC, compareCount]);

  // Automated Explainable Comparative Verdict Generation
  const comparativeVerdict = useMemo(() => {
    if (!playerA || !playerB) return '';

    if (compareCount === 3 && playerC) {
      const players = [playerA, playerB, playerC].sort((a, b) => b.rating - a.rating);
      const top = players[0];
      const second = players[1];
      const third = players[2];

      if (isBatter) {
        const topB = top as Batter;
        return `Across this 3-way evaluation, ${top.name} (BPI: ${top.rating}) demonstrates the strongest clutch credentials, delivering a pressure strike rate of ${topB.pressureSR} (+${topB.srDelta} delta over baseline), outperforming ${second.name} (BPI: ${second.rating}) and ${third.name} (BPI: ${third.rating}). ${top.name}'s combination of boundary percentage (${topB.boundaryPct}%) and match consistency score (${topB.consistencyScore}/100) makes them the primary tactical recommendation for high-leverage batting situations.`;
      } else {
        const topBw = top as Bowler;
        return `Across this 3-way bowling evaluation, ${top.name} (BPI-Bowl: ${top.rating}) leads with exceptional death and chase control, conceding just ${topBw.pressureEcon} runs per over under pressure (+${topBw.econDelta} rpo economy suppression). They rank ahead of ${second.name} (BPI-Bowl: ${second.rating}) and ${third.name} (BPI-Bowl: ${third.rating}) through superior dot ball pressure (${topBw.dotPct}%) and ${topBw.pressureWickets} critical pressure dismissals.`;
      }
    }

    const ratingDiff = Math.abs(playerA.rating - playerB.rating).toFixed(1);
    const higherPlayer = playerA.rating >= playerB.rating ? playerA : playerB;
    const lowerPlayer = playerA.rating < playerB.rating ? playerA : playerB;

    if (isBatter) {
      const hB = higherPlayer as Batter;
      const lB = lowerPlayer as Batter;
      const srDiff = (hB.pressureSR - lB.pressureSR).toFixed(1);

      return `${higherPlayer.name} (BPI: ${higherPlayer.rating}) ranks above ${lowerPlayer.name} (BPI: ${lowerPlayer.rating}) by a margin of +${ratingDiff} points. In high-leverage match situations, ${higherPlayer.name} delivers a pressure strike rate of ${hB.pressureSR} (${parseFloat(srDiff) >= 0 ? `+${srDiff} higher` : `${srDiff} lower`}) and demonstrates an improvement delta of +${hB.srDelta} over normal baseline vs +${lB.srDelta} for ${lowerPlayer.name}. Furthermore, ${higherPlayer.name} boasts a consistency score of ${hB.consistencyScore}/100 across ${hB.pressureMatches} pressure matches, proving statistically superior in high-stakes match resolution.`;
    } else {
      const hBw = higherPlayer as Bowler;
      const lBw = lowerPlayer as Bowler;
      const econDiff = (lBw.pressureEcon - hBw.pressureEcon).toFixed(2);

      return `${higherPlayer.name} (BPI-Bowl: ${higherPlayer.rating}) outperforms ${lowerPlayer.name} (BPI-Bowl: ${lowerPlayer.rating}) by +${ratingDiff} points. Under critical death and chase leverage, ${higherPlayer.name} maintains a restrictive economy rate of ${hBw.pressureEcon} (${parseFloat(econDiff) >= 0 ? `${econDiff} rpo more economical` : `${econDiff} rpo difference`}) while securing ${hBw.pressureWickets} pressure wickets with ${hBw.dotPct}% dot balls, compared to ${lowerPlayer.name}'s ${lBw.pressureEcon} economy and ${lBw.dotPct}% dot balls.`;
    }
  }, [playerA, playerB, playerC, compareCount, isBatter]);

  // Export comparison text report
  const handleExportReport = () => {
    const lines = [
      `# SupeRR Selector 2.0: Player Comparison Report`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Evaluation Category: ${isBatter ? 'Batting Under Pressure' : 'Bowling Under Pressure'}`,
      `Comparison Mode: ${compareCount}-Player Comparison`,
      ``,
      `## 1. Players Evaluated`,
      `- Player 1: ${playerA?.name} (${playerA?.team}) — BPI: ${playerA?.rating}`,
      `- Player 2: ${playerB?.name} (${playerB?.team}) — BPI: ${playerB?.rating}`,
      ...(compareCount === 3 && playerC
        ? [`- Player 3: ${playerC.name} (${playerC.team}) — BPI: ${playerC.rating}`]
        : []),
      ``,
      `## 2. Analytical Verdict: Who Performs Better Under Pressure?`,
      comparativeVerdict,
      ``,
      `## 3. Metrics Comparison`,
    ];

    if (isBatter && playerA && playerB) {
      const bA = playerA as Batter;
      const bB = playerB as Batter;
      const bC = playerC as Batter;
      lines.push(
        `| Metric | ${bA.name} | ${bB.name} | ${compareCount === 3 && bC ? bC.name : ''} |`,
        `| :--- | :---: | :---: | :---: |`,
        `| Pressure Strike Rate | ${bA.pressureSR} | ${bB.pressureSR} | ${compareCount === 3 && bC ? bC.pressureSR : ''} |`,
        `| Baseline Strike Rate | ${bA.normalSR} | ${bB.normalSR} | ${compareCount === 3 && bC ? bC.normalSR : ''} |`,
        `| SR Improvement Delta | +${bA.srDelta} | +${bB.srDelta} | ${compareCount === 3 && bC ? `+${bC.srDelta}` : ''} |`,
        `| Boundary % Under Pressure | ${bA.boundaryPct}% | ${bB.boundaryPct}% | ${compareCount === 3 && bC ? `${bC.boundaryPct}%` : ''} |`,
        `| Pressure Runs (Balls) | ${bA.pressureRuns} (${bA.pressureBalls}b) | ${bB.pressureRuns} (${bB.pressureBalls}b) | ${compareCount === 3 && bC ? `${bC.pressureRuns} (${bC.pressureBalls}b)` : ''} |`,
        `| Consistency Score | ${bA.consistencyScore}/100 | ${bB.consistencyScore}/100 | ${compareCount === 3 && bC ? `${bC.consistencyScore}/100` : ''} |`
      );
    } else if (playerA && playerB) {
      const bwA = playerA as Bowler;
      const bwB = playerB as Bowler;
      const bwC = playerC as Bowler;
      lines.push(
        `| Metric | ${bwA.name} | ${bwB.name} | ${compareCount === 3 && bwC ? bwC.name : ''} |`,
        `| :--- | :---: | :---: | :---: |`,
        `| Pressure Economy | ${bwA.pressureEcon} | ${bwB.pressureEcon} | ${compareCount === 3 && bwC ? bwC.pressureEcon : ''} |`,
        `| Baseline Economy | ${bwA.normalEcon} | ${bwB.normalEcon} | ${compareCount === 3 && bwC ? bwC.normalEcon : ''} |`,
        `| Economy Suppression | +${bwA.econDelta} | +${bwB.econDelta} | ${compareCount === 3 && bwC ? `+${bwC.econDelta}` : ''} |`,
        `| Pressure Wickets | ${bwA.pressureWickets} | ${bwB.pressureWickets} | ${compareCount === 3 && bwC ? bwC.pressureWickets : ''} |`,
        `| Dot Ball % | ${bwA.dotPct}% | ${bwB.dotPct}% | ${compareCount === 3 && bwC ? `${bwC.dotPct}%` : ''} |`,
        `| Pressure Overs | ${bwA.pressureOvers} ov | ${bwB.pressureOvers} ov | ${compareCount === 3 && bwC ? `${bwC.pressureOvers} ov` : ''} |`
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supeRR_comparison_${playerA?.name.replace(/\s+/g, '_')}_vs_${playerB?.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F7FB] flex items-center gap-2">
            <AllRounderIcon size={24} className="text-[#E90074]" />
            Player DNA &amp; Comparison Studio
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            6-Axis Batter &amp; Bowler DNA fingerprints with head-to-head comparison and downloadable scouting dossiers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Studio Mode: 1 Player DNA vs 2 Players vs 3 Players */}
          <div className="flex items-center bg-[#171F35] p-1 rounded-xl border border-[#29334C]">
            <button
              onClick={() => setCompareCount(1)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                compareCount === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-[#929BB2]'
              }`}
            >
              <Dna size={12} /> 1-Player DNA
            </button>
            <button
              onClick={() => setCompareCount(2)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                compareCount === 2 ? 'bg-[#121A2D] text-[#F7F7FB] border border-[#29334C]' : 'text-[#929BB2]'
              }`}
            >
              2 Players
            </button>
            <button
              onClick={() => setCompareCount(3)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                compareCount === 3 ? 'bg-[#121A2D] text-[#F7F7FB] border border-[#29334C]' : 'text-[#929BB2]'
              }`}
            >
              3 Players
            </button>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex items-center bg-[#171F35] p-1 rounded-xl border border-[#29334C]">
            <button
              onClick={() => setRole('batter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isBatter
                  ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white shadow-rr-pink'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <CricketBatIcon size={13} className="text-pink-300" />
              Batters
            </button>
            <button
              onClick={() => setRole('bowler')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isBatter
                  ? 'bg-gradient-to-r from-[#7545C8] to-[#E90074] text-white shadow-rr-purple'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              <BowlingMotionIcon size={13} className="text-purple-300" />
              Bowlers
            </button>
          </div>

          {/* Export Report Action */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171F35] text-[#C9C3DF] hover:text-white border border-[#29334C] hover:border-[#384666] text-xs font-semibold transition-all"
            title="Download Full Comparison Report (.md)"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Player Selectors & Head-to-Head Cards */}
      <div
        className={`grid gap-4 ${
          compareCount === 1
            ? 'grid-cols-1'
            : compareCount === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {/* Player A Card */}
        <div className="rr-glass-card p-5 border-l-4 border-l-[#E90074]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E90074] block mb-2">
            Selected Player 1
          </span>

          <select
            value={playerAId}
            onChange={(e) => setPlayerAId(e.target.value)}
            className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-2 text-sm font-bold text-[#F7F7FB] outline-none mb-4 cursor-pointer"
          >
            {isBatter
              ? batters.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#171F35]">
                    #{b.rank} {b.name} ({b.team}) — BPI: {b.rating}
                  </option>
                ))
              : bowlers.map((bw) => (
                  <option key={bw.id} value={bw.id} className="bg-[#171F35]">
                    #{bw.rank} {bw.name} ({bw.team}) — BPI: {bw.rating}
                  </option>
                ))}
          </select>

          {playerA && (
            <div className="flex items-center gap-4">
              <PlayerAvatar
                name={playerA.name}
                team={playerA.team}
                rank={playerA.rank}
                role={playerA.player_role || role}
                size="lg"
                avatarIcon={playerA.avatar_icon}
                countryFlag={playerA.country_flag}
                countryCode={playerA.country_code}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{playerA.country_flag || '🏏'}</span>
                  <span className="text-[11px] font-mono font-bold text-[#929BB2] uppercase">
                    {playerA.country || 'International'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#F7F7FB] truncate">
                  {playerA.name}
                </h4>
                <p className="text-xs text-[#929BB2] truncate">
                  {playerA.team} • {playerA.player_role || (isBatter ? 'Batter' : 'Bowler')}
                </p>
                <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-xs text-[#929BB2]">Pressure Index</span>
                  <span className="font-mono font-extrabold text-base text-[#E90074]">
                    {playerA.rating} / 100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player B Card */}
        {compareCount >= 2 && (
        <div className="rr-glass-card p-5 border-l-4 border-l-[#7545C8]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7545C8] block mb-2">
            Selected Player 2
          </span>

          <select
            value={playerBId}
            onChange={(e) => setPlayerBId(e.target.value)}
            className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-2 text-sm font-bold text-[#F7F7FB] outline-none mb-4 cursor-pointer"
          >
            {isBatter
              ? batters.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#171F35]">
                    #{b.rank} {b.name} ({b.team}) — BPI: {b.rating}
                  </option>
                ))
              : bowlers.map((bw) => (
                  <option key={bw.id} value={bw.id} className="bg-[#171F35]">
                    #{bw.rank} {bw.name} ({bw.team}) — BPI: {bw.rating}
                  </option>
                ))}
          </select>

          {playerB && (
            <div className="flex items-center gap-4">
              <PlayerAvatar
                name={playerB.name}
                team={playerB.team}
                rank={playerB.rank}
                role={playerB.player_role || role}
                size="lg"
                avatarIcon={playerB.avatar_icon}
                countryFlag={playerB.country_flag}
                countryCode={playerB.country_code}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{playerB.country_flag || '🏏'}</span>
                  <span className="text-[11px] font-mono font-bold text-[#929BB2] uppercase">
                    {playerB.country || 'International'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#F7F7FB] truncate">
                  {playerB.name}
                </h4>
                <p className="text-xs text-[#929BB2] truncate">
                  {playerB.team} • {playerB.player_role || (isBatter ? 'Batter' : 'Bowler')}
                </p>
                <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#121A2D]">
                  <span className="text-xs text-[#929BB2]">Pressure Index</span>
                  <span className="font-mono font-extrabold text-base text-[#7545C8]">
                    {playerB.rating} / 100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Optional Player C Card (for 3-Way Tri-Comparison) */}
        {compareCount === 3 && (
          <div className="rr-glass-card p-5 border-l-4 border-l-sky-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-2">
              Selected Player 3
            </span>

            <select
              value={playerCId}
              onChange={(e) => setPlayerCId(e.target.value)}
              className="w-full bg-[#121A2D] border border-[#29334C] rounded-xl px-3 py-2 text-sm font-bold text-[#F7F7FB] outline-none mb-4 cursor-pointer"
            >
              {isBatter
                ? batters.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#171F35]">
                      #{b.rank} {b.name} ({b.team}) — BPI: {b.rating}
                    </option>
                  ))
                : bowlers.map((bw) => (
                    <option key={bw.id} value={bw.id} className="bg-[#171F35]">
                      #{bw.rank} {bw.name} ({bw.team}) — BPI: {bw.rating}
                    </option>
                  ))}
            </select>

            {playerC && (
              <div className="flex items-center gap-4">
                <PlayerAvatar
                  name={playerC.name}
                  team={playerC.team}
                  rank={playerC.rank}
                  role={playerC.player_role || role}
                  size="lg"
                  avatarIcon={playerC.avatar_icon}
                  countryFlag={playerC.country_flag}
                  countryCode={playerC.country_code}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{playerC.country_flag || '🏏'}</span>
                    <span className="text-[11px] font-mono font-bold text-[#929BB2] uppercase">
                      {playerC.country || 'International'}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#F7F7FB] truncate">
                    {playerC.name}
                  </h4>
                  <p className="text-xs text-[#929BB2] truncate">
                    {playerC.team} • {playerC.player_role || (isBatter ? 'Batter' : 'Bowler')}
                  </p>
                  <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-[#121A2D]">
                    <span className="text-xs text-[#929BB2]">Pressure Index</span>
                    <span className="font-mono font-extrabold text-base text-sky-400">
                      {playerC.rating} / 100
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION: WHO PERFORMS BETTER UNDER PRESSURE? / SINGLE PLAYER DNA */}
      <div className="rr-glass-card p-6 border-[#E90074]/50 bg-gradient-to-r from-[#171F35] via-[#121A2D] to-[#171F35] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#E90074]" />
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#F7F7FB]">
              {compareCount === 1 && playerA
                ? `${playerA.name.toUpperCase()} — 6-AXIS PLAYER DNA DIAGNOSTIC`
                : 'WHO PERFORMS BETTER UNDER PRESSURE?'}
            </h3>
          </div>
          {playerA && dnaA && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold">
                DNA Score: {dnaA.overallDNA}/100
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                  dnaA.confidence.level === 'robust'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : dnaA.confidence.level === 'moderate'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {dnaA.confidence.label} ({dnaA.confidence.weight}x)
              </span>
              <button
                onClick={() => toggleShortlist(playerA.id, 'Player DNA Studio')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                  isShortlisted(playerA.id) || isShortlisted(playerA.name)
                    ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                    : 'bg-[#121A2D] border-[#29334C] text-[#C9C3DF] hover:text-white'
                }`}
              >
                <Bookmark size={12} /> Shortlist {playerA.name.split(' ')[0]}
              </button>
              <button
                onClick={() => downloadScoutingReport(playerA, role)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#121A2D] border border-[#29334C] text-xs font-bold text-[#C9C3DF] hover:text-white transition-colors"
              >
                <Download size={12} className="text-cyan-400" /> Scouting Report (.md)
              </button>
            </div>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#C9C3DF] leading-relaxed">
          {compareCount === 1 && playerA && dnaA
            ? `${playerA.name} scores ${dnaA.overallDNA}/100 on 6-axis ${isBatter ? 'Batting' : 'Bowling'} DNA across ${playerA.matchesAnalysed} matches (${playerA.pressureMatches} high-pressure). Key edge: ${dnaA.strengths[0]}.`
            : comparativeVerdict}
        </p>

        {/* DNA Strengths, Weaknesses & Sample Warnings */}
        {dnaA && (
          <div className="mt-4 pt-4 border-t border-[#29334C]/70 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0F1626] border border-emerald-500/25">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={13} /> {playerA?.name} Top DNA Strengths
              </span>
              <ul className="space-y-1 text-[#C9C3DF] list-disc pl-4">
                {dnaA.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-[#0F1626] border border-amber-500/25">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <AlertTriangle size={13} /> Development &amp; Sample Flags
              </span>
              <ul className="space-y-1 text-[#C9C3DF] list-disc pl-4">
                {dnaA.weaknesses.map((w) => (
                  <li key={w}>{w}</li>
                ))}
                {dnaA.confidence.warning && <li className="text-amber-300">{dnaA.confidence.warning}</li>}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Visual Comparison: 6-Axis DNA Radar & Metrics Difference Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-6 rr-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F7F7FB]">6-Axis Player DNA Fingerprint</h3>
              <p className="text-xs text-[#929BB2]">
                {isBatter
                  ? 'Power Hitting · Strike Rotation · Consistency · Finishing · Pressure Perf. · Boundaries'
                  : 'Economy · Wicket-Taking · Death · Powerplay · Middle Control · Consistency'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[#E90074] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E90074]" /> {playerA?.name.split(' ')[0]}
              </span>
              {compareCount >= 2 && playerB && (
                <span className="flex items-center gap-1 text-[#7545C8] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7545C8]" /> {playerB?.name.split(' ')[0]}
                </span>
              )}
              {compareCount === 3 && playerC && (
                <span className="flex items-center gap-1 text-sky-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> {playerC?.name.split(' ')[0]}
                </span>
              )}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#29334C" />
                <PolarAngleAxis dataKey="dimension" stroke="#929BB2" fontSize={10} />
                <PolarRadiusAxis stroke="#384666" domain={[0, 100]} />
                <Radar
                  name={playerA?.name}
                  dataKey={playerA?.name}
                  stroke="#E90074"
                  fill="#E90074"
                  fillOpacity={0.35}
                />
                {compareCount >= 2 && playerB && (
                  <Radar
                    name={playerB?.name}
                    dataKey={playerB?.name}
                    stroke="#7545C8"
                    fill="#7545C8"
                    fillOpacity={0.35}
                  />
                )}
                {compareCount === 3 && playerC && (
                  <Radar
                    name={playerC?.name}
                    dataKey={playerC?.name}
                    stroke="#38BDF8"
                    fill="#38BDF8"
                    fillOpacity={0.35}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direct Metrics Comparison Table OR Single Player DNA Breakdown */}
        <div className="lg:col-span-6 rr-glass-card p-5">
          <h3 className="text-sm font-bold text-[#F7F7FB] mb-1">
            {compareCount === 1 ? '6-Axis DNA Score Breakdown' : 'Direct Statistical Comparison'}
          </h3>
          <p className="text-xs text-[#929BB2] mb-4">
            {compareCount === 1 && playerA
              ? `Exact dimensional scores and underlying CSV basis for ${playerA.name}`
              : 'Direct head-to-head metrics breakdown'}
          </p>

          {compareCount === 1 && dnaA ? (
            <div className="space-y-3 text-xs">
              {dnaA.dimensions.map((d) => (
                <div key={d.axis} className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white">{d.axis}</span>
                    <span className="font-mono font-black text-cyan-300">{d.score} / 100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0B1020] overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E90074] to-cyan-400"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#929BB2]">{d.rawLabel}</span>
                </div>
              ))}
            </div>
          ) : isBatter && playerA && playerB ? (
            <div className="space-y-3 text-xs">
              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#E90074]">{(playerA as Batter).pressureSR}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Pressure SR <MetricTooltip term="Pressure Strike Rate" />
                </span>
                <span className="text-right font-bold text-[#7545C8]">{(playerB as Batter).pressureSR}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-sky-400">
                    {(playerC as Batter).pressureSR}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#F7F7FB]">{(playerA as Batter).normalSR}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Normal SR <MetricTooltip term="Baseline Strike Rate" />
                </span>
                <span className="text-right font-bold text-[#F7F7FB]">{(playerB as Batter).normalSR}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#F7F7FB]">
                    {(playerC as Batter).normalSR}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-emerald-400">+{(playerA as Batter).srDelta}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Improvement <MetricTooltip term="SR Improvement" />
                </span>
                <span className="text-right font-bold text-emerald-400">+{(playerB as Batter).srDelta}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-emerald-400">
                    +{(playerC as Batter).srDelta}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-amber-400">{(playerA as Batter).boundaryPct}%</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Boundary % <MetricTooltip term="Boundary %" />
                </span>
                <span className="text-right font-bold text-amber-400">{(playerB as Batter).boundaryPct}%</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-amber-400">
                    {(playerC as Batter).boundaryPct}%
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#F7F7FB]">
                  {(playerA as Batter).pressureRuns} ({(playerA as Batter).pressureBalls}b)
                </span>
                <span className="text-center text-[#929BB2] font-sans">Pressure Runs</span>
                <span className="text-right font-bold text-[#F7F7FB]">
                  {(playerB as Batter).pressureRuns} ({(playerB as Batter).pressureBalls}b)
                </span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#F7F7FB]">
                    {(playerC as Batter).pressureRuns} ({(playerC as Batter).pressureBalls}b)
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#C9C3DF]">{(playerA as Batter).consistencyScore}/100</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Consistency <MetricTooltip term="Consistency" />
                </span>
                <span className="text-right font-bold text-[#C9C3DF]">{(playerB as Batter).consistencyScore}/100</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#C9C3DF]">
                    {(playerC as Batter).consistencyScore}/100
                  </span>
                )}
              </div>
            </div>
          ) : playerA && playerB ? (
            <div className="space-y-3 text-xs">
              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#7545C8]">{(playerA as Bowler).pressureEcon}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Pressure Econ <MetricTooltip term="Pressure Economy" />
                </span>
                <span className="text-right font-bold text-[#E90074]">{(playerB as Bowler).pressureEcon}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-sky-400">
                    {(playerC as Bowler).pressureEcon}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#F7F7FB]">{(playerA as Bowler).normalEcon}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Normal Econ <MetricTooltip term="Baseline Economy" />
                </span>
                <span className="text-right font-bold text-[#F7F7FB]">{(playerB as Bowler).normalEcon}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#F7F7FB]">
                    {(playerC as Bowler).normalEcon}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-emerald-400">+{(playerA as Bowler).econDelta}</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Suppression <MetricTooltip term="Economy Suppression" />
                </span>
                <span className="text-right font-bold text-emerald-400">+{(playerB as Bowler).econDelta}</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-emerald-400">
                    +{(playerC as Bowler).econDelta}
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-amber-400">{(playerA as Bowler).pressureWickets} wkts</span>
                <span className="text-center text-[#929BB2] font-sans">Pressure Wkts</span>
                <span className="text-right font-bold text-amber-400">{(playerB as Bowler).pressureWickets} wkts</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-amber-400">
                    {(playerC as Bowler).pressureWickets} wkts
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#F7F7FB]">{(playerA as Bowler).dotPct}%</span>
                <span className="text-center text-[#929BB2] font-sans flex items-center justify-center gap-1">
                  Dot Ball % <MetricTooltip term="Dot Ball %" />
                </span>
                <span className="text-right font-bold text-[#F7F7FB]">{(playerB as Bowler).dotPct}%</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#F7F7FB]">
                    {(playerC as Bowler).dotPct}%
                  </span>
                )}
              </div>

              <div
                className={`grid p-2.5 rounded-xl bg-[#121A2D] font-mono items-center ${
                  compareCount === 3 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <span className="font-bold text-[#C9C3DF]">{(playerA as Bowler).pressureOvers} ov</span>
                <span className="text-center text-[#929BB2] font-sans">Pressure Overs</span>
                <span className="text-right font-bold text-[#C9C3DF]">{(playerB as Bowler).pressureOvers} ov</span>
                {compareCount === 3 && playerC && (
                  <span className="text-right font-bold text-[#C9C3DF]">
                    {(playerC as Bowler).pressureOvers} ov
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
