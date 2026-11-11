const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

const targetBatterIds = new Set([
  '46066', // Vipraj Nigam
  '4842',  // Shamar Springer
  '8101',  // Ashutosh Sharma
  '332',   // Angelo Mathews
  '6396',  // Tim David
  '2756',  // Shashank Singh
  '6273',  // Tom Banton
  '37052', // Naman Dhir
  '143',   // Dinesh Karthik
  '8741'   // Mohammad Haris
]);

const targetBowlerIds = new Set([
  '34485', // Sufiyan Muqeem
  '3056',  // Iftikhar Ahmed
  '5979',  // Abrar Ahmed
  '2490',  // Mohammad Nawaz
  '1101',  // George Dockrell
  '19530', // Shahnawaz Dhani
  '781',   // Sunil Narine
  '7690',  // Saim Ayub
  '20310', // Ahmed Daniyal
  '4229'   // George Linde
]);

async function analyzeTargets() {
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  const bStats = {};
  const bwStats = {};

  let count = 0;
  for await (const line of rl) {
    if (count++ === 0) continue;
    const p = line.split(',');
    const strikerId = p[7];
    const bowlerId = p[11];
    const runs = parseInt(p[16], 10) || 0;
    const extType = p[23];
    const isLegal = (extType !== 'wide' && extType !== 'Overstep');
    const isWicket = p[19] === 'true' || p[19] === '1';

    if (targetBatterIds.has(strikerId)) {
      if (!bStats[strikerId]) bStats[strikerId] = { name: p[8], balls: 0, runs: 0, fours: 0, sixes: 0, matches: new Set() };
      if (isLegal) {
        bStats[strikerId].balls++;
        bStats[strikerId].runs += runs;
        if (p[17] === 'true' || p[17] === '1') bStats[strikerId].fours++;
        if (p[18] === 'true' || p[18] === '1') bStats[strikerId].sixes++;
        bStats[strikerId].matches.add(p[0]);
      }
    }

    if (targetBowlerIds.has(bowlerId)) {
      if (!bwStats[bowlerId]) bwStats[bowlerId] = { name: p[12], balls: 0, runs: 0, wickets: 0, dots: 0, matches: new Set() };
      if (isLegal) bwStats[bowlerId].balls++;
      bwStats[bowlerId].runs += runs;
      if (isWicket) bwStats[bowlerId].wickets++;
      if (isLegal && runs === 0) bwStats[bowlerId].dots++;
      bwStats[bowlerId].matches.add(p[0]);
    }
  }

  console.log('--- TARGET BATTERS RAW STATS ---');
  for (const id of targetBatterIds) {
    const s = bStats[id];
    if (s) {
      console.log(`Batter [${id}] ${s.name}: ${s.runs} runs, ${s.balls} balls, SR ${(s.runs/s.balls*100).toFixed(1)}, ${s.matches.size} matches`);
    } else {
      console.log(`Batter [${id}]: No balls in dataset`);
    }
  }

  console.log('\n--- TARGET BOWLERS RAW STATS ---');
  for (const id of targetBowlerIds) {
    const s = bwStats[id];
    if (s) {
      console.log(`Bowler [${id}] ${s.name}: ${s.wickets} wkts, ${s.runs} runs, ${(s.balls/6).toFixed(1)} ov, Econ ${(s.runs/(s.balls/6)).toFixed(2)}, ${s.matches.size} matches`);
    } else {
      console.log(`Bowler [${id}]: No balls in dataset`);
    }
  }
}

analyzeTargets();

