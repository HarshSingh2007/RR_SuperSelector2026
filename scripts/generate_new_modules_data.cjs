const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');
const dataDir = path.join(__dirname, '..', 'src', 'data');

const top20Path = path.join(dataDir, 'top20_identities.json');
const battersPath = path.join(dataDir, 'batters.json');
const bowlersPath = path.join(dataDir, 'bowlers.json');
const youngTalentsPath = path.join(dataDir, 'young_talents.json');

const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf8'));
const batters = JSON.parse(fs.readFileSync(battersPath, 'utf8'));
const bowlers = JSON.parse(fs.readFileSync(bowlersPath, 'utf8'));
const youngTalents = fs.existsSync(youngTalentsPath) ? JSON.parse(fs.readFileSync(youngTalentsPath, 'utf8')) : [];

// Build lookup maps (including Young Talent Radar players so all H2H matchups exist)
const allBattersMap = {};
top20.batters.forEach(b => { allBattersMap[b.id || b.player_id] = b; });
batters.forEach(b => { if (!allBattersMap[b.id]) allBattersMap[b.id] = b; });
youngTalents.forEach(y => {
  if (!allBattersMap[y.id] && (y.stats.batting.balls >= 15 || ['Batter', 'All-Rounder', 'Wicketkeeper'].includes(y.primary_role))) {
    allBattersMap[y.id] = { id: y.id, player_id: y.id, name: y.name, team: y.current_teams[0] || 'Franchise', country: y.country, country_code: y.country_code, country_flag: y.country_flag, player_role: y.primary_role };
  }
});

const allBowlersMap = {};
top20.bowlers.forEach(bw => { allBowlersMap[bw.id || bw.player_id] = bw; });
bowlers.forEach(bw => { if (!allBowlersMap[bw.id]) allBowlersMap[bw.id] = bw; });
youngTalents.forEach(y => {
  if (!allBowlersMap[y.id] && (y.stats.bowling.balls >= 18 || ['Fast Bowler', 'Spinner', 'All-Rounder'].includes(y.primary_role))) {
    allBowlersMap[y.id] = { id: y.id, player_id: y.id, name: y.name, team: y.current_teams[0] || 'Franchise', country: y.country, country_code: y.country_code, country_flag: y.country_flag, player_role: y.primary_role };
  }
});

console.log(`Tracking ${Object.keys(allBattersMap).length} unique batters and ${Object.keys(allBowlersMap).length} unique bowlers.`);

async function generateAll() {
  console.log('Loading competitions for format classification...');
  const comps = {};
  if (fs.existsSync(path.join(rawDir, 'competitions.csv'))) {
    fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
      .trim().split(/\r?\n/).slice(1).forEach(line => {
        const p = line.split(',');
        comps[p[0]] = {
          name: p[1],
          is_ipl: (p[1] || '').toLowerCase().includes('ipl') || (p[1] || '').toLowerCase().includes('indian premier')
        };
      });
  }

  const matches = {};
  if (fs.existsSync(path.join(rawDir, 'matches.csv'))) {
    fs.readFileSync(path.join(rawDir, 'matches.csv'), 'utf8')
      .trim().split(/\r?\n/).slice(1).forEach(line => {
        const p = line.split(',');
        matches[p[0]] = {
          comp_id: p[1]
        };
      });
  }

  console.log('Pass 1: Streaming ball_by_ball.csv for Head-to-Head encounters...');
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  const h2h = {};
  const BOWLER_DISMISSALS = new Set(['Bowled', 'Caught', 'Stump', 'LBW', 'Hit Wicket']);

  let lineCount = 0;
  for await (const line of rl) {
    if (lineCount++ === 0) continue;
    const p = line.split(',');
    const matchId = p[0];
    const bId = p[7]; // striker_id
    const bwId = p[11]; // bowler_id
    const bName = p[8];
    const bwName = p[12];
    const runsOffBat = parseInt(p[16], 10) || 0;
    const isFourFlag = p[17] === '1' || p[17] === 'true' || p[17] === 'True';
    const isSixFlag = p[18] === '1' || p[18] === 'true' || p[18] === 'True';
    const dismissalType = p[21];
    const dismissedPlayerId = p[22];
    const extraType = p[23];

    // Process if either striker or bowler is tracked (ensuring toughest_opponents/favourite_batters stay full)
    const hasBatter = !!allBattersMap[bId];
    const hasBowler = !!allBowlersMap[bwId];
    if (!hasBatter && !hasBowler) continue;

    const key = `${bId}_${bwId}`;
    if (!h2h[key]) {
      h2h[key] = {
        batter_id: bId,
        batter_name: allBattersMap[bId]?.name || bName,
        bowler_id: bwId,
        bowler_name: allBowlersMap[bwId]?.name || bwName,
        balls_faced: 0,
        runs_scored: 0,
        dismissals: 0,
        dots: 0,
        fours: 0,
        sixes: 0,
        timeline: [],
        ipl: { balls: 0, runs: 0, dismissals: 0, dots: 0, fours: 0, sixes: 0 },
        t20i: { balls: 0, runs: 0, dismissals: 0, dots: 0, fours: 0, sixes: 0 }
      };
    }

    const rec = h2h[key];
    const isLegal = extraType !== 'wide' && extraType !== 'Overstep';
    const isIPL = matchId && matches[matchId] && comps[matches[matchId].comp_id]?.is_ipl;
    const isBatterDismissed = dismissedPlayerId === bId && BOWLER_DISMISSALS.has(dismissalType);

    if (isLegal) {
      rec.balls_faced++;
      rec.runs_scored += runsOffBat;
      if (runsOffBat === 0) rec.dots++;
      if (runsOffBat === 4 || isFourFlag) rec.fours++;
      if (runsOffBat === 6 || isSixFlag) rec.sixes++;

      if (isIPL) {
        rec.ipl.balls++;
        rec.ipl.runs += runsOffBat;
        if (runsOffBat === 0) rec.ipl.dots++;
        if (runsOffBat === 4 || isFourFlag) rec.ipl.fours++;
        if (runsOffBat === 6 || isSixFlag) rec.ipl.sixes++;
      } else {
        rec.t20i.balls++;
        rec.t20i.runs += runsOffBat;
        if (runsOffBat === 0) rec.t20i.dots++;
        if (runsOffBat === 4 || isFourFlag) rec.t20i.fours++;
        if (runsOffBat === 6 || isSixFlag) rec.t20i.sixes++;
      }

      // Track most recent 12 legal ball outcomes cleanly (single event per delivery)
      let event = runsOffBat.toString();
      if (isBatterDismissed) event = 'W';
      else if (isSixFlag || runsOffBat === 6) event = '6';
      else if (isFourFlag || runsOffBat === 4) event = '4';
      else if (runsOffBat === 0) event = '•';
      rec.timeline.push(event);
      if (rec.timeline.length > 12) rec.timeline.shift();
    }

    if (isBatterDismissed) {
      rec.dismissals++;
      if (isIPL) rec.ipl.dismissals++;
      else rec.t20i.dismissals++;
    }
  }

  console.log(`Processed ${Object.keys(h2h).length} active head-to-head pairs.`);

  // Enrich H2H records with strike rates, advantage indicators, and averages
  const enrichedH2H = {};
  const batterMatchups = {};
  const bowlerMatchups = {};

  function computeAdvantage(balls, sr, dismissals, dotPct) {
    if (balls < 4) return 'balanced';
    if (dismissals >= 2 || (balls >= 10 && sr < 110) || (dismissals >= 1 && dotPct >= 50)) return 'bowler';
    if ((sr >= 160 && dismissals <= 1) || (balls >= 12 && dismissals === 0 && sr >= 140)) return 'batter';
    return 'balanced';
  }

  for (const [key, rec] of Object.entries(h2h)) {
    if (rec.balls_faced < 1) continue;

    const sr = rec.balls_faced > 0 ? parseFloat(((rec.runs_scored / rec.balls_faced) * 100).toFixed(1)) : 0;
    const dotPct = rec.balls_faced > 0 ? parseFloat(((rec.dots / rec.balls_faced) * 100).toFixed(1)) : 0;
    const boundaryPct = rec.balls_faced > 0 ? parseFloat((((rec.fours + rec.sixes) / rec.balls_faced) * 100).toFixed(1)) : 0;
    const avg = rec.dismissals > 0 ? parseFloat((rec.runs_scored / rec.dismissals).toFixed(1)) : rec.runs_scored;

    const iplSr = rec.ipl.balls > 0 ? parseFloat(((rec.ipl.runs / rec.ipl.balls) * 100).toFixed(1)) : 0;
    const iplDot = rec.ipl.balls > 0 ? parseFloat(((rec.ipl.dots / rec.ipl.balls) * 100).toFixed(1)) : 0;
    const t20iSr = rec.t20i.balls > 0 ? parseFloat(((rec.t20i.runs / rec.t20i.balls) * 100).toFixed(1)) : 0;
    const t20iDot = rec.t20i.balls > 0 ? parseFloat(((rec.t20i.dots / rec.t20i.balls) * 100).toFixed(1)) : 0;

    const payload = {
      ...rec,
      strike_rate: sr,
      dot_pct: dotPct,
      boundary_pct: boundaryPct,
      batting_avg: avg,
      advantage: computeAdvantage(rec.balls_faced, sr, rec.dismissals, dotPct),
      ipl: {
        ...rec.ipl,
        strike_rate: iplSr,
        dot_pct: iplDot,
        boundary_pct: rec.ipl.balls > 0 ? parseFloat((((rec.ipl.fours + rec.ipl.sixes) / rec.ipl.balls) * 100).toFixed(1)) : 0,
        batting_avg: rec.ipl.dismissals > 0 ? parseFloat((rec.ipl.runs / rec.ipl.dismissals).toFixed(1)) : rec.ipl.runs,
        advantage: computeAdvantage(rec.ipl.balls, iplSr, rec.ipl.dismissals, iplDot)
      },
      t20i: {
        ...rec.t20i,
        strike_rate: t20iSr,
        dot_pct: t20iDot,
        boundary_pct: rec.t20i.balls > 0 ? parseFloat((((rec.t20i.fours + rec.t20i.sixes) / rec.t20i.balls) * 100).toFixed(1)) : 0,
        batting_avg: rec.t20i.dismissals > 0 ? parseFloat((rec.t20i.runs / rec.t20i.dismissals).toFixed(1)) : rec.t20i.runs,
        advantage: computeAdvantage(rec.t20i.balls, t20iSr, rec.t20i.dismissals, t20iDot)
      }
    };

    enrichedH2H[key] = payload;

    // Track for batter
    if (!batterMatchups[rec.batter_id]) batterMatchups[rec.batter_id] = [];
    batterMatchups[rec.batter_id].push(payload);

    // Track for bowler
    if (!bowlerMatchups[rec.bowler_id]) bowlerMatchups[rec.bowler_id] = [];
    bowlerMatchups[rec.bowler_id].push(payload);
  }

  // Determine "Toughest Opponent" for each batter
  const toughestOpponents = {};
  for (const [bId, list] of Object.entries(batterMatchups)) {
    const sorted = [...list]
      .filter(m => m.balls_faced >= 6)
      .sort((a, b) => {
        if (b.dismissals !== a.dismissals) return b.dismissals - a.dismissals;
        return a.strike_rate - b.strike_rate;
      });
    toughestOpponents[bId] = sorted.slice(0, 5);
  }

  // Determine "Favourite Batter" for each bowler
  const favouriteBatters = {};
  for (const [bwId, list] of Object.entries(bowlerMatchups)) {
    const sorted = [...list]
      .filter(m => m.balls_faced >= 6)
      .sort((a, b) => {
        if (b.dismissals !== a.dismissals) return b.dismissals - a.dismissals;
        return a.strike_rate - b.strike_rate;
      });
    favouriteBatters[bwId] = sorted.slice(0, 5);
  }

  // Filter for tracked players to keep bundle lean and ultra-responsive
  const batterIds = new Set(Object.keys(allBattersMap));
  const bowlerIds = new Set(Object.keys(allBowlersMap));
  const neededKeys = new Set();

  for (const [k, v] of Object.entries(enrichedH2H)) {
    if (batterIds.has(v.batter_id) && bowlerIds.has(v.bowler_id)) {
      neededKeys.add(k);
    }
  }

  const filteredToughest = {};
  for (const bId of batterIds) {
    if (toughestOpponents[bId]) {
      filteredToughest[bId] = toughestOpponents[bId];
      toughestOpponents[bId].forEach(o => neededKeys.add(`${o.batter_id}_${o.bowler_id}`));
    }
  }

  const filteredFavourite = {};
  for (const bwId of bowlerIds) {
    if (favouriteBatters[bwId]) {
      filteredFavourite[bwId] = favouriteBatters[bwId];
      favouriteBatters[bwId].forEach(o => neededKeys.add(`${o.batter_id}_${o.bowler_id}`));
    }
  }

  const filteredMatchups = {};
  for (const k of neededKeys) {
    if (enrichedH2H[k]) filteredMatchups[k] = enrichedH2H[k];
  }

  fs.writeFileSync(path.join(dataDir, 'head_to_head_matrix.json'), JSON.stringify({
    matchups: filteredMatchups,
    toughest_opponents: filteredToughest,
    favourite_batters: filteredFavourite
  }));
  console.log(`Saved optimized head_to_head_matrix.json (${Object.keys(filteredMatchups).length} matchups).`);

  // ==========================================
  // MODULE 2: HIDDEN GEMS DETECTOR DATA GENERATION
  // ==========================================
  console.log('Generating Hidden Gems dataset...');

  // Established global veterans / marquee IPL stars should NOT rank above genuine sleeper picks in Hidden Gems
  const MARQUEE_VETERAN_NAMES = new Set([
    'angelo mathews', 'dinesh karthik', 'mahendra singh dhoni', 'ms dhoni', 'kieron pollard',
    'sunil narine', 'andre russell', 'glenn maxwell', 'ravichandran ashwin', 'jasprit bumrah',
    'virat kohli', 'rohit sharma', 'rashid khan', 'david miller', 'suryakumar yadav',
    'hardik pandya', 'trent boult', 'ravindra jadeja', 'kagiso rabada', 'josh hazlewood',
    'bhuvneshwar kumar', 'patrick cummins', 'pat cummins', 'mitchell starc', 'kl rahul',
    'rishabh pant', 'sanju samson', 'jos buttler', 'mitchell santner', 'tim southee',
    'adil rashid', 'chris jordan', 'umesh yadav', 'mohit sharma', 'jaydev unadkat',
    'kane williamson', 'babar azam', 'mohammad rizwan', 'shaheen afridi', 'mustafizur rahman',
    'adam zampa', 'jason holder', 'devon conway', 'jonny bairstow', 'moeen ali',
    'daryl mitchell', 'nicholas pooran', 'marcus stoinis', 'heinrich klaasen', 'sam curran'
  ]);

  const gemList = [];
  const batterById = new Map(batters.map(b => [b.id, b]));
  const bowlerById = new Map(bowlers.map(bw => [bw.id, bw]));

  // Combine top20 and database players (deduplicated)
  const candidatePool = [
    ...top20.batters.map(b => ({ ...b, role_type: 'batter' })),
    ...top20.bowlers.map(bw => ({ ...bw, role_type: 'bowler' })),
    ...batters.map(b => ({ ...b, role_type: 'batter' })),
    ...bowlers.map(bw => ({ ...bw, role_type: 'bowler' }))
  ];

  const seenIds = new Set();
  candidatePool.forEach(p => {
    const pId = p.id || p.player_id;
    if (seenIds.has(pId)) return;
    seenIds.add(pId);

    const isBatter = p.role_type === 'batter';
    const matchesCount = p.matchesAnalysed || 10;
    const pressMatches = p.pressureMatches || 4;
    const isMarqueeVeteran = MARQUEE_VETERAN_NAMES.has((p.name || '').toLowerCase()) || matchesCount >= 38;

    const rating = p.rating || p.pressure_rating || 75;
    const delta = isBatter ? (p.srDelta || 0) : (p.econDelta || 0);
    const consistency = p.consistencyScore || 75;

    let gemScore = 0;
    let gemTag = 'Emerging Clutch Weapon';
    let scoutingVerdict = '';
    const strengths = [];
    const weaknesses = [];

    // Sample-size reliability factor so tiny 3-4 match samples don't overshoot solid 10-28 match sleepers
    const reliability = Math.min(1.0, Math.max(0.55, matchesCount / 14));
    const prominencePenalty = isMarqueeVeteran ? 18 : 0;

    if (isBatter) {
      const pSR = p.pressureSR || 140;
      const nSR = p.normalSR || pSR;
      const bPct = p.boundaryPct || 20;
      const dRate = p.dismissalRate || 8;
      const srEff = Math.min(100, (pSR / 210) * 100);
      const deltaBonus = Math.min(100, Math.max(0, 50 + delta * 1.15));
      const scarcityBonus = Math.max(10, 98 - Math.min(45, matchesCount) * 2.0);

      const rawGem = 0.34 * srEff + 0.24 * deltaBonus + 0.22 * scarcityBonus + 0.20 * consistency;
      gemScore = parseFloat(Math.max(45, Math.min(96.5, (rawGem * (0.75 + 0.25 * reliability)) - prominencePenalty)).toFixed(1));

      if (isMarqueeVeteran) gemTag = 'Marquee Veteran / Proven Star';
      else if (gemScore >= 82) gemTag = 'Diamond in the Rough';
      else if (gemScore >= 75) gemTag = 'High-Ceiling Finisher';
      else if (gemScore >= 68) gemTag = 'Underrated Value Striker';
      else gemTag = 'Emerging Talent';

      scoutingVerdict = isMarqueeVeteran
        ? `Proven high-profile contributor across ${matchesCount} T20 appearances (${pSR} pressure SR, ${delta >= 0 ? '+' : ''}${delta} delta vs baseline). Already well-priced on global auction radar.`
        : `${p.name} posts a ${pSR} strike rate under high pressure (${delta >= 0 ? '+' : ''}${delta} SR delta vs ${nSR} normal baseline) across ${matchesCount} matches analysed, delivering ${bPct}% boundaries in clutch overs.`;

      if (pSR >= 170) strengths.push(`Explosive ${pSR} strike rate in high-leverage overs`);
      else strengths.push(`Steady ${pSR} pressure strike rate over ${p.pressureBalls || 0} clutch balls`);
      if (delta >= 20) strengths.push(`Strong clutch escalation (+${delta} SR lift vs normal phase)`);
      else if (bPct >= 22) strengths.push(`High boundary frequency (${bPct}% of pressure deliveries hit 4/6)`);
      else strengths.push(`Maintains ${consistency}/100 innings consistency under pressure`);
      if (p.deathSR >= 175) strengths.push(`Thrives at the death (${p.deathSR} death-overs SR)`);

      if (matchesCount < 12) weaknesses.push(`Compact dataset sample (${matchesCount} matches; ${p.pressureBalls || 0} pressure balls faced)`);
      if (dRate >= 10) weaknesses.push(`Elevated risk-reward wicket rate (${dRate}% dismissal rate in pressure balls)`);
      if (p.dotPct >= 34) weaknesses.push(`High dot-ball share (${p.dotPct}% dots under pressure) limits strike rotation`);
      if (!p.ipl?.balls) weaknesses.push(`Zero IPL delivery exposure in this 2022–2026 dataset slice`);
      if (weaknesses.length < 2) weaknesses.push(`Needs sustained away-venue replication across high-leverage phases`);
    } else {
      const pEcon = p.pressureEcon || 7.5;
      const nEcon = p.normalEcon || pEcon;
      const dPct = p.dotPct || 40;
      const pWkts = p.pressureWickets || 0;
      const econEff = Math.min(100, Math.max(0, ((11.2 - pEcon) / 5.2) * 100));
      const deltaBonus = Math.min(100, Math.max(0, 50 + delta * 16));
      const scarcityBonus = Math.max(10, 98 - Math.min(45, matchesCount) * 2.0);

      const rawGem = 0.34 * econEff + 0.24 * deltaBonus + 0.22 * scarcityBonus + 0.20 * consistency;
      gemScore = parseFloat(Math.max(45, Math.min(96.5, (rawGem * (0.75 + 0.25 * reliability)) - prominencePenalty)).toFixed(1));

      if (isMarqueeVeteran) gemTag = 'Marquee Veteran / Proven Star';
      else if (gemScore >= 82) gemTag = (p.bowlingType || '').toLowerCase().includes('spin') || (p.player_role || '').toLowerCase().includes('spin') ? 'Mystery Spin Maverick' : 'Stealth Pace Enforcer';
      else if (gemScore >= 75) gemTag = 'Death-Over Stifler';
      else if (gemScore >= 68) gemTag = 'Underrated Containment Asset';
      else gemTag = 'Emerging Specialist';

      scoutingVerdict = isMarqueeVeteran
        ? `Established frontline attack option over ${matchesCount} T20 outings (${pEcon} pressure economy, ${pWkts} pressure wickets).`
        : `${p.name} holds a miserly ${pEcon} economy in high-leverage overs (${delta >= 0 ? '+' : ''}${delta} econ improvement vs ${nEcon} normal) with ${pWkts} clutch wickets and ${dPct}% dot balls across ${matchesCount} matches.`;

      if (pEcon <= 7.2) strengths.push(`Restrictive ${pEcon} economy in high-leverage overs`);
      else strengths.push(`Reliable ${pEcon} pressure economy across ${p.pressureBalls || 0} clutch balls`);
      if (dPct >= 44) strengths.push(`Heavy dot-ball squeeze (${dPct}% dots in pressure phases)`);
      else if (pWkts >= 12) strengths.push(`Consistent breakthrough threat (${pWkts} high-pressure wickets)`);
      if (delta >= 0.8) strengths.push(`Tightens scoring under pressure (+${delta} runs/over gain vs baseline)`);
      else strengths.push(`Solid ${consistency}/100 spell control score across pressure overs`);

      if (matchesCount < 12) weaknesses.push(`Compact sample (${matchesCount} matches analysed); workload scale unverified`);
      if (!p.ipl?.balls) weaknesses.push(`Zero IPL bowling deliveries recorded in this 2022–2026 dataset`);
      if (p.deathEcon >= 10.0) weaknesses.push(`Concedes boundaries at the death (${p.deathEcon} death-overs economy)`);
      if (dPct < 36) weaknesses.push(`Moderate dot percentage (${dPct}%) allows single rotation`);
      if (weaknesses.length < 2) weaknesses.push(`Requires validation on flat high-scoring Indian surfaces`);
    }

    // Preserve All-Rounder tag if player qualifies in both datasets
    const resolvedRole = (batterById.has(pId) && bowlerById.has(pId) && !String(p.player_role || '').toLowerCase().includes('keeper'))
      ? 'All-Rounder'
      : (p.player_role || (isBatter ? 'Batter' : 'Bowler'));

    gemList.push({
      player_id: pId,
      name: p.name,
      country: p.country || 'India',
      country_code: p.country_code || 'IN',
      country_flag: p.country_flag || '🇮🇳',
      player_role: resolvedRole,
      role_type: p.role_type,
      team: p.team || 'Franchise',
      avatar_icon: p.avatar_icon || (isBatter ? 'flame' : 'radar'),
      bpi_rating: rating,
      hidden_gem_score: gemScore,
      gem_tag: gemTag,
      matches_analysed: matchesCount,
      pressure_matches: pressMatches,
      pressure_metric: isBatter ? `SR ${p.pressureSR}` : `Econ ${p.pressureEcon}`,
      baseline_metric: isBatter ? `SR ${p.normalSR}` : `Econ ${p.normalEcon}`,
      delta: delta,
      consistency: consistency,
      dot_or_boundary_pct: isBatter ? (p.boundaryPct || 25) : (p.dotPct || 45),
      why_scout: scoutingVerdict,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 2)
    });
  });

  // Sort by hidden gem score
  gemList.sort((a, b) => b.hidden_gem_score - a.hidden_gem_score);

  fs.writeFileSync(path.join(dataDir, 'hidden_gems.json'), JSON.stringify(gemList, null, 2));
  console.log(`Saved hidden_gems.json (${gemList.length} scouted players). Top 5:`, gemList.slice(0, 5).map(g => `${g.name} (${g.hidden_gem_score}, ${g.gem_tag})`));

  // ==========================================
  // MODULE 1: AUCTION WAR ROOM DATA GENERATION
  // ==========================================
  console.log('Generating Auction War Room player pool...');
  const gemIds = new Set(gemList.map(g => g.player_id));

  // Merge key emerging prospects from Young Talent Radar who weren't in batters/bowlers minimum threshold
  const extraYouthCandidates = youngTalents
    .filter(y => !gemIds.has(y.id) && y.stats.matches >= 10)
    .map(y => {
      const isBowlerPrimary = y.primary_role === 'Fast Bowler' || y.primary_role === 'Spinner';
      const roleMapped = y.primary_role === 'Wicketkeeper' ? 'Wicketkeeper-Batter' : y.primary_role;
      return {
        player_id: y.id,
        name: y.name,
        country: y.country,
        country_code: y.country_code,
        country_flag: y.country_flag,
        player_role: roleMapped,
        role_type: isBowlerPrimary ? 'bowler' : 'batter',
        team: y.current_teams[0] || 'Franchise',
        avatar_icon: y.avatar_icon,
        bpi_rating: y.scores.current_performance,
        matches_analysed: y.stats.matches,
        pressure_metric: isBowlerPrimary
          ? `Econ ${y.stats.bowling.pressure_econ ?? y.stats.bowling.economy}`
          : `SR ${y.stats.batting.pressure_sr ?? y.stats.batting.strike_rate}`,
        delta: 0,
        why_scout: y.why_this_player
      };
    });

  const combinedAuctionPoolSource = [...gemList, ...extraYouthCandidates];

  const auctionPool = combinedAuctionPoolSource.map(p => {
    let basePriceCr = 0.50;
    if (p.bpi_rating >= 90 || p.matches_analysed >= 35) basePriceCr = 2.00;
    else if (p.bpi_rating >= 85 || p.matches_analysed >= 22) basePriceCr = 1.50;
    else if (p.bpi_rating >= 80 || p.matches_analysed >= 15) basePriceCr = 1.00;
    else if (p.bpi_rating >= 74) basePriceCr = 0.50;
    else basePriceCr = 0.20;

    // Simulated Auction Estimation (clearly distinct from historical BPI)
    const bpiBonus = Math.max(0, (p.bpi_rating - 70) * 0.45);
    const roleLower = (p.player_role || '').toLowerCase();
    const roleMultiplier = roleLower.includes('all-rounder') ? 1.35 : (roleLower.includes('keeper') ? 1.25 : 1.0);
    const estimatedValuationCr = parseFloat(Math.min(18.5, Math.max(basePriceCr * 1.5, (basePriceCr + bpiBonus) * roleMultiplier)).toFixed(2));

    const isOverseas = p.country_code !== 'IN';

    return {
      player_id: p.player_id,
      name: p.name,
      country: p.country,
      country_code: p.country_code,
      country_flag: p.country_flag,
      is_overseas: isOverseas,
      player_role: p.player_role,
      role_type: p.role_type,
      current_franchise: p.team,
      avatar_icon: p.avatar_icon,
      bpi_rating: p.bpi_rating,
      base_price_cr: basePriceCr,
      estimated_valuation_cr: estimatedValuationCr,
      key_stat: p.pressure_metric,
      clutch_delta: p.delta,
      matches_analysed: p.matches_analysed,
      scouting_summary: p.why_scout
    };
  });

  fs.writeFileSync(path.join(dataDir, 'auction_players.json'), JSON.stringify(auctionPool, null, 2));
  console.log(`Saved auction_players.json (${auctionPool.length} auction players, Overseas=${auctionPool.filter(a=>a.is_overseas).length}, Domestic=${auctionPool.filter(a=>!a.is_overseas).length}).`);
}

generateAll().catch(console.error);
