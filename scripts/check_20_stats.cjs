const fs = require('fs');

const batters = JSON.parse(fs.readFileSync('src/data/batters.json'));
const bowlers = JSON.parse(fs.readFileSync('src/data/bowlers.json'));

const batterIds = [
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
];

const bowlerIds = [
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
];

console.log('--- BATTERS FOUND IN BATTERS.JSON ---');
for (const id of batterIds) {
  const b = batters.find(x => x.id === id);
  if (b) {
    console.log(`ID ${id}: ${b.name} (${b.team}) | BPI: ${b.rating} | Press SR: ${b.pressureSR} | Delta: +${b.srDelta} | Runs: ${b.pressureRuns} (${b.pressureBalls}b)`);
  } else {
    console.log(`ID ${id}: Not in qualified batters.json (checking all raw batter stats)...`);
  }
}

console.log('\n--- BOWLERS FOUND IN BOWLERS.JSON ---');
for (const id of bowlerIds) {
  const bw = bowlers.find(x => x.id === id);
  if (bw) {
    console.log(`ID ${id}: ${bw.name} (${bw.team}) | BPI: ${bw.rating} | Econ: ${bw.pressureEcon} | Delta: +${bw.econDelta} | Wkts: ${bw.pressureWickets} (${bw.pressureOvers} ov)`);
  } else {
    console.log(`ID ${id}: Not in qualified bowlers.json (checking all raw bowler stats)...`);
  }
}

