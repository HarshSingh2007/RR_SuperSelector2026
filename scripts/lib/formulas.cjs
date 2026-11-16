/**
 * Audited Core Analytical Formulas for SupeRR Selector 2.0
 * Every constant & formula here mirrors scripts/generate_analytics_data.cjs bit-for-bit.
 */

function clamp(val, min, max) {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function safeDivide(numerator, denominator, fallback = 0) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return fallback;
  }
  return numerator / denominator;
}

function computeChasePressure({
  runsRequired,
  ballsRemaining,
  wicketsLost,
  isKnockout = false,
}) {
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

function computeFirstInningsPressure({
  oversCompleted,
  overid,
  currentScore,
  wicketsLost,
  isKnockout = false,
}) {
  const safeOversCompleted = Math.max(0, Number.isFinite(oversCompleted) ? oversCompleted : 0);
  const safeOver = Math.max(1, Number.isFinite(overid) ? overid : Math.max(1, Math.ceil(safeOversCompleted)));
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

function classifyPressure(pressureIndex) {
  const p = clamp(pressureIndex, 0.0, 1.0);
  if (p >= 0.75) return 'Extreme';
  if (p >= 0.55) return 'High';
  if (p >= 0.38) return 'Moderate';
  return 'Normal';
}

function computeConfidenceWeight(pressureBalls) {
  const safeBalls = Math.max(0, Number.isFinite(pressureBalls) ? pressureBalls : 0);
  return Math.min(1.0, 0.65 + 0.35 * Math.sqrt(Math.min(safeBalls, 240) / 240));
}

function computeBattingBPI({
  pressSR,
  srDelta,
  dismissalRateRPD,
  boundaryPct,
  consistencyScore,
  pressureBalls,
}) {
  const rawRating =
    0.35 * Math.min(100, (pressSR / 165) * 100) +
    0.25 * clamp(50 + srDelta * 1.4, 0, 100) +
    0.20 * Math.min(100, (dismissalRateRPD / 42) * 100) +
    0.10 * Math.min(100, (boundaryPct / 24) * 100) +
    0.10 * consistencyScore;

  const confidenceWeight = computeConfidenceWeight(pressureBalls);
  const rating = rawRating * (0.68 + 0.32 * confidenceWeight);
  return {
    rawRating: parseFloat(rawRating.toFixed(1)),
    confidenceWeight: parseFloat(confidenceWeight.toFixed(2)),
    rating: parseFloat(rating.toFixed(1)),
  };
}

function computeBowlingBPI({
  pressEcon,
  econDelta,
  wicketSR,
  dotPct,
  consistencyScore,
  pressureLegalBalls,
}) {
  const rawRating =
    0.35 * clamp(((12.0 - pressEcon) / 5.2) * 100, 0, 100) +
    0.25 * clamp(50 + econDelta * 14, 0, 100) +
    0.20 * clamp(((30 - Math.min(30, wicketSR)) / 20) * 100, 0, 100) +
    0.10 * Math.min(100, (dotPct / 46) * 100) +
    0.10 * consistencyScore;

  const confidenceWeight = computeConfidenceWeight(pressureLegalBalls);
  const rating = rawRating * (0.68 + 0.32 * confidenceWeight);
  return {
    rawRating: parseFloat(rawRating.toFixed(1)),
    confidenceWeight: parseFloat(confidenceWeight.toFixed(2)),
    rating: parseFloat(rating.toFixed(1)),
  };
}

module.exports = {
  clamp,
  safeDivide,
  computeChasePressure,
  computeFirstInningsPressure,
  classifyPressure,
  computeConfidenceWeight,
  computeBattingBPI,
  computeBowlingBPI,
};

