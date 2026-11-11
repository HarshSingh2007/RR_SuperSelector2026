const fs = require('fs');
const path = require('path');

const top20Path = path.join(__dirname, '..', 'src', 'data', 'top20_identities.json');
const battersPath = path.join(__dirname, '..', 'src', 'data', 'batters.json');
const bowlersPath = path.join(__dirname, '..', 'src', 'data', 'bowlers.json');

const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf8'));
const batters = JSON.parse(fs.readFileSync(battersPath, 'utf8'));
const bowlers = JSON.parse(fs.readFileSync(bowlersPath, 'utf8'));

// Build lookup map from top20
const targetMap = {};
top20.batters.forEach(b => {
  targetMap[b.player_id] = b;
  targetMap[b.name.toLowerCase()] = b;
});
top20.bowlers.forEach(bw => {
  targetMap[bw.player_id] = bw;
  targetMap[bw.name.toLowerCase()] = bw;
});

// Common player nationality heuristic dictionary
const playerCountryMap = {
  // India
  'mahendra singh dhoni': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'ms dhoni': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'rinku singh': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'namboori tilak varma': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'tilak varma': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'mayank yadav': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'virat kohli': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'rohit sharma': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'suryakumar yadav': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'hardik pandya': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'jasprit bumrah': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'ravindra jadeja': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'sanju samson': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'yashasvi jaiswal': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'dhruv jurel': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'riyan parag': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'ravichandran ashwin': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'yuzvendra chahal': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'kuldeep yadav': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'arshdeep singh': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'harshal patel': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'axar patel': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'rishabh pant': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'kl rahul': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'shubman gill': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'abhishek sharma': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'nitish kumar reddy': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },
  'varun chakaravarthy': { country: 'India', country_code: 'IN', country_flag: '🇮🇳' },

  // South Africa
  'tristan stubbs': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'heinrich klaasen': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'david miller': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'kagiso rabada': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'anrich nortje': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'marco jansen': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'aiden markram': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },

  // Australia
  'matthew wade': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'marcus stoinis': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'glenn maxwell': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'pat cummins': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'mitchell starc': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'travis head': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'josh hazlewood': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'david warner': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },

  // England
  'jos buttler': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'phil salt': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'sam curran': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'liam livingstone': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'jamie overton': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'jonny bairstow': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'moeen ali': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'jofra archer': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },

  // West Indies
  'nicholas pooran': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'andre russell': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'shimron hetmyer': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'rovman powell': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'shamar joseph': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'romario shepherd': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'sunil narine': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'kieron pollard': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'jason holder': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'sherfane rutherford': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'akeal hosein': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'alzarri joseph': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },
  'obed mccoy': { country: 'West Indies', country_code: 'WI', country_flag: '🌴' },

  // Pakistan
  'shadab khan': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'babar azam': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'mohammad rizwan': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'shaheen afridi': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'naseem shah': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'haris rauf': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'fakhar zaman': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'faheem ashraf': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'mohammad nawaz': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'abrar ahmed': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },
  'sufiyan muqeem': { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' },

  // Afghanistan
  'rashid khan': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'noor ahmad': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'rahmanullah gurbaz': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'fazalhaq farooqi': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'naveen-ul-haq': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'naveen ul haq': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'mujeeb ur rahman': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },
  'azmatullah omarzai': { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' },

  // New Zealand
  'trent boult': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'glenn phillips': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'mitchell santner': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'devon conway': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'kane williamson': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'daryl mitchell': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'jimmy neesham': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'tim southee': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'ish sodhi': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'lockie ferguson': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },
  'jacob duffy': { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' },

  // Sri Lanka
  'dasun shanaka': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },
  'wanindu hasaranga': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },
  'maheesh theekshana': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },
  'matheesha pathirana': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },
  'eshan malinga': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },
  'dushmantha chameera': { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' },

  // Bangladesh
  'towhid hridoy': { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' },
  'mohammad rishad hossain': { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' },
  'tanzim sakib': { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' },
  'taskin ahmed': { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' },
  'mustafizur rahman': { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' },

  // Additional Australia / England / SA / Zimbabwe / Ireland / UAE
  'patrick cummins': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'cameron green': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'adam zampa': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'nathan ellis': { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' },
  'chris jordan': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'reece topley': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'adil rashid': { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' },
  'lungi ngidi': { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' },
  'sikandar raza': { country: 'Zimbabwe', country_code: 'ZW', country_flag: '🇿🇼' },
  'ryan burl': { country: 'Zimbabwe', country_code: 'ZW', country_flag: '🇿🇼' },
  'brad evans': { country: 'Zimbabwe', country_code: 'ZW', country_flag: '🇿🇼' },
  'mark adair': { country: 'Ireland', country_code: 'IE', country_flag: '🇮🇪' },
  'george dockrell': { country: 'Ireland', country_code: 'IE', country_flag: '🇮🇪' },
  'asif khan': { country: 'United Arab Emirates', country_code: 'AE', country_flag: '🇦🇪' }
};

// Authoritative national team detection from a player's full teams array
const NATIONAL_TEAM_RULES = [
  { rx: /^India( A)?$/i, info: { country: 'India', country_code: 'IN', country_flag: '🇮🇳' } },
  { rx: /^Pakistan( A)?$/i, info: { country: 'Pakistan', country_code: 'PK', country_flag: '🇵🇰' } },
  { rx: /^Australia$/i, info: { country: 'Australia', country_code: 'AU', country_flag: '🇦🇺' } },
  { rx: /^England$/i, info: { country: 'England', country_code: 'GB-ENG', country_flag: '🏴' } },
  { rx: /^South Africa$/i, info: { country: 'South Africa', country_code: 'ZA', country_flag: '🇿🇦' } },
  { rx: /^West Indies$/i, info: { country: 'West Indies', country_code: 'WI', country_flag: '🌴' } },
  { rx: /^New Zealand$/i, info: { country: 'New Zealand', country_code: 'NZ', country_flag: '🇳🇿' } },
  { rx: /^Sri Lanka( A)?$/i, info: { country: 'Sri Lanka', country_code: 'LK', country_flag: '🇱🇰' } },
  { rx: /^Bangladesh( A)?$/i, info: { country: 'Bangladesh', country_code: 'BD', country_flag: '🇧🇩' } },
  { rx: /^Afghanistan( A)?$/i, info: { country: 'Afghanistan', country_code: 'AF', country_flag: '🇦🇫' } },
  { rx: /^Ireland$/i, info: { country: 'Ireland', country_code: 'IE', country_flag: '🇮🇪' } },
  { rx: /^Zimbabwe$/i, info: { country: 'Zimbabwe', country_code: 'ZW', country_flag: '🇿🇼' } },
  { rx: /^United Arab Emirates( A)?$/i, info: { country: 'United Arab Emirates', country_code: 'AE', country_flag: '🇦🇪' } },
  { rx: /^Scotland$/i, info: { country: 'Scotland', country_code: 'GB-SCT', country_flag: '🏴' } },
  { rx: /^Netherlands$/i, info: { country: 'Netherlands', country_code: 'NL', country_flag: '🇳🇱' } },
  { rx: /^Namibia$/i, info: { country: 'Namibia', country_code: 'NA', country_flag: '🇳🇦' } },
  { rx: /^Nepal$/i, info: { country: 'Nepal', country_code: 'NP', country_flag: '🇳🇵' } },
  { rx: /^Oman( A)?$/i, info: { country: 'Oman', country_code: 'OM', country_flag: '🇴🇲' } },
  { rx: /^(USA|United States Of America)$/i, info: { country: 'USA', country_code: 'US', country_flag: '🇺🇸' } },
  { rx: /^Canada$/i, info: { country: 'Canada', country_code: 'CA', country_flag: '🇨🇦' } },
  { rx: /^Hong Kong$/i, info: { country: 'Hong Kong', country_code: 'HK', country_flag: '🇭🇰' } },
  { rx: /^Singapore$/i, info: { country: 'Singapore', country_code: 'SG', country_flag: '🇸🇬' } },
  { rx: /^Kuwait$/i, info: { country: 'Kuwait', country_code: 'KW', country_flag: '🇰🇼' } },
  { rx: /^Japan$/i, info: { country: 'Japan', country_code: 'JP', country_flag: '🇯🇵' } }
];

function inferCountryFromTeams(p) {
  const allTeams = Array.from(new Set([...(p.teams || []), p.team].filter(Boolean)));
  for (const rule of NATIONAL_TEAM_RULES) {
    if (allTeams.some(t => rule.rx.test(t.trim()))) {
      return rule.info;
    }
  }
  return null;
}

// Detect wicketkeepers directly from playing_eleven.csv is_wk flag
const wkCounts = {};
const playingXiPath = path.join(__dirname, '..', 'data', 'raw', 'playing_eleven.csv');
if (fs.existsSync(playingXiPath)) {
  fs.readFileSync(playingXiPath, 'utf8')
    .trim().split(/\r?\n/).slice(1).forEach(line => {
      const p = line.split(',');
      if (p[6] === '1' || p[6] === 'True' || p[6] === 'true') {
        wkCounts[p[2]] = (wkCounts[p[2]] || 0) + 1;
      }
    });
}

// Detect genuine all-rounders appearing in both qualified batters and bowlers datasets
const batterIdSet = new Set(batters.map(b => b.id));
const bowlerIdSet = new Set(bowlers.map(bw => bw.id));
const allRounderIds = new Set();
for (const id of batterIdSet) {
  if (bowlerIdSet.has(id)) allRounderIds.add(id);
}

function enrichPlayer(p, isBatter) {
  const normName = p.name.toLowerCase();
  const matchedTarget = targetMap[p.id] || targetMap[normName];

  if (matchedTarget) {
    return {
      ...p,
      country: matchedTarget.country,
      country_code: matchedTarget.country_code,
      country_flag: matchedTarget.country_flag,
      player_role: matchedTarget.player_role,
      avatar_icon: matchedTarget.avatar_icon,
      player_id: matchedTarget.player_id,
      pressure_rating: matchedTarget.pressure_rating,
      keyMetric: matchedTarget.keyMetric
    };
  }

  // Prefer explicit national team membership in player's teams[] over name dictionary fallback
  const lookup = inferCountryFromTeams(p) || playerCountryMap[normName] || {
    country: 'India',
    country_code: 'IN',
    country_flag: '🇮🇳'
  };

  let role = isBatter ? 'Batter' : (p.bowlingType || 'Bowler');
  if ((wkCounts[p.id] || 0) >= 2) {
    role = 'Wicketkeeper-Batter';
  } else if (allRounderIds.has(p.id)) {
    role = 'All-Rounder';
  }

  const icons = role === 'All-Rounder'
    ? ['shield', 'zap', 'star']
    : (isBatter ? ['flame', 'zap', 'target', 'sparkles', 'sword', 'crosshair'] : ['radar', 'activity', 'compass', 'gauge', 'wind', 'rocket']);
  const icon = icons[Math.abs(p.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % icons.length];

  return {
    ...p,
    country: lookup.country,
    country_code: lookup.country_code,
    country_flag: lookup.country_flag,
    player_role: role,
    avatar_icon: icon,
    player_id: p.id,
    pressure_rating: p.rating,
    keyMetric: isBatter ? `SR ${p.pressureSR}` : `Econ ${p.pressureEcon}`
  };
}

const enrichedBatters = batters.map(b => enrichPlayer(b, true));
const enrichedBowlers = bowlers.map(bw => enrichPlayer(bw, false));

fs.writeFileSync(battersPath, JSON.stringify(enrichedBatters, null, 2));
fs.writeFileSync(bowlersPath, JSON.stringify(enrichedBowlers, null, 2));

console.log(`Enriched ${enrichedBatters.length} batters and ${enrichedBowlers.length} bowlers! (All-rounders detected: ${allRounderIds.size})`);

