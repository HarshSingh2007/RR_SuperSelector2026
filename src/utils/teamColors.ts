export interface TeamTheme {
  primary: string;
  secondary: string;
  text: string;
  accent: string;
  shortCode: string;
}

export const TEAM_THEMES: Record<string, TeamTheme> = {
  'Rajasthan Royals': {
    primary: '#E90074',
    secondary: '#1A2A6C',
    text: '#FFFFFF',
    accent: '#FF69B4',
    shortCode: 'RR',
  },
  'Mumbai Indians': {
    primary: '#004BA0',
    secondary: '#D1AB3E',
    text: '#FFFFFF',
    accent: '#0078FF',
    shortCode: 'MI',
  },
  'Chennai Super Kings': {
    primary: '#FDB913',
    secondary: '#0057E7',
    text: '#0B1020',
    accent: '#FFE066',
    shortCode: 'CSK',
  },
  'Kolkata Knight Riders': {
    primary: '#3A225D',
    secondary: '#D4AF37',
    text: '#FFFFFF',
    accent: '#8A5FB8',
    shortCode: 'KKR',
  },
  'Royal Challengers Bengaluru': {
    primary: '#EC1C24',
    secondary: '#1D1D1D',
    text: '#FFFFFF',
    accent: '#FF4D4D',
    shortCode: 'RCB',
  },
  'Royal Challengers Bangalore': {
    primary: '#EC1C24',
    secondary: '#1D1D1D',
    text: '#FFFFFF',
    accent: '#FF4D4D',
    shortCode: 'RCB',
  },
  'Delhi Capitals': {
    primary: '#004C97',
    secondary: '#D71920',
    text: '#FFFFFF',
    accent: '#2680EB',
    shortCode: 'DC',
  },
  'Gujarat Titans': {
    primary: '#1B2133',
    secondary: '#B9975B',
    text: '#FFFFFF',
    accent: '#D4AF37',
    shortCode: 'GT',
  },
  'Lucknow Super Giants': {
    primary: '#00AEEF',
    secondary: '#F26722',
    text: '#FFFFFF',
    accent: '#33C4FF',
    shortCode: 'LSG',
  },
  'Sunrisers Hyderabad': {
    primary: '#F26522',
    secondary: '#111111',
    text: '#FFFFFF',
    accent: '#FF8547',
    shortCode: 'SRH',
  },
  'Punjab Kings': {
    primary: '#ED1B24',
    secondary: '#A7A9AC',
    text: '#FFFFFF',
    accent: '#FF4D52',
    shortCode: 'PBKS',
  },
  'India': {
    primary: '#0066CC',
    secondary: '#FF9933',
    text: '#FFFFFF',
    accent: '#3399FF',
    shortCode: 'IND',
  },
  'England': {
    primary: '#C8102E',
    secondary: '#012169',
    text: '#FFFFFF',
    accent: '#E63946',
    shortCode: 'ENG',
  },
  'Australia': {
    primary: '#006633',
    secondary: '#FFCC00',
    text: '#FFFFFF',
    accent: '#00994D',
    shortCode: 'AUS',
  },
  'Pakistan': {
    primary: '#004422',
    secondary: '#A3D977',
    text: '#FFFFFF',
    accent: '#118844',
    shortCode: 'PAK',
  },
  'South Africa': {
    primary: '#006A4E',
    secondary: '#FFB81C',
    text: '#FFFFFF',
    accent: '#00996B',
    shortCode: 'SA',
  },
  'New Zealand': {
    primary: '#111111',
    secondary: '#00A3E0',
    text: '#FFFFFF',
    accent: '#33B5E5',
    shortCode: 'NZ',
  },
  'West Indies': {
    primary: '#7B002C',
    secondary: '#FFD700',
    text: '#FFFFFF',
    accent: '#A01546',
    shortCode: 'WI',
  },
  'Bangladesh': {
    primary: '#006A4E',
    secondary: '#F42A41',
    text: '#FFFFFF',
    accent: '#00996B',
    shortCode: 'BAN',
  },
  'Sri Lanka': {
    primary: '#003399',
    secondary: '#FFCC00',
    text: '#FFFFFF',
    accent: '#2664D9',
    shortCode: 'SL',
  },
  'Afghanistan': {
    primary: '#0047AB',
    secondary: '#D32F2F',
    text: '#FFFFFF',
    accent: '#2A75D3',
    shortCode: 'AFG',
  },
};

export function getTeamTheme(teamName: string = ''): TeamTheme {
  // Direct match
  if (TEAM_THEMES[teamName]) {
    return TEAM_THEMES[teamName];
  }

  // Partial match
  const lower = teamName.toLowerCase();
  for (const [key, theme] of Object.entries(TEAM_THEMES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return theme;
    }
  }

  // Default theme
  return {
    primary: '#7545C8',
    secondary: '#171F35',
    text: '#F7F7FB',
    accent: '#9D72E8',
    shortCode: teamName.slice(0, 3).toUpperCase() || 'RR',
  };
}

export function getPlayerInitials(name: string = ''): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'CR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

