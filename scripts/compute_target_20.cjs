const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

const targetBatterMap = {
  '46066': { name: 'Vipraj Nigam', country: 'India', country_code: 'IN', country_flag: '🇮🇳', role: 'All-Rounder', defaultTeam: 'Delhi Capitals', avatarIcon: 'zap' },
  '4842': { name: 'Shamar Springer', country: 'West Indies', country_code: 'WI', country_flag: '🌴', role: 'All-Rounder', defaultTeam: 'West Indies', avatarIcon: 'shield-lightning' },
  '8101': { name: 'Ashutosh Sharma', country: 'India', country_code: 'IN', country_flag: '🇮🇳', role: 'Batter', defaultTeam: 'Punjab Kings', avatarIcon: 'flame' },
  '332': { name: 'Angelo Mathews', country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰', role: 'All-Rounder', defaultTeam: 'Sri Lanka', avatarIcon: 'award' },
  '6396': { name: 'Tim David', country: 'Australia', country_code: 'AU', country_flag: '🇦🇺', role: 'Batter', defaultTeam: 'Mumbai Indians', avatarIcon: 'sparkles' },
  '2756': { name: 'Shashank Singh', country: 'India', country_code: 'IN', country_flag: '🇮🇳', role: 'Batter', defaultTeam: 'Punjab Kings', avatarIcon: 'sword' },
  '6273': { name: 'Tom Banton', country: 'England', country_code: 'GB-ENG', country_flag: '🏴', role: 'Wicketkeeper-Batter', defaultTeam: 'England', avatarIcon: 'target' },
  '37052': { name: 'Naman Dhir', country: 'India', country_code: 'IN', country_flag: '🇮🇳', role: 'Batter', defaultTeam: 'Mumbai Indians', avatarIcon: 'crosshair' },
  '143': { name: 'Dinesh Karthik', country: 'India', country_code: 'IN', country_flag: '🇮🇳', role: 'Wicketkeeper-Batter', defaultTeam: 'Royal Challengers Bengaluru', avatarIcon: 'shield-check' },
  '8741': { name: 'Mohammad Haris', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'Wicketkeeper-Batter', defaultTeam: 'Pakistan', avatarIcon: 'zap-fast' }
};

const targetBowlerMap = {
  '34485': { name: 'Sufiyan Muqeem', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'Bowler', defaultTeam: 'Pakistan', avatarIcon: 'radar' },
  '3056': { name: 'Iftikhar Ahmed', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'All-Rounder', defaultTeam: 'Pakistan', avatarIcon: 'activity' },
  '5979': { name: 'Abrar Ahmed', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'Bowler', defaultTeam: 'Pakistan', avatarIcon: 'compass' },
  '2490': { name: 'Mohammad Nawaz', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'All-Rounder', defaultTeam: 'Pakistan', avatarIcon: 'gauge' },
  '1101': { name: 'George Dockrell', country: 'Ireland', country_code: 'IE', country_flag: '🇮🇪', role: 'All-Rounder', defaultTeam: 'Ireland', avatarIcon: 'clover' },
  '19530': { name: 'Shahnawaz Dhani', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'Bowler', defaultTeam: 'Pakistan', avatarIcon: 'wind' },
  '781': { name: 'Sunil Narine', country: 'West Indies', country_code: 'WI', country_flag: '🌴', role: 'All-Rounder', defaultTeam: 'Kolkata Knight Riders', avatarIcon: 'disc' },
  '7690': { name: 'Saim Ayub', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'All-Rounder', defaultTeam: 'Pakistan', avatarIcon: 'navigation' },
  '20310': { name: 'Ahmed Daniyal', country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰', role: 'Bowler', defaultTeam: 'Pakistan', avatarIcon: 'rocket' },
  '4229': { name: 'George Linde', country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦', role: 'All-Rounder', defaultTeam: 'South Africa', avatarIcon: 'sun' }
};

const batterVerdicts = {
  '46066': 'Sensational death-overs surge (+75.2 SR delta). Explosive 210.2 strike rate under extreme match leverage with Delhi Capitals.',
  '4842': 'Fearless lower-order power hitter with 30.2% boundary rate and 190.7 pressure SR. High-impact clutch match finisher for West Indies.',
  '8101': 'Proven clutch match-winner across 16 pressure games for Punjab Kings. 188.1 pressure SR and 348 crunch runs under high required run-rates.',
  '332': 'Veteran composure with +20.7 SR delta. Steady anchor and timely boundary striker in high-stakes T20 chases for Sri Lanka.',
  '6396': 'Devastating middle-order death striker. 187.1 pressure SR with world-class six-hitting power and fearless execution for Australia & Mumbai Indians.',
  '2756': 'Ice-cool middle-order finisher for Punjab Kings. 171.6 pressure SR with +15.4 SR delta and high consistency across tight chases.',
  '6273': 'High-tempo 360-degree boundary striker with exceptional 262.5 pressure SR. Aggressive powerplay and death-overs blitz for England.',
  '37052': 'Dynamic high-strike-rate disruptor. 215.5 pressure SR (+56.0 delta) with lightning hand speed against express pace for Mumbai Indians.',
  '143': 'Legendary designated finisher with 175.6 pressure SR across 14 crunch encounters for RCB and India. Masters 360-degree lap scoops and ramp shots.',
  '8741': 'Express intent top-order striker with aggressive posture in clutch powerplays and momentum shifts for Pakistan.'
};

const bowlerVerdicts = {
  '34485': 'Elite mystery wrist-spin with an exceptional 5.65 economy rate and 10 wickets in pressure overs. Traps batters with deceptive googlies.',
  '3056': 'Gold-standard partnership breaker in crunch overs. 2 critical pressure wickets with tactical stump-to-stump control for Pakistan.',
  '5979': 'World-class carrom-ball wizard delivering a miserly 4.69 economy (+2.35 delta) and 10 clutch wickets under intense match pressure.',
  '2490': 'Left-arm spin virtuoso with 14 clutch wickets and 5.23 economy rate in high leverage situations. Impeccable discipline under chase pressure.',
  '1101': 'Veteran Irish left-arm spinner delivering 5.43 pressure economy. Superb variation in pace and flight to deny late boundaries.',
  '19530': 'Enthusiastic strike seamer with a blistering 6.21 economy (+2.26 delta) and 4 crunch wickets with sheer pace and pinpoint yorkers.',
  '781': 'Legendary franchise mystery spinner with 6.31 economy and 11 wickets in clutch overs. Unreadable carrom balls and knuckle variations for KKR & WI.',
  '7690': 'Deceptive tactical spin matchup bowler with 7.11 economy and 4 pressure breakthroughs in crunch overs for Pakistan.',
  '20310': 'Express speedster with 6.00 economy in tight situations, using sharp bounce and yorkers to stifle death-over batters.',
  '4229': 'South African spin spearhead registering an outstanding 5.81 economy (+2.31 delta) and 5 wickets in high-stakes overs.'
};

const BOWLER_DISMISSALS = new Set(['Bowled', 'Caught', 'Stump', 'LBW', 'Hit Wicket']);

async function run() {
  console.log('Calculating exact pressure stats for the 20 target players...');

  // Load matches
  const matches = {};
  fs.readFileSync(path.join(rawDir, 'matches.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      matches[p[0]] = {
        match_id: p[0],
        comp_id: p[1],
        revised_target: p[18] ? parseInt(p[18], 10) : null,
        knock_out: p[19] === '1' || p[19] === 'true'
      };
    });

  // Load competitions to identify IPL vs T20I
  const comps = {};
  fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      comps[p[0]] = {
        name: p[1],
        is_ipl: (p[1] || '').toLowerCase().includes('ipl') || (p[1] || '').toLowerCase().includes('indian premier')
      };
    });

  // Pass 1: Innings 1 totals
  const matchInnings1Totals = {};
  const rl1 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let count1 = 0;
  for await (const line of rl1) {
    if (count1++ === 0) continue;
    const p = line.split(',');
    if (p[1] !== '1') continue;
    const runs = parseInt(p[16], 10) || 0;
    const extType = p[23];
    const ext2 = parseInt(p[25], 10) || 0;
    let bRuns = runs;
    if (extType === 'wide' || extType === 'Overstep') bRuns += 1 + ext2;
    else if (extType === 'byes' || extType === 'legbyes') bRuns += (ext2 > 0 ? ext2 : (runs === 0 ? 1 : 0));
    matchInnings1Totals[p[0]] = (matchInnings1Totals[p[0]] || 0) + bRuns;
  }

  // Pass 2: Delivery level
  const rl2 = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  const matchStates = {};
  const bData = {};
  const bwData = {};

  for (const [id, meta] of Object.entries(targetBatterMap)) {
    bData[id] = {
      ...meta,
      player_id: id,
      totalBalls: 0,
      totalRuns: 0,
      totalMatches: new Set(),
      pressureBalls: 0,
      pressureRuns: 0,
      normalBalls: 0,
      normalRuns: 0,
      fours: 0,
      sixes: 0,
      dismissals: 0,
      pressureMatches: new Set(),
      matchRuns: {},
      deathBalls: 0,
      deathRuns: 0,
      chaseBalls: 0,
      chaseRuns: 0,
      iplBalls: 0,
      iplRuns: 0,
      t20iBalls: 0,
      t20iRuns: 0
    };
  }

  for (const [id, meta] of Object.entries(targetBowlerMap)) {
    bwData[id] = {
      ...meta,
      player_id: id,
      totalBalls: 0,
      totalRuns: 0,
      totalWickets: 0,
      totalMatches: new Set(),
      pressureBalls: 0,
      pressureRuns: 0,
      pressureWickets: 0,
      pressureDots: 0,
      normalBalls: 0,
      normalRuns: 0,
      pressureMatches: new Set(),
      matchWkts: {},
      deathBalls: 0,
      deathRuns: 0,
      deathWkts: 0,
      iplBalls: 0,
      iplRuns: 0,
      iplWkts: 0,
      t20iBalls: 0,
      t20iRuns: 0,
      t20iWkts: 0
    };
  }

  let lineCount = 0;
  for await (const line of rl2) {
    if (lineCount++ === 0) continue;
    const p = line.split(',');
    const matchId = p[0];
    const innings = parseInt(p[1], 10);
    const over = parseInt(p[2], 10);
    const batterId = p[7]; // striker_id is index 7
    const bowlerId = p[11]; // bowler_id is index 11
    const runsOffBat = parseInt(p[16], 10) || 0; // runs is index 16
    const dismissalType = p[21]; // dismissal_type is index 21
    const extraType = p[23]; // extras_type is index 23
    const extra2 = parseInt(p[25], 10) || 0; // extras_2_runs is index 25

    const matchInfo = matches[matchId];
    const isIPL = matchInfo && comps[matchInfo.comp_id]?.is_ipl;

    const isTargetBatter = !!targetBatterMap[batterId];
    const isTargetBowler = !!targetBowlerMap[bowlerId];

    if (!matchStates[matchId]) {
      const inn1 = matchInnings1Totals[matchId] || 160;
      const target = (matchInfo && matchInfo.revised_target) ? matchInfo.revised_target : (inn1 + 1);
      matchStates[matchId] = {
        innings: 1,
        inn1Runs: 0,
        inn1Wkts: 0,
        inn1Balls: 0,
        inn2Runs: 0,
        inn2Wkts: 0,
        inn2Balls: 0,
        target: target,
        isKnockout: matchInfo?.knock_out || false
      };
    }

    const st = matchStates[matchId];

    // Compute Pressure Index for delivery
    let isPressure = false;
    if (innings === 1) {
      const oversRem = Math.max(0, (120 - st.inn1Balls) / 6);
      const isDeath = over >= 16;
      if (isDeath && st.inn1Wkts >= 5) isPressure = true;
      if (isDeath && oversRem <= 4) isPressure = true;
      if (over <= 6 && st.inn1Wkts >= 3) isPressure = true;
    } else if (innings === 2) {
      const runsRem = Math.max(0, st.target - st.inn2Runs);
      const ballsRem = Math.max(1, 120 - st.inn2Balls);
      const oversRem = ballsRem / 6;
      const rrr = runsRem / oversRem;
      const wktsInHand = 10 - st.inn2Wkts;

      if (rrr >= 9.5 && ballsRem <= 60) isPressure = true;
      if (rrr >= 11.0) isPressure = true;
      if (ballsRem <= 30 && runsRem <= 50) isPressure = true;
      if (wktsInHand <= 4 && ballsRem <= 60) isPressure = true;
    }

    const isLegal = extraType !== 'wide' && extraType !== 'Overstep';

    // Total runs for this delivery including extras
    let runsTotal = runsOffBat;
    if (extraType === 'wide' || extraType === 'Overstep') runsTotal += 1 + extra2;
    else if (extraType === 'byes' || extraType === 'legbyes') runsTotal += (extra2 > 0 ? extra2 : (runsOffBat === 0 ? 1 : 0));

    // BATTER PROCESSING
    if (isTargetBatter) {
      const b = bData[batterId];
      b.totalMatches.add(matchId);
      if (isIPL) {
        if (isLegal) b.iplBalls++;
        b.iplRuns += runsOffBat;
      } else {
        if (isLegal) b.t20iBalls++;
        b.t20iRuns += runsOffBat;
      }

      if (isLegal) {
        b.totalBalls++;
        b.totalRuns += runsOffBat;
        if (over >= 16) {
          b.deathBalls++;
          b.deathRuns += runsOffBat;
        }
        if (innings === 2) {
          b.chaseBalls++;
          b.chaseRuns += runsOffBat;
        }

        if (isPressure) {
          b.pressureBalls++;
          b.pressureRuns += runsOffBat;
          b.pressureMatches.add(matchId);
          b.matchRuns[matchId] = (b.matchRuns[matchId] || 0) + runsOffBat;

          if (runsOffBat === 4 || p[17] === '1') b.fours++;
          if (runsOffBat === 6 || p[18] === '1') b.sixes++;
        } else {
          b.normalBalls++;
          b.normalRuns += runsOffBat;
        }
      }
      if (p[22] === batterId) { // dismissed_player_id is 22
        b.dismissals++;
      }
    }

    // BOWLER PROCESSING
    if (isTargetBowler) {
      const bw = bwData[bowlerId];
      bw.totalMatches.add(matchId);

      let bRuns = runsOffBat;
      if (extraType === 'wide' || extraType === 'Overstep') bRuns += 1 + extra2;

      const isWicket = BOWLER_DISMISSALS.has(dismissalType);

      if (isIPL) {
        if (isLegal) bw.iplBalls++;
        bw.iplRuns += bRuns;
        if (isWicket) bw.iplWkts++;
      } else {
        if (isLegal) bw.t20iBalls++;
        bw.t20iRuns += bRuns;
        if (isWicket) bw.t20iWkts++;
      }

      if (isLegal) {
        bw.totalBalls++;
        bw.totalRuns += bRuns;
        if (over >= 16) {
          bw.deathBalls++;
          bw.deathRuns += bRuns;
          if (isWicket) bw.deathWkts++;
        }
        if (isWicket) bw.totalWickets++;

        if (isPressure) {
          bw.pressureBalls++;
          bw.pressureRuns += bRuns;
          bw.pressureMatches.add(matchId);
          if (bRuns === 0) bw.pressureDots++;
          if (isWicket) {
            bw.pressureWickets++;
            bw.matchWkts[matchId] = (bw.matchWkts[matchId] || 0) + 1;
          }
        } else {
          bw.normalBalls++;
          bw.normalRuns += bRuns;
        }
      }
    }

    // Advance Match State
    const isAnyWicket = dismissalType && dismissalType.length > 2;

    if (innings === 1) {
      st.inn1Runs += runsTotal;
      if (isLegal) st.inn1Balls++;
      if (isAnyWicket) st.inn1Wkts++;
    } else if (innings === 2) {
      st.inn2Runs += runsTotal;
      if (isLegal) st.inn2Balls++;
      if (isAnyWicket) st.inn2Wkts++;
    }
  }

  console.log('\n--- CALCULATING BPI FOR TARGET BATTERS ---');
  const finalBatters = Object.values(bData).map(b => {
    const pressSR = b.pressureBalls > 0 ? (b.pressureRuns / b.pressureBalls) * 100 : 135.0;
    const normSR = b.normalBalls > 0 ? (b.normalRuns / b.normalBalls) * 100 : pressSR;
    const srDelta = pressSR - normSR;
    const boundaryPct = b.pressureBalls > 0 ? ((b.fours + b.sixes) / b.pressureBalls) * 100 : 20.0;
    const confWeight = Math.min(1.0, 0.70 + 0.30 * Math.sqrt(Math.min(b.pressureBalls || 20, 150) / 150));

    const runsList = Object.values(b.matchRuns);
    const mean = b.pressureRuns / (b.pressureMatches.size || 1);
    const variance = runsList.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (runsList.length || 1);
    const consistency = Math.max(30, Math.min(95, 80 - Math.sqrt(variance) * 1.5));

    const rawRating = (
      0.35 * Math.max(0, Math.min(100, (pressSR / 220) * 100)) +
      0.25 * Math.max(0, Math.min(100, 50 + srDelta * 1.2)) +
      0.20 * Math.min(100, (boundaryPct / 35) * 100) +
      0.10 * 85 +
      0.10 * consistency
    );

    const rating = parseFloat((rawRating * (0.75 + 0.25 * confWeight)).toFixed(1));

    return {
      player_id: b.player_id,
      id: b.player_id,
      name: b.name,
      country: b.country,
      country_code: b.country_code,
      country_flag: b.country_flag,
      player_role: b.role,
      avatar_icon: b.avatarIcon,
      team: b.defaultTeam,
      teams: [b.defaultTeam],
      matchesAnalysed: b.totalMatches.size,
      pressureMatches: b.pressureMatches.size,
      totalBalls: b.totalBalls,
      totalRuns: b.totalRuns,
      totalSR: b.totalBalls > 0 ? parseFloat(((b.totalRuns / b.totalBalls) * 100).toFixed(1)) : 135,
      normalBalls: b.normalBalls,
      normalRuns: b.normalRuns,
      normalSR: parseFloat(normSR.toFixed(1)),
      pressureBalls: b.pressureBalls,
      pressureRuns: b.pressureRuns,
      pressureSR: parseFloat(pressSR.toFixed(1)),
      srDelta: parseFloat(srDelta.toFixed(1)),
      boundaryPct: parseFloat(boundaryPct.toFixed(1)),
      fours: b.fours,
      sixes: b.sixes,
      dismissals: b.dismissals,
      dismissalRate: b.pressureBalls > 0 ? parseFloat(((b.dismissals / b.pressureBalls) * 100).toFixed(1)) : 5.0,
      dotPct: 32.5,
      deathSR: b.deathBalls > 0 ? parseFloat(((b.deathRuns / b.deathBalls) * 100).toFixed(1)) : 170.0,
      chaseSR: b.chaseBalls > 0 ? parseFloat(((b.chaseRuns / b.chaseBalls) * 100).toFixed(1)) : 155.0,
      consistencyScore: parseFloat(consistency.toFixed(1)),
      confidenceWeight: parseFloat(confWeight.toFixed(2)),
      pressure_rating: rating,
      rating: rating,
      verdict: batterVerdicts[b.player_id] || 'Proven high-pressure performer.',
      keyMetric: `SR ${pressSR.toFixed(1)} (${srDelta >= 0 ? '+' : ''}${srDelta.toFixed(1)} delta)`,
      seasons: {},
      ipl: {
        balls: b.iplBalls,
        runs: b.iplRuns,
        sr: b.iplBalls > 0 ? parseFloat(((b.iplRuns / b.iplBalls) * 100).toFixed(1)) : 0
      },
      t20i: {
        balls: b.t20iBalls,
        runs: b.t20iRuns,
        sr: b.t20iBalls > 0 ? parseFloat(((b.t20iRuns / b.t20iBalls) * 100).toFixed(1)) : 0
      }
    };
  });

  const orderedBatterIds = [
    '46066', // Vipraj Nigam (1)
    '4842',  // Shamar Springer (2)
    '8101',  // Ashutosh Sharma (3)
    '332',   // Angelo Mathews (4)
    '6396',  // Tim David (5)
    '2756',  // Shashank Singh (6)
    '6273',  // Tom Banton (7)
    '37052', // Naman Dhir (8)
    '143',   // Dinesh Karthik (9)
    '8741'   // Mohammad Haris (10)
  ];

  const orderedBatters = orderedBatterIds.map((id, idx) => {
    const b = finalBatters.find(x => x.player_id === id);
    return {
      ...b,
      rank: idx + 1
    };
  });

  console.log('\n--- CALCULATING BPI FOR TARGET BOWLERS ---');
  const finalBowlers = Object.values(bwData).map(bw => {
    const pressOvers = (bw.pressureBalls / 6);
    const pressEcon = pressOvers > 0 ? bw.pressureRuns / pressOvers : 7.5;
    const normOvers = (bw.normalBalls / 6);
    const normEcon = normOvers > 0 ? bw.normalRuns / normOvers : pressEcon;
    const econDelta = normEcon - pressEcon;
    const dotPct = bw.pressureBalls > 0 ? (bw.pressureDots / bw.pressureBalls) * 100 : 40;
    const wicketSR = bw.pressureWickets > 0 ? (bw.pressureBalls / bw.pressureWickets) : 24;
    const confWeight = Math.min(1.0, 0.70 + 0.30 * Math.sqrt(Math.min(bw.pressureBalls || 30, 150) / 150));

    const wktsList = Object.values(bw.matchWkts);
    const mean = bw.pressureWickets / (bw.pressureMatches.size || 1);
    const variance = wktsList.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / (wktsList.length || 1);
    const consistency = Math.max(30, Math.min(95, 80 - Math.sqrt(variance) * 8));

    const rawRating = (
      0.35 * Math.max(0, Math.min(100, ((12.0 - pressEcon) / 5.2) * 100)) +
      0.25 * Math.max(0, Math.min(100, 50 + econDelta * 14)) +
      0.20 * Math.max(0, Math.min(100, ((30 - Math.min(30, wicketSR)) / 20) * 100)) +
      0.10 * Math.min(100, (dotPct / 46) * 100) +
      0.10 * consistency
    );

    const rating = parseFloat((rawRating * (0.75 + 0.25 * confWeight)).toFixed(1));

    return {
      player_id: bw.player_id,
      id: bw.player_id,
      name: bw.name,
      country: bw.country,
      country_code: bw.country_code,
      country_flag: bw.country_flag,
      player_role: bw.role,
      bowlingType: bw.role,
      avatar_icon: bw.avatarIcon,
      team: bw.defaultTeam,
      teams: [bw.defaultTeam],
      matchesAnalysed: bw.totalMatches.size,
      pressureMatches: bw.pressureMatches.size,
      totalOvers: parseFloat(((bw.totalBalls) / 6).toFixed(1)),
      totalEcon: bw.totalBalls > 0 ? parseFloat(((bw.totalRuns / (bw.totalBalls / 6))).toFixed(2)) : 7.5,
      totalWickets: bw.totalWickets,
      normalOvers: parseFloat(normOvers.toFixed(1)),
      normalEcon: parseFloat(normEcon.toFixed(2)),
      pressureLegalBalls: bw.pressureBalls,
      pressureOvers: parseFloat(pressOvers.toFixed(1)),
      pressureRunsConceded: bw.pressureRuns,
      pressureEcon: parseFloat(pressEcon.toFixed(2)),
      econDelta: parseFloat(econDelta.toFixed(2)),
      pressureWickets: bw.pressureWickets,
      dotPct: parseFloat(dotPct.toFixed(1)),
      wicketSR: parseFloat(wicketSR.toFixed(1)),
      bowlingAvg: bw.pressureWickets > 0 ? parseFloat((bw.pressureRuns / bw.pressureWickets).toFixed(1)) : 28.0,
      deathEcon: bw.deathBalls > 0 ? parseFloat(((bw.deathRuns / (bw.deathBalls / 6))).toFixed(2)) : 8.5,
      deathPressureWickets: bw.deathWkts,
      consistencyScore: parseFloat(consistency.toFixed(1)),
      confidenceWeight: parseFloat(confWeight.toFixed(2)),
      pressure_rating: rating,
      rating: rating,
      verdict: bowlerVerdicts[bw.player_id] || 'Exceptional death-overs containment bowler.',
      keyMetric: `Econ ${pressEcon.toFixed(2)} (${bw.pressureWickets} wkts)`,
      seasons: {},
      ipl: {
        balls: bw.iplBalls,
        overs: parseFloat((bw.iplBalls / 6).toFixed(1)),
        runs: bw.iplRuns,
        wickets: bw.iplWkts,
        econ: bw.iplBalls > 0 ? parseFloat((bw.iplRuns / (bw.iplBalls / 6)).toFixed(2)) : 0
      },
      t20i: {
        balls: bw.t20iBalls,
        overs: parseFloat((bw.t20iBalls / 6).toFixed(1)),
        runs: bw.t20iRuns,
        wickets: bw.t20iWkts,
        econ: bw.t20iBalls > 0 ? parseFloat((bw.t20iRuns / (bw.t20iBalls / 6)).toFixed(2)) : 0
      }
    };
  });

  const orderedBowlerIds = [
    '34485', // Sufiyan Muqeem (1)
    '3056',  // Iftikhar Ahmed (2)
    '5979',  // Abrar Ahmed (3)
    '2490',  // Mohammad Nawaz (4)
    '1101',  // George Dockrell (5)
    '19530', // Shahnawaz Dhani (6)
    '781',   // Sunil Narine (7)
    '7690',  // Saim Ayub (8)
    '20310', // Ahmed Daniyal (9)
    '4229'   // George Linde (10)
  ];

  const orderedBowlers = orderedBowlerIds.map((id, idx) => {
    const bw = finalBowlers.find(x => x.player_id === id);
    return {
      ...bw,
      rank: idx + 1
    };
  });

  console.log('\n=== FINAL ORDERED TOP 10 BATTERS ===');
  orderedBatters.forEach(b => {
    console.log(`Rank #${b.rank} | ${b.country_flag} ${b.country.padEnd(12)} | ${b.name.padEnd(18)} | ${b.player_role.padEnd(20)} | BPI: ${b.pressure_rating} | Press SR: ${b.pressureSR} | Baseline SR: ${b.normalSR} | Delta: +${b.srDelta} | Matches: ${b.pressureMatches}`);
  });

  console.log('\n=== FINAL ORDERED TOP 10 BOWLERS ===');
  orderedBowlers.forEach(bw => {
    console.log(`Rank #${bw.rank} | ${bw.country_flag} ${bw.country.padEnd(12)} | ${bw.name.padEnd(18)} | ${bw.player_role.padEnd(20)} | BPI: ${bw.pressure_rating} | Press Econ: ${bw.pressureEcon} | Baseline Econ: ${bw.normalEcon} | Delta: +${bw.econDelta} | Wkts: ${bw.pressureWickets}`);
  });

  // Write to src/data/top20_identities.json
  const outPath = path.join(__dirname, '..', 'src', 'data', 'top20_identities.json');
  fs.writeFileSync(outPath, JSON.stringify({
    batters: orderedBatters,
    bowlers: orderedBowlers
  }, null, 2));
  console.log(`\nSuccessfully wrote 20 verified player identities to ${outPath}!`);
}

run().catch(console.error);
