import React, { useMemo, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Dna,
  Eye,
  Gavel,
  Sparkles,
  ArrowRight,
  Layers,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';
import {
  assessSampleConfidence,
  clamp,
  computeBatterDNA,
  computeBowlerDNA,
} from '../utils/analyticsEngine';
import { Badge } from '../components/Badge';
import type { AuctionPlayer, Batter, Bowler } from '../types';

type BaselineMode = 'rr-core' | 'auction-squad' | 'shortlist';

type DimensionId =
  | 'batting-depth'
  | 'opening'
  | 'middle-order'
  | 'finishing'
  | 'pace'
  | 'spin'
  | 'death-bowling'
  | 'overseas-balance'
  | 'backups';

interface GapDimensionResult {
  id: DimensionId;
  label: string;
  coverageScore: number;
  urgencyScore: number; // 100 - coverageScore
  status: 'Critical Gap' | 'Priority Need' | 'Balanced' | 'Strong';
  currentSummary: string;
  targetBenchmark: string;
  recommendationQuery: string;
}

interface FitRecommendation {
  playerId: string;
  name: string;
  country: string;
  countryFlag: string;
  team: string;
  roleLabel: string;
  type: 'batter' | 'bowler';
  suitabilityScore: number;
  bpiRating: number;
  statsSummary: string;
  strengths: string[];
  weaknesses: string[];
  confidenceLabel: string;
  confidenceLevel: 'robust' | 'moderate' | 'limited';
  confidenceWarning?: string;
  fitExplanation: string;
  valuationCr?: number;
}

export const SquadGapAnalyzerPage: React.FC = () => {
  const {
    activeAuctionSquad,
    shortlist,
    openPlayerProfile,
    openPlayerDNA,
    isShortlisted,
    toggleShortlist,
    sendToAuctionBlock,
    navigateTo,
  } = useEcosystem();

  const [baselineMode, setBaselineMode] = useState<BaselineMode>(() =>
    activeAuctionSquad.length > 0 ? 'auction-squad' : 'rr-core'
  );
  const [selectedDimensionId, setSelectedDimensionId] = useState<DimensionId | 'ALL_PRIORITY'>('ALL_PRIORITY');

  const allBatters = playerDataService.getBatters();
  const allBowlers = playerDataService.getBowlers();
  const allAuction = playerDataService.getAuctionPlayers();
  const youngTalents = playerDataService.getYoungTalents();

  // Resolve baseline player pool strictly from actual datasets or live simulator/shortlist state
  const baselinePool = useMemo(() => {
    interface PoolMember {
      id: string;
      name: string;
      country: string;
      role: string;
      isOverseas: boolean;
      batter?: Batter;
      bowler?: Bowler;
      auction?: AuctionPlayer;
    }

    const members: PoolMember[] = [];
    const seen = new Set<string>();

    const addByNameOrId = (idOrName: string) => {
      const rec = playerDataService.findPlayer(idOrName);
      const auction = playerDataService.findAuctionCandidate(idOrName);
      const key = rec?.primaryId || auction?.player_id || idOrName;
      if (seen.has(key)) return;
      seen.add(key);
      const country = rec?.country || auction?.country || 'India';
      const role = rec?.role || auction?.player_role || 'Player';
      members.push({
        id: key,
        name: rec?.name || auction?.name || idOrName,
        country,
        role,
        isOverseas: rec?.isOverseas ?? (country !== 'India' && country !== 'IND'),
        batter: rec?.batter,
        bowler: rec?.bowler,
        auction,
      });
    };

    if (baselineMode === 'auction-squad') {
      activeAuctionSquad.forEach((sq) => addByNameOrId(sq.player_id || sq.name));
    } else if (baselineMode === 'shortlist') {
      shortlist.forEach((sl) => addByNameOrId(sl.playerId || sl.name));
    } else {
      // RR Core dataset pool (Rajasthan Royals players across batters, bowlers & auction records)
      allBatters
        .filter((b) => b.team.toLowerCase().includes('rajasthan') || b.teams.some((t) => t.toLowerCase().includes('rajasthan')))
        .forEach((b) => addByNameOrId(b.id));
      allBowlers
        .filter((bw) => bw.team.toLowerCase().includes('rajasthan') || bw.teams.some((t) => t.toLowerCase().includes('rajasthan')))
        .forEach((bw) => addByNameOrId(bw.id));
      allAuction
        .filter((a) => a.current_franchise.toLowerCase().includes('rajasthan'))
        .forEach((a) => addByNameOrId(a.player_id));
    }

    return members;
  }, [baselineMode, activeAuctionSquad, shortlist, allBatters, allBowlers, allAuction]);

  // Evaluate exact 9 squad dimensions deterministically
  const dimensionsAnalysis = useMemo((): GapDimensionResult[] => {
    const battersCount = baselinePool.filter((m) => m.batter || m.role.toLowerCase().includes('bat') || m.role.toLowerCase().includes('keeper') || m.role.toLowerCase().includes('opener') || m.role.toLowerCase().includes('finisher')).length;
    const allRoundersCount = baselinePool.filter((m) => m.role.toLowerCase().includes('all-rounder') || m.role.toLowerCase().includes('all rounder') || (m.batter && m.bowler)).length;
    const openers = baselinePool.filter((m) => m.role.toLowerCase().includes('opener') || m.role.toLowerCase().includes('top-order'));
    const middleOrder = baselinePool.filter(
      (m) =>
        m.role.toLowerCase().includes('middle') ||
        m.role.toLowerCase().includes('anchor') ||
        (m.batter && (m.batter.middleSR ?? 0) >= 132 && !m.role.toLowerCase().includes('opener'))
    );
    const finishers = baselinePool.filter(
      (m) =>
        m.role.toLowerCase().includes('finisher') ||
        m.role.toLowerCase().includes('power') ||
        (m.batter && m.batter.deathSR >= 158)
    );
    const pacers = baselinePool.filter(
      (m) =>
        m.bowler &&
        (m.bowler.bowlingType.toLowerCase().includes('fast') ||
          m.bowler.bowlingType.toLowerCase().includes('medium') ||
          m.bowler.bowlingType.toLowerCase().includes('pace'))
    );
    const spinners = baselinePool.filter(
      (m) =>
        m.bowler &&
        (m.bowler.bowlingType.toLowerCase().includes('spin') ||
          m.bowler.bowlingType.toLowerCase().includes('orthodox') ||
          m.bowler.bowlingType.toLowerCase().includes('leg') ||
          m.bowler.bowlingType.toLowerCase().includes('off'))
    );
    const deathBowlers = baselinePool.filter(
      (m) => m.bowler && ((m.bowler.deathEcon > 0 && m.bowler.deathEcon <= 9.6) || m.bowler.deathPressureWickets >= 3)
    );
    const overseasCount = baselinePool.filter((m) => m.isOverseas).length;
    const domesticCount = baselinePool.filter((m) => !m.isOverseas).length;

    const toStatus = (score: number): GapDimensionResult['status'] => {
      if (score < 40) return 'Critical Gap';
      if (score < 68) return 'Priority Need';
      if (score < 85) return 'Balanced';
      return 'Strong';
    };

    const scoreRatio = (actual: number, ideal: number, bonusAvg = 0) =>
      Math.round(clamp((actual / Math.max(1, ideal)) * 80 + bonusAvg, 8, 98));

    const battingDepthScore = scoreRatio(battersCount + allRoundersCount * 0.8, 7, allRoundersCount >= 2 ? 12 : 0);
    const openingScore = scoreRatio(openers.length, 3, openers.some((o) => (o.batter?.rating ?? 0) >= 75) ? 14 : 0);
    const middleScore = scoreRatio(middleOrder.length, 3, middleOrder.some((o) => (o.batter?.consistencyScore ?? 0) >= 65) ? 12 : 0);
    const finishingScore = scoreRatio(finishers.length, 3, finishers.some((o) => (o.batter?.deathSR ?? 0) >= 165) ? 15 : 0);
    const paceScore = scoreRatio(pacers.length, 4, pacers.some((p) => (p.bowler?.rating ?? 0) >= 75) ? 14 : 0);
    const spinScore = scoreRatio(spinners.length, 3, spinners.some((s) => (s.bowler?.pressureEcon ?? 99) <= 7.5) ? 16 : 0);
    const deathScore = scoreRatio(deathBowlers.length, 3, deathBowlers.some((d) => (d.bowler?.deathEcon ?? 99) <= 8.5) ? 16 : 0);
    const overseasScore =
      overseasCount > 8
        ? 18
        : domesticCount >= Math.max(4, overseasCount * 1.5)
          ? 88
          : clamp(Math.round(45 + domesticCount * 5), 25, 85);
    const backupsScore = scoreRatio(
      Math.max(0, baselinePool.length - 11),
      7,
      baselinePool.length >= 16 ? 12 : 0
    );

    return [
      {
        id: 'batting-depth',
        label: 'Batting Depth & All-Rounders',
        coverageScore: battingDepthScore,
        urgencyScore: 100 - battingDepthScore,
        status: toStatus(battingDepthScore),
        currentSummary: `${battersCount} batting options + ${allRoundersCount} all-rounders in pool`,
        targetBenchmark: '7+ dependable top-7 batters + 2+ high-leverage all-rounders',
        recommendationQuery: 'All-rounders and high-consistency multi-phase batters',
      },
      {
        id: 'opening',
        label: 'Opening Pair Stability',
        coverageScore: openingScore,
        urgencyScore: 100 - openingScore,
        status: toStatus(openingScore),
        currentSummary: `${openers.length} specialist opener(s) identified`,
        targetBenchmark: '3 high-intent Powerplay openers (SR >= 140)',
        recommendationQuery: 'High-impact openers with strong Powerplay SR',
      },
      {
        id: 'middle-order',
        label: 'Middle-Order Anchoring',
        coverageScore: middleScore,
        urgencyScore: 100 - middleScore,
        status: toStatus(middleScore),
        currentSummary: `${middleOrder.length} middle-overs stabilizer/controller(s)`,
        targetBenchmark: '3 reliable middle-order batters (Ov 7-15 SR >= 132 & high consistency)',
        recommendationQuery: 'Indian and overseas middle-order batters with high consistency & spin control',
      },
      {
        id: 'finishing',
        label: 'Finishing Firepower',
        coverageScore: finishingScore,
        urgencyScore: 100 - finishingScore,
        status: toStatus(finishingScore),
        currentSummary: `${finishers.length} lower/death finisher(s) (Death SR >= 158)`,
        targetBenchmark: '3 explosive finishers for overs 16-20',
        recommendationQuery: 'Death-over finishers with elite boundary conversion and chase SR',
      },
      {
        id: 'pace',
        label: 'Pace Attack Depth',
        coverageScore: paceScore,
        urgencyScore: 100 - paceScore,
        status: toStatus(paceScore),
        currentSummary: `${pacers.length} fast/medium pace bowler(s)`,
        targetBenchmark: '4+ varied fast bowlers (powerplay swing + hit-the-deck enforcers)',
        recommendationQuery: 'High-BPI pace bowlers across powerplay and middle overs',
      },
      {
        id: 'spin',
        label: 'Spin Control & Wicket Threat',
        coverageScore: spinScore,
        urgencyScore: 100 - spinScore,
        status: toStatus(spinScore),
        currentSummary: `${spinners.length} specialist spinner(s) in current group`,
        targetBenchmark: '3 economical/wicket-taking spinners (Mystery + Left-Arm/Leg-Break)',
        recommendationQuery: 'Economical middle-overs spinners with high dot ball %',
      },
      {
        id: 'death-bowling',
        label: 'Death Over Bowling (16-20)',
        coverageScore: deathScore,
        urgencyScore: 100 - deathScore,
        status: toStatus(deathScore),
        currentSummary: `${deathBowlers.length} verified death-overs specialist(s)`,
        targetBenchmark: '3 specialists averaging <= 9.2 death economy & high clutch wickets',
        recommendationQuery: 'Reliable death bowlers with lowest death economy & suppression delta',
      },
      {
        id: 'overseas-balance',
        label: 'Overseas / Domestic Slot Balance',
        coverageScore: overseasScore,
        urgencyScore: 100 - overseasScore,
        status: toStatus(overseasScore),
        currentSummary: `${domesticCount} Indian domestic / ${overseasCount} overseas slots used (cap: 8)`,
        targetBenchmark: 'Domestic core >= 14 players; max 8 overseas slots cleanly balanced',
        recommendationQuery: 'High-impact Indian domestic uncapped/core talent to protect overseas slots',
      },
      {
        id: 'backups',
        label: 'Backup & Future-Star Reserves',
        coverageScore: backupsScore,
        urgencyScore: 100 - backupsScore,
        status: toStatus(backupsScore),
        currentSummary: `${baselinePool.length} total tracked members (${youngTalents.length} U-24 prospects available)`,
        targetBenchmark: 'Like-for-like backups for key XI injuries and high-upside U-24 development picks',
        recommendationQuery: 'Emerging U-24 and budget Hidden Gem backups',
      },
    ];
  }, [baselinePool, youngTalents.length]);

  const overallSquadScore = useMemo(() => {
    if (baselinePool.length === 0) return 0;
    return Math.round(
      dimensionsAnalysis.reduce((sum, d) => sum + d.coverageScore, 0) / dimensionsAnalysis.length
    );
  }, [dimensionsAnalysis, baselinePool.length]);

  const sortedByUrgency = useMemo(
    () => [...dimensionsAnalysis].sort((a, b) => b.urgencyScore - a.urgencyScore),
    [dimensionsAnalysis]
  );

  // Recommend validated candidates NOT already present in current baselinePool
  const recommendations = useMemo((): FitRecommendation[] => {
    const existingIds = new Set(baselinePool.map((m) => m.id));
    const existingNames = new Set(baselinePool.map((m) => m.name.toLowerCase()));
    const targetDims =
      selectedDimensionId === 'ALL_PRIORITY'
        ? sortedByUrgency.slice(0, 3).map((d) => d.id)
        : [selectedDimensionId];

    const pool: FitRecommendation[] = [];
    const pushedIds = new Set<string>();

    const evaluateBatter = (b: Batter, dimId: DimensionId): FitRecommendation | null => {
      if (existingIds.has(b.id) || existingNames.has(b.name.toLowerCase()) || pushedIds.has(b.id)) return null;
      const roleLower = (b.player_role || '').toLowerCase();
      let dimScore = 0;
      let fitWhy = '';

      if (dimId === 'finishing') {
        if (b.deathSR < 145 && !roleLower.includes('finisher')) return null;
        dimScore = clamp(0.45 * b.rating + 0.35 * (b.deathSR / 200) * 100 + 0.2 * (b.chaseSR / 180) * 100, 40, 98);
        fitWhy = `Directly addresses finishing deficit with ${b.deathSR} Death Pressure SR and ${b.chaseSR} Chase SR across ${b.pressureMatches} high-leverage games.`;
      } else if (dimId === 'opening') {
        if (!roleLower.includes('opener') && (b.powerplaySR ?? 0) < 135) return null;
        dimScore = clamp(0.45 * b.rating + 0.35 * ((b.powerplaySR ?? b.totalSR) / 165) * 100 + 0.2 * b.consistencyScore, 40, 97);
        fitWhy = `Provides powerplay propulsion (${(b.powerplaySR ?? b.totalSR).toFixed(1)} PP SR, ${b.totalFours ?? 0} fours / ${b.totalSixes ?? 0} sixes) without sacrificing consistency (${b.consistencyScore}/100).`;
      } else if (dimId === 'middle-order') {
        if (roleLower.includes('opener') && (b.middleSR ?? 0) < 140) return null;
        dimScore = clamp(0.4 * b.rating + 0.35 * ((b.middleSR ?? b.normalSR) / 155) * 100 + 0.25 * b.consistencyScore, 40, 97);
        fitWhy = `Strengthens overs 7-15 scoring at ${(b.middleSR ?? b.normalSR).toFixed(1)} Middle SR and ${(b.battingAvg ?? 30).toFixed(1)} batting average.`;
      } else if (dimId === 'batting-depth' || dimId === 'overseas-balance' || dimId === 'backups') {
        if (dimId === 'overseas-balance' && b.country !== 'India') return null;
        if (dimId === 'batting-depth' && !roleLower.includes('all') && b.rating < 68) return null;
        dimScore = clamp(0.55 * b.rating + 0.25 * b.consistencyScore + 0.2 * clamp(50 + b.srDelta, 0, 100), 40, 96);
        fitWhy =
          dimId === 'overseas-balance'
            ? `Indian domestic candidate (preserves overseas quota) delivering BPI ${b.rating} and ${b.pressureSR} Pressure SR.`
            : `Raises overall batting floor with ${b.rating} BPI and ${b.totalRuns} career runs across ${b.matchesAnalysed} matches.`;
      } else {
        return null;
      }

      const dna = computeBatterDNA(b);
      const conf = assessSampleConfidence(b.pressureBalls, 'pressure');
      const auction = playerDataService.findAuctionCandidate(b.id) || playerDataService.findAuctionCandidate(b.name);
      pushedIds.add(b.id);
      return {
        playerId: b.id,
        name: b.name,
        country: b.country || 'International',
        countryFlag: b.country_flag || '🏏',
        team: b.team,
        roleLabel: b.player_role || 'Batter',
        type: 'batter',
        suitabilityScore: Math.round(dimScore),
        bpiRating: b.rating,
        statsSummary: `${b.totalRuns}r (${b.matchesAnalysed}m) · Avg ${(b.battingAvg ?? 0).toFixed(1)} · Press SR ${b.pressureSR} · Death ${b.deathSR}`,
        strengths: dna.strengths,
        weaknesses: dna.weaknesses,
        confidenceLabel: conf.label,
        confidenceLevel: conf.level,
        confidenceWarning: conf.warning,
        fitExplanation: fitWhy,
        valuationCr: auction?.estimated_valuation_cr,
      };
    };

    const evaluateBowler = (bw: Bowler, dimId: DimensionId): FitRecommendation | null => {
      if (existingIds.has(bw.id) || existingNames.has(bw.name.toLowerCase()) || pushedIds.has(bw.id)) return null;
      const bType = bw.bowlingType.toLowerCase();
      const isSpin = bType.includes('spin') || bType.includes('orthodox') || bType.includes('leg') || bType.includes('off');
      let dimScore = 0;
      let fitWhy = '';

      if (dimId === 'death-bowling') {
        if ((bw.deathEcon || 15) > 10.5 && bw.deathPressureWickets < 3) return null;
        dimScore = clamp(0.45 * bw.rating + 0.35 * clamp(((12.5 - (bw.deathEcon || bw.pressureEcon)) / 5.5) * 100, 10, 100) + 0.2 * clamp((bw.deathPressureWickets / 12) * 100, 0, 100), 40, 99);
        fitWhy = `Elite closing overs control: ${(bw.deathEcon || bw.deathOverallEcon || bw.pressureEcon).toFixed(2)} Death Economy and ${bw.deathPressureWickets} pressure wickets in death overs.`;
      } else if (dimId === 'spin') {
        if (!isSpin) return null;
        dimScore = clamp(0.5 * bw.rating + 0.3 * clamp(((10.5 - bw.pressureEcon) / 4.5) * 100, 10, 100) + 0.2 * bw.consistencyScore, 40, 98);
        fitWhy = `Specialized ${bw.bowlingType} option conceding ${bw.pressureEcon} pressure economy with ${(bw.overallDotPct ?? bw.dotPct).toFixed(1)}% dot balls.`;
      } else if (dimId === 'pace') {
        if (isSpin) return null;
        dimScore = clamp(0.5 * bw.rating + 0.3 * clamp((bw.totalWickets / 60) * 100, 10, 100) + 0.2 * bw.consistencyScore, 40, 98);
        fitWhy = `${bw.bowlingType} strike option with ${bw.totalWickets} wickets, ${bw.powerplayEcon ?? bw.totalEcon} PP Econ, and BPI ${bw.rating}.`;
      } else if (dimId === 'overseas-balance' || dimId === 'backups') {
        if (dimId === 'overseas-balance' && bw.country !== 'India') return null;
        dimScore = clamp(0.55 * bw.rating + 0.25 * bw.consistencyScore + 0.2 * clamp(50 + bw.econDelta * 12, 0, 100), 40, 96);
        fitWhy = `Domestic/value bowling addition (${bw.totalWickets} wickets @ ${bw.totalEcon} econ) strengthening bench resilience.`;
      } else {
        return null;
      }

      const dna = computeBowlerDNA(bw);
      const conf = assessSampleConfidence(bw.pressureLegalBalls, 'pressure');
      const auction = playerDataService.findAuctionCandidate(bw.id) || playerDataService.findAuctionCandidate(bw.name);
      pushedIds.add(bw.id);
      return {
        playerId: bw.id,
        name: bw.name,
        country: bw.country || 'International',
        countryFlag: bw.country_flag || '⚾',
        team: bw.team,
        roleLabel: bw.bowlingType,
        type: 'bowler',
        suitabilityScore: Math.round(dimScore),
        bpiRating: bw.rating,
        statsSummary: `${bw.totalWickets}w (${bw.matchesAnalysed}m) · Econ ${bw.totalEcon} · Press ${bw.pressureEcon} · Best ${bw.bestBowling ?? 'N/A'}`,
        strengths: dna.strengths,
        weaknesses: dna.weaknesses,
        confidenceLabel: conf.label,
        confidenceLevel: conf.level,
        confidenceWarning: conf.warning,
        fitExplanation: fitWhy,
        valuationCr: auction?.estimated_valuation_cr,
      };
    };

    targetDims.forEach((dimId) => {
      allBatters.forEach((b) => {
        const res = evaluateBatter(b, dimId);
        if (res) pool.push(res);
      });
      allBowlers.forEach((bw) => {
        const res = evaluateBowler(bw, dimId);
        if (res) pool.push(res);
      });
    });

    return pool.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 9);
  }, [baselinePool, selectedDimensionId, sortedByUrgency, allBatters, allBowlers]);

  const decisionTimeline = useMemo(() => {
    const criticalCount = dimensionsAnalysis.filter((d) => d.status === 'Critical Gap' || d.status === 'Priority Need').length;
    return [
      {
        stage: '1. Audit Squad Weaknesses',
        status: 'complete' as const,
        summary: `${criticalCount} high-priority gaps isolated across 9 structural dimensions.`,
      },
      {
        stage: '2. Pin Recruitment Targets',
        status: shortlist.length >= 3 ? ('complete' as const) : ('active' as const),
        summary: `${shortlist.length} target(s) shortlisted across modules (${shortlist.filter((s) => s.priority === 'critical').length} marked critical).`,
      },
      {
        stage: '3. Verify DNA & Sample Confidence',
        status: shortlist.length >= 1 ? ('active' as const) : ('pending' as const),
        summary: 'Review 6-axis DNA balance & Matchup Splits before committing purse capital.',
      },
      {
        stage: '4. Simulate Auction & Scenario A vs B',
        status: activeAuctionSquad.length >= 18 ? ('complete' as const) : activeAuctionSquad.length > 0 ? ('active' as const) : ('pending' as const),
        summary:
          activeAuctionSquad.length > 0
            ? `${activeAuctionSquad.length}/25 squad slots simulated in Auction War Room.`
            : 'Send shortlisted targets to Auction War Room to test budget tradeoffs.',
      },
    ];
  }, [dimensionsAnalysis, shortlist, activeAuctionSquad]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F7F7FB] flex items-center gap-2">
            <ShieldAlert className="text-emerald-400" size={24} />
            Squad Gap Analyzer &amp; Recruitment Priority Matrix
          </h2>
          <p className="text-xs text-[#929BB2] mt-0.5">
            9-dimension structural diagnostic identifying role deficits, overseas balance &amp; CSV-verified recruitment targets
          </p>
        </div>

        {/* Baseline Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#171F35] p-1 rounded-xl border border-[#29334C]">
          {[
            { id: 'rr-core' as BaselineMode, label: 'RR Dataset Core' },
            { id: 'auction-squad' as BaselineMode, label: `Sim Squad (${activeAuctionSquad.length})` },
            { id: 'shortlist' as BaselineMode, label: `Shortlist (${shortlist.length})` },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setBaselineMode(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                baselineMode === b.id
                  ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white shadow'
                  : 'text-[#929BB2] hover:text-white'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty Baseline Helper if user inspects empty Sim Squad / Shortlist */}
      {baselinePool.length === 0 && (
        <div className="rr-glass-card p-6 border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertTriangle size={16} />
              No players currently in{' '}
              {baselineMode === 'auction-squad' ? 'Live Simulated Auction Squad' : 'Scouting Shortlist'}
            </h3>
            <p className="text-xs text-[#C9C3DF] mt-1">
              Build a squad manually in the Auction War Room, shortlist candidates below, or switch back to &ldquo;RR Dataset Core&rdquo; to evaluate Rajasthan Royals&rsquo; audited roster pool.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setBaselineMode('rr-core')}
              className="px-3.5 py-2 rounded-xl bg-[#121A2D] hover:bg-[#1A243E] text-white border border-[#29334C] text-xs font-bold"
            >
              Inspect RR Core
            </button>
            <button
              onClick={() => navigateTo('auction')}
              className="px-3.5 py-2 rounded-xl bg-[#E90074] hover:bg-[#FF1A8B] text-white text-xs font-bold"
            >
              Open Auction Sim
            </button>
          </div>
        </div>
      )}

      {/* Top Overview: Squad Balance Meter + Recruitment Priority Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Squad Balance Meter */}
        <div className="lg:col-span-4 rr-glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#929BB2]">
                Squad Balance Meter
              </span>
              <Badge variant={overallSquadScore >= 72 ? 'green' : overallSquadScore >= 48 ? 'purple' : 'pink'}>
                {overallSquadScore >= 72 ? 'Well Balanced' : overallSquadScore >= 48 ? 'Needs Tuning' : 'Major Gaps'}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 my-3">
              <span className="text-5xl font-black font-mono text-white">{overallSquadScore}</span>
              <span className="text-sm font-mono text-[#929BB2]">/ 100 Balance Index</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#0B1020] overflow-hidden border border-[#29334C]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${overallSquadScore}%`,
                  background:
                    overallSquadScore >= 72
                      ? 'linear-gradient(90deg, #10B981, #34D399)'
                      : overallSquadScore >= 48
                        ? 'linear-gradient(90deg, #7545C8, #E90074)'
                        : 'linear-gradient(90deg, #EF4444, #F59E0B)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#29334C]/70 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-[#121A2D]">
              <span className="text-[10px] font-sans text-[#929BB2] block">Evaluated Pool</span>
              <span className="text-sm font-bold text-white">{baselinePool.length} Players</span>
            </div>
            <div className="p-2 rounded-xl bg-[#121A2D]">
              <span className="text-[10px] font-sans text-[#929BB2] block">Critical / Priority</span>
              <span className="text-sm font-bold text-[#FF47A3]">
                {dimensionsAnalysis.filter((d) => d.coverageScore < 68).length} / 9
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#121A2D]">
              <span className="text-[10px] font-sans text-[#929BB2] block">Shortlisted</span>
              <span className="text-sm font-bold text-emerald-400">{shortlist.length} Saved</span>
            </div>
          </div>
        </div>

        {/* Recruitment Priority Map Chart */}
        <div className="lg:col-span-8 rr-glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Recruitment Priority Map (9 Structural Dimensions)</h3>
              <p className="text-xs text-[#929BB2]">
                Higher Coverage = Strong; Lower Coverage = Immediate Auction Priority
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#929BB2]">
              Click any dimension card below to filter targets
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dimensionsAnalysis}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#29334C" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#929BB2" fontSize={10} />
                <YAxis type="category" dataKey="label" width={170} stroke="#C9C3DF" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171F35',
                    borderColor: '#29334C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F7F7FB',
                  }}
                />
                <Bar dataKey="coverageScore" name="Coverage Score" radius={[0, 4, 4, 0]}>
                  {dimensionsAnalysis.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={
                        entry.coverageScore < 40
                          ? '#F43F5E'
                          : entry.coverageScore < 68
                            ? '#F59E0B'
                            : entry.coverageScore < 85
                              ? '#7545C8'
                              : '#10B981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive 9-Dimension Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {dimensionsAnalysis.map((dim) => {
          const isSelected = selectedDimensionId === dim.id;
          return (
            <button
              key={dim.id}
              onClick={() => setSelectedDimensionId(isSelected ? 'ALL_PRIORITY' : dim.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-[#1A2342] border-[#E90074] shadow-lg shadow-[#E90074]/10'
                  : 'bg-[#121A2D] hover:bg-[#171F35] border-[#29334C]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-white">{dim.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    dim.status === 'Critical Gap'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : dim.status === 'Priority Need'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : dim.status === 'Balanced'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {dim.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#0B1020] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${dim.coverageScore}%`,
                      backgroundColor:
                        dim.coverageScore < 40
                          ? '#F43F5E'
                          : dim.coverageScore < 68
                            ? '#F59E0B'
                            : dim.coverageScore < 85
                              ? '#7545C8'
                              : '#10B981',
                    }}
                  />
                </div>
                <span className="font-mono font-bold text-xs text-white">{dim.coverageScore}%</span>
              </div>
              <p className="text-[11px] text-[#C9C3DF]">{dim.currentSummary}</p>
              <p className="text-[10px] text-[#929BB2] mt-1">Benchmark: {dim.targetBenchmark}</p>
            </button>
          );
        })}
      </div>

      {/* Validated Dataset Recommendations Section */}
      <div className="rr-glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#29334C] pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#E90074]" />
              {selectedDimensionId === 'ALL_PRIORITY'
                ? 'Recommended Targets for Top Recruitment Priorities'
                : `Targeted Solutions for: ${dimensionsAnalysis.find((d) => d.id === selectedDimensionId)?.label}`}
            </h3>
            <p className="text-xs text-[#929BB2]">
              Every player, stat, strength, weakness &amp; confidence assessment is computed strictly from audited datasets (excluding players already in your evaluated pool).
            </p>
          </div>
          {selectedDimensionId !== 'ALL_PRIORITY' && (
            <button
              onClick={() => setSelectedDimensionId('ALL_PRIORITY')}
              className="px-3 py-1.5 rounded-lg bg-[#121A2D] hover:bg-[#1D2745] text-xs font-bold text-[#C9C3DF] border border-[#29334C]"
            >
              Show All Top Gaps
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => {
            const shortlisted = isShortlisted(rec.playerId) || isShortlisted(rec.name);
            const hasAuction = Boolean(playerDataService.findAuctionCandidate(rec.playerId) || playerDataService.findAuctionCandidate(rec.name));

            return (
              <div
                key={rec.playerId}
                className="p-4 rounded-2xl bg-[#121A2D] border border-[#29334C] hover:border-[#E90074]/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{rec.countryFlag}</span>
                        <h4 className="font-bold text-sm text-white">{rec.name}</h4>
                      </div>
                      <p className="text-[11px] text-[#929BB2]">
                        {rec.roleLabel} · {rec.team}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-[#929BB2] block">SUITABILITY</span>
                      <span className="text-base font-black font-mono text-[#FF47A3]">{rec.suitabilityScore}/100</span>
                    </div>
                  </div>

                  {/* Verified Telemetry */}
                  <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#232744] text-[11px] font-mono text-[#C9C3DF]">
                    {rec.statsSummary}
                    {rec.valuationCr !== undefined && (
                      <span className="block text-emerald-400 mt-1">Est. Valuation: ₹{rec.valuationCr} Cr</span>
                    )}
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold border ${
                        rec.confidenceLevel === 'robust'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : rec.confidenceLevel === 'moderate'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {rec.confidenceLabel}
                    </span>
                    <span className="font-mono text-[#929BB2]">BPI {rec.bpiRating}</span>
                  </div>

                  {/* Squad Fit Explanation */}
                  <p className="text-xs text-[#C9C3DF] leading-relaxed">{rec.fitExplanation}</p>

                  {/* Strengths & Weaknesses */}
                  <div className="space-y-1 text-[11px]">
                    <div className="text-emerald-300 flex items-start gap-1.5">
                      <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                      <span>{rec.strengths[0]}</span>
                    </div>
                    <div className="text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{rec.weaknesses[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#29334C] flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => openPlayerProfile(rec.playerId, rec.type)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#171F35] hover:bg-[#232D50] text-[11px] font-semibold text-[#C9C3DF] border border-[#29334C] inline-flex items-center gap-1"
                  >
                    <Eye size={12} /> Profile
                  </button>
                  <button
                    onClick={() => openPlayerDNA(rec.playerId, rec.type)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1"
                  >
                    <Dna size={12} /> DNA
                  </button>
                  <button
                    onClick={() => toggleShortlist(rec.playerId, 'Squad Gap Analyzer', 'critical')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 ${
                      shortlisted
                        ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                        : 'bg-[#171F35] border-[#29334C] text-[#C9C3DF] hover:text-white'
                    }`}
                  >
                    <Bookmark size={12} className={shortlisted ? 'fill-current' : ''} />
                    {shortlisted ? 'Saved' : 'Shortlist'}
                  </button>
                  {hasAuction && (
                    <button
                      onClick={() => sendToAuctionBlock(rec.playerId)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1 ml-auto"
                    >
                      <Gavel size={12} /> Bid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recruitment Decision Timeline */}
      <div className="rr-glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#7545C8]" />
            <h3 className="text-sm font-bold text-white">Recruitment Decision Timeline</h3>
          </div>
          <button
            onClick={() => navigateTo('auction')}
            className="text-xs font-bold text-[#FF47A3] hover:text-white inline-flex items-center gap-1"
          >
            Proceed to Auction Simulation <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {decisionTimeline.map((step) => (
            <div
              key={step.stage}
              className={`p-3.5 rounded-xl border ${
                step.status === 'complete'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : step.status === 'active'
                    ? 'bg-[#E90074]/10 border-[#E90074]/40'
                    : 'bg-[#121A2D] border-[#29334C]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{step.stage}</span>
                <Layers size={13} className="text-[#929BB2]" />
              </div>
              <p className="text-[11px] text-[#C9C3DF] leading-relaxed">{step.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
