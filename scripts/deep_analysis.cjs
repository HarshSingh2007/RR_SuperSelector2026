const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

async function analyze() {
  console.log('--- 1. COMPETITIONS & SEASONS ---');
  const comps = fs.readFileSync(path.join(rawDir, 'competitions.csv'), 'utf8')
    .trim().split('\n').slice(1).map(line => {
      const parts = line.split(',');
      return { comp_id: parts[0], comp_name: parts[1], format: parts[2], season: parts[3] };
    });
  
  const seasons = {};
  const formats = {};
  let iplCount = 0;
  let t20iCount = 0;
  for (const c of comps) {
    seasons[c.season] = (seasons[c.season] || 0) + 1;
    formats[c.format] = (formats[c.format] || 0) + 1;
    if (c.comp_name.toLowerCase().includes('ipl') || c.comp_name.toLowerCase().includes('indian premier league')) {
      iplCount++;
      console.log(`  IPL Comp: [${c.comp_id}] ${c.comp_name} (${c.season})`);
    } else {
      t20iCount++;
    }
  }
  console.log(`Total competitions: ${comps.length}. IPL: ${iplCount}, T20I / other: ${t20iCount}`);
  console.log('Seasons breakdown:', seasons);
  console.log('Formats breakdown:', formats);

  console.log('\n--- 2. MATCHES SUMMARY ---');
  const matchesLines = fs.readFileSync(path.join(rawDir, 'matches.csv'), 'utf8')
    .trim().split('\n').slice(1);
  console.log(`Total matches in matches.csv: ${matchesLines.length}`);

  console.log('\n--- 3. BALL BY BALL DISMISSALS & EXTRAS ---');
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  const dismissalTypes = {};
  const extrasTypes = {};
  let totalBalls = 0;
  let wicketsCount = 0;
  let matchesInBBP = new Set();
  let sampleDismissals = [];
  let sampleExtras = [];

  for await (const line of rl) {
    if (totalBalls === 0) {
      totalBalls++;
      continue;
    }
    totalBalls++;
    const parts = line.split(',');
    const matchId = parts[0];
    const isWicket = parts[19];
    const dismissalType = parts[21];
    const extrasType = parts[23];
    const extras1 = parts[24];
    const extras2 = parts[25];

    matchesInBBP.add(matchId);

    if (extrasType) {
      extrasTypes[extrasType] = (extrasTypes[extrasType] || 0) + 1;
    }
    if (extrasType && extrasType !== 'None' && sampleExtras.length < 5) {
      sampleExtras.push({ extrasType, extras1, extras2, line: line.slice(0, 100) });
    }

    if (isWicket === 'true' || isWicket === '1') {
      wicketsCount++;
      dismissalTypes[dismissalType || 'UNKNOWN'] = (dismissalTypes[dismissalType || 'UNKNOWN'] || 0) + 1;
      if (sampleDismissals.length < 5) {
        sampleDismissals.push({ dismissalType, line: line.slice(0, 100) });
      }
    }
  }

  console.log(`Total deliveries: ${totalBalls - 1}`);
  console.log(`Unique matches in ball_by_ball: ${matchesInBBP.size}`);
  console.log(`Total wickets: ${wicketsCount}`);
  console.log('Dismissal types:', dismissalTypes);
  console.log('Extras types:', extrasTypes);
  console.log('Sample extras:', sampleExtras);
  console.log('Sample dismissals:', sampleDismissals);
}

analyze().catch(console.error);

