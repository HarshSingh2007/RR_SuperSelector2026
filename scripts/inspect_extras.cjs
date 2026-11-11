const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'raw');

async function inspectExtras() {
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(rawDir, 'ball_by_ball.csv')),
    crlfDelay: Infinity
  });

  let count = 0;
  const examples = {};

  for await (const line of rl) {
    if (count++ === 0) continue;
    const p = line.split(',');
    const extType = p[23];
    const runs = p[16];
    const ext1 = p[24];
    const ext2 = p[25];

    if (!examples[extType] && Object.keys(examples).length < 20) {
      examples[extType] = [];
    }
    if (examples[extType] && examples[extType].length < 3) {
      examples[extType].push({
        runs,
        ext1,
        ext2,
        is_four: p[17],
        is_six: p[18],
        raw: `${p[2]}.${p[3]} runs:${runs} ext:${extType} ext1:${ext1} ext2:${ext2}`
      });
    }
    if (count > 50000) break;
  }

  console.log('Examples by extras_type:', JSON.stringify(examples, null, 2));
}

inspectExtras();

