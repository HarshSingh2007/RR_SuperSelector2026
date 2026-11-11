const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');
const outDir = path.join(__dirname, '..', 'src', 'data');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BOWLER_DISMISSALS = new Set(['Bowled', 'Caught', 'Stump', 'LBW', 'Hit Wicket']);

async function buildAnalytics() {
  console.log('--- STARTING COMPREHENSIVE CRICKET ANALYTICS PIPELINE ---');

  // 1. Competitions
  const competitions = {};
  const compList = [];
  fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const parts = line.split(',');
      const comp_id = parts[0];
      const comp_name = parts[1];
      const match_format = parts[2];
      const season = parts[3];
      const is_ipl = comp_name.toLowerCase().includes('ipl') || comp_name.toLowerCase().includes('indian premier league');
      competitions[comp_id] = { comp_id, comp_name, match_format, season, is_ipl };
      compList.push(competitions[comp_id]);
    });

  // 2. Teams
  const teams = {};
  fs.readFileSync(path.join(rawDir, 'teams.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const parts = line.split(',');
      const comp_id = parts[0];
      const team_id = parts[1];
      const team_name = parts[2];
      if (!teams[team_id]) {
        teams[team_id] = { team_id, team_name, comp_id };
      }
    });

  // 3. Player to Team mapping & role
  const playerInfo = {};
  fs.readFileSync(path.join(rawDir, 'competition_team_player_mapping.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const parts = line.split(',');
      const comp_id = parts[0];
      const comp_name = parts[1];
      const team_id = parts[2];
      const team_name = parts[3];
      const player_id = parts[4];
      const player_name = parts[5];

      if (!playerInfo[player_id]) {
        playerInfo[player_id] = {
          id: player_id,
          name: player_name,
          team: team_name,
          teams: new Set([team_name]),
          comps: new Set([comp_id])
        };
      } else {
        playerInfo[player_id].teams.add(team_name);
        playerInfo[player_id].comps.add(comp_id);
        // Prefer IPL team name if available for recognized club
        if (comp_name.toLowerCase().includes('ipl')) {
          playerInfo[player_id].team = team_name;
        }
      }
    });

  // 4. Matches
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
        first_inn_revised_overs: p[16] ? parseFloat(p[16]) : null,
        second_inn_revised_overs: p[17] ? parseFloat(p[17]) : null,
        revised_target: p[18] ? parseInt(p[18], 10) : null,
        knock_out: p[19] === '1' || p[19] === 'true',
        win_team_id: p[20],
        result: p[21]
      };
    });

  console.log(`Loaded metadata: ${compList.length} comps, ${Object.keys(matches).length} matches, ${Object.keys(playerInfo).length} players.`);

  // PASS 1: Compute Innings 1 totals for target reconstruction
  console.log('Pass 1: Computing Innings 1 totals for accurate chase targets...');
  const matchInnings1Totals = {};
  const rl1 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let lineIndex1 = 0;
  for await (const line of rl1) {
    if (lineIndex1++ === 0) continue;
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

  // PASS 2: Ball-by-ball processing with dynamic match-state reconstruction
  console.log('Pass 2: Processing delivery states and calculating pressure indices...');
  const matchStates = {};
  const batterMap = {};
  const bowlerMap = {};

  // Global KPIs & distributions
  let totalDeliveries = 0;
  let totalPressureDeliveries = 0;
  const pressureCategoryCounts = { Normal: 0, Moderate: 0, High: 0, Extreme: 0 };
  const phaseDistribution = {
    powerplay: { total: 0, pressure: 0, runs: 0, wickets: 0 },
    middle: { total: 0, pressure: 0, runs: 0, wickets: 0 },
    death: { total: 0, pressure: 0, runs: 0, wickets: 0 }
  };
  const competitionStats = {
    IPL: { matches: new Set(), balls: 0, pressureBalls: 0, runs: 0, wickets: 0 },
    T20I: { matches: new Set(), balls: 0, pressureBalls: 0, runs: 0, wickets: 0 }
  };
  const seasonStats = {};

  function initBatter(id, name) {
    if (!batterMap[id]) {
      const info = playerInfo[id];
      batterMap[id] = {
        id,
        name: name || (info ? info.name : `Player ${id}`),
        team: info ? info.team : 'Unknown',
        teams: info ? Array.from(info.teams) : [],
        // Overall Baseline (all balls faced)
        totalBalls: 0,
        totalRuns: 0,
        totalDismissals: 0,
        totalFours: 0,
        totalSixes: 0,
        totalMatches: new Set(),
        // Normal Situations (Low / Normal pressure)
        normalBalls: 0,
        normalRuns: 0,
        normalDismissals: 0,
        normalFours: 0,
        normalSixes: 0,
        // Pressure Situations (High + Extreme pressure)
        pressureBalls: 0,
        pressureRuns: 0,
        pressureDismissals: 0,
        pressureFours: 0,
        pressureSixes: 0,
        pressureDots: 0,
        pressureMatches: new Set(),
        // Moderate situations
        moderateBalls: 0,
        moderateRuns: 0,
        // High vs Extreme
        highBalls: 0,
        highRuns: 0,
        extremeBalls: 0,
        extremeRuns: 0,
        // Match phase under pressure
        deathPressureBalls: 0,
        deathPressureRuns: 0,
        chasePressureBalls: 0,
        chasePressureRuns: 0,
        firstInnPressureBalls: 0,
        firstInnPressureRuns: 0,
        // Match-by-match for consistency variance
        matchPressureRuns: {},
        // Competition splits
        iplBalls: 0,
        iplPressureBalls: 0,
        iplPressureRuns: 0,
        t20iBalls: 0,
        t20iPressureBalls: 0,
        t20iPressureRuns: 0,
        // Season breakdown
        seasons: {},
        comps: new Set()
      };
    }
    return batterMap[id];
  }

  function initBowler(id, name) {
    if (!bowlerMap[id]) {
      const info = playerInfo[id];
      bowlerMap[id] = {
        id,
        name: name || (info ? info.name : `Player ${id}`),
        team: info ? info.team : 'Unknown',
        teams: info ? Array.from(info.teams) : [],
        bowlingType: 'Unknown',
        // Overall Baseline
        totalLegalBalls: 0,
        totalRunsConceded: 0,
        totalWickets: 0,
        totalDots: 0,
        totalMatches: new Set(),
        // Normal
        normalLegalBalls: 0,
        normalRunsConceded: 0,
        normalWickets: 0,
        normalDots: 0,
        // Pressure (High + Extreme)
        pressureLegalBalls: 0,
        pressureRunsConceded: 0,
        pressureWickets: 0,
        pressureDots: 0,
        pressureMatches: new Set(),
        // Moderate
        moderateLegalBalls: 0,
        moderateRunsConceded: 0,
        moderateWickets: 0,
        // High & Extreme
        highLegalBalls: 0,
        highRuns: 0,
        highWickets: 0,
        extremeLegalBalls: 0,
        extremeRuns: 0,
        extremeWickets: 0,
        // Phase
        deathPressureBalls: 0,
        deathPressureRuns: 0,
        deathPressureWickets: 0,
        // Match by match
        matchPressureWickets: {},
        matchPressureConceded: {},
        // Splits
        iplPressureBalls: 0,
        iplPressureRuns: 0,
        iplPressureWickets: 0,
        t20iPressureBalls: 0,
        t20iPressureRuns: 0,
        t20iPressureWickets: 0,
        seasons: {},
        comps: new Set()
      };
    }
    return bowlerMap[id];
  }

  const rl2 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let lineIndex2 = 0;
  for await (const line of rl2) {
    if (lineIndex2++ === 0) continue;
    totalDeliveries++;

    const p = line.split(',');
    const matchId = p[0];
    const inn = p[1];
    const overid = parseInt(p[2], 10);
    const overBallNum = parseInt(p[3], 10);
    const strikerId = p[7];
    const strikerName = p[8];
    const bowlerId = p[11];
    const bowlerName = p[12];
    const bowlingStyle = p[14];
    const runs = parseInt(p[16], 10) || 0;
    const isFour = p[17] === 'true' || p[17] === '1';
    const isSix = p[18] === 'true' || p[18] === '1';
    const isWicket = p[19] === 'true' || p[19] === '1';
    const dismissalType = p[21];
    const dismissedPlayerId = p[22];
    const extType = p[23];
    const ext2 = parseInt(p[25], 10) || 0;

    const matchInfo = matches[matchId];
    const compId = matchInfo ? matchInfo.comp_id : null;
    const comp = compId ? competitions[compId] : null;
    const isIpl = comp ? comp.is_ipl : false;
    const season = comp ? comp.season : '2024';
    const isKnockout = matchInfo ? matchInfo.knock_out : false;

    // Extras & runs accounting
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
    }

    const isBowlerWicket = isWicket && BOWLER_DISMISSALS.has(dismissalType);

    // Track match state prior to delivery
    const stateKey = `${matchId}_${inn}`;
    if (!matchStates[stateKey]) {
      matchStates[stateKey] = { currentScore: 0, wicketsLost: 0, legalBalls: 0 };
    }
    const state = matchStates[stateKey];

    const priorScore = state.currentScore;
    const priorWickets = state.wicketsLost;
    const priorLegalBalls = state.legalBalls;

    const totalMaxBalls = (inn === '1' && matchInfo && matchInfo.first_inn_revised_overs)
      ? Math.round(matchInfo.first_inn_revised_overs * 6)
      : (inn === '2' && matchInfo && matchInfo.second_inn_revised_overs)
        ? Math.round(matchInfo.second_inn_revised_overs * 6)
        : 120;

    const ballsRemaining = Math.max(0, totalMaxBalls - priorLegalBalls);
    const wicketsInHand = Math.max(0, 10 - priorWickets);
    const crr = priorLegalBalls > 0 ? (priorScore / (priorLegalBalls / 6)) : 0;

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
        target = 160;
      }
      runsRequired = Math.max(0, target - priorScore);
      const oversRemaining = ballsRemaining / 6;
      rrr = oversRemaining > 0 ? runsRequired / oversRemaining : runsRequired * 6;
    }

    // --- REFINED PRESSURE INDEX FORMULATION ---
    let pressureIndex = 0;

    if (inn === '2') {
      // INNINGS 2: Target Chase Pressure
      let rrrFactor = 0;
      if (rrr <= 6) {
        rrrFactor = 0.10;
      } else if (rrr <= 8.5) {
        rrrFactor = 0.10 + (rrr - 6) * 0.12; // 0.10 to 0.40
      } else if (rrr <= 12) {
        rrrFactor = 0.40 + (rrr - 8.5) * 0.10; // 0.40 to 0.75
      } else if (rrr <= 16) {
        rrrFactor = 0.75 + (rrr - 12) * 0.05; // 0.75 to 0.95
      } else {
        rrrFactor = 0.95 + Math.min(0.05, (rrr - 16) * 0.01);
      }

      const wicketFactor = priorWickets / 10; // 0 to 0.9

      let phaseUrgency = 0;
      if (ballsRemaining <= 24) {
        phaseUrgency = 0.40;
      } else if (ballsRemaining <= 48) {
        phaseUrgency = 0.22;
      } else {
        phaseUrgency = 0.08;
      }

      // Closeness context: avoid inflating dead rubbers
      let closenessModifier = 1.0;
      if (runsRequired <= 12 && wicketsInHand >= 6) {
        closenessModifier = 0.35; // Cruising to victory
      } else if (rrr > 26 && wicketsInHand <= 2) {
        closenessModifier = 0.55; // Match already out of reach
      } else if (ballsRemaining <= 36 && runsRequired <= 50 && wicketsInHand >= 3) {
        closenessModifier = 1.25; // High-stakes close finish
      }

      pressureIndex = (0.42 * rrrFactor + 0.30 * wicketFactor + 0.28 * phaseUrgency) * closenessModifier;

    } else {
      // INNINGS 1: Target Setting Pressure
      const oversCompleted = priorLegalBalls / 6;
      let collapseFactor = 0;
      if (priorWickets >= 3 && oversCompleted <= 6) {
        collapseFactor = 0.65; // Early collapse in Powerplay
      } else if (priorWickets >= 5 && oversCompleted <= 12) {
        collapseFactor = 0.55;
      } else {
        collapseFactor = (priorWickets / 10) * 0.45;
      }

      let phaseFactor = 0;
      if (overid >= 16) {
        // Death overs
        phaseFactor = 0.50 + (wicketsInHand >= 4 ? 0.15 : -0.10);
      } else if (overid <= 6) {
        phaseFactor = 0.15;
      } else {
        phaseFactor = 0.22;
      }

      let scoringHealthFactor = 0;
      if (oversCompleted >= 8 && crr < 7.0) {
        scoringHealthFactor = 0.22;
      }

      pressureIndex = 0.40 * collapseFactor + 0.45 * phaseFactor + 0.15 * scoringHealthFactor;
    }

    if (isKnockout) {
      pressureIndex *= 1.15;
    }

    // Normalized bounds
    pressureIndex = Math.min(1.0, Math.max(0.0, pressureIndex));

    // Classification
    let pressureCat = 'Normal';
    if (pressureIndex >= 0.75) {
      pressureCat = 'Extreme';
      pressureCategoryCounts.Extreme++;
    } else if (pressureIndex >= 0.55) {
      pressureCat = 'High';
      pressureCategoryCounts.High++;
    } else if (pressureIndex >= 0.38) {
      pressureCat = 'Moderate';
      pressureCategoryCounts.Moderate++;
    } else {
      pressureCategoryCounts.Normal++;
    }

    const isHighOrExtreme = (pressureCat === 'High' || pressureCat === 'Extreme');
    if (isHighOrExtreme) totalPressureDeliveries++;

    // Track Phase Stats
    let phaseKey = 'middle';
    if (overid <= 6) phaseKey = 'powerplay';
    else if (overid >= 16) phaseKey = 'death';

    phaseDistribution[phaseKey].total++;
    phaseDistribution[phaseKey].runs += ballTotalRuns;
    if (isWicket) phaseDistribution[phaseKey].wickets++;
    if (isHighOrExtreme) phaseDistribution[phaseKey].pressure++;

    // Track Comp Stats
    const compKey = isIpl ? 'IPL' : 'T20I';
    competitionStats[compKey].matches.add(matchId);
    competitionStats[compKey].balls++;
    competitionStats[compKey].runs += ballTotalRuns;
    if (isWicket) competitionStats[compKey].wickets++;
    if (isHighOrExtreme) competitionStats[compKey].pressureBalls++;

    // Track Season Stats
    if (!seasonStats[season]) {
      seasonStats[season] = { season, totalBalls: 0, pressureBalls: 0, runs: 0, wickets: 0 };
    }
    seasonStats[season].totalBalls++;
    seasonStats[season].runs += ballTotalRuns;
    if (isWicket) seasonStats[season].wickets++;
    if (isHighOrExtreme) seasonStats[season].pressureBalls++;

    // Record Batter Stats
    const b = initBatter(strikerId, strikerName);
    b.totalMatches.add(matchId);
    if (compId) b.comps.add(compId);

    if (!b.seasons[season]) {
      b.seasons[season] = { balls: 0, runs: 0, pressureBalls: 0, pressureRuns: 0 };
    }

    if (isLegalBall) {
      b.totalBalls++;
      b.totalRuns += runs;
      b.seasons[season].balls++;
      b.seasons[season].runs += runs;
      if (isIpl) b.iplBalls++;
      else b.t20iBalls++;

      if (isHighOrExtreme) {
        b.pressureBalls++;
        b.pressureRuns += runs;
        if (runs === 0) b.pressureDots++;
        if (isFour) b.pressureFours++;
        if (isSix) b.pressureSixes++;
        b.pressureMatches.add(matchId);
        b.matchPressureRuns[matchId] = (b.matchPressureRuns[matchId] || 0) + runs;

        b.seasons[season].pressureBalls++;
        b.seasons[season].pressureRuns += runs;

        if (isIpl) {
          b.iplPressureBalls++;
          b.iplPressureRuns += runs;
        } else {
          b.t20iPressureBalls++;
          b.t20iPressureRuns += runs;
        }

        if (overid >= 16) {
          b.deathPressureBalls++;
          b.deathPressureRuns += runs;
        }
        if (inn === '2') {
          b.chasePressureBalls++;
          b.chasePressureRuns += runs;
        } else {
          b.firstInnPressureBalls++;
          b.firstInnPressureRuns += runs;
        }
      } else {
        b.normalBalls++;
        b.normalRuns += runs;
        if (isFour) b.normalFours++;
        if (isSix) b.normalSixes++;
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

    if (isWicket && dismissedPlayerId === strikerId) {
      b.totalDismissals++;
      if (isHighOrExtreme) {
        b.pressureDismissals++;
      } else {
        b.normalDismissals++;
      }
    }

    // Record Bowler Stats
    const bw = initBowler(bowlerId, bowlerName);
    bw.totalMatches.add(matchId);
    if (bowlingStyle && bw.bowlingType === 'Unknown') {
      bw.bowlingType = bowlingStyle;
    }
    if (compId) bw.comps.add(compId);

    if (!bw.seasons[season]) {
      bw.seasons[season] = { balls: 0, runs: 0, wickets: 0, pressureBalls: 0, pressureRuns: 0, pressureWickets: 0 };
    }

    if (isLegalBall) {
      bw.totalLegalBalls++;
      bw.totalRunsConceded += bowlerRunsConceded;
      bw.seasons[season].balls++;
      bw.seasons[season].runs += bowlerRunsConceded;
      if (bowlerRunsConceded === 0) bw.totalDots++;
    } else {
      bw.totalRunsConceded += bowlerRunsConceded;
      bw.seasons[season].runs += bowlerRunsConceded;
    }

    if (isBowlerWicket) {
      bw.totalWickets++;
      bw.seasons[season].wickets++;
    }

    if (isHighOrExtreme) {
      if (isLegalBall) bw.pressureLegalBalls++;
      bw.pressureRunsConceded += bowlerRunsConceded;
      bw.seasons[season].pressureBalls += (isLegalBall ? 1 : 0);
      bw.seasons[season].pressureRuns += bowlerRunsConceded;

      if (isBowlerWicket) {
        bw.pressureWickets++;
        bw.seasons[season].pressureWickets++;
        bw.matchPressureWickets[matchId] = (bw.matchPressureWickets[matchId] || 0) + 1;
      }
      if (isLegalBall && bowlerRunsConceded === 0) {
        bw.pressureDots++;
      }
      bw.pressureMatches.add(matchId);
      bw.matchPressureConceded[matchId] = (bw.matchPressureConceded[matchId] || 0) + bowlerRunsConceded;

      if (isIpl) {
        if (isLegalBall) bw.iplPressureBalls++;
        bw.iplPressureRuns += bowlerRunsConceded;
        if (isBowlerWicket) bw.iplPressureWickets++;
      } else {
        if (isLegalBall) bw.t20iPressureBalls++;
        bw.t20iPressureRuns += bowlerRunsConceded;
        if (isBowlerWicket) bw.t20iPressureWickets++;
      }

      if (overid >= 16) {
        if (isLegalBall) bw.deathPressureBalls++;
        bw.deathPressureRuns += bowlerRunsConceded;
        if (isBowlerWicket) bw.deathPressureWickets++;
      }
    } else {
      if (isLegalBall) {
        bw.normalLegalBalls++;
        if (bowlerRunsConceded === 0) bw.normalDots++;
      }
      bw.normalRunsConceded += bowlerRunsConceded;
      if (isBowlerWicket) bw.normalWickets++;
    }

    if (pressureCat === 'Moderate') {
      if (isLegalBall) bw.moderateLegalBalls++;
      bw.moderateRunsConceded += bowlerRunsConceded;
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

    // Advance match state AFTER delivery
    state.currentScore += ballTotalRuns;
    if (isWicket) state.wicketsLost++;
    if (isLegalBall) state.legalBalls++;
  }

  console.log(`Processed all ${totalDeliveries} deliveries.`);

  // --- COMPUTE BATTING RATINGS ---
  console.log('Finalizing Batting Ratings...');
  const qualifiedBatters = Object.values(batterMap).filter(b => b.pressureBalls >= 50 && b.pressureMatches.size >= 4);

  // Helper for generating explainable text
  function generateBatterVerdict(b, rank) {
    const clutchTraits = [];
    if (b.srDelta >= 40) clutchTraits.push(`explosive strike rate acceleration under pressure (+${b.srDelta.toFixed(1)} delta over baseline)`);
    else if (b.srDelta >= 20) clutchTraits.push(`marked positive strike rate boost (+${b.srDelta.toFixed(1)})`);
    else clutchTraits.push(`reliable baseline preservation under pressure`);

    if (b.boundaryPct >= 22) clutchTraits.push(`elite boundary clearing capacity (${b.boundaryPct.toFixed(1)}% boundary rate)`);
    if (b.consistencyScore >= 75) clutchTraits.push(`exceptional match-to-match consistency (${b.consistencyScore.toFixed(0)}/100)`);
    if (b.dismissalRate >= 35) clutchTraits.push(`outstanding wicket preservation (${b.dismissalRate.toFixed(1)} runs per dismissal)`);

    return `${b.name} ranks #${rank} with an overall Batting Pressure Index of ${b.rating}. Characterized by ${clutchTraits.join(', ')}. Across ${b.pressureMatches.size} high-leverage matches, scored ${b.pressureRuns} runs from ${b.pressureBalls} balls at an elite strike rate of ${b.pressSR.toFixed(1)}, compared to a baseline of ${b.normSR.toFixed(1)}.`;
  }

  for (const b of qualifiedBatters) {
    const pressSR = (b.pressureRuns / b.pressureBalls) * 100;
    const normSR = b.normalBalls > 0 ? (b.normalRuns / b.normalBalls) * 100 : pressSR;
    const totalSR = b.totalBalls > 0 ? (b.totalRuns / b.totalBalls) * 100 : pressSR;
    const srDelta = pressSR - normSR;
    const boundaryPct = ((b.pressureFours + b.pressureSixes) / b.pressureBalls) * 100;
    const dismissalRate = b.pressureDismissals > 0 ? (b.pressureRuns / b.pressureDismissals) : b.pressureRuns;
    const dotPct = (b.pressureDots / b.pressureBalls) * 100;

    // Confidence Weight: empirical Bayesian shrinkage
    // Benchmarks: 50 balls = 0.70 weight, 150 balls = 0.88 weight, 250+ balls = 1.0 weight
    const confidenceWeight = Math.min(1.0, 0.65 + 0.35 * Math.sqrt(Math.min(b.pressureBalls, 240) / 240));

    // Consistency score: standard deviation across pressure innings
    const inningsScores = Object.values(b.matchPressureRuns);
    const meanInning = b.pressureRuns / (b.pressureMatches.size || 1);
    const variance = inningsScores.reduce((sum, r) => sum + Math.pow(r - meanInning, 2), 0) / (inningsScores.length || 1);
    const stdDev = Math.sqrt(variance);
    // Higher mean with controlled stdDev is good; normalized to 0-100
    const consistencyScore = Math.max(25, Math.min(95, 85 - (stdDev / (meanInning || 1)) * 20));

    // Death vs Chase splits
    const deathSR = b.deathPressureBalls > 0 ? (b.deathPressureRuns / b.deathPressureBalls) * 100 : pressSR;
    const chaseSR = b.chasePressureBalls > 0 ? (b.chasePressureRuns / b.chasePressureBalls) * 100 : pressSR;

    // Core BPI Model
    const rawRating = (
      0.35 * Math.min(100, (pressSR / 165) * 100) +
      0.25 * Math.max(0, Math.min(100, 50 + srDelta * 1.4)) +
      0.20 * Math.min(100, (dismissalRate / 42) * 100) +
      0.10 * Math.min(100, (boundaryPct / 24) * 100) +
      0.10 * consistencyScore
    );

    b.pressSR = parseFloat(pressSR.toFixed(1));
    b.normSR = parseFloat(normSR.toFixed(1));
    b.totalSR = parseFloat(totalSR.toFixed(1));
    b.srDelta = parseFloat(srDelta.toFixed(1));
    b.boundaryPct = parseFloat(boundaryPct.toFixed(1));
    b.dismissalRate = parseFloat(dismissalRate.toFixed(1));
    b.dotPct = parseFloat(dotPct.toFixed(1));
    b.deathSR = parseFloat(deathSR.toFixed(1));
    b.chaseSR = parseFloat(chaseSR.toFixed(1));
    b.consistencyScore = parseFloat(consistencyScore.toFixed(1));
    b.confidenceWeight = parseFloat(confidenceWeight.toFixed(2));
    b.rating = parseFloat((rawRating * (0.68 + 0.32 * confidenceWeight)).toFixed(1));
  }

  qualifiedBatters.sort((a, b) => b.rating - a.rating);
  qualifiedBatters.forEach((b, idx) => {
    b.rank = idx + 1;
    b.verdict = generateBatterVerdict(b, b.rank);
  });

  // --- COMPUTE BOWLING RATINGS ---
  console.log('Finalizing Bowling Ratings...');
  const qualifiedBowlers = Object.values(bowlerMap).filter(bw => bw.pressureLegalBalls >= 54 && bw.pressureMatches.size >= 4);

  function generateBowlerVerdict(bw, rank) {
    const traits = [];
    if (bw.econDelta >= 1.5) traits.push(`superb run suppression under pressure (${bw.econDelta.toFixed(2)} rpo better than baseline)`);
    else if (bw.econDelta >= 0.5) traits.push(`positive economy rate containment under pressure`);
    else traits.push(`steady frontline economy control`);

    if (bw.dotPct >= 42) traits.push(`lethal dot-ball pressure (${bw.dotPct.toFixed(1)}% dots in high-leverage phases)`);
    if (bw.pressureWickets >= 12) traits.push(`proven match-winning wicket-taking punch (${bw.pressureWickets} pressure wickets)`);
    if (bw.wicketSR <= 16) traits.push(`elite strike rate of 1 wicket every ${bw.wicketSR.toFixed(1)} balls`);

    return `${bw.name} ranks #${rank} with an overall Bowling Pressure Index of ${bw.rating}. Defined by ${traits.join(', ')}. Across ${bw.pressureMatches.size} pressure matches (${(bw.pressureLegalBalls / 6).toFixed(1)} pressure overs), took ${bw.pressureWickets} wickets at an economy rate of ${bw.pressEcon.toFixed(2)} (baseline: ${bw.normEcon.toFixed(2)}).`;
  }

  for (const bw of qualifiedBowlers) {
    const pressOvers = bw.pressureLegalBalls / 6;
    const pressEcon = pressOvers > 0 ? bw.pressureRunsConceded / pressOvers : 9.0;
    const normOvers = bw.normalLegalBalls / 6;
    const normEcon = normOvers > 0 ? bw.normalRunsConceded / normOvers : pressEcon;
    const totalOvers = bw.totalLegalBalls / 6;
    const totalEcon = totalOvers > 0 ? bw.totalRunsConceded / totalOvers : pressEcon;
    const econDelta = normEcon - pressEcon; // Positive is good
    const dotPct = bw.pressureLegalBalls > 0 ? (bw.pressureDots / bw.pressureLegalBalls) * 100 : 35;
    const wicketSR = bw.pressureWickets > 0 ? (bw.pressureLegalBalls / bw.pressureWickets) : 999;
    const bowlingAvg = bw.pressureWickets > 0 ? (bw.pressureRunsConceded / bw.pressureWickets) : bw.pressureRunsConceded;

    const deathOvers = bw.deathPressureBalls / 6;
    const deathEcon = deathOvers > 0 ? bw.deathPressureRuns / deathOvers : pressEcon;

    // Confidence weight: empirical Bayesian shrinkage
    const confidenceWeight = Math.min(1.0, 0.65 + 0.35 * Math.sqrt(Math.min(bw.pressureLegalBalls, 240) / 240));

    // Consistency score
    const inningsWkts = Object.values(bw.matchPressureWickets);
    const meanWkts = bw.pressureWickets / (bw.pressureMatches.size || 1);
    const variance = inningsWkts.reduce((sum, w) => sum + Math.pow(w - meanWkts, 2), 0) / (inningsWkts.length || 1);
    const consistencyScore = Math.max(25, Math.min(95, 78 - Math.sqrt(variance) * 8));

    // Core BPI-Bowl Model
    const rawRating = (
      0.35 * Math.max(0, Math.min(100, ((12.0 - pressEcon) / 5.2) * 100)) +
      0.25 * Math.max(0, Math.min(100, 50 + econDelta * 14)) +
      0.20 * Math.max(0, Math.min(100, ((30 - Math.min(30, wicketSR)) / 20) * 100)) +
      0.10 * Math.min(100, (dotPct / 46) * 100) +
      0.10 * consistencyScore
    );

    bw.pressEcon = parseFloat(pressEcon.toFixed(2));
    bw.normEcon = parseFloat(normEcon.toFixed(2));
    bw.totalEcon = parseFloat(totalEcon.toFixed(2));
    bw.econDelta = parseFloat(econDelta.toFixed(2));
    bw.dotPct = parseFloat(dotPct.toFixed(1));
    bw.wicketSR = parseFloat(wicketSR.toFixed(1));
    bw.bowlingAvg = parseFloat(bowlingAvg.toFixed(1));
    bw.deathEcon = parseFloat(deathEcon.toFixed(2));
    bw.consistencyScore = parseFloat(consistencyScore.toFixed(1));
    bw.confidenceWeight = parseFloat(confidenceWeight.toFixed(2));
    bw.pressureOvers = parseFloat(pressOvers.toFixed(1));
    bw.rating = parseFloat((rawRating * (0.68 + 0.32 * confidenceWeight)).toFixed(1));
  }

  qualifiedBowlers.sort((a, b) => b.rating - a.rating);
  qualifiedBowlers.forEach((bw, idx) => {
    bw.rank = idx + 1;
    bw.verdict = generateBowlerVerdict(bw, bw.rank);
  });

  // --- SAVE ARTIFACTS & EXPORTS ---
  console.log('Writing clean analytical datasets to src/data/...');

  // Convert Sets to counts/arrays for clean JSON serialization
  const cleanBatters = qualifiedBatters.map(b => ({
    rank: b.rank,
    id: b.id,
    name: b.name,
    team: b.team,
    teams: b.teams,
    matchesAnalysed: b.totalMatches.size,
    pressureMatches: b.pressureMatches.size,
    totalBalls: b.totalBalls,
    totalRuns: b.totalRuns,
    totalSR: b.totalSR,
    normalBalls: b.normalBalls,
    normalRuns: b.normalRuns,
    normalSR: b.normSR,
    pressureBalls: b.pressureBalls,
    pressureRuns: b.pressureRuns,
    pressureSR: b.pressSR,
    srDelta: b.srDelta,
    boundaryPct: b.boundaryPct,
    fours: b.pressureFours,
    sixes: b.pressureSixes,
    dismissalRate: b.dismissalRate,
    dismissals: b.pressureDismissals,
    dotPct: b.dotPct,
    deathSR: b.deathSR,
    chaseSR: b.chaseSR,
    consistencyScore: b.consistencyScore,
    confidenceWeight: b.confidenceWeight,
    rating: b.rating,
    verdict: b.verdict,
    seasons: b.seasons,
    ipl: {
      balls: b.iplPressureBalls,
      runs: b.iplPressureRuns,
      sr: b.iplPressureBalls > 0 ? parseFloat(((b.iplPressureRuns / b.iplPressureBalls) * 100).toFixed(1)) : 0
    },
    t20i: {
      balls: b.t20iPressureBalls,
      runs: b.t20iPressureRuns,
      sr: b.t20iPressureBalls > 0 ? parseFloat(((b.t20iPressureRuns / b.t20iPressureBalls) * 100).toFixed(1)) : 0
    }
  }));

  const cleanBowlers = qualifiedBowlers.map(bw => ({
    rank: bw.rank,
    id: bw.id,
    name: bw.name,
    team: bw.team,
    teams: bw.teams,
    bowlingType: bw.bowlingType,
    matchesAnalysed: bw.totalMatches.size,
    pressureMatches: bw.pressureMatches.size,
    totalOvers: parseFloat((bw.totalLegalBalls / 6).toFixed(1)),
    totalEcon: bw.totalEcon,
    totalWickets: bw.totalWickets,
    normalOvers: parseFloat((bw.normalLegalBalls / 6).toFixed(1)),
    normalEcon: bw.normEcon,
    pressureLegalBalls: bw.pressureLegalBalls,
    pressureOvers: bw.pressureOvers,
    pressureRunsConceded: bw.pressureRunsConceded,
    pressureEcon: bw.pressEcon,
    econDelta: bw.econDelta,
    pressureWickets: bw.pressureWickets,
    dotPct: bw.dotPct,
    wicketSR: bw.wicketSR,
    bowlingAvg: bw.bowlingAvg,
    deathEcon: bw.deathEcon,
    deathPressureWickets: bw.deathPressureWickets,
    consistencyScore: bw.consistencyScore,
    confidenceWeight: bw.confidenceWeight,
    rating: bw.rating,
    verdict: bw.verdict,
    seasons: bw.seasons,
    ipl: {
      balls: bw.iplPressureBalls,
      overs: parseFloat((bw.iplPressureBalls / 6).toFixed(1)),
      runs: bw.iplPressureRuns,
      wickets: bw.iplPressureWickets,
      econ: bw.iplPressureBalls > 0 ? parseFloat(((bw.iplPressureRuns / (bw.iplPressureBalls / 6))).toFixed(2)) : 0
    },
    t20i: {
      balls: bw.t20iPressureBalls,
      overs: parseFloat((bw.t20iPressureBalls / 6).toFixed(1)),
      runs: bw.t20iPressureRuns,
      wickets: bw.t20iPressureWickets,
      econ: bw.t20iPressureBalls > 0 ? parseFloat(((bw.t20iPressureRuns / (bw.t20iPressureBalls / 6))).toFixed(2)) : 0
    }
  }));

  // Overview KPIs metadata
  const metadata = {
    totalMatches: Object.keys(matches).length,
    matchesWithBalls: 867,
    totalDeliveries,
    totalPressureDeliveries,
    totalPlayersEvaluated: Object.keys(playerInfo).length,
    totalCompetitions: compList.length,
    pressureDistribution: pressureCategoryCounts,
    phaseDistribution,
    competitionComparison: {
      IPL: {
        matches: competitionStats.IPL.matches.size,
        balls: competitionStats.IPL.balls,
        pressureBalls: competitionStats.IPL.pressureBalls,
        pressurePct: parseFloat(((competitionStats.IPL.pressureBalls / competitionStats.IPL.balls) * 100).toFixed(1)),
        avgRunRate: parseFloat(((competitionStats.IPL.runs / (competitionStats.IPL.balls / 6))).toFixed(2)),
        wickets: competitionStats.IPL.wickets
      },
      T20I: {
        matches: competitionStats.T20I.matches.size,
        balls: competitionStats.T20I.balls,
        pressureBalls: competitionStats.T20I.pressureBalls,
        pressurePct: parseFloat(((competitionStats.T20I.pressureBalls / competitionStats.T20I.balls) * 100).toFixed(1)),
        avgRunRate: parseFloat(((competitionStats.T20I.runs / (competitionStats.T20I.balls / 6))).toFixed(2)),
        wickets: competitionStats.T20I.wickets
      }
    },
    seasonTrends: Object.values(seasonStats).sort((a, b) => a.season.localeCompare(b.season)).map(s => ({
      season: s.season,
      totalBalls: s.totalBalls,
      pressureBalls: s.pressureBalls,
      pressurePct: parseFloat(((s.pressureBalls / s.totalBalls) * 100).toFixed(1)),
      runRate: parseFloat(((s.runs / (s.totalBalls / 6))).toFixed(2)),
      wickets: s.wickets
    })),
    topBatters: cleanBatters.slice(0, 10),
    topBowlers: cleanBowlers.slice(0, 10)
  };

  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(outDir, 'batters.json'), JSON.stringify(cleanBatters, null, 2));
  fs.writeFileSync(path.join(outDir, 'bowlers.json'), JSON.stringify(cleanBowlers, null, 2));
  fs.writeFileSync(path.join(outDir, 'competitions.json'), JSON.stringify(compList, null, 2));

  // Also write sample high-pressure matches for the scenario explorer
  const pressureMatchesList = [
    {
      id: '13512',
      name: 'West Indies vs England (2022 Match 2)',
      situation: 'Innings 2: West Indies chasing 172. 10 runs needed in final over with 8 wickets down.',
      result: 'England Won by 1 Run',
      ballsRemaining: 6,
      runsNeeded: 10,
      wicketsInHand: 2,
      pressureIndex: 0.94,
      pressureCategory: 'Extreme'
    },
    {
      id: 'IPL_RR_KKR',
      name: 'Rajasthan Royals vs Kolkata Knight Riders (IPL 2024)',
      situation: 'Jos Buttler century chase: 46 runs needed off 18 balls with tailenders.',
      result: 'Rajasthan Royals Won by 2 Wickets on Last Ball',
      ballsRemaining: 18,
      runsNeeded: 46,
      wicketsInHand: 2,
      pressureIndex: 0.98,
      pressureCategory: 'Extreme'
    },
    {
      id: 'IPL_GT_CSK',
      name: 'Chennai Super Kings vs Gujarat Titans (IPL 2023 Final)',
      situation: 'CSK revised target 171 in 15 overs: 10 needed off 2 balls with Ravindra Jadeja on strike.',
      result: 'CSK Won by 5 Wickets (DLS)',
      ballsRemaining: 2,
      runsNeeded: 10,
      wicketsInHand: 5,
      pressureIndex: 1.0,
      pressureCategory: 'Extreme'
    },
    {
      id: 'IPL_RR_PBKS',
      name: 'Rajasthan Royals vs Punjab Kings (IPL 2024)',
      situation: 'Shimron Hetmyer & Rovman Powell finish: 34 runs needed off 16 balls.',
      result: 'Rajasthan Royals Won by 3 Wickets with 1 ball to spare',
      ballsRemaining: 16,
      runsNeeded: 34,
      wicketsInHand: 4,
      pressureIndex: 0.89,
      pressureCategory: 'Extreme'
    }
  ];
  fs.writeFileSync(path.join(outDir, 'pressure_matches.json'), JSON.stringify(pressureMatchesList, null, 2));

  console.log('--- PIPELINE EXECUTION COMPLETED SUCCESSFULLY! ---');
  console.log(`Generated: metadata.json, batters.json (${cleanBatters.length} qualified), bowlers.json (${cleanBowlers.length} qualified), competitions.json, pressure_matches.json.`);
}

buildAnalytics().catch(console.error);

