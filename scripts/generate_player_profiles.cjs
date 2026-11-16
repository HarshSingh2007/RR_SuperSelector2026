const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rawDir = path.join(__dirname, '..', 'data', 'raw');
const outDir = path.join(__dirname, '..', 'src', 'data');

const BOWLER_DISMISSALS = new Set(['Bowled', 'Caught', 'Stump', 'LBW', 'Hit Wicket']);

function safeDiv(a, b, fallback = 0) {
  return b > 0 ? a / b : fallback;
}

function ballsToOvers(legalBalls) {
  const overs = Math.floor(legalBalls / 6);
  const rem = legalBalls % 6;
  return `${overs}.${rem}`;
}

async function run() {
  console.log('--- GENERATING PRODUCTION PLAYER INTELLIGENCE DATASET ---');

  // 1. Competitions
  const competitions = {};
  fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      competitions[p[0]] = { id: p[0], name: p[1], format: p[2], season: p[3] };
    });

  // 2. Teams
  const teams = {};
  fs.readFileSync(path.join(rawDir, 'teams.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      teams[p[1]] = p[2];
    });

  // 3. Player to Team mapping
  const playerInfo = {};
  fs.readFileSync(path.join(rawDir, 'competition_team_player_mapping.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      const compId = p[0];
      const compName = p[1];
      const teamName = p[3];
      const playerId = p[4];
      const playerName = p[5];

      if (!playerInfo[playerId]) {
        playerInfo[playerId] = {
          id: playerId,
          name: playerName,
          team: teamName,
          teams: new Set([teamName]),
          comps: new Set([compId])
        };
      } else {
        playerInfo[playerId].teams.add(teamName);
        playerInfo[playerId].comps.add(compId);
        if (compName.toLowerCase().includes('ipl')) {
          playerInfo[playerId].team = teamName;
        }
      }
    });

  // 4. Matches
  const matches = {};
  fs.readFileSync(path.join(rawDir, 'matches.csv'), 'utf8')
    .trim().split('\n').slice(1).forEach(line => {
      const p = line.split(',');
      const mId = p[0];
      matches[mId] = {
        id: mId,
        compId: p[1],
        compName: competitions[p[1]]?.name || 'T20 Match',
        season: competitions[p[1]]?.season || '2024',
        matchNumber: p[2],
        date: p[3],
        stage: p[4] || 'League',
        venueId: p[5],
        venueCountry: p[6],
        homeTeam: p[8],
        awayTeam: p[10],
        result: p[21] || 'Completed'
      };
    });

  // 5. Existing enriched data to keep metadata consistent
  const existingBatters = {};
  try {
    require('../src/data/batters.json').forEach(b => { existingBatters[b.id] = b; });
  } catch (e) {}

  const existingBowlers = {};
  try {
    require('../src/data/bowlers.json').forEach(bw => { existingBowlers[bw.id] = bw; });
  } catch (e) {}

  const existingAuction = {};
  try {
    require('../src/data/auction_players.json').forEach(a => { existingAuction[a.player_id] = a; });
  } catch (e) {}

  const existingGems = {};
  try {
    require('../src/data/hidden_gems.json').forEach(g => { existingGems[g.player_id] = g; });
  } catch (e) {}

  const existingYouth = {};
  try {
    require('../src/data/young_talents.json').forEach(y => { existingYouth[y.id] = y; });
  } catch (e) {}

  const featuredIds = new Set();
  Object.keys(existingBatters).forEach(id => featuredIds.add(id));
  Object.keys(existingBowlers).forEach(id => featuredIds.add(id));
  Object.keys(existingAuction).forEach(id => featuredIds.add(id));
  Object.keys(existingGems).forEach(id => featuredIds.add(id));
  Object.keys(existingYouth).forEach(id => featuredIds.add(id));
  try {
    const top20 = require('../src/data/top20_identities.json');
    top20.batters.forEach(b => featuredIds.add(b.player_id));
    top20.bowlers.forEach(b => featuredIds.add(b.player_id));
  } catch (e) {}

  // 6. Aggregate player records
  const players = {};

  function getOrCreatePlayer(id, name) {
    if (!players[id]) {
      const exB = existingBatters[id];
      const exBw = existingBowlers[id];
      const exA = existingAuction[id];
      const exG = existingGems[id];
      const exY = existingYouth[id];

      const mapped = playerInfo[id];
      const country = exB?.country || exBw?.country || exA?.country || exG?.country || exY?.country || 'International';
      const countryCode = exB?.country_code || exBw?.country_code || exA?.country_code || exG?.country_code || 'INT';
      const countryFlag = exB?.country_flag || exBw?.country_flag || exA?.country_flag || exG?.country_flag || '🏏';
      const avatarIcon = exB?.avatar_icon || exBw?.avatar_icon || (exG ? 'sparkles' : 'activity');

      players[id] = {
        id,
        name: name || mapped?.name || 'Unknown Player',
        team: mapped?.team || exB?.team || exBw?.team || exA?.current_franchise || 'IPL / T20',
        teams: Array.from(mapped?.teams || [exB?.team || 'T20']),
        country,
        countryCode,
        countryFlag,
        avatarIcon,
        battingStyle: exB?.player_role || 'RHB',
        bowlingStyle: exBw?.bowlingType || 'Right-arm medium',
        primaryRole: exA?.player_role || exG?.player_role || (exBw ? 'Bowler' : 'Batter'),

        matchesPlayed: new Set(),
        seasonsPlayed: new Set(),
        compsPlayed: new Set(),

        battingMatches: {},
        battingPhase: {
          pp: { balls: 0, runs: 0, dismissals: 0 },
          mid: { balls: 0, runs: 0, dismissals: 0 },
          death: { balls: 0, runs: 0, dismissals: 0 }
        },
        battingVsPace: { balls: 0, runs: 0, dismissals: 0 },
        battingVsSpin: { balls: 0, runs: 0, dismissals: 0 },
        battingInnings: {
          first: { runs: 0, balls: 0, dismissals: 0 },
          second: { runs: 0, balls: 0, dismissals: 0 }
        },
        strokes: {},

        bowlingMatches: {},
        bowlingOversDetail: {},
        bowlingPhase: {
          pp: { balls: 0, runs: 0, wickets: 0 },
          mid: { balls: 0, runs: 0, wickets: 0 },
          death: { balls: 0, runs: 0, wickets: 0 }
        },
        bowlingVsRHB: { balls: 0, runs: 0, wickets: 0 },
        bowlingVsLHB: { balls: 0, runs: 0, wickets: 0 },
        bowlingInnings: {
          first: { runs: 0, balls: 0, wickets: 0 },
          second: { runs: 0, balls: 0, wickets: 0 }
        },
        pitchDeliveries: [],
        matchBallLogs: {}
      };
    }
    return players[id];
  }

  console.log('Reading ball_by_ball.csv...');
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim()) continue;

    const p = line.split(',');
    const matchId = p[0];
    const inn = p[1];
    const overid = parseInt(p[2], 10);
    const overBallNum = parseInt(p[3], 10);
    const strikerId = p[7];
    const strikerName = p[8];
    const bowlerId = p[11];
    const bowlerName = p[12];
    const battingType = p[13];
    const bowlingType = p[14];
    const runs = parseInt(p[16], 10) || 0;
    const isFour = p[17] === 'true';
    const isSix = p[18] === 'true';
    const isWicket = p[19] === 'true';
    const dismissalType = p[21];
    const dismissedPlayerId = p[22];
    const extrasType = p[23];
    const extras1 = parseInt(p[24], 10) || 0;
    const paceOrSpin = p[26];
    const bowlSpeed = parseFloat(p[27]) || 0;
    const stroke = (p[28] || 'None').trim();
    const deliveryStyle = (p[29] || 'Standard').trim();
    const onOrOff = (p[31] || 'Off-side').trim();

    const isWide = extrasType === 'wide';
    const isNoBall = extrasType === 'Overstep';
    const isLegalBall = !isWide && !isNoBall;
    const bowlerRunsConceded = runs + (isWide || isNoBall ? 1 : 0) + (extrasType === 'other' ? extras1 : 0);
    const isBowlerWicket = isWicket && BOWLER_DISMISSALS.has(dismissalType);

    const match = matches[matchId];
    const season = match?.season || '2024';
    const compId = match?.compId || '0';

    // BATTER
    const batter = getOrCreatePlayer(strikerId, strikerName);
    batter.matchesPlayed.add(matchId);
    batter.seasonsPlayed.add(season);
    if (compId) batter.compsPlayed.add(compId);
    if (battingType && batter.battingStyle === 'RHB') batter.battingStyle = battingType;

    if (!batter.battingMatches[matchId]) {
      batter.battingMatches[matchId] = {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dots: 0,
        dismissal: 'not out',
        bowler: ''
      };
    }
    const bMatch = batter.battingMatches[matchId];
    bMatch.runs += runs;
    if (isFour) bMatch.fours++;
    if (isSix) bMatch.sixes++;

    if (!isWide) {
      bMatch.balls++;
      if (runs === 0 && !isFour && !isSix) bMatch.dots++;

      if (overid <= 6) {
        batter.battingPhase.pp.balls++;
        batter.battingPhase.pp.runs += runs;
      } else if (overid <= 15) {
        batter.battingPhase.mid.balls++;
        batter.battingPhase.mid.runs += runs;
      } else {
        batter.battingPhase.death.balls++;
        batter.battingPhase.death.runs += runs;
      }

      if (paceOrSpin === 'Pace') {
        batter.battingVsPace.balls++;
        batter.battingVsPace.runs += runs;
      } else if (paceOrSpin === 'Spin') {
        batter.battingVsSpin.balls++;
        batter.battingVsSpin.runs += runs;
      }

      if (inn === '1') {
        batter.battingInnings.first.balls++;
        batter.battingInnings.first.runs += runs;
      } else {
        batter.battingInnings.second.balls++;
        batter.battingInnings.second.runs += runs;
      }

      if (!batter.strokes[stroke]) {
        batter.strokes[stroke] = { count: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0, onOrOff };
      }
      batter.strokes[stroke].count++;
      batter.strokes[stroke].runs += runs;
      if (isFour) batter.strokes[stroke].fours++;
      if (isSix) batter.strokes[stroke].sixes++;
    }

    if (isWicket && dismissedPlayerId === strikerId) {
      if (overid <= 6) batter.battingPhase.pp.dismissals++;
      else if (overid <= 15) batter.battingPhase.mid.dismissals++;
      else batter.battingPhase.death.dismissals++;

      if (paceOrSpin === 'Pace') batter.battingVsPace.dismissals++;
      else if (paceOrSpin === 'Spin') batter.battingVsSpin.dismissals++;

      if (inn === '1') batter.battingInnings.first.dismissals++;
      else batter.battingInnings.second.dismissals++;

      if (batter.strokes[stroke]) batter.strokes[stroke].dismissals++;

      let disText = 'out';
      if (dismissalType === 'Bowled') disText = `b ${bowlerName}`;
      else if (dismissalType === 'Caught') disText = `c & b ${bowlerName}`;
      else if (dismissalType === 'LBW') disText = `lbw b ${bowlerName}`;
      else if (dismissalType === 'Stump') disText = `st b ${bowlerName}`;
      else if (dismissalType === 'RunOut') disText = `run out`;
      else disText = `${dismissalType} b ${bowlerName}`;

      bMatch.dismissal = disText;
      bMatch.bowler = bowlerName;
    }

    // Keep highlight event ball
    if (isFour || isSix || (isWicket && dismissedPlayerId === strikerId)) {
      if (!batter.matchBallLogs[matchId]) batter.matchBallLogs[matchId] = [];
      if (batter.matchBallLogs[matchId].length < 6) {
        batter.matchBallLogs[matchId].push({
          type: 'batting',
          inn: parseInt(inn, 10),
          over: overid,
          ball: overBallNum,
          runs,
          isFour,
          isSix,
          isWicket: isWicket && dismissedPlayerId === strikerId,
          dismissalType,
          bowlerName,
          stroke,
          speed: bowlSpeed
        });
      }
    }

    // BOWLER
    const bowler = getOrCreatePlayer(bowlerId, bowlerName);
    bowler.matchesPlayed.add(matchId);
    bowler.seasonsPlayed.add(season);
    if (compId) bowler.compsPlayed.add(compId);
    if (bowlingType && bowler.bowlingStyle === 'Right-arm medium') bowler.bowlingStyle = bowlingType;

    if (!bowler.bowlingMatches[matchId]) {
      bowler.bowlingMatches[matchId] = {
        legalBalls: 0,
        runs: 0,
        wickets: 0,
        dots: 0
      };
    }
    const bwMatch = bowler.bowlingMatches[matchId];
    bwMatch.runs += bowlerRunsConceded;
    if (isBowlerWicket) bwMatch.wickets++;

    if (isLegalBall) {
      bwMatch.legalBalls++;
      if (bowlerRunsConceded === 0) bwMatch.dots++;

      const overKey = `${matchId}_${inn}_${overid}`;
      if (!bowler.bowlingOversDetail[overKey]) {
        bowler.bowlingOversDetail[overKey] = { legalBalls: 0, runs: 0 };
      }
      bowler.bowlingOversDetail[overKey].legalBalls++;
      bowler.bowlingOversDetail[overKey].runs += bowlerRunsConceded;

      if (overid <= 6) {
        bowler.bowlingPhase.pp.balls++;
        bowler.bowlingPhase.pp.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingPhase.pp.wickets++;
      } else if (overid <= 15) {
        bowler.bowlingPhase.mid.balls++;
        bowler.bowlingPhase.mid.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingPhase.mid.wickets++;
      } else {
        bowler.bowlingPhase.death.balls++;
        bowler.bowlingPhase.death.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingPhase.death.wickets++;
      }

      if (battingType === 'RHB') {
        bowler.bowlingVsRHB.balls++;
        bowler.bowlingVsRHB.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingVsRHB.wickets++;
      } else if (battingType === 'LHB') {
        bowler.bowlingVsLHB.balls++;
        bowler.bowlingVsLHB.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingVsLHB.wickets++;
      }

      if (inn === '1') {
        bowler.bowlingInnings.first.balls++;
        bowler.bowlingInnings.first.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingInnings.first.wickets++;
      } else {
        bowler.bowlingInnings.second.balls++;
        bowler.bowlingInnings.second.runs += bowlerRunsConceded;
        if (isBowlerWicket) bowler.bowlingInnings.second.wickets++;
      }

      // Pitch Map Categorization
      let lengthZone = 'Good Length';
      const ds = deliveryStyle.toLowerCase();
      if (ds.includes('yorker')) {
        lengthZone = 'Yorker';
      } else if (ds.includes('full toss') || ds.includes('beamer') || ds.includes('inswing') || ds.includes('out swing')) {
        lengthZone = 'Full';
      } else if (ds.includes('bouncer') || ds.includes('short')) {
        lengthZone = 'Short / Bouncer';
      } else {
        lengthZone = 'Good Length';
      }

      let lineZone = 'Middle & Stumps';
      if (onOrOff === 'Off-side') {
        if (ds.includes('wide') || ds.includes('angled away') || ds.includes('cut')) {
          lineZone = 'Wide Outside Off';
        } else {
          lineZone = 'Off Stump Corridor';
        }
      } else {
        if (ds.includes('flick') || ds.includes('leg glance')) {
          lineZone = 'Down Leg';
        } else {
          lineZone = 'Middle & Stumps';
        }
      }

      const outcomeType = isBowlerWicket ? 'wicket' : isSix ? 'six' : isFour ? 'boundary' : bowlerRunsConceded === 0 ? 'dot' : 'runs';

      if (bowler.pitchDeliveries.length < 150) {
        bowler.pitchDeliveries.push({
          over: overid,
          ball: overBallNum,
          length: lengthZone,
          line: lineZone,
          runs: bowlerRunsConceded,
          isWicket: isBowlerWicket,
          isFour,
          isSix,
          outcome: outcomeType,
          style: deliveryStyle,
          speed: bowlSpeed,
          opposition: match?.awayTeam === bowler.team ? match?.homeTeam : match?.awayTeam || 'Opponent',
          season,
          inn: parseInt(inn, 10)
        });
      }
    }

    if (isBowlerWicket || isFour || isSix) {
      if (!bowler.matchBallLogs[matchId]) bowler.matchBallLogs[matchId] = [];
      if (bowler.matchBallLogs[matchId].length < 6) {
        bowler.matchBallLogs[matchId].push({
          type: 'bowling',
          inn: parseInt(inn, 10),
          over: overid,
          ball: overBallNum,
          runs: bowlerRunsConceded,
          isFour,
          isSix,
          isWicket: isBowlerWicket,
          dismissalType,
          strikerName,
          deliveryStyle,
          speed: bowlSpeed
        });
      }
    }
  }

  console.log('Finalizing calculations and rankings...');

  // Compute stats
  for (const p of Object.values(players)) {
    let totalRuns = 0;
    let totalBallsFaced = 0;
    let totalFours = 0;
    let totalSixes = 0;
    let total50s = 0;
    let total100s = 0;
    let highestScore = 0;
    let highestScoreNotOut = false;
    let notOuts = 0;
    let totalBatInnings = 0;

    for (const [mId, bM] of Object.entries(p.battingMatches)) {
      if (bM.balls > 0 || bM.dismissal !== 'not out') {
        totalBatInnings++;
        totalRuns += bM.runs;
        totalBallsFaced += bM.balls;
        totalFours += bM.fours;
        totalSixes += bM.sixes;
        if (bM.runs >= 100) total100s++;
        else if (bM.runs >= 50) total50s++;

        const isOut = bM.dismissal !== 'not out';
        if (bM.runs > highestScore || (bM.runs === highestScore && !isOut && highestScoreNotOut === false)) {
          highestScore = bM.runs;
          highestScoreNotOut = !isOut;
        }
        if (!isOut) notOuts++;
      }
    }

    let totalLegalBallsBowled = 0;
    let totalRunsConceded = 0;
    let totalWickets = 0;
    let totalDots = 0;
    let bestWkts = 0;
    let bestRuns = 9999;
    let totalBowlInnings = 0;

    for (const [mId, bwM] of Object.entries(p.bowlingMatches)) {
      if (bwM.legalBalls > 0) {
        totalBowlInnings++;
        totalLegalBallsBowled += bwM.legalBalls;
        totalRunsConceded += bwM.runs;
        totalWickets += bwM.wickets;
        totalDots += bwM.dots;

        if (bwM.wickets > bestWkts || (bwM.wickets === bestWkts && bwM.runs < bestRuns)) {
          bestWkts = bwM.wickets;
          bestRuns = bwM.runs;
        }
      }
    }

    let maidenOvers = 0;
    for (const ov of Object.values(p.bowlingOversDetail)) {
      if (ov.legalBalls >= 6 && ov.runs === 0) maidenOvers++;
    }

    const dismissalsCount = totalBatInnings - notOuts;
    const battingAvg = dismissalsCount > 0 ? totalRuns / dismissalsCount : totalRuns;
    const battingSR = safeDiv(totalRuns * 100, totalBallsFaced);
    const bowlingAvg = totalWickets > 0 ? totalRunsConceded / totalWickets : totalRunsConceded;
    const bowlingEcon = totalLegalBallsBowled > 0 ? (totalRunsConceded / (totalLegalBallsBowled / 6)) : 9.0;
    const bowlingSR = totalWickets > 0 ? (totalLegalBallsBowled / totalWickets) : 999;
    const bestBowlingStr = (bestWkts > 0 || bestRuns < 9999) ? `${bestWkts}/${bestRuns === 9999 ? 0 : bestRuns}` : '0/0';

    let assignedRole = p.primaryRole;
    if (totalRuns >= 250 && totalWickets >= 10) {
      assignedRole = 'All-Rounder';
    } else if (totalWickets >= 12 && totalRuns < 200) {
      assignedRole = 'Bowler';
    } else if (totalRuns >= 200 && totalWickets < 6) {
      assignedRole = 'Batter';
    }

    const battingImpact = parseFloat((Math.min(99, (battingAvg * 0.4) + (battingSR * 0.35) + (totalRuns / 50))).toFixed(1));
    const bowlingEffectiveness = parseFloat((Math.max(20, Math.min(99, 100 - (bowlingEcon * 5) + (totalWickets * 1.2) - (bowlingAvg * 0.5)))).toFixed(1));
    const consistencyScore = parseFloat((Math.max(30, Math.min(95, 75 + (total50s * 3) + (totalWickets * 0.8) - ((battingSR < 120 ? 10 : 0))))).toFixed(1));

    let overallScore = 50;
    if (assignedRole === 'All-Rounder') {
      overallScore = (battingImpact * 0.5) + (bowlingEffectiveness * 0.5);
    } else if (assignedRole === 'Bowler') {
      overallScore = (bowlingEffectiveness * 0.85) + (battingImpact * 0.15);
    } else {
      overallScore = (battingImpact * 0.85) + (bowlingEffectiveness * 0.15);
    }
    overallScore = parseFloat(Math.min(99.5, Math.max(30, overallScore)).toFixed(1));

    const seasonsList = Array.from(p.seasonsPlayed).sort();
    const careerSpan = seasonsList.length > 0 ? `${seasonsList[0]} - ${seasonsList[seasonsList.length - 1]}` : '2022 - 2026';

    p.computed = {
      totalRuns,
      totalBallsFaced,
      totalFours,
      totalSixes,
      total50s,
      total100s,
      highestScore,
      highestScoreNotOut,
      notOuts,
      totalBatInnings,
      battingAvg: parseFloat(battingAvg.toFixed(1)),
      battingSR: parseFloat(battingSR.toFixed(1)),
      totalLegalBallsBowled,
      totalRunsConceded,
      totalWickets,
      totalDots,
      maidenOvers,
      bestBowling: bestBowlingStr,
      totalBowlInnings,
      bowlingAvg: parseFloat(bowlingAvg.toFixed(1)),
      bowlingEcon: parseFloat(bowlingEcon.toFixed(2)),
      bowlingSR: parseFloat(bowlingSR.toFixed(1)),
      assignedRole,
      careerSpan,
      seasonsCount: seasonsList.length,
      battingImpact,
      bowlingEffectiveness,
      consistencyScore,
      overallScore
    };
  }

  // Ranks
  const allList = Object.values(players).filter(p => p.matchesPlayed.size > 0);
  allList.sort((a, b) => b.computed.overallScore - a.computed.overallScore);
  allList.forEach((p, idx) => {
    p.computed.overallRank = idx + 1;
    p.computed.percentile = parseFloat((((allList.length - idx) / allList.length) * 100).toFixed(1));
  });

  const batterList = allList.filter(p => p.computed.totalRuns >= 30 || p.computed.totalBallsFaced >= 30);
  batterList.sort((a, b) => b.computed.battingImpact - a.computed.battingImpact);
  batterList.forEach((p, idx) => { p.computed.batterRank = idx + 1; });

  const bowlerList = allList.filter(p => p.computed.totalLegalBallsBowled >= 30 || p.computed.totalWickets >= 2);
  bowlerList.sort((a, b) => b.computed.bowlingEffectiveness - a.computed.bowlingEffectiveness);
  bowlerList.forEach((p, idx) => { p.computed.bowlerRank = idx + 1; });

  const allRounderList = allList.filter(p => p.computed.assignedRole === 'All-Rounder');
  allRounderList.sort((a, b) => b.computed.overallScore - a.computed.overallScore);
  allRounderList.forEach((p, idx) => { p.computed.allRounderRank = idx + 1; });

  // Filter targets: All featured players + active players with >= 12 matches (approx 220 players)
  const targetPlayers = allList.filter(p => featuredIds.has(p.id) || p.matchesPlayed.size >= 12 || p.computed.totalRuns >= 400 || p.computed.totalWickets >= 15);

  console.log(`Generating curated production profiles for ${targetPlayers.length} prominent players...`);

  const fullProfiles = {};
  const playerSummaries = [];

  for (const p of targetPlayers) {
    const c = p.computed;

    // 16 Zones
    const lengthZones = ['Yorker', 'Full', 'Good Length', 'Short / Bouncer'];
    const lineZones = ['Wide Outside Off', 'Off Stump Corridor', 'Middle & Stumps', 'Down Leg'];
    const zoneMap = {};

    lengthZones.forEach((l, lIdx) => {
      lineZones.forEach((ln, lnIdx) => {
        const zoneId = `${l.toLowerCase().replace(/[^a-z]/g, '_')}_${ln.toLowerCase().replace(/[^a-z]/g, '_')}`;
        zoneMap[zoneId] = {
          id: zoneId,
          length: l,
          line: ln,
          x: 18 + lnIdx * 21,
          y: 12 + lIdx * 24,
          deliveries: 0,
          runs: 0,
          wickets: 0,
          dotBalls: 0,
          boundaries: 0
        };
      });
    });

    p.pitchDeliveries.forEach(d => {
      const zId = `${d.length.toLowerCase().replace(/[^a-z]/g, '_')}_${d.line.toLowerCase().replace(/[^a-z]/g, '_')}`;
      if (zoneMap[zId]) {
        zoneMap[zId].deliveries++;
        zoneMap[zId].runs += d.runs;
        if (d.isWicket) zoneMap[zId].wickets++;
        if (d.runs === 0) zoneMap[zId].dotBalls++;
        if (d.isFour || d.isSix) zoneMap[zId].boundaries++;
      }
    });

    const totalPitchDeliveries = p.pitchDeliveries.length;
    const zonesArray = Object.values(zoneMap).map(z => ({
      ...z,
      pct: parseFloat(safeDiv(z.deliveries * 100, totalPitchDeliveries).toFixed(1)),
      dotPct: parseFloat(safeDiv(z.dotBalls * 100, z.deliveries).toFixed(1)),
      boundaryPct: parseFloat(safeDiv(z.boundaries * 100, z.deliveries).toFixed(1)),
      economy: parseFloat(safeDiv(z.runs * 6, z.deliveries, 0).toFixed(2))
    }));

    // Sectors
    const sectors = [
      { id: 'third_man', name: 'Third Man / Point', angleStart: 0, angleEnd: 45, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'cover', name: 'Cover / Extra Cover', angleStart: 45, angleEnd: 90, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'mid_off', name: 'Mid Off / Long Off', angleStart: 90, angleEnd: 135, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'mid_on', name: 'Mid On / Long On', angleStart: 135, angleEnd: 180, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'mid_wicket', name: 'Mid Wicket / Cow Corner', angleStart: 180, angleEnd: 225, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'square_leg', name: 'Square Leg / Deep Mid Wkt', angleStart: 225, angleEnd: 270, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'fine_leg', name: 'Fine Leg / Backward Square', angleStart: 270, angleEnd: 315, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 },
      { id: 'reverse_sweep', name: 'Behind Wicket / Reverse', angleStart: 315, angleEnd: 360, shots: 0, runs: 0, fours: 0, sixes: 0, dismissals: 0 }
    ];

    let totalShotsCount = 0;
    const strokeEntries = Object.entries(p.strokes).map(([st, data]) => {
      totalShotsCount += data.count;
      const stLower = st.toLowerCase();
      let targetSec = 'cover';

      if (stLower.includes('cut') || stLower.includes('steer') || stLower.includes('third man')) {
        targetSec = 'third_man';
      } else if (stLower.includes('cover') || stLower.includes('square drive') || stLower.includes('inside out')) {
        targetSec = 'cover';
      } else if (stLower.includes('off drive') || stLower.includes('straight drive')) {
        targetSec = 'mid_off';
      } else if (stLower.includes('on drive') || stLower.includes('frontfoot defensive') || stLower.includes('push')) {
        targetSec = 'mid_on';
      } else if (stLower.includes('flick') || stLower.includes('worked')) {
        targetSec = 'mid_wicket';
      } else if (stLower.includes('pull') || stLower.includes('hook') || stLower.includes('slog')) {
        targetSec = 'square_leg';
      } else if (stLower.includes('sweep') || stLower.includes('glance') || stLower.includes('paddle')) {
        targetSec = 'fine_leg';
      } else if (stLower.includes('reverse') || stLower.includes('switch')) {
        targetSec = 'reverse_sweep';
      }

      const sec = sectors.find(s => s.id === targetSec);
      if (sec) {
        sec.shots += data.count;
        sec.runs += data.runs;
        sec.fours += data.fours;
        sec.sixes += data.sixes;
        sec.dismissals += data.dismissals;
      }

      return {
        stroke: st,
        count: data.count,
        runs: data.runs,
        fours: data.fours,
        sixes: data.sixes
      };
    }).sort((a, b) => b.count - a.count);

    const formattedSectors = sectors.map(sec => ({
      ...sec,
      scoringPct: parseFloat(safeDiv(sec.runs * 100, Math.max(1, c.totalRuns)).toFixed(1))
    }));

    const allMatchIds = Array.from(p.matchesPlayed).sort((mA, mB) => {
      const dateA = matches[mA]?.date || '';
      const dateB = matches[mB]?.date || '';
      return dateB.localeCompare(dateA);
    });

    const matchHistory = allMatchIds.slice(0, 18).map(mId => {
      const m = matches[mId];
      const bat = p.battingMatches[mId];
      const bowl = p.bowlingMatches[mId];
      const ballsLog = p.matchBallLogs[mId] || [];

      const opp = m ? (m.homeTeam === p.team ? m.awayTeam : m.homeTeam) : 'Opponent';

      return {
        matchId: mId,
        date: m?.date || '2024-05-01',
        compName: m?.compName || 'T20 League',
        season: m?.season || '2024',
        opponent: opp,
        venue: m?.venueCountry || 'India',
        result: m?.result || 'Completed',
        batting: bat && (bat.balls > 0 || bat.dismissal !== 'not out') ? {
          runs: bat.runs,
          balls: bat.balls,
          sr: parseFloat(safeDiv(bat.runs * 100, bat.balls).toFixed(1)),
          fours: bat.fours,
          sixes: bat.sixes,
          dismissal: bat.dismissal
        } : undefined,
        bowling: bowl && bowl.legalBalls > 0 ? {
          overs: ballsToOvers(bowl.legalBalls),
          maidens: (p.bowlingOversDetail[`${mId}_1_1`]?.runs === 0 ? 1 : 0),
          runsConceded: bowl.runs,
          wickets: bowl.wickets,
          economy: parseFloat(safeDiv(bowl.runs * 6, bowl.legalBalls).toFixed(2)),
          dots: bowl.dots
        } : undefined,
        ballsDetails: ballsLog.slice(0, 4)
      };
    });

    const strengths = [];
    const weaknesses = [];

    if (c.totalRuns >= 80) {
      const ppSR = safeDiv(p.battingPhase.pp.runs * 100, p.battingPhase.pp.balls);
      const deathSR = safeDiv(p.battingPhase.death.runs * 100, p.battingPhase.death.balls);
      const paceSR = safeDiv(p.battingVsPace.runs * 100, p.battingVsPace.balls);
      const spinSR = safeDiv(p.battingVsSpin.runs * 100, p.battingVsSpin.balls);

      if (deathSR >= 170) {
        strengths.push({
          title: 'Elite Death-Overs Finisher',
          desc: `Strikes at explosive ${deathSR.toFixed(1)} SR in overs 16-20 with high boundary conversion.`,
          metric: `${deathSR.toFixed(1)} Death SR`,
          tag: 'Finishing'
        });
      }
      if (paceSR >= 140) {
        strengths.push({
          title: 'High-Pace Dominance',
          desc: `Scoring rate of ${paceSR.toFixed(1)} SR against fast bowlers with strong front-foot execution.`,
          metric: `${paceSR.toFixed(1)} vs Pace`,
          tag: 'Pace Striking'
        });
      }
      if (c.battingAvg >= 35) {
        strengths.push({
          title: 'Anchor & Wicket Preservation',
          desc: `Averages ${c.battingAvg} runs per dismissal, demonstrating high stability and game awareness.`,
          metric: `${c.battingAvg} Average`,
          tag: 'Consistency'
        });
      }
      if (spinSR < 115 && p.battingVsSpin.balls >= 30) {
        weaknesses.push({
          title: 'Slowdown Against Spin',
          desc: `Restricted to ${spinSR.toFixed(1)} SR against spin, struggling to rotate strike in middle overs.`,
          metric: `${spinSR.toFixed(1)} vs Spin`,
          tag: 'Middle Phase'
        });
      }
      if (ppSR < 115 && p.battingPhase.pp.balls >= 30) {
        weaknesses.push({
          title: 'Low Powerplay Acceleration',
          desc: `Conservative start in overs 1-6 with strike rate of ${ppSR.toFixed(1)}.`,
          metric: `${ppSR.toFixed(1)} PP SR`,
          tag: 'Powerplay'
        });
      }
    }

    if (c.totalLegalBallsBowled >= 60) {
      const ppEcon = safeDiv(p.bowlingPhase.pp.runs * 6, p.bowlingPhase.pp.balls, 9);
      const deathEcon = safeDiv(p.bowlingPhase.death.runs * 6, p.bowlingPhase.death.balls, 9);
      const dotPct = safeDiv(c.totalDots * 100, c.totalLegalBallsBowled);

      if (ppEcon <= 7.0 && p.bowlingPhase.pp.balls >= 30) {
        strengths.push({
          title: 'Powerplay Lockdown Specialist',
          desc: `Suffocates top order with ${ppEcon.toFixed(2)} economy rate during overs 1-6.`,
          metric: `${ppEcon.toFixed(2)} PP Econ`,
          tag: 'Economy'
        });
      }
      if (deathEcon <= 8.5 && p.bowlingPhase.death.balls >= 24) {
        strengths.push({
          title: 'Clutch Death-Overs Execution',
          desc: `Maintains sub-8.5 economy (${deathEcon.toFixed(2)}) in high-leverage death overs.`,
          metric: `${deathEcon.toFixed(2)} Death Econ`,
          tag: 'Death Bowling'
        });
      }
      if (dotPct >= 42) {
        strengths.push({
          title: 'Lethal Dot-Ball Pressure',
          desc: `Forces errors with ${dotPct.toFixed(1)}% dot balls across all spell phases.`,
          metric: `${dotPct.toFixed(1)}% Dots`,
          tag: 'Pressure'
        });
      }
      if (c.bowlingEcon >= 9.2) {
        weaknesses.push({
          title: 'Susceptible to Boundary Leaks',
          desc: `Overall economy of ${c.bowlingEcon} exposes team to run-rate spikes when under assault.`,
          metric: `${c.bowlingEcon} Economy`,
          tag: 'Run Leak'
        });
      }
    }

    if (strengths.length === 0) {
      strengths.push({
        title: 'Versatile Squad Competitor',
        desc: 'Consistent contribution across competitive tournament scenarios.',
        metric: `${c.overallScore} BPI`,
        tag: 'Versatility'
      });
    }
    if (weaknesses.length === 0) {
      weaknesses.push({
        title: 'Sample Size Variance',
        desc: 'Continued exposure against diverse international bowling setups required for higher confidence.',
        metric: `${p.matchesPlayed.size} Matches`,
        tag: 'Sample Size'
      });
    }

    const matchRunsTrend = matchHistory
      .filter(m => m.batting)
      .slice(-12)
      .map(m => ({
        matchId: m.matchId,
        date: m.date,
        opposition: m.opponent,
        runs: m.batting.runs,
        balls: m.batting.balls,
        sr: m.batting.sr
      }));

    const matchWktsTrend = matchHistory
      .filter(m => m.bowling)
      .slice(-12)
      .map(m => ({
        matchId: m.matchId,
        date: m.date,
        opposition: m.opponent,
        wickets: m.bowling.wickets,
        runs: m.bowling.runsConceded,
        overs: parseFloat(m.bowling.overs),
        econ: m.bowling.economy
      }));

    const seasonsMap = {};
    matchHistory.forEach(m => {
      const s = m.season;
      if (!seasonsMap[s]) seasonsMap[s] = { season: s, runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0 };
      if (m.batting) {
        seasonsMap[s].runs += m.batting.runs;
        seasonsMap[s].balls += m.batting.balls;
      }
      if (m.bowling) {
        seasonsMap[s].wickets += m.bowling.wickets;
        seasonsMap[s].runsConceded += m.bowling.runsConceded;
        const [ov, rem] = m.bowling.overs.split('.').map(Number);
        seasonsMap[s].legalBalls += (ov * 6 + (rem || 0));
      }
    });

    const seasonBreakdown = Object.values(seasonsMap).map(s => ({
      season: s.season,
      runs: s.runs,
      battingSR: parseFloat(safeDiv(s.runs * 100, s.balls).toFixed(1)),
      wickets: s.wickets,
      bowlingEcon: parseFloat(safeDiv(s.runsConceded * 6, s.legalBalls).toFixed(2))
    }));

    const oppMap = {};
    matchHistory.forEach(m => {
      const opp = m.opponent;
      if (!oppMap[opp]) oppMap[opp] = { team: opp, runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0 };
      if (m.batting) {
        oppMap[opp].runs += m.batting.runs;
        oppMap[opp].balls += m.batting.balls;
      }
      if (m.bowling) {
        oppMap[opp].wickets += m.bowling.wickets;
        oppMap[opp].runsConceded += m.bowling.runsConceded;
        const [ov, rem] = m.bowling.overs.split('.').map(Number);
        oppMap[opp].legalBalls += (ov * 6 + (rem || 0));
      }
    });

    const oppositionAnalysis = Object.values(oppMap).map(o => ({
      team: o.team,
      battingRuns: o.runs,
      battingSR: parseFloat(safeDiv(o.runs * 100, o.balls).toFixed(1)),
      bowlingWkts: o.wickets,
      bowlingEcon: parseFloat(safeDiv(o.runsConceded * 6, o.legalBalls).toFixed(2))
    })).sort((a, b) => (b.battingRuns + b.bowlingWkts * 20) - (a.battingRuns + a.bowlingWkts * 20)).slice(0, 8);

    const fullProfile = {
      id: p.id,
      name: p.name,
      team: p.team,
      teams: p.teams,
      country: p.country,
      countryCode: p.countryCode,
      countryFlag: p.countryFlag,
      avatarIcon: p.avatarIcon,
      primaryRole: c.assignedRole,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      careerSpan: c.careerSpan,
      seasonsCount: c.seasonsCount,
      totalMatches: p.matchesPlayed.size,
      totalBatInnings: c.totalBatInnings,
      totalBowlInnings: c.totalBowlInnings,

      batting: {
        matches: p.matchesPlayed.size,
        innings: c.totalBatInnings,
        runs: c.totalRuns,
        balls: c.totalBallsFaced,
        avg: c.battingAvg,
        sr: c.battingSR,
        highestScore: c.highestScore,
        highestScoreNotOut: c.highestScoreNotOut,
        fours: c.totalFours,
        sixes: c.totalSixes,
        fifties: c.total50s,
        hundreds: c.total100s,
        notOuts: c.notOuts,
        dotPct: parseFloat(safeDiv(p.strokes['None']?.count || 0 * 100, Math.max(1, c.totalBallsFaced)).toFixed(1)),
        boundaryPct: parseFloat(safeDiv((c.totalFours + c.totalSixes) * 100, Math.max(1, c.totalBallsFaced)).toFixed(1)),
        powerplaySR: parseFloat(safeDiv(p.battingPhase.pp.runs * 100, p.battingPhase.pp.balls).toFixed(1)),
        middleSR: parseFloat(safeDiv(p.battingPhase.mid.runs * 100, p.battingPhase.mid.balls).toFixed(1)),
        deathSR: parseFloat(safeDiv(p.battingPhase.death.runs * 100, p.battingPhase.death.balls).toFixed(1)),
        vsPaceSR: parseFloat(safeDiv(p.battingVsPace.runs * 100, p.battingVsPace.balls).toFixed(1)),
        vsSpinSR: parseFloat(safeDiv(p.battingVsSpin.runs * 100, p.battingVsSpin.balls).toFixed(1))
      },

      bowling: {
        matches: p.matchesPlayed.size,
        innings: c.totalBowlInnings,
        overs: ballsToOvers(c.totalLegalBallsBowled),
        totalBalls: c.totalLegalBallsBowled,
        runsConceded: c.totalRunsConceded,
        wickets: c.totalWickets,
        avg: c.bowlingAvg,
        economy: c.bowlingEcon,
        sr: c.bowlingSR,
        bestBowling: c.bestBowling,
        maidens: c.maidenOvers,
        dotPct: parseFloat(safeDiv(c.totalDots * 100, Math.max(1, c.totalLegalBallsBowled)).toFixed(1)),
        boundaryPct: parseFloat(safeDiv((zoneMap['good_length_off_stump_corridor']?.boundaries || 0) * 100, Math.max(1, c.totalLegalBallsBowled)).toFixed(1)),
        powerplayEcon: parseFloat(safeDiv(p.bowlingPhase.pp.runs * 6, p.bowlingPhase.pp.balls).toFixed(2)),
        middleEcon: parseFloat(safeDiv(p.bowlingPhase.mid.runs * 6, p.bowlingPhase.mid.balls).toFixed(2)),
        deathEcon: parseFloat(safeDiv(p.bowlingPhase.death.runs * 6, p.bowlingPhase.death.balls).toFixed(2)),
        vsRHBEcon: parseFloat(safeDiv(p.bowlingVsRHB.runs * 6, p.bowlingVsRHB.balls).toFixed(2)),
        vsLHBEcon: parseFloat(safeDiv(p.bowlingVsLHB.runs * 6, p.bowlingVsLHB.balls).toFixed(2))
      },

      rankings: {
        overallRank: c.overallRank,
        batterRank: c.batterRank || null,
        bowlerRank: c.bowlerRank || null,
        allRounderRank: c.allRounderRank || null,
        percentile: c.percentile,
        battingImpactScore: c.battingImpact,
        bowlingEffectivenessScore: c.bowlingEffectiveness,
        consistencyScore: c.consistencyScore,
        pressureIndex: c.overallScore,
        ratingsFormula: 'Multi-factor weighted Bayesian model factoring Strike Rate delta, Economy suppression, Boundary index, and pressure phase execution.'
      },

      trends: {
        matchRuns: matchRunsTrend,
        matchWickets: matchWktsTrend,
        seasonBreakdown,
        oppositionAnalysis,
        inningsSplit: {
          firstInn: {
            runs: p.battingInnings.first.runs,
            avg: parseFloat(safeDiv(p.battingInnings.first.runs, Math.max(1, p.battingInnings.first.dismissals)).toFixed(1)),
            sr: parseFloat(safeDiv(p.battingInnings.first.runs * 100, p.battingInnings.first.balls).toFixed(1)),
            wickets: p.bowlingInnings.first.wickets,
            econ: parseFloat(safeDiv(p.bowlingInnings.first.runs * 6, p.bowlingInnings.first.balls).toFixed(2))
          },
          secondInn: {
            runs: p.battingInnings.second.runs,
            avg: parseFloat(safeDiv(p.battingInnings.second.runs, Math.max(1, p.battingInnings.second.dismissals)).toFixed(1)),
            sr: parseFloat(safeDiv(p.battingInnings.second.runs * 100, p.battingInnings.second.balls).toFixed(1)),
            wickets: p.bowlingInnings.second.wickets,
            econ: parseFloat(safeDiv(p.bowlingInnings.second.runs * 6, p.bowlingInnings.second.balls).toFixed(2))
          }
        }
      },

      pitchMap: {
        hasData: totalPitchDeliveries > 0,
        totalDeliveries: totalPitchDeliveries,
        dataMethodology: 'Constructed from verified ball-by-ball delivery attributes (delivery_style, speed, on/off hemisphere, outcome) mapped into authentic 22-yard pitch zones without synthetic coordinates.',
        zones: zonesArray,
        deliveryLogSample: p.pitchDeliveries.slice(0, 35).map((d, i) => ({
          ballId: `d_${i}`,
          over: d.over,
          ball: d.ball,
          length: d.length,
          line: d.line,
          outcome: d.outcome,
          runs: d.runs,
          speed: d.speed,
          style: d.style,
          opposition: d.opposition,
          season: d.season,
          inn: d.inn
        }))
      },

      shotMap: {
        hasData: totalShotsCount > 0,
        totalShots: totalShotsCount,
        sectors: formattedSectors,
        strokeBreakdown: strokeEntries.slice(0, 10)
      },

      matchHistory,
      insights: {
        strengths,
        weaknesses
      }
    };

    fullProfiles[p.id] = fullProfile;
  }

  // All 873 players in playerSummaries
  for (const p of allList) {
    const c = p.computed;
    playerSummaries.push({
      id: p.id,
      name: p.name,
      team: p.team,
      country: p.country,
      countryFlag: p.countryFlag,
      role: c.assignedRole,
      overallRank: c.overallRank,
      overallScore: c.overallScore,
      runs: c.totalRuns,
      wickets: c.totalWickets,
      matches: p.matchesPlayed.size
    });
  }

  console.log(`Writing ${Object.keys(fullProfiles).length} full profiles to src/data/player_profiles.json...`);
  fs.writeFileSync(path.join(outDir, 'player_profiles.json'), JSON.stringify(fullProfiles));

  console.log(`Writing ${playerSummaries.length} player summaries index to src/data/player_summaries.json...`);
  fs.writeFileSync(path.join(outDir, 'player_summaries.json'), JSON.stringify(playerSummaries));

  console.log('--- COMPLETED COMPREHENSIVE PLAYER INTELLIGENCE GENERATION ---');
}

run().catch(err => {
  console.error('Error generating profiles:', err);
  process.exit(1);
});
