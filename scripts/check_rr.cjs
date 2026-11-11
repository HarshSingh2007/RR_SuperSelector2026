const fs = require('fs');
const batters = JSON.parse(fs.readFileSync('src/data/batters.json'));
const bowlers = JSON.parse(fs.readFileSync('src/data/bowlers.json'));

console.log('--- RAJASTHAN ROYALS BATTERS ---');
batters.filter(b => b.team.toLowerCase().includes('rajasthan') || b.teams.some(t => t.toLowerCase().includes('rajasthan'))).forEach(b => {
  console.log(`Rank #${b.rank} ${b.name.padEnd(20)} | BPI: ${b.rating} | Press SR: ${b.pressureSR} | Delta: +${b.srDelta} | Runs: ${b.pressureRuns}`);
});

console.log('\n--- RAJASTHAN ROYALS BOWLERS ---');
bowlers.filter(bw => bw.team.toLowerCase().includes('rajasthan') || bw.teams.some(t => t.toLowerCase().includes('rajasthan'))).forEach(bw => {
  console.log(`Rank #${bw.rank} ${bw.name.padEnd(20)} | BPI: ${bw.rating} | Press Econ: ${bw.pressureEcon} | Delta: +${bw.econDelta} | Wkts: ${bw.pressureWickets}`);
});

