import type { Batter, Bowler } from '../types';

export function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return fallback;
  }
  return numerator / denominator;
}

/** Convert cricket overs decimal notation (e.g. 16.4 = 16 overs, 4 balls) to legal balls. */
export function oversDecimalToBalls(overs: number): number {
  if (!Number.isFinite(overs) || overs <= 0) return 0;
  const completedOvers = Math.floor(overs);
  const partialBalls = Math.min(5, Math.max(0, Math.round((overs - completedOvers) * 10)));
  return clamp(completedOvers * 6 + partialBalls, 0, 120);
}

/** Convert legal balls (0..120) to cricket overs string (e.g. "16.4"). */
export function ballsToOversDisplay(balls: number): string {
  const safeBalls = clamp(Math.round(balls), 0, 120);
  const overs = Math.floor(safeBalls / 6);
  const rem = safeBalls % 6;
  return `${overs}.${rem}`;
}

export interface ChasePressureInput {
  runsRequired: number;
  ballsRemaining: number;
  wicketsLost: number;
  isKnockout?: boolean;
}

export function computeChasePressure({
  runsRequired,
  ballsRemaining,
  wicketsLost,
  isKnockout = false,
}: ChasePressureInput): number {
  const safeRuns = Math.max(0, Number.isFinite(runsRequired) ? runsRequired : 0);
  const safeBalls = Math.max(0, Number.isFinite(ballsRemaining) ? ballsRemaining : 0);
  const safeWicketsLost = clamp(Number.isFinite(wicketsLost) ? wicketsLost : 0, 0, 10);
  const wicketsInHand = Math.max(0, 10 - safeWicketsLost);

  const oversRemaining = safeBalls / 6;
  const rrr = oversRemaining > 0 ? safeRuns / oversRemaining : safeRuns * 6;

  let rrrFactor = 0;
  if (rrr <= 6) {
    rrrFactor = 0.10;
  } else if (rrr <= 8.5) {
    rrrFactor = 0.10 + (rrr - 6) * 0.12;
  } else if (rrr <= 12) {
    rrrFactor = 0.40 + (rrr - 8.5) * 0.10;
  } else if (rrr <= 16) {
    rrrFactor = 0.75 + (rrr - 12) * 0.05;
  } else {
    rrrFactor = 0.95 + Math.min(0.05, (rrr - 16) * 0.01);
  }

  const wicketFactor = safeWicketsLost / 10;

  let phaseUrgency = 0;
  if (safeBalls <= 24) {
    phaseUrgency = 0.40;
  } else if (safeBalls <= 48) {
    phaseUrgency = 0.22;
  } else {
    phaseUrgency = 0.08;
  }

  let closenessModifier = 1.0;
  if (safeRuns <= 12 && wicketsInHand >= 6) {
    closenessModifier = 0.35;
  } else if (rrr > 26 && wicketsInHand <= 2) {
    closenessModifier = 0.55;
  } else if (safeBalls <= 36 && safeRuns <= 50 && wicketsInHand >= 3) {
    closenessModifier = 1.25;
  }

  let pressureIndex = (0.42 * rrrFactor + 0.30 * wicketFactor + 0.28 * phaseUrgency) * closenessModifier;
  if (isKnockout) {
    pressureIndex *= 1.15;
  }

  return clamp(pressureIndex, 0.0, 1.0);
}

export interface FirstInningsPressureInput {
  oversCompleted: number;
  overid?: number;
  currentScore: number;
  wicketsLost: number;
  isKnockout?: boolean;
}

export function computeFirstInningsPressure({
  oversCompleted,
  overid,
  currentScore,
  wicketsLost,
  isKnockout = false,
}: FirstInningsPressureInput): number {
  const safeOversCompleted = Math.max(0, Number.isFinite(oversCompleted) ? oversCompleted : 0);
  const safeOver = Math.max(
    1,
    Number.isFinite(overid) ? (overid as number) : Math.max(1, Math.ceil(safeOversCompleted))
  );
  const safeScore = Math.max(0, Number.isFinite(currentScore) ? currentScore : 0);
  const safeWicketsLost = clamp(Number.isFinite(wicketsLost) ? wicketsLost : 0, 0, 10);
  const wicketsInHand = Math.max(0, 10 - safeWicketsLost);
  const crr = safeOversCompleted > 0 ? safeScore / safeOversCompleted : 0;

  let collapseFactor = 0;
  if (safeWicketsLost >= 3 && safeOversCompleted <= 6) {
    collapseFactor = 0.65;
  } else if (safeWicketsLost >= 5 && safeOversCompleted <= 12) {
    collapseFactor = 0.55;
  } else {
    collapseFactor = (safeWicketsLost / 10) * 0.45;
  }

  let phaseFactor = 0;
  if (safeOver >= 16) {
    phaseFactor = 0.50 + (wicketsInHand >= 4 ? 0.15 : -0.10);
  } else if (safeOver <= 6) {
    phaseFactor = 0.15;
  } else {
    phaseFactor = 0.22;
  }

  let scoringHealthFactor = 0;
  if (safeOversCompleted >= 8 && crr < 7.0) {
    scoringHealthFactor = 0.22;
  }

  let pressureIndex = 0.40 * collapseFactor + 0.45 * phaseFactor + 0.15 * scoringHealthFactor;
  if (isKnockout) {
    pressureIndex *= 1.15;
  }

  return clamp(pressureIndex, 0.0, 1.0);
}

export type PressureTier = 'Normal' | 'Moderate' | 'High' | 'Extreme';

export function classifyPressure(pressureIndex: number): PressureTier {
  const p = clamp(pressureIndex, 0.0, 1.0);
  if (p >= 0.75) return 'Extreme';
  if (p >= 0.55) return 'High';
  if (p >= 0.38) return 'Moderate';
  return 'Normal';
}

export function computeConfidenceWeight(pressureBalls: number): number {
  const safeBalls = Math.max(0, Number.isFinite(pressureBalls) ? pressureBalls : 0);
  return Math.min(1.0, 0.65 + 0.35 * Math.sqrt(Math.min(safeBalls, 240) / 240));
}

export interface SampleConfidenceAssessment {
  level: 'robust' | 'moderate' | 'limited';
  label: string;
  weight: number;
  warning?: string;
}

export function assessSampleConfidence(balls: number, kind: 'pressure' | 'overall' = 'pressure'): SampleConfidenceAssessment {
  const safeBalls = Math.max(0, Number.isFinite(balls) ? balls : 0);
  const weight = parseFloat(computeConfidenceWeight(safeBalls).toFixed(2));
  if (kind === 'pressure') {
    if (safeBalls >= 180) {
      return { level: 'robust', label: 'Robust Sample', weight };
    }
    if (safeBalls >= 90) {
      return {
        level: 'moderate',
        label: 'Moderate Sample',
        weight,
        warning: `Moderate pressure sample (${safeBalls} balls); BPI applies Bayesian confidence scaling (${weight}x).`,
      };
    }
    return {
      level: 'limited',
      label: 'Limited Sample',
      weight,
      warning: `Small pressure sample (${safeBalls} balls < 90). Treat extreme rates with caution.`,
    };
  }
  if (safeBalls >= 300) {
    return { level: 'robust', label: 'High Volume', weight: 1.0 };
  }
  if (safeBalls >= 100) {
    return { level: 'moderate', label: 'Moderate Volume', weight: 0.85 };
  }
  return {
    level: 'limited',
    label: 'Small Career Volume',
    weight: 0.7,
    warning: `Small overall sample (${safeBalls} balls). Monitor longer domestic/IPL progression.`,
  };
}

export interface MatchupSampleAssessment {
  reliable: boolean;
  level: 'reliable' | 'small' | 'insufficient';
  badge: string;
  warning?: string;
}

export function assessMatchupSample(balls: number): MatchupSampleAssessment {
  const safeBalls = Math.max(0, Number.isFinite(balls) ? balls : 0);
  if (safeBalls < 6) {
    return {
      reliable: false,
      level: 'insufficient',
      badge: `Insufficient sample (< 6 balls)`,
      warning: `Only ${safeBalls} ball${safeBalls === 1 ? '' : 's'} faced in recorded dataset — statistically unreliable for tactical lock-in.`,
    };
  }
  if (safeBalls < 15) {
    return {
      reliable: true,
      level: 'small',
      badge: `Small sample (${safeBalls}b)`,
      warning: `Small head-to-head sample (${safeBalls} balls). Pair with Pace/Spin and role archetypes.`,
    };
  }
  return {
    reliable: true,
    level: 'reliable',
    badge: `Reliable sample (${safeBalls}b)`,
  };
}

export interface DNADimension {
  axis: string;
  score: number;
  rawLabel: string;
}

export interface PlayerDNAProfile {
  type: 'batter' | 'bowler';
  dimensions: DNADimension[];
  overallDNA: number;
  strengths: string[];
  weaknesses: string[];
  confidence: SampleConfidenceAssessment;
}

export function computeBatterDNA(b: Batter): PlayerDNAProfile {
  const totalBalls = Math.max(1, b.totalBalls || b.pressureBalls);
  const boundaryBalls = (b.totalFours || 0) + (b.totalSixes || 0);
  const boundaryRuns = (b.totalFours || 0) * 4 + (b.totalSixes || 0) * 6;
  const nonBoundaryRuns = Math.max(0, (b.totalRuns || 0) - boundaryRuns);
  const nonBoundaryBalls = Math.max(1, totalBalls - boundaryBalls);
  const nonBoundarySR = (nonBoundaryRuns / nonBoundaryBalls) * 100;

  const deathSRUsed = b.deathSR > 0 ? b.deathSR : b.deathOverallSR || b.totalSR;
  const chaseSRUsed = b.chaseSR > 0 ? b.chaseSR : b.pressureSR;
  const sixRatePct = ((b.totalSixes || 0) / totalBalls) * 100;

  const powerHitting = Math.round(
    clamp(0.45 * clamp((sixRatePct / 10) * 100, 0, 100) + 0.35 * clamp((deathSRUsed / 195) * 100, 0, 100) + 0.20 * clamp((b.totalSR / 165) * 100, 0, 100), 15, 99)
  );
  const strikeRotation = Math.round(
    clamp(0.65 * clamp((nonBoundarySR / 90) * 100, 0, 100) + 0.35 * clamp(((b.normalSR || b.totalSR) / 145) * 100, 0, 100), 18, 99)
  );
  const consistency = Math.round(clamp(b.consistencyScore || 50, 10, 99));
  const finishing = Math.round(
    clamp(0.55 * clamp((deathSRUsed / 190) * 100, 0, 100) + 0.45 * clamp((chaseSRUsed / 165) * 100, 0, 100), 15, 99)
  );
  const pressurePerformance = Math.round(
    clamp(0.65 * clamp(b.rating, 0, 100) + 0.35 * clamp((b.pressureSR / 170) * 100, 0, 100), 15, 99)
  );
  const boundaryAbility = Math.round(
    clamp(0.60 * clamp(((b.totalBoundaryPct || b.boundaryPct) / 24) * 100, 0, 100) + 0.40 * clamp((b.boundaryPct / 24) * 100, 0, 100), 15, 99)
  );

  const dimensions: DNADimension[] = [
    { axis: 'Power Hitting', score: powerHitting, rawLabel: `${b.totalSixes ?? 0} sixes · SR ${b.totalSR.toFixed(1)}` },
    { axis: 'Strike Rotation', score: strikeRotation, rawLabel: `Non-boundary SR ${nonBoundarySR.toFixed(1)}` },
    { axis: 'Consistency', score: consistency, rawLabel: `${consistency.toFixed(0)}/100 index · Avg ${b.battingAvg?.toFixed(1) ?? 'N/A'}` },
    { axis: 'Finishing', score: finishing, rawLabel: `Death SR ${deathSRUsed.toFixed(1)} · Chase SR ${chaseSRUsed.toFixed(1)}` },
    { axis: 'Pressure Perf.', score: pressurePerformance, rawLabel: `BPI ${b.rating.toFixed(1)} · Press SR ${b.pressureSR.toFixed(1)}` },
    { axis: 'Boundary Ability', score: boundaryAbility, rawLabel: `${(b.totalBoundaryPct || b.boundaryPct).toFixed(1)}% boundary balls` },
  ];

  const overallDNA = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const sorted = [...dimensions].sort((a, b2) => b2.score - a.score);
  const strengths = sorted.slice(0, 2).map((d) => `${d.axis} (${d.score}/100 — ${d.rawLabel})`);
  const weaknesses: string[] = [];
  if (sorted[sorted.length - 1].score < 68) {
    const low = sorted[sorted.length - 1];
    weaknesses.push(`${low.axis} below elite benchmark (${low.score}/100)`);
  }
  if ((b.srDelta ?? 0) < -5) {
    weaknesses.push(`Pressure SR dips (${b.srDelta.toFixed(1)} vs normal phase)`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push(`Lowest relative axis: ${sorted[sorted.length - 1].axis} (${sorted[sorted.length - 1].score}/100)`);
  }

  return {
    type: 'batter',
    dimensions,
    overallDNA,
    strengths,
    weaknesses,
    confidence: assessSampleConfidence(b.pressureBalls, 'pressure'),
  };
}

export function computeBowlerDNA(bw: Bowler): PlayerDNAProfile {
  const deathEconVal = bw.deathEcon > 0 ? bw.deathEcon : bw.deathOverallEcon || bw.totalEcon;
  const ppEconVal = bw.powerplayEcon && bw.powerplayEcon > 0 ? bw.powerplayEcon : bw.totalEcon;
  const midEconVal = bw.middleEcon && bw.middleEcon > 0 ? bw.middleEcon : bw.normalEcon || bw.totalEcon;
  const dotPctVal = bw.overallDotPct || bw.dotPct || 32;
  const wicketSRVal = bw.overallWicketSR || bw.wicketSR || 22;

  const economy = Math.round(
    clamp(0.50 * clamp(((10.5 - bw.pressureEcon) / 4.2) * 100, 0, 100) + 0.30 * clamp(((10.2 - bw.totalEcon) / 4.0) * 100, 0, 100) + 0.20 * clamp((dotPctVal / 46) * 100, 0, 100), 15, 99)
  );
  const wicketTaking = Math.round(
    clamp(0.55 * clamp(((28 - Math.min(28, wicketSRVal)) / 18) * 100, 0, 100) + 0.45 * clamp(((26 - Math.min(26, bw.wicketSR || wicketSRVal)) / 16) * 100, 0, 100), 15, 99)
  );
  const deathPerf = Math.round(
    clamp(0.70 * clamp(((12.5 - deathEconVal) / 5.5) * 100, 0, 100) + 0.30 * clamp(((bw.deathPressureWickets || 0) / 14) * 100, 0, 100), 15, 99)
  );
  const powerplayPerf = Math.round(
    clamp(0.70 * clamp(((10.5 - ppEconVal) / 4.5) * 100, 0, 100) + 0.30 * clamp(((bw.powerplayWickets || 0) / 25) * 100, 0, 100), 18, 99)
  );
  const middleControl = Math.round(
    clamp(0.65 * clamp(((10.0 - midEconVal) / 4.2) * 100, 0, 100) + 0.35 * clamp((dotPctVal / 45) * 100, 0, 100), 18, 99)
  );
  const consistency = Math.round(clamp(bw.consistencyScore || 50, 15, 99));

  const dimensions: DNADimension[] = [
    { axis: 'Economy', score: economy, rawLabel: `Press Econ ${bw.pressureEcon.toFixed(2)} · Dot ${dotPctVal.toFixed(1)}%` },
    { axis: 'Wicket-Taking', score: wicketTaking, rawLabel: `Strike Rate ${wicketSRVal.toFixed(1)}b · ${bw.totalWickets} wkts` },
    { axis: 'Death Perf.', score: deathPerf, rawLabel: `Death Econ ${deathEconVal.toFixed(2)} · ${bw.deathPressureWickets} press wkts` },
    { axis: 'Powerplay Perf.', score: powerplayPerf, rawLabel: `PP Econ ${ppEconVal.toFixed(2)} · ${bw.powerplayWickets ?? 0} PP wkts` },
    { axis: 'Middle Control', score: middleControl, rawLabel: `Mid Econ ${midEconVal.toFixed(2)} · ${bw.middleWickets ?? 0} Mid wkts` },
    { axis: 'Consistency', score: consistency, rawLabel: `${consistency.toFixed(0)}/100 index · BPI ${bw.rating.toFixed(1)}` },
  ];

  const overallDNA = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const sorted = [...dimensions].sort((a, b2) => b2.score - a.score);
  const strengths = sorted.slice(0, 2).map((d) => `${d.axis} (${d.score}/100 — ${d.rawLabel})`);
  const weaknesses: string[] = [];
  if (sorted[sorted.length - 1].score < 68) {
    const low = sorted[sorted.length - 1];
    weaknesses.push(`${low.axis} trails elite tier (${low.score}/100 — ${low.rawLabel})`);
  }
  if ((bw.econDelta ?? 0) < -0.5) {
    weaknesses.push(`Economy rises under pressure (Δ ${bw.econDelta.toFixed(2)})`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push(`Lowest relative axis: ${sorted[sorted.length - 1].axis} (${sorted[sorted.length - 1].score}/100)`);
  }

  return {
    type: 'bowler',
    dimensions,
    overallDNA,
    strengths,
    weaknesses,
    confidence: assessSampleConfidence(bw.pressureLegalBalls, 'pressure'),
  };
}

