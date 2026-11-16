const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { computeConfidenceWeight, clamp, safeDivide } = require('./lib/formulas.cjs');

const DATA_DIR = path.resolve(__dirname, '../src/data');

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

test('young_talents.json handles nullable pressure_sr cleanly without stringified nulls', () => {
  const talents = readJson('young_talents.json');
  assert.ok(Array.isArray(talents) && talents.length > 0, 'young_talents.json should be non-empty');

  let nullPressureSrCount = 0;
  for (const t of talents) {
    const psr = t.stats?.batting?.pressure_sr;
    assert.notEqual(psr, 'null', `Player ${t.name} must not have string "null" pressure_sr`);
    assert.notEqual(psr, 'NaN', `Player ${t.name} must not have string "NaN" pressure_sr`);
    if (psr === null || psr === undefined) {
      nullPressureSrCount += 1;
    } else {
      assert.ok(Number.isFinite(psr) && psr >= 0, `Player ${t.name} finite pressure_sr invalid: ${psr}`);
    }
    const overallScore = t.scores?.overall_talent_score;
    assert.ok(
      Number.isFinite(overallScore) && overallScore >= 0 && overallScore <= 100,
      `Player ${t.name} invalid overall_talent_score: ${overallScore}`
    );
  }
  assert.ok(nullPressureSrCount > 0, 'Expected at least one young talent (e.g. Sooryavanshi) with null pressure_sr requiring null-safe formatting');
});

test('head_to_head_matrix.json respects ball sample distribution and <6b insufficient threshold', () => {
  const h2h = readJson('head_to_head_matrix.json');
  assert.ok(h2h.matchups && typeof h2h.matchups === 'object', 'H2H matchups map populated');
  assert.ok(h2h.toughest_opponents && typeof h2h.toughest_opponents === 'object', 'toughest_opponents index populated');
  assert.ok(h2h.favourite_batters && typeof h2h.favourite_batters === 'object', 'favourite_batters index populated');

  let totalPairs = 0;
  let insufficientPairs = 0;
  let reliablePairs = 0;

  for (const [, entry] of Object.entries(h2h.matchups)) {
    totalPairs += 1;
    assert.ok(Number.isFinite(entry.balls_faced) && entry.balls_faced > 0, 'Matchup balls_faced must be positive finite number');
    assert.ok(Number.isFinite(entry.runs_scored) && entry.runs_scored >= 0, 'Matchup runs_scored must be non-negative');
    assert.ok(Number.isFinite(entry.dismissals) && entry.dismissals >= 0, 'Matchup dismissals non-negative');
    if (entry.balls_faced < 6) {
      insufficientPairs += 1;
    } else if (entry.balls_faced >= 15) {
      reliablePairs += 1;
    }
  }

  assert.ok(totalPairs > 50, `Expected >50 recorded H2H pairs, got ${totalPairs}`);
  assert.ok(insufficientPairs > 0, 'Expected small <6b matchup pairs that require UI insufficient-sample warning');
  assert.ok(reliablePairs > 0, 'Expected reliable >=15b matchup pairs');
});

test('canonical datasets preserve consistent core RR & auction joins with finite financials', () => {
  const batters = readJson('batters.json');
  const bowlers = readJson('bowlers.json');
  const auction = readJson('auction_players.json');
  const hiddenGems = readJson('hidden_gems.json');
  const top20 = readJson('top20_identities.json');

  assert.equal(top20.batters.length, 10, 'top20_identities batters strictly preserved at 10');
  assert.equal(top20.bowlers.length, 10, 'top20_identities bowlers strictly preserved at 10');
  assert.equal(top20.batters.length + top20.bowlers.length, 20, 'Official SupeRR Top 20 equals 10 batters + 10 bowlers');

  const auctionIds = new Set();
  for (const p of auction) {
    assert.ok(p.player_id && !auctionIds.has(p.player_id), `Duplicate or missing auction player_id: ${p.player_id}`);
    auctionIds.add(p.player_id);
    assert.ok(Number.isFinite(p.base_price_cr) && p.base_price_cr >= 0.2, `Invalid base_price_cr for ${p.name}`);
    assert.ok(Number.isFinite(p.estimated_valuation_cr) && p.estimated_valuation_cr >= p.base_price_cr, `Valuation < base price for ${p.name}`);
    assert.ok(Number.isFinite(p.bpi_rating) && p.bpi_rating >= 0 && p.bpi_rating <= 100, `Invalid bpi_rating for ${p.name}: ${p.bpi_rating}`);
  }

  for (const gem of hiddenGems) {
    assert.ok(Number.isFinite(gem.hidden_gem_score) && gem.hidden_gem_score > 0);
    assert.ok(Array.isArray(gem.strengths) && gem.strengths.length > 0, `Gem ${gem.name} missing strengths`);
  }

  // Ensure Rajasthan Royals & emerging core players exist across their respective datasets
  const batterNames = new Set(batters.map((b) => b.name));
  const youngNames = new Set(readJson('young_talents.json').map((y) => y.name));
  assert.ok(batterNames.has('Dhruv Jurel'), 'Dhruv Jurel present in batters.json');
  assert.ok(batterNames.has('Shimron Hetmyer'), 'Shimron Hetmyer present in batters.json');
  assert.ok(youngNames.has('Yashasvi Jaiswal'), 'Yashasvi Jaiswal present in young_talents.json');
  assert.ok(youngNames.has('Vaibhav Sooryavanshi'), 'Vaibhav Sooryavanshi present in young_talents.json');
  assert.ok(batters.length >= 70, `Batters leaderboard expected >=70 entries, got ${batters.length}`);
  assert.ok(bowlers.length >= 80, `Bowlers leaderboard expected >=80 entries, got ${bowlers.length}`);
});

test('Bayesian confidence weights and utility math remain bounded under edge inputs', () => {
  assert.equal(computeConfidenceWeight(0), 0.65);
  assert.ok(computeConfidenceWeight(90) < computeConfidenceWeight(180));
  assert.equal(computeConfidenceWeight(240), 1.0);
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(NaN, 0, 100), 0);
  assert.equal(safeDivide(100, 0, -1), -1);
});
