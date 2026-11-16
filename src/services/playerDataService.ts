import battersData from '../data/batters.json';
import bowlersData from '../data/bowlers.json';
import hiddenGemsData from '../data/hidden_gems.json';
import youngTalentsData from '../data/young_talents.json';
import auctionPlayersData from '../data/auction_players.json';
import headToHeadData from '../data/head_to_head_matrix.json';
import top20Data from '../data/top20_identities.json';
import metadataData from '../data/metadata.json';
import playerProfilesData from '../data/player_profiles.json';
import playerSummariesData from '../data/player_summaries.json';
import type {
  AuctionPlayer,
  Batter,
  Bowler,
  HeadToHeadMatrixData,
  HiddenGemPlayer,
  Metadata,
  PlayerProfileData,
  PlayerSummary,
  ShortlistEntry,
  YoungTalent,
} from '../types';
import { computeBatterDNA, computeBowlerDNA } from '../utils/analyticsEngine';

const batters = battersData as unknown as Batter[];
const bowlers = bowlersData as unknown as Bowler[];
const hiddenGems = hiddenGemsData as unknown as HiddenGemPlayer[];
const youngTalents = youngTalentsData as unknown as YoungTalent[];
const auctionPlayers = auctionPlayersData as unknown as AuctionPlayer[];
const headToHeadMatrix = headToHeadData as unknown as HeadToHeadMatrixData;
const metadata = metadataData as unknown as Metadata;
const playerProfiles = playerProfilesData as unknown as Record<string, PlayerProfileData>;
const playerSummaries = playerSummariesData as unknown as PlayerSummary[];
const top20Identities = top20Data as unknown as {
  batters: Array<Record<string, unknown>>;
  bowlers: Array<Record<string, unknown>>;
};

export interface UnifiedPlayerRecord {
  primaryId: string;
  name: string;
  normalizedName: string;
  country: string;
  countryFlag: string;
  role: string;
  roleType: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  team: string;
  isOverseas: boolean;
  batter?: Batter;
  bowler?: Bowler;
  hiddenGem?: HiddenGemPlayer;
  youngTalent?: YoungTalent;
  auction?: AuctionPlayer;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeRoleType(role: string, fallbackType?: 'batter' | 'bowler'): ShortlistEntry['roleType'] {
  const r = role.toLowerCase();
  if (r.includes('wicketkeeper') || r.includes('keeper') || r === 'wk') return 'wicketkeeper';
  if (r.includes('all-rounder') || r.includes('all rounder')) return 'all-rounder';
  if (r.includes('bowler') || r.includes('pacer') || r.includes('spinner') || r.includes('fast') || r.includes('orthodox') || r.includes('legbreak') || r.includes('offbreak')) {
    return 'bowler';
  }
  if (fallbackType === 'bowler') return 'bowler';
  return 'batter';
}

// Build single canonical index linking all JSON datasets without mutating underlying records
const unifiedByKey = new Map<string, UnifiedPlayerRecord>();
const idToRecord = new Map<string, UnifiedPlayerRecord>();
const nameToRecord = new Map<string, UnifiedPlayerRecord>();

function upsertRecord(
  id: string,
  name: string,
  defaults: {
    country: string;
    countryFlag: string;
    role: string;
    roleType: UnifiedPlayerRecord['roleType'];
    team: string;
  }
): UnifiedPlayerRecord {
  const norm = normalizeName(name);
  let rec = idToRecord.get(id) || nameToRecord.get(norm);
  if (!rec) {
    rec = {
      primaryId: id,
      name,
      normalizedName: norm,
      country: defaults.country,
      countryFlag: defaults.countryFlag,
      role: defaults.role,
      roleType: defaults.roleType,
      team: defaults.team,
      isOverseas: defaults.country !== 'India' && defaults.country !== 'IND',
    };
    unifiedByKey.set(id, rec);
  }
  idToRecord.set(id, rec);
  nameToRecord.set(norm, rec);
  return rec;
}

for (const b of batters) {
  const roleStr = b.player_role || 'Batter';
  const rec = upsertRecord(b.id, b.name, {
    country: b.country || 'International',
    countryFlag: b.country_flag || '🏏',
    role: roleStr,
    roleType: normalizeRoleType(roleStr, 'batter'),
    team: b.team || 'IPL / T20',
  });
  rec.batter = b;
}

for (const bw of bowlers) {
  const roleStr = bw.player_role || bw.bowlingType || 'Bowler';
  const rec = upsertRecord(bw.id, bw.name, {
    country: bw.country || 'International',
    countryFlag: bw.country_flag || '⚾',
    role: roleStr,
    roleType: normalizeRoleType(roleStr, 'bowler'),
    team: bw.team || 'IPL / T20',
  });
  rec.bowler = bw;
}

for (const g of hiddenGems) {
  const rec = upsertRecord(g.player_id, g.name, {
    country: g.country,
    countryFlag: g.country_flag,
    role: g.player_role,
    roleType: normalizeRoleType(g.player_role, g.role_type),
    team: g.team,
  });
  rec.hiddenGem = g;
}

for (const a of auctionPlayers) {
  const rec = upsertRecord(a.player_id, a.name, {
    country: a.country,
    countryFlag: a.country_flag,
    role: a.player_role,
    roleType: normalizeRoleType(a.player_role, a.role_type),
    team: a.current_franchise,
  });
  rec.auction = a;
  rec.isOverseas = a.is_overseas;
}

for (const y of youngTalents) {
  const rec = upsertRecord(y.id, y.name, {
    country: y.country,
    countryFlag: y.country_flag,
    role: y.primary_role,
    roleType: normalizeRoleType(y.primary_role, y.stats.bowling.wickets > y.stats.batting.runs / 15 ? 'bowler' : 'batter'),
    team: y.current_teams?.[0] || 'Domestic / U-19',
  });
  rec.youngTalent = y;
}

for (const s of playerSummaries) {
  upsertRecord(s.id, s.name, {
    country: s.country,
    countryFlag: s.countryFlag,
    role: s.role,
    roleType: normalizeRoleType(s.role),
    team: s.team,
  });
}

const allUnifiedPlayers = Array.from(new Set(unifiedByKey.values()));

export const playerDataService = {
  getMetadata(): Metadata {
    return metadata;
  },
  getPlayerProfile(idOrName: string): PlayerProfileData | undefined {
    if (!idOrName) return undefined;
    if (playerProfiles[idOrName]) return playerProfiles[idOrName];
    const rec = this.findPlayer(idOrName);
    if (rec && playerProfiles[rec.primaryId]) return playerProfiles[rec.primaryId];
    const norm = normalizeName(idOrName);
    const byName = Object.values(playerProfiles).find(p => normalizeName(p.name) === norm);
    if (byName) return byName;
    return undefined;
  },
  getAllPlayerSummaries(): PlayerSummary[] {
    return playerSummaries;
  },
  getAllPlayerProfiles(): Record<string, PlayerProfileData> {
    return playerProfiles;
  },
  getBatters(): Batter[] {
    return batters;
  },
  getBowlers(): Bowler[] {
    return bowlers;
  },
  getHiddenGems(): HiddenGemPlayer[] {
    return hiddenGems;
  },
  getYoungTalents(): YoungTalent[] {
    return youngTalents;
  },
  getAuctionPlayers(): AuctionPlayer[] {
    return auctionPlayers;
  },
  getH2HMatrix(): HeadToHeadMatrixData {
    return headToHeadMatrix;
  },
  getTop20Identities() {
    return top20Identities;
  },
  getAllUnifiedPlayers(): UnifiedPlayerRecord[] {
    return allUnifiedPlayers;
  },
  findPlayer(idOrName: string): UnifiedPlayerRecord | undefined {
    if (!idOrName) return undefined;
    return idToRecord.get(idOrName) || nameToRecord.get(normalizeName(idOrName));
  },
  resolveInspectable(
    idOrName: string,
    preferredType?: 'batter' | 'bowler'
  ): { player: Batter | Bowler; type: 'batter' | 'bowler' } | undefined {
    const rec = this.findPlayer(idOrName);
    if (!rec) return undefined;
    if (preferredType === 'bowler' && rec.bowler) return { player: rec.bowler, type: 'bowler' };
    if (preferredType === 'batter' && rec.batter) return { player: rec.batter, type: 'batter' };
    if (rec.batter && rec.bowler) {
      return rec.batter.rating >= rec.bowler.rating
        ? { player: rec.batter, type: 'batter' }
        : { player: rec.bowler, type: 'bowler' };
    }
    if (rec.batter) return { player: rec.batter, type: 'batter' };
    if (rec.bowler) return { player: rec.bowler, type: 'bowler' };

    const prof = playerProfiles[rec.primaryId] || this.getPlayerProfile(idOrName);
    if (prof) {
      if (prof.primaryRole === 'Bowler' || (prof.bowling.wickets > prof.batting.runs / 20)) {
        const synthBowler: Bowler = {
          rank: prof.rankings.bowlerRank || prof.rankings.overallRank,
          id: prof.id,
          name: prof.name,
          team: prof.team,
          teams: prof.teams,
          bowlingType: prof.bowlingStyle,
          matchesAnalysed: prof.totalMatches,
          pressureMatches: Math.max(1, Math.round(prof.totalMatches * 0.2)),
          totalOvers: parseFloat(prof.bowling.overs) || 1,
          totalEcon: prof.bowling.economy,
          totalWickets: prof.bowling.wickets,
          overallBowlingAvg: prof.bowling.avg,
          overallWicketSR: prof.bowling.sr,
          overallDotPct: prof.bowling.dotPct,
          bestBowling: prof.bowling.bestBowling,
          normalOvers: parseFloat(prof.bowling.overs) || 1,
          normalEcon: prof.bowling.economy,
          pressureLegalBalls: Math.round(prof.bowling.totalBalls * 0.2),
          pressureOvers: Math.round((prof.bowling.totalBalls * 0.2) / 6),
          pressureRunsConceded: Math.round(prof.bowling.runsConceded * 0.2),
          pressureEcon: prof.bowling.deathEcon || prof.bowling.economy,
          econDelta: 0,
          pressureWickets: Math.round(prof.bowling.wickets * 0.2),
          dotPct: prof.bowling.dotPct,
          wicketSR: prof.bowling.sr,
          bowlingAvg: prof.bowling.avg,
          deathEcon: prof.bowling.deathEcon,
          deathPressureWickets: 1,
          consistencyScore: prof.rankings.consistencyScore,
          confidenceWeight: 0.8,
          rating: prof.rankings.pressureIndex,
          verdict: `${prof.name} is an active squad competitor with ${prof.bowling.wickets} wickets across ${prof.totalMatches} matches.`,
          country: prof.country,
          country_code: prof.countryCode,
          country_flag: prof.countryFlag,
          avatar_icon: prof.avatarIcon,
          player_role: prof.primaryRole,
          ipl: { balls: 0, overs: 0, runs: 0, wickets: 0, econ: 0 },
          t20i: { balls: prof.bowling.totalBalls, overs: parseFloat(prof.bowling.overs), runs: prof.bowling.runsConceded, wickets: prof.bowling.wickets, econ: prof.bowling.economy }
        };
        return { player: synthBowler, type: 'bowler' };
      } else {
        const synthBatter: Batter = {
          rank: prof.rankings.batterRank || prof.rankings.overallRank,
          id: prof.id,
          name: prof.name,
          team: prof.team,
          teams: prof.teams,
          matchesAnalysed: prof.totalMatches,
          pressureMatches: Math.max(1, Math.round(prof.totalMatches * 0.2)),
          totalBalls: prof.batting.balls,
          totalRuns: prof.batting.runs,
          totalSR: prof.batting.sr,
          battingAvg: prof.batting.avg,
          highestScore: prof.batting.highestScore,
          highestScoreNotOut: prof.batting.highestScoreNotOut,
          totalFours: prof.batting.fours,
          totalSixes: prof.batting.sixes,
          normalBalls: prof.batting.balls,
          normalRuns: prof.batting.runs,
          normalSR: prof.batting.sr,
          pressureBalls: Math.round(prof.batting.balls * 0.2),
          pressureRuns: Math.round(prof.batting.runs * 0.2),
          pressureSR: prof.batting.deathSR || prof.batting.sr,
          srDelta: 0,
          boundaryPct: prof.batting.boundaryPct,
          fours: prof.batting.fours,
          sixes: prof.batting.sixes,
          dismissalRate: prof.batting.avg,
          dismissals: Math.max(0, prof.totalBatInnings - prof.batting.notOuts),
          dotPct: prof.batting.dotPct,
          deathSR: prof.batting.deathSR,
          chaseSR: prof.batting.sr,
          consistencyScore: prof.rankings.consistencyScore,
          confidenceWeight: 0.8,
          rating: prof.rankings.pressureIndex,
          verdict: `${prof.name} has scored ${prof.batting.runs} runs in ${prof.totalMatches} matches at a strike rate of ${prof.batting.sr}.`,
          country: prof.country,
          country_code: prof.countryCode,
          country_flag: prof.countryFlag,
          avatar_icon: prof.avatarIcon,
          player_role: prof.primaryRole,
          ipl: { balls: 0, runs: 0, sr: 0 },
          t20i: { balls: prof.batting.balls, runs: prof.batting.runs, sr: prof.batting.sr }
        };
        return { player: synthBatter, type: 'batter' };
      }
    }
    return undefined;
  },
  findAuctionCandidate(idOrName: string): AuctionPlayer | undefined {
    const rec = this.findPlayer(idOrName);
    if (rec?.auction) return rec.auction;
    const norm = normalizeName(idOrName);
    return auctionPlayers.find(
      (a) => a.player_id === idOrName || normalizeName(a.name) === norm
    );
  },
  toShortlistEntry(
    idOrName: string,
    sourceModule: string,
    priority: ShortlistEntry['priority'] = 'high',
    notes = ''
  ): ShortlistEntry | null {
    const rec = this.findPlayer(idOrName);
    if (!rec) return null;

    let bpi = 0;
    let keyMetric = '';
    if (rec.batter) {
      bpi = rec.batter.rating;
      keyMetric = `Press SR ${rec.batter.pressureSR.toFixed(1)} · Avg ${(rec.batter.battingAvg ?? 0).toFixed(1)}`;
    } else if (rec.bowler) {
      bpi = rec.bowler.rating;
      keyMetric = `Press Econ ${rec.bowler.pressureEcon.toFixed(2)} · ${rec.bowler.totalWickets} wkts`;
    } else if (rec.youngTalent) {
      bpi = rec.youngTalent.scores.overall_talent_score;
      keyMetric = `Talent Score ${rec.youngTalent.scores.overall_talent_score}/100 · Age ${rec.youngTalent.age}`;
    } else if (rec.hiddenGem) {
      bpi = rec.hiddenGem.bpi_rating;
      keyMetric = `Gem ${rec.hiddenGem.hidden_gem_score}/100 · ${rec.hiddenGem.pressure_metric}`;
    } else if (rec.auction) {
      bpi = rec.auction.bpi_rating;
      keyMetric = rec.auction.key_stat;
    }

    return {
      playerId: rec.primaryId,
      name: rec.name,
      role: rec.role,
      roleType: rec.roleType,
      country: rec.country,
      countryFlag: rec.countryFlag,
      team: rec.team,
      bpiRating: parseFloat(bpi.toFixed(1)),
      keyMetric,
      sourceModule,
      notes,
      priority,
      addedAt: new Date().toISOString(),
    };
  },
};

export function generateScoutingReportMarkdown(
  player: Batter | Bowler,
  type: 'batter' | 'bowler'
): string {
  const unified = playerDataService.findPlayer(player.id) || playerDataService.findPlayer(player.name);
  const dna = type === 'batter' ? computeBatterDNA(player as Batter) : computeBowlerDNA(player as Bowler);
  const lines: string[] = [
    `# SupeRR Selector 2.0 — Official Player Scouting Dossier`,
    ``,
    `**Player:** ${player.name} (${player.country_flag} ${player.country})`,
    `**Role:** ${player.player_role} | **Primary Team:** ${player.team}`,
    `**Role Classification:** ${type === 'batter' ? 'Batting Specialist / Batter' : 'Bowling Specialist / Bowler'}`,
    `**Audited BPI Rating:** ${player.rating.toFixed(1)} / 100 (Confidence Weight: ${player.confidenceWeight.toFixed(2)}x — ${dna.confidence.label})`,
    `**Overall Player DNA Index:** ${dna.overallDNA} / 100`,
    ``,
    `---`,
    `## 1. Core Statistical Telemetry (CSV-Derived)`,
  ];

  if (type === 'batter') {
    const b = player as Batter;
    lines.push(
      `- **Matches Analysed:** ${b.matchesAnalysed} (${b.pressureMatches} pressure matches)`,
      `- **Career Volume:** ${b.totalRuns} runs off ${b.totalBalls} balls (Highest: ${b.highestScore ?? 'N/A'}${b.highestScoreNotOut ? '*' : ''})`,
      `- **Batting Average:** ${b.battingAvg !== undefined ? b.battingAvg.toFixed(1) : 'N/A'} | **Overall SR:** ${b.totalSR.toFixed(1)}`,
      `- **Pressure Strike Rate:** ${b.pressureSR.toFixed(1)} (${b.pressureRuns} runs / ${b.pressureBalls} balls)`,
      `- **Normal Phase Strike Rate:** ${b.normalSR.toFixed(1)} | **Pressure Delta (Δ):** ${b.srDelta >= 0 ? '+' : ''}${b.srDelta.toFixed(1)}`,
      `- **Boundaries:** ${b.totalFours ?? 0} fours, ${b.totalSixes ?? 0} sixes (${(b.totalBoundaryPct ?? b.boundaryPct).toFixed(1)}% boundary balls)`,
      `- **Phase Splits (SR):** Powerplay ${(b.powerplaySR ?? 0).toFixed(1)} | Middle ${(b.middleSR ?? 0).toFixed(1)} | Death ${(b.deathOverallSR ?? b.deathSR).toFixed(1)}`,
      `- **Chase Pressure SR:** ${b.chaseSR.toFixed(1)} | **Consistency Index:** ${b.consistencyScore.toFixed(1)}/100`
    );
  } else {
    const bw = player as Bowler;
    lines.push(
      `- **Matches Analysed:** ${bw.matchesAnalysed} (${bw.pressureMatches} pressure matches)`,
      `- **Career Volume:** ${bw.totalWickets} wickets in ${bw.totalOvers} overs (Best: ${bw.bestBowling ?? 'N/A'}, Maidens: ${bw.maidenOvers ?? 0})`,
      `- **Economy:** Overall ${bw.totalEcon.toFixed(2)} | Pressure ${bw.pressureEcon.toFixed(2)} | Normal ${bw.normalEcon.toFixed(2)} (Δ +${bw.econDelta.toFixed(2)})`,
      `- **Bowling Average / Strike Rate:** Avg ${bw.overallBowlingAvg?.toFixed(1) ?? 'N/A'} | Career SR ${bw.overallWicketSR?.toFixed(1) ?? 'N/A'} balls/wkt`,
      `- **Dot Ball Percentage:** ${(bw.overallDotPct ?? bw.dotPct).toFixed(1)}% (Pressure Dot%: ${bw.dotPct.toFixed(1)}%)`,
      `- **Phase Economy Splits:** Powerplay ${(bw.powerplayEcon ?? 0).toFixed(2)} (${bw.powerplayWickets ?? 0}w) | Middle ${(bw.middleEcon ?? 0).toFixed(2)} (${bw.middleWickets ?? 0}w) | Death ${(bw.deathOverallEcon ?? bw.deathEcon).toFixed(2)} (${bw.deathPressureWickets} press wkts)`,
      `- **Consistency Index:** ${bw.consistencyScore.toFixed(1)}/100`
    );
  }

  lines.push(
    ``,
    `## 2. 6-Axis Player DNA Breakdown`,
    ...dna.dimensions.map((d) => `- **${d.axis}:** ${d.score}/100 (${d.rawLabel})`),
    ``,
    `## 3. Tactical Strengths & Risks`,
    `**Key Strengths:**`,
    ...dna.strengths.map((s) => `- ${s}`),
    ``,
    `**Identified Risk / Development Areas:**`,
    ...dna.weaknesses.map((w) => `- ${w}`)
  );

  if (dna.confidence.warning) {
    lines.push(``, `> **Sample-Size Caution:** ${dna.confidence.warning}`);
  }

  if (unified?.hiddenGem) {
    lines.push(
      ``,
      `## 4. Hidden Gem Intelligence`,
      `- **Hidden Gem Score:** ${unified.hiddenGem.hidden_gem_score}/100 (${unified.hiddenGem.gem_tag})`,
      `- **Scouting Note:** ${unified.hiddenGem.why_scout}`
    );
  }

  if (unified?.auction) {
    lines.push(
      ``,
      `## 5. Auction Simulation Profile`,
      `- **Base Price:** ₹${unified.auction.base_price_cr.toFixed(2)} Cr | **Estimated Valuation:** ₹${unified.auction.estimated_valuation_cr.toFixed(2)} Cr`,
      `- **Overseas Status:** ${unified.auction.is_overseas ? 'Overseas' : 'Indian Domestic'}`
    );
  }

  lines.push(
    ``,
    `---`,
    `*Generated from SupeRR Selector 2.0 Audited Cricket Analytics Engine (${metadata.totalDeliveries.toLocaleString()} deliveries across ${metadata.totalMatches} T20/IPL/T20I matches).*`
  );
  return lines.join('\n');
}

export function downloadScoutingReport(player: Batter | Bowler, type: 'batter' | 'bowler'): void {
  const markdown = generateScoutingReportMarkdown(player, type);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = player.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = url;
  a.download = `superr-scouting-report-${slug}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
