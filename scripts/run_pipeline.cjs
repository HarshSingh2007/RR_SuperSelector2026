const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

// Bowler credited dismissal types
const BOWLER_DISMISSALS = new Set(['Bowled', 'Caught', 'Stump', 'LBW', 'Hit Wicket']);

async function runPipeline() {
  console.log('Loading competitions, teams, matches, and players...');

  // 1. Competitions
  const competitions = {};
  fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const [comp_id, comp_name, match_format, season] = line.split(',');
      competitions[comp_id] = { comp_id, comp_name, match_format, season };
    });

  // 2. Teams
  const teams = {};
  fs.readFileSync(path.join(rawDir, 'teams.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const [comp_id, team_id, team_name] = line.split(',');
      if (!teams[team_id]) {
        teams[team_id] = team_name;
      }
    });

  // 3. Matches
  const matches = {};
  fs.readFileSync(path.join(rawDir, 'matches.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      const match_id = p[0];
      matches[match_id] = {
        match_id,
        comp_id: p[1],
        match_number: p[2],
        match_date: p[3],
        stage: p[4],
        venue_id: p[5],
        venue_country: p[6],
        home_team_id: p[7],
        home_team: p[8],
        away_team_id: p[9],
        away_team: p[10],
        toss_win_team_id: p[13],
        toss_opted: p[14],
        man_of_the_match: p[15],
        first_inn_revised_overs: p[16] ? parseFloat(p[16]) : null,
        second_inn_revised_overs: p[17] ? parseFloat(p[17]) : null,
        revised_target: p[18] ? parseInt(p[18], 10) : null,
        knock_out: p[19] === '1' || p[19] === 'true',
        win_team_id: p[20],
        result: p[21]
      };
    });

  // 4. Players
  const players = {};
  fs.readFileSync(path.join(rawDir, 'competition_team_player_mapping.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      const playerId = p[4];
      const playerName = p[5];
      const teamName = p[3];
      if (!players[playerId]) {
        players[playerId] = { id: playerId, name: playerName, team: teamName };
      }
    });

  console.log(`Loaded ${Object.keys(competitions).length} competitions, ${Object.keys(matches).length} matches, ${Object.keys(players).length} players.`);

  // Pass 1: Scan ball_by_ball to compute exact Innings 1 totals for each match
  console.log('\nPass 1: Computing match totals & targets...');
  const matchInnings1Totals = {};
  
  const rl1 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let ballCount = 0;
  for await (const line of rl1) {
    if (ballCount++ === 0) continue;
    const p = line.split(',');
    const matchId = p[0];
    const inn = p[1];
    if (inn !== '1') continue;

    const runs = parseInt(p[16], 10) || 0;
    const extType = p[23];
    const ext2 = parseInt(p[25], 10) || 0;

    let ballTotalRuns = runs;
    if (extType === 'wide' || extType === 'Overstep') {
      ballTotalRuns += 1 + ext2;
    } else if (extType === 'byes' || extType === 'legbyes') {
      ballTotalRuns += (ext2 > 0 ? ext2 : (runs === 0 ? 1 : 0));
    }

    matchInnings1Totals[matchId] = (matchInnings1Totals[matchId] || 0) + ballTotalRuns;
  }

  console.log(`Computed Innings 1 totals for ${Object.keys(matchInnings1Totals).length} matches.`);

  // Pass 2: Reconstruct match state per delivery and classify pressure
  console.log('\nPass 2: Reconstructing match states & calculating pressure scores...');

  const rl2 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  // Track match state during innings
  // matchStates[matchId_inn] = { currentScore, wicketsLost, legalBalls }
  const matchStates = {};
  
  const batterStats = {};
  const bowlerStats = {};

  function getBatter(id, name) {
    if (!batterStats[id]) {
      batterStats[id] = {
        id,
        name: name || (players[id] ? players[id].name : `Player ${id}`),
        // Normal (baseline)
        normalBalls: 0,
        normalRuns: 0,
        normalDismissals: 0,
        normalFours: 0,
        normalSixes: 0,
        normalMatches: new Set(),
        // Pressure (High + Extreme)
        pressureBalls: 0,
        pressureRuns: 0,
        pressureDismissals: 0,
        pressureFours: 0,
        pressureSixes: 0,
        pressureMatches: new Set(),
        // By pressure level
        moderateBalls: 0,
        moderateRuns: 0,
        highBalls: 0,
        highRuns: 0,
        extremeBalls: 0,
        extremeRuns: 0,
        // Match by match runs under pressure for consistency
        matchPressureRuns: {},
        // Competitions
        comps: new Set()
      };
    }
    return batterStats[id];
  }

  function getBowler(id, name) {
    if (!bowlerStats[id]) {
      bowlerStats[id] = {
        id,
        name: name || (players[id] ? players[id].name : `Player ${id}`),
        // Normal
        normalLegalBalls: 0,
        normalRunsConceded: 0,
        normalWickets: 0,
        normalDots: 0,
        normalMatches: new Set(),
        // Pressure (High + Extreme)
        pressureLegalBalls: 0,
        pressureRunsConceded: 0,
        pressureWickets: 0,
        pressureDots: 0,
        pressureMatches: new Set(),
        // By pressure level
        moderateLegalBalls: 0,
        moderateRuns: 0,
        moderateWickets: 0,
        highLegalBalls: 0,
        highRuns: 0,
        highWickets: 0,
        extremeLegalBalls: 0,
        extremeRuns: 0,
        extremeWickets: 0,
        // Match by match
        matchPressureWickets: {},
        comps: new Set()
      };
    }
    return bowlerStats[id];
  }

  let processedDeliveries = 0;
  let pressureCounts = { Normal: 0, Moderate: 0, High: 0, Extreme: 0 };

  for await (const line of rl2) {
    if (processedDeliveries++ === 0) continue;
    const p = line.split(',');
    const matchId = p[0];
    const inn = p[1];
    const overid = parseInt(p[2], 10);
    const overBallNum = parseInt(p[3], 10);
    const strikerId = p[7];
    const strikerName = p[8];
    const bowlerId = p[11];
    const bowlerName = p[12];
    const runs = parseInt(p[16], 10) || 0;
    const isFour = p[17] === 'true' || p[17] === '1';
    const isSix = p[18] === 'true' || p[18] === '1';
    const isWicket = p[19] === 'true' || p[19] === '1';
    const dismissalType = p[21];
    const extType = p[23];
    const ext2 = parseInt(p[25], 10) || 0;

    const matchInfo = matches[matchId];
    const compId = matchInfo ? matchInfo.comp_id : null;
    const isKnockout = matchInfo ? matchInfo.knock_out : false;

    // Delivery runs & extras
    let ballTotalRuns = runs;
    let bowlerRunsConceded = runs;
    const isLegalBall = (extType !== 'wide' && extType !== 'Overstep');

    if (extType === 'wide') {
      ballTotalRuns += 1 + ext2;
      bowlerRunsConceded += 1 + ext2;
    } else if (extType === 'Overstep') {
      ballTotalRuns += 1 + ext2;
      bowlerRunsConceded += 1 + ext2;
    } else if (extType === 'byes' || extType === 'legbyes') {
      const extraR = (ext2 > 0 ? ext2 : (runs === 0 ? 1 : 0));
      ballTotalRuns += extraR;
      // byes and legbyes are not conceded by bowler
    }

    const isBowlerWicket = isWicket && BOWLER_DISMISSALS.has(dismissalType);

    // State tracking
    const stateKey = `${matchId}_${inn}`;
    if (!matchStates[stateKey]) {
      matchStates[stateKey] = { currentScore: 0, wicketsLost: 0, legalBalls: 0 };
    }
    const state = matchStates[stateKey];

    // Current state prior to this delivery
    const priorScore = state.currentScore;
    const priorWickets = state.wicketsLost;
    const priorLegalBalls = state.legalBalls;

    // Determine target and max balls
    const totalMaxBalls = (inn === '1' && matchInfo && matchInfo.first_inn_revised_overs)
      ? Math.round(matchInfo.first_inn_revised_overs * 6)
      : (inn === '2' && matchInfo && matchInfo.second_inn_revised_overs)
        ? Math.round(matchInfo.second_inn_revised_overs * 6)
        : 120;

    const ballsRemaining = Math.max(0, totalMaxBalls - priorLegalBalls);
    const wicketsInHand = Math.max(0, 10 - priorWickets);

    // Target for Innings 2
    let target = null;
    let runsRequired = null;
    let rrr = null;

    if (inn === '2') {
      if (matchInfo && matchInfo.revised_target) {
        target = matchInfo.revised_target;
      } else if (matchInnings1Totals[matchId]) {
        target = matchInnings1Totals[matchId] + 1;
      } else {
        // Fallback target if 1st inn not in dataset
        target = 160;
      }
      runsRequired = Math.max(0, target - priorScore);
      const oversRemaining = ballsRemaining / 6;
      rrr = oversRemaining > 0 ? runsRequired / oversRemaining : runsRequired * 6;
    }

    // CRR
    const crr = priorLegalBalls > 0 ? (priorScore / (priorLegalBalls / 6)) : 0;

    // --- Calculate Pressure Index (0.0 to 1.0) ---
    let pressureIndex = 0;

    if (inn === '2') {
      // INNINGS 2 PRESSURE
      // 1. RRR Component (normalized against benchmark 8.5)
      // Clamped between 0 and 1.5
      let rrrFactor = 0;
      if (rrr <= 6) {
        rrrFactor = 0.1;
      } else if (rrr <= 9) {
        rrrFactor = 0.2 + (rrr - 6) * 0.1; // 0.2 to 0.5
      } else if (rrr <= 14) {
        rrrFactor = 0.5 + (rrr - 9) * 0.07; // 0.5 to 0.85
      } else {
        rrrFactor = 0.85 + Math.min(0.15, (rrr - 14) * 0.02); // 0.85 to 1.0
      }

      // 2. Resource scarcity (wickets lost)
      const wicketFactor = priorWickets / 10; // 0 to 0.9

      // 3. Stage & Closeness (death overs urgency)
      let stageFactor = 0;
      if (ballsRemaining <= 24) { // Overs 17-20
        stageFactor = 0.35;
      } else if (ballsRemaining <= 48) { // Overs 13-16
        stageFactor = 0.20;
      } else {
        stageFactor = 0.05;
      }

      // If game is practically over (e.g. needing <= 10 runs with 7+ wickets, or needing 100 runs off 12 balls with 9 down),
      // adjust for dead rubber / anti-climax
      let closenessModifier = 1.0;
      if (runsRequired <= 12 && wicketsInHand >= 6) {
        closenessModifier = 0.4; // Cruise control
      } else if (rrr > 25 && wicketsInHand <= 2) {
        closenessModifier = 0.6; // Inevitable loss
      } else if (ballsRemaining <= 30 && runsRequired <= 45 && wicketsInHand >= 3) {
        closenessModifier = 1.25; // Nail-biter chase!
      }

      pressureIndex = (0.45 * rrrFactor + 0.30 * wicketFactor + 0.25 * stageFactor) * closenessModifier;
      
    } else {
      // INNINGS 1 PRESSURE
      // Setting a total
      // 1. Wicket pressure: losing wickets early
      const oversCompleted = priorLegalBalls / 6;
      let collapseFactor = 0;
      if (priorWickets >= 3 && oversCompleted < 6) {
        collapseFactor = 0.6; // Top-order collapse
      } else if (priorWickets >= 5 && oversCompleted < 12) {
        collapseFactor = 0.5;
      } else {
        collapseFactor = (priorWickets / 10) * 0.4;
      }

      // 2. Phase pressure: Death overs (overs 16-20)
      let phaseFactor = 0;
      if (overid >= 16) {
        // In death overs, if team has wickets (>= 4 wickets in hand), it's high acceleration pressure
        phaseFactor = 0.45 + (wicketsInHand >= 4 ? 0.15 : -0.1);
      } else if (overid <= 6) {
        // Powerplay
        phaseFactor = 0.15;
      } else {
        // Middle overs
        phaseFactor = 0.20;
      }

      // 3. Current run rate health
      let scoringHealthFactor = 0;
      if (oversCompleted >= 8 && crr < 7.0) {
        scoringHealthFactor = 0.2; // Stagnant scoring pressure
      }

      pressureIndex = 0.40 * collapseFactor + 0.45 * phaseFactor + 0.15 * scoringHealthFactor;
    }

    if (isKnockout) {
      pressureIndex *= 1.12;
    }

    // Clamp
    pressureIndex = Math.min(1.0, Math.max(0.0, pressureIndex));

    // Classification
    let pressureCat = 'Normal';
    if (pressureIndex >= 0.75) {
      pressureCat = 'Extreme';
      pressureCounts.Extreme++;
    } else if (pressureIndex >= 0.55) {
      pressureCat = 'High';
      pressureCounts.High++;
    } else if (pressureIndex >= 0.38) {
      pressureCat = 'Moderate';
      pressureCounts.Moderate++;
    } else {
      pressureCounts.Normal++;
    }

    const isHighOrExtreme = (pressureCat === 'High' || pressureCat === 'Extreme');

    // Record Batter Stats
    const b = getBatter(strikerId, strikerName);
    if (compId) b.comps.add(compId);

    if (isLegalBall) {
      if (isHighOrExtreme) {
        b.pressureBalls++;
        b.pressureRuns += runs;
        if (isFour) b.pressureFours++;
        if (isSix) b.pressureSixes++;
        b.pressureMatches.add(matchId);
        b.matchPressureRuns[matchId] = (b.matchPressureRuns[matchId] || 0) + runs;
      } else {
        b.normalBalls++;
        b.normalRuns += runs;
        if (isFour) b.normalFours++;
        if (isSix) b.normalSixes++;
        b.normalMatches.add(matchId);
      }

      if (pressureCat === 'Moderate') {
        b.moderateBalls++;
        b.moderateRuns += runs;
      } else if (pressureCat === 'High') {
        b.highBalls++;
        b.highRuns += runs;
      } else if (pressureCat === 'Extreme') {
        b.extremeBalls++;
        b.extremeRuns += runs;
      }
    }

    if (isWicket && p[22] === strikerId) {
      if (isHighOrExtreme) {
        b.pressureDismissals++;
      } else {
        b.normalDismissals++;
      }
    }

    // Record Bowler Stats
    const bw = getBowler(bowlerId, bowlerName);
    if (compId) bw.comps.add(compId);

    if (isHighOrExtreme) {
      if (isLegalBall) bw.pressureLegalBalls++;
      bw.pressureRunsConceded += bowlerRunsConceded;
      if (isBowlerWicket) {
        bw.pressureWickets++;
        bw.matchPressureWickets[matchId] = (bw.matchPressureWickets[matchId] || 0) + 1;
      }
      if (isLegalBall && bowlerRunsConceded === 0) bw.pressureDots++;
      bw.pressureMatches.add(matchId);
    } else {
      if (isLegalBall) bw.normalLegalBalls++;
      bw.normalRunsConceded += bowlerRunsConceded;
      if (isBowlerWicket) bw.normalWickets++;
      if (isLegalBall && bowlerRunsConceded === 0) bw.normalDots++;
      bw.normalMatches.add(matchId);
    }

    if (pressureCat === 'Moderate') {
      if (isLegalBall) bw.moderateLegalBalls++;
      bw.moderateRuns += bowlerRunsConceded;
      if (isBowlerWicket) bw.moderateWickets++;
    } else if (pressureCat === 'High') {
      if (isLegalBall) bw.highLegalBalls++;
      bw.highRuns += bowlerRunsConceded;
      if (isBowlerWicket) bw.highWickets++;
    } else if (pressureCat === 'Extreme') {
      if (isLegalBall) bw.extremeLegalBalls++;
      bw.extremeRuns += bowlerRunsConceded;
      if (isBowlerWicket) bw.extremeWickets++;
    }

    // Update state AFTER this delivery
    state.currentScore += ballTotalRuns;
    if (isWicket) state.wicketsLost++;
    if (isLegalBall) state.legalBalls++;
  }

  console.log(`\nProcessed ${processedDeliveries - 1} deliveries.`);
  console.log('Pressure delivery distribution:', pressureCounts);

  // --- Compute Batting Ratings & Leaderboards ---
  console.log('\n--- CALCULATING BATTING PRESSURE INDEX ---');
  // Qualification: minimum 75 pressure balls faced and at least 5 pressure matches
  const qualifiedBatters = Object.values(batterStats).filter(b => b.pressureBalls >= 60 && b.pressureMatches.size >= 5);
  console.log(`Qualified batters (pressure balls >= 60): ${qualifiedBatters.length}`);

  for (const b of qualifiedBatters) {
    const pressSR = (b.pressureRuns / b.pressureBalls) * 100;
    const normSR = b.normalBalls > 0 ? (b.normalRuns / b.normalBalls) * 100 : pressSR;
    const srDelta = pressSR - normSR;
    const boundaryPct = ((b.pressureFours + b.pressureSixes) / b.pressureBalls) * 100;
    const dismissalRate = b.pressureDismissals > 0 ? (b.pressureRuns / b.pressureDismissals) : b.pressureRuns;
    
    // Bayesian volume confidence adjustment (Laplace smoothing factor towards sample size)
    // Sample size weight: sqrt(min(pressureBalls, 300) / 300)
    const confidenceWeight = Math.sqrt(Math.min(b.pressureBalls, 300) / 300);

    // Consistency: variance of runs across pressure matches
    const matchRuns = Object.values(b.matchPressureRuns);
    const avgMatchRun = b.pressureRuns / (b.pressureMatches.size || 1);
    const variance = matchRuns.reduce((acc, r) => acc + Math.pow(r - avgMatchRun, 2), 0) / (matchRuns.length || 1);
    const consistencyScore = Math.max(20, Math.min(95, 100 - (Math.sqrt(variance) * 1.8)));

    // BPI (Batting Pressure Index) formula:
    // 1. Pressure Strike Rate relative to benchmark 135 (40%)
    // 2. Strike Rate delta/improvement relative to normal (25%)
    // 3. Pressure Average / Dismissal resistance (15%)
    // 4. Boundary rate under pressure (10%)
    // 5. Consistency score (10%)
    // Scaled by confidence weight
    const rawRating = (
      0.35 * Math.min(100, (pressSR / 165) * 100) +
      0.25 * Math.max(0, Math.min(100, 50 + srDelta * 1.5)) +
      0.20 * Math.min(100, (dismissalRate / 45) * 100) +
      0.10 * Math.min(100, (boundaryPct / 25) * 100) +
      0.10 * consistencyScore
    );

    b.pressSR = pressSR;
    b.normSR = normSR;
    b.srDelta = srDelta;
    b.boundaryPct = boundaryPct;
    b.dismissalRate = dismissalRate;
    b.consistencyScore = consistencyScore;
    b.rating = parseFloat((rawRating * (0.7 + 0.3 * confidenceWeight)).toFixed(1));
  }

  qualifiedBatters.sort((a, b) => b.rating - a.rating);

  console.log('\n================ TOP 15 BATTERS UNDER PRESSURE ================');
  qualifiedBatters.slice(0, 15).forEach((b, idx) => {
    console.log(
      `${(idx + 1).toString().padStart(2)}. ${b.name.padEnd(20)} | BPI: ${b.rating} | Press Runs: ${b.pressureRuns.toString().padStart(4)} (${b.pressureBalls}b, SR: ${b.pressSR.toFixed(1)}) | Norm SR: ${b.normSR.toFixed(1)} | Delta: ${(b.srDelta >= 0 ? '+' : '') + b.srDelta.toFixed(1)} | Matches: ${b.pressureMatches.size}`
    );
  });

  // --- Compute Bowling Ratings & Leaderboards ---
  console.log('\n--- CALCULATING BOWLING PRESSURE INDEX ---');
  // Qualification: minimum 60 legal pressure balls (10 overs) and at least 5 pressure matches
  const qualifiedBowlers = Object.values(bowlerStats).filter(bw => bw.pressureLegalBalls >= 60 && bw.pressureMatches.size >= 5);
  console.log(`Qualified bowlers (pressure balls >= 60): ${qualifiedBowlers.length}`);

  for (const bw of qualifiedBowlers) {
    const pressOvers = bw.pressureLegalBalls / 6;
    const pressEcon = bw.pressureRunsConceded / pressOvers;
    const normOvers = bw.normalLegalBalls / 6;
    const normEcon = normOvers > 0 ? bw.normalRunsConceded / normOvers : pressEcon;
    const econDelta = normEcon - pressEcon; // positive is good (economy improved under pressure)
    const dotPct = (bw.pressureDots / bw.pressureLegalBalls) * 100;
    const wicketSR = bw.pressureWickets > 0 ? (bw.pressureLegalBalls / bw.pressureWickets) : 999;
    const bowlingAvg = bw.pressureWickets > 0 ? (bw.pressureRunsConceded / bw.pressureWickets) : bw.pressureRunsConceded;

    const confidenceWeight = Math.sqrt(Math.min(bw.pressureLegalBalls, 300) / 300);

    // Consistency across matches
    const matchWickets = Object.values(bw.matchPressureWickets);
    const avgWkts = bw.pressureWickets / (bw.pressureMatches.size || 1);
    const variance = matchWickets.reduce((acc, w) => acc + Math.pow(w - avgWkts, 2), 0) / (matchWickets.length || 1);
    const consistencyScore = Math.max(25, Math.min(95, 100 - (Math.sqrt(variance) * 12)));

    // BPI-Bowl (Bowling Pressure Index) formula:
    // 1. Pressure Economy Rate suppression (benchmark 9.0 in pressure/death) (35%)
    // 2. Economy Improvement vs Normal (25%)
    // 3. Wicket taking strike rate under pressure (20%)
    // 4. Dot ball percentage under pressure (10%)
    // 5. Match-to-match consistency (10%)
    const rawRating = (
      0.35 * Math.max(0, Math.min(100, ((12.0 - pressEcon) / 5.0) * 100)) +
      0.25 * Math.max(0, Math.min(100, 50 + econDelta * 15)) +
      0.20 * Math.max(0, Math.min(100, ((30 - Math.min(30, wicketSR)) / 20) * 100)) +
      0.10 * Math.min(100, (dotPct / 45) * 100) +
      0.10 * consistencyScore
    );

    bw.pressEcon = pressEcon;
    bw.normEcon = normEcon;
    bw.econDelta = econDelta;
    bw.dotPct = dotPct;
    bw.wicketSR = wicketSR;
    bw.bowlingAvg = bowlingAvg;
    bw.consistencyScore = consistencyScore;
    bw.rating = parseFloat((rawRating * (0.7 + 0.3 * confidenceWeight)).toFixed(1));
  }

  qualifiedBowlers.sort((a, b) => b.rating - a.rating);

  console.log('\n================ TOP 15 BOWLERS UNDER PRESSURE ================');
  qualifiedBowlers.slice(0, 15).forEach((bw, idx) => {
    console.log(
      `${(idx + 1).toString().padStart(2)}. ${bw.name.padEnd(20)} | BPI: ${bw.rating} | Press Wkts: ${bw.pressureWickets.toString().padStart(2)} | Econ: ${bw.pressEcon.toFixed(2)} (Norm: ${bw.normEcon.toFixed(2)}) | Imp: ${(bw.econDelta >= 0 ? '+' : '') + bw.econDelta.toFixed(2)} | Dots: ${bw.dotPct.toFixed(1)}% | Overs: ${(bw.pressureLegalBalls / 6).toFixed(1)}`
    );
  });
}

runPipeline().catch(console.error);

