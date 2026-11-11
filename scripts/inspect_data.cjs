const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

async function inspectFile(filename, maxLines = 5) {
  const filePath = path.join(rawDir, filename);
  console.log(`\n======================================================`);
  console.log(`FILE: ${filename}`);
  console.log(`======================================================`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const stats = fs.statSync(filePath);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let header = '';
  const sampleLines = [];

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      header = line;
    } else if (lineCount <= maxLines + 1) {
      sampleLines.push(line);
    }
  }

  console.log(`Total rows (including header): ${lineCount}`);
  console.log(`Header columns (${header.split(',').length}):`);
  console.log(header.split(',').map((col, idx) => `  [${idx}] ${col.trim()}`).join('\n'));
  console.log(`\nSample rows:`);
  sampleLines.forEach((l, i) => console.log(`  Row ${i + 1}: ${l.slice(0, 140)}...`));
}

async function run() {
  const files = [
    'competitions.csv',
    'teams.csv',
    'matches.csv',
    'playing_eleven.csv',
    'competition_team_player_mapping.csv',
    'ball_by_ball.csv'
  ];

  for (const f of files) {
    await inspectFile(f);
  }
}

run().catch(console.error);

