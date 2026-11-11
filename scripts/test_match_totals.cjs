const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

async function testMatchTotals() {
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  const matchData = {};
  let count = 0;

  for await (const line of rl) {
    if (count++ === 0) continue;
    const p = line.split(',');
    const matchId = p[0];
    if (matchId !== '13511' && matchId !== '13512') continue;

    const inn = p[1];
    const key = `${matchId}_${inn}`;
    if (!matchData[key]) {
      matchData[key] = {
        batterRuns: 0,
        extraRuns: 0,
        balls: 0,
        validBalls: 0,
        wickets: 0,
        extrasByType: {},
        rows: []
      };
    }
    const bRuns = parseInt(p[16], 10) || 0;
    const extType = p[23];
    const ext2 = parseInt(p[25], 10) || 0;
    const isWicket = p[19] === 'true' || p[19] === '1';

    matchData[key].batterRuns += bRuns;
    if (extType !== 'None') {
      matchData[key].extrasByType[extType] = (matchData[key].extrasByType[extType] || 0) + 1;
    }
    if (extType === 'wide') {
      // 1 run for wide + any ext2
      matchData[key].extraRuns += 1 + ext2;
    } else if (extType === 'Overstep') {
      matchData[key].extraRuns += 1 + ext2;
    } else if (extType === 'byes' || extType === 'legbyes') {
      matchData[key].extraRuns += (ext2 > 0 ? ext2 : (bRuns === 0 ? 1 : 0)); // let's check
    }

    if (extType !== 'wide' && extType !== 'Overstep') {
      matchData[key].validBalls++;
    }
    matchData[key].balls++;
    if (isWicket) matchData[key].wickets++;
    if (extType !== 'None') {
      matchData[key].rows.push({
        over: `${p[2]}.${p[3]}`,
        bRuns,
        extType,
        ext1: p[24],
        ext2: p[25]
      });
    }
  }

  console.log('Match data breakdown:', JSON.stringify(matchData, null, 2));
}

testMatchTotals();

