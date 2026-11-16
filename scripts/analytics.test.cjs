const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  clamp,
  safeDivide,
  computeChasePressure,
  computeFirstInningsPressure,
  classifyPressure,
  computeConfidenceWeight,
  computeBattingBPI,
  computeBowlingBPI,
} = require('./lib/formulas.cjs');

test('safeDivide handles zero, negative, and NaN denominators cleanly', () => {
  assert.equal(safeDivide(100, 0, 0), 0);
  assert.equal(safeDivide(100, -5, -1), -1);
  assert.equal(safeDivide(NaN, 10, 42), 42);
  assert.equal(safeDivide(150, 100), 1.5);
});

test('chase pressure respects high-stakes cliffhanger, anti-climax, and bounds [0, 1]', () => {
  // Default high-leverage chase: 36 needed off 18 balls, 7 wickets lost (3 in hand)
  const clutch = computeChasePressure({
    runsRequired: 36,
    ballsRemaining: 18,
    wicketsLost: 7,
    isKnockout: false,
  });
  assert.ok(clutch >= 0.75 && clutch <= 1.0, `Expected extreme pressure, got ${clutch}`);
  assert.equal(classifyPressure(clutch), 'Extreme');

  // Anti-climax safeguard: 10 needed with 7 wickets in hand
  const cruising = computeChasePressure({
    runsRequired: 10,
    ballsRemaining: 18,
    wicketsLost: 3,
    isKnockout: false,
  });
  assert.ok(cruising < 0.38, `Expected anti-climax Normal situation (<0.38), got ${cruising}`);
  assert.equal(classifyPressure(cruising), 'Normal');

  // Knockout multiplier still clamped to 1.0 (3 wickets in hand triggers 1.25x cliffhanger + 1.15x knockout)
  const knockout = computeChasePressure({
    runsRequired: 48,
    ballsRemaining: 12,
    wicketsLost: 7,
    isKnockout: true,
  });
  assert.equal(knockout, 1.0);

  // Tail-exposed hopeless chase (<= 2 wickets in hand, RRR > 26) dampened by 0.55x
  const hopeless = computeChasePressure({
    runsRequired: 60,
    ballsRemaining: 12,
    wicketsLost: 8,
    isKnockout: false,
  });
  assert.ok(hopeless < 0.60, `Expected hopeless chase dampener (<0.60), got ${hopeless}`);
});

test('first innings pressure elevates powerplay collapses and death overs safely', () => {
  const collapse = computeFirstInningsPressure({
    oversCompleted: 4,
    overid: 5,
    currentScore: 28,
    wicketsLost: 3,
    isKnockout: false,
  });
  const steady = computeFirstInningsPressure({
    oversCompleted: 4,
    overid: 5,
    currentScore: 36,
    wicketsLost: 0,
    isKnockout: false,
  });
  assert.ok(collapse > steady);
  assert.ok(collapse >= 0 && collapse <= 1);
});

test('Bayesian confidence weight & BPI calculations penalize tiny samples', () => {
  const lowSample = computeBattingBPI({
    pressSR: 190,
    srDelta: 45,
    dismissalRateRPD: 35,
    boundaryPct: 24,
    consistencyScore: 70,
    pressureBalls: 50,
  });
  const highSample = computeBattingBPI({
    pressSR: 190,
    srDelta: 45,
    dismissalRateRPD: 35,
    boundaryPct: 24,
    consistencyScore: 70,
    pressureBalls: 240,
  });
  assert.equal(highSample.confidenceWeight, 1.0);
  assert.ok(lowSample.confidenceWeight < 0.85);
  assert.ok(highSample.rating > lowSample.rating);

  const bowl = computeBowlingBPI({
    pressEcon: 5.5,
    econDelta: 2.5,
    wicketSR: 12,
    dotPct: 45,
    consistencyScore: 75,
    pressureLegalBalls: 180,
  });
  assert.ok(bowl.rating > 80 && bowl.rating <= 100);
});

test('generated datasets pass sample thresholds, zero-NaN, and duplicate ID checks', () => {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const metadata = JSON.parse(fs.readFileSync(path.join(dataDir, 'metadata.json'), 'utf8'));
  const batters = JSON.parse(fs.readFileSync(path.join(dataDir, 'batters.json'), 'utf8'));
  const bowlers = JSON.parse(fs.readFileSync(path.join(dataDir, 'bowlers.json'), 'utf8'));
  const gems = JSON.parse(fs.readFileSync(path.join(dataDir, 'hidden_gems.json'), 'utf8'));
  const auction = JSON.parse(fs.readFileSync(path.join(dataDir, 'auction_players.json'), 'utf8'));
  const young = JSON.parse(fs.readFileSync(path.join(dataDir, 'young_talents.json'), 'utf8'));

  assert.equal(metadata.totalDeliveries, 200999);
  assert.equal(metadata.totalMatches, 883);
  assert.equal(metadata.totalPressureDeliveries, 14422);

  // Duplicate ID checks within each dataset
  const assertUnique = (arr, key, label) => {
    const seen = new Set();
    for (const item of arr) {
      const id = String(item[key]);
      assert.ok(!seen.has(id), `Duplicate ID ${id} found in ${label}`);
      seen.add(id);
    }
  };
  assertUnique(batters, 'id', 'batters.json');
  assertUnique(bowlers, 'id', 'bowlers.json');
  assertUnique(gems, 'player_id', 'hidden_gems.json');
  assertUnique(auction, 'player_id', 'auction_players.json');
  assertUnique(young, 'id', 'young_talents.json');

  // Minimum eligibility thresholds & non-NaN numerical checks
  for (const b of batters) {
    assert.ok(b.pressureBalls >= 50, `${b.name} below 50 pressure balls`);
    assert.ok(b.pressureMatches >= 4, `${b.name} below 4 pressure matches`);
    assert.ok(Number.isFinite(b.rating) && Number.isFinite(b.battingAvg) && Number.isFinite(b.highestScore));
    assert.ok(b.totalFours >= 0 && b.totalSixes >= 0);
  }
  for (const bw of bowlers) {
    assert.ok(bw.pressureLegalBalls >= 54, `${bw.name} below 54 legal pressure balls`);
    assert.ok(bw.pressureMatches >= 4, `${bw.name} below 4 pressure matches`);
    assert.ok(Number.isFinite(bw.rating) && Number.isFinite(bw.overallBowlingAvg) && Number.isFinite(bw.maidenOvers));
    assert.match(String(bw.bestBowling), /^\d+\/\d+$/);
  }
});
