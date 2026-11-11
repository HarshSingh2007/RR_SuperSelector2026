const fs = require('fs');

const playersToFind = [
  'Vipraj Nigam',
  'Shamar Springer',
  'Ashutosh Sharma',
  'Angelo Mathews',
  'Tim David',
  'Shashank Singh',
  'Tom Banton',
  'Naman Dhir',
  'Dinesh Karthik',
  'Mohammad Haris',
  'Sufiyan Muqeem',
  'Iftikhar Ahmed',
  'Abrar Ahmed',
  'Mohammad Nawaz',
  'George Dockrell',
  'Shahnawaz Dhani',
  'Sunil Narine',
  'Saim Ayub',
  'Ahmed Daniyal',
  'George Linde'
];

const lines = fs.readFileSync('data/raw/competition_team_player_mapping.csv', 'utf8').split('\n');
const found = {};

for (let i = 1; i < lines.length; i++) {
  const p = lines[i].split(',');
  if (p.length < 6) continue;
  const compId = p[0];
  const compName = p[1];
  const teamId = p[2];
  const teamName = p[3];
  const playerId = p[4];
  const playerName = p[5].trim();

  for (const target of playersToFind) {
    if (playerName.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(playerName.toLowerCase())) {
      if (!found[target]) {
        found[target] = [];
      }
      if (!found[target].some(x => x.playerId === playerId)) {
        found[target].push({ playerId, playerName, teamName, compName });
      }
    }
  }
}

console.log('--- FOUND PLAYERS IN DATASET ---');
for (const target of playersToFind) {
  if (found[target]) {
    console.log(`MATCH for ${target}:`, JSON.stringify(found[target]));
  } else {
    console.log(`NO EXACT MATCH for ${target}, checking partial names...`);
  }
}

