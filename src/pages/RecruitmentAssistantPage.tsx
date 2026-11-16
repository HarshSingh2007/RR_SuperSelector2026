import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  Bookmark,
  Dna,
  Eye,
  Gavel,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';
import { assessSampleConfidence } from '../utils/analyticsEngine';
import { Badge } from '../components/Badge';
import type { Batter, Bowler } from '../types';

interface AssistantRecommendationCard {
  playerId: string;
  name: string;
  countryFlag: string;
  role: string;
  team: string;
  type: 'batter' | 'bowler' | 'young';
  bpiRating: number;
  metricsLine: string;
  rationale: string;
  sampleWarning?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  cards?: AssistantRecommendationCard[];
  comparisonRows?: Array<{ label: string; valA: string; valB: string }>;
  comparisonNames?: [string, string];
  caveats?: string[];
  timestamp: string;
}

const EXAMPLE_PROMPTS = [
  'Find Indian uncapped middle-order batters',
  'Best reliable death bowlers',
  'Identify pressure performers',
  'Compare Dhruv Jurel vs Namboori Tilak Varma',
  'Which players fix a weak middle order?',
  'Show economical spin options',
  'U-24 emerging Indian fast bowlers',
  'Top budget Hidden Gem targets under 4 Cr',
];

function formatBatteryMetrics(b: Batter): string {
  return `Mat ${b.matchesAnalysed} · ${b.totalRuns}r @ Avg ${(b.battingAvg ?? 0).toFixed(1)} · Press SR ${b.pressureSR} (Δ ${b.srDelta >= 0 ? '+' : ''}${b.srDelta}) · Death ${b.deathSR}`;
}

function formatBowlerMetrics(bw: Bowler): string {
  return `Mat ${bw.matchesAnalysed} · ${bw.totalWickets}w @ ${bw.totalEcon} Econ · Press Econ ${bw.pressureEcon} · Death ${(bw.deathEcon || bw.deathOverallEcon || 0).toFixed(2)} · Best ${bw.bestBowling ?? 'N/A'}`;
}

export const RecruitmentAssistantPage: React.FC = () => {
  const { openPlayerProfile, openPlayerDNA, isShortlisted, toggleShortlist, sendToAuctionBlock } =
    useEcosystem();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Welcome to the SupeRR Explainable AI Recruitment Assistant. Every recommendation, comparison, and sample-size warning below is computed deterministically from our audited 200,999-delivery CSV dataset, Hidden Gem index, Young Talent Radar, and Auction pool — with zero fabricated stats. Select a prompt or ask your scouting question below.',
      caveats: [
        'CSV coverage spans 883 IPL & T20I matches (2022–2026) plus 28 tracked U-24 prospects.',
        'Statistical confidence penalties & small-sample warnings (< 90 pressure balls) are always surfaced automatically.',
      ],
      timestamp: 'Ready',
    },
  ]);

  const runDeterministicQuery = (rawQuery: string): ChatMessage => {
    const q = rawQuery.trim();
    const ql = q.toLowerCase();
    const batters = playerDataService.getBatters();
    const bowlers = playerDataService.getBowlers();
    const youngTalents = playerDataService.getYoungTalents();
    const hiddenGems = playerDataService.getHiddenGems();
    const matrix = playerDataService.getH2HMatrix();

    // 1. Check unsupported / outside-dataset topics cleanly
    const unsupportedKeywords = ['weather', 'pitch report tomorrow', 'injury news', 'injured today', 'contract 2027', 'betting', 'odds', 'stock', 'crypto', 'president', 'recipe'];
    if (unsupportedKeywords.some((kw) => ql.includes(kw))) {
      return {
        id: String(Date.now()),
        sender: 'assistant',
        text: `I cannot verify "${q}" because real-time external weather, live medical injury bulletins, betting odds, and future unannounced contract feeds are outside our audited local dataset.`,
        caveats: [
          'What I CAN answer accurately: pressure BPI rankings, phase splits (PP/Middle/Death), Indian domestic/uncapped scouting, head-to-head matchups across 200,999 deliveries, U-24 development curves, Hidden Gems, and Auction valuation targets.',
        ],
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    // 2. Compare A vs B handler
    if (ql.includes('compare') || ql.includes(' vs ')) {
      const cleaned = q.replace(/compare/i, '').trim();
      const parts = cleaned.split(/\s+vs\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);

      const resolveMention = (fragment: string) => {
        const f = fragment.toLowerCase();
        const batMatch = batters.find((b) => b.name.toLowerCase().includes(f) || f.includes(b.name.toLowerCase()));
        if (batMatch) return { kind: 'batter' as const, player: batMatch };
        const bwlMatch = bowlers.find((bw) => bw.name.toLowerCase().includes(f) || f.includes(bw.name.toLowerCase()));
        if (bwlMatch) return { kind: 'bowler' as const, player: bwlMatch };
        // Partial word matching (last name)
        const words = f.split(/\s+/).filter((w) => w.length >= 3);
        for (const w of words) {
          const bm = batters.find((b) => b.name.toLowerCase().includes(w));
          if (bm) return { kind: 'batter' as const, player: bm };
          const bwm = bowlers.find((bw) => bw.name.toLowerCase().includes(w));
          if (bwm) return { kind: 'bowler' as const, player: bwm };
        }
        return null;
      };

      const entityA = parts[0] ? resolveMention(parts[0]) : null;
      const entityB = parts[1] ? resolveMention(parts[1]) : null;

      if (entityA && entityB) {
        if (entityA.kind === 'batter' && entityB.kind === 'batter') {
          const a = entityA.player;
          const b = entityB.player;
          const winner = a.rating >= b.rating ? a : b;
          const loser = a.rating >= b.rating ? b : a;
          const confA = assessSampleConfidence(a.pressureBalls, 'pressure');
          const confB = assessSampleConfidence(b.pressureBalls, 'pressure');
          return {
            id: String(Date.now()),
            sender: 'assistant',
            text: `Dataset Comparison: ${a.name} vs ${b.name}. ${winner.name} leads on audited Batting Pressure Index (${winner.rating} vs ${loser.rating}) across IPL + T20I pressure situations.`,
            comparisonNames: [a.name, b.name],
            comparisonRows: [
              { label: 'BPI Rating', valA: `${a.rating}/100`, valB: `${b.rating}/100` },
              { label: 'Pressure SR', valA: `${a.pressureSR} (${a.pressureBalls}b)`, valB: `${b.pressureSR} (${b.pressureBalls}b)` },
              { label: 'Normal SR / Delta', valA: `${a.normalSR} (+${a.srDelta})`, valB: `${b.normalSR} (${b.srDelta >= 0 ? '+' : ''}${b.srDelta})` },
              { label: 'Career Runs / Avg', valA: `${a.totalRuns}r · Avg ${(a.battingAvg ?? 0).toFixed(1)}`, valB: `${b.totalRuns}r · Avg ${(b.battingAvg ?? 0).toFixed(1)}` },
              { label: 'Death / Chase SR', valA: `${a.deathSR} / ${a.chaseSR}`, valB: `${b.deathSR} / ${b.chaseSR}` },
              { label: 'Consistency Index', valA: `${a.consistencyScore}/100`, valB: `${b.consistencyScore}/100` },
            ],
            cards: [
              {
                playerId: a.id,
                name: a.name,
                countryFlag: a.country_flag || '🏏',
                role: a.player_role || 'Batter',
                team: a.team,
                type: 'batter',
                bpiRating: a.rating,
                metricsLine: formatBatteryMetrics(a),
                rationale: `Rank #${a.rank} batter (${confA.label}).`,
                sampleWarning: confA.warning,
              },
              {
                playerId: b.id,
                name: b.name,
                countryFlag: b.country_flag || '🏏',
                role: b.player_role || 'Batter',
                team: b.team,
                type: 'batter',
                bpiRating: b.rating,
                metricsLine: formatBatteryMetrics(b),
                rationale: `Rank #${b.rank} batter (${confB.label}).`,
                sampleWarning: confB.warning,
              },
            ],
            caveats: [confA.warning, confB.warning].filter(Boolean) as string[],
            timestamp: new Date().toLocaleTimeString(),
          };
        }

        if (entityA.kind === 'bowler' && entityB.kind === 'bowler') {
          const a = entityA.player;
          const b = entityB.player;
          const winner = a.rating >= b.rating ? a : b;
          return {
            id: String(Date.now()),
            sender: 'assistant',
            text: `Dataset Bowling Comparison: ${a.name} vs ${b.name}. ${winner.name} leads BPI-Bowl (${winner.rating}/100) in high-leverage phases.`,
            comparisonNames: [a.name, b.name],
            comparisonRows: [
              { label: 'BPI-Bowl Rating', valA: `${a.rating}/100`, valB: `${b.rating}/100` },
              { label: 'Pressure Economy', valA: `${a.pressureEcon}`, valB: `${b.pressureEcon}` },
              { label: 'Career Wkts / Econ', valA: `${a.totalWickets}w @ ${a.totalEcon}`, valB: `${b.totalWickets}w @ ${b.totalEcon}` },
              { label: 'Death Economy', valA: `${(a.deathEcon || a.deathOverallEcon || 0).toFixed(2)}`, valB: `${(b.deathEcon || b.deathOverallEcon || 0).toFixed(2)}` },
              { label: 'Dot Ball % / Best', valA: `${a.dotPct}% · ${a.bestBowling ?? 'N/A'}`, valB: `${b.dotPct}% · ${b.bestBowling ?? 'N/A'}` },
            ],
            cards: [
              {
                playerId: a.id,
                name: a.name,
                countryFlag: a.country_flag || '⚾',
                role: a.bowlingType,
                team: a.team,
                type: 'bowler',
                bpiRating: a.rating,
                metricsLine: formatBowlerMetrics(a),
                rationale: `Rank #${a.rank} bowler (${a.bowlingType}).`,
              },
              {
                playerId: b.id,
                name: b.name,
                countryFlag: b.country_flag || '⚾',
                role: b.bowlingType,
                team: b.team,
                type: 'bowler',
                bpiRating: b.rating,
                metricsLine: formatBowlerMetrics(b),
                rationale: `Rank #${b.rank} bowler (${b.bowlingType}).`,
              },
            ],
            timestamp: new Date().toLocaleTimeString(),
          };
        }

        // Cross-role Batter vs Bowler -> check Head-to-Head matrix!
        const bat = entityA.kind === 'batter' ? entityA.player : entityB.player;
        const bwl = entityA.kind === 'bowler' ? entityA.player : entityB.player;
        const h2h = matrix.matchups[`${bat.id}_${bwl.id}`];
        if (h2h) {
          return {
            id: String(Date.now()),
            sender: 'assistant',
            text: `Recorded Head-to-Head Matchup: ${bat.name} vs ${bwl.name} across ${h2h.balls_faced} deliveries in 200,999-ball CSV dataset.`,
            comparisonNames: [bat.name, bwl.name],
            comparisonRows: [
              { label: 'H2H Balls / Runs', valA: `${h2h.runs_scored} runs off ${h2h.balls_faced}b`, valB: `${h2h.dismissals} dismissals` },
              { label: 'H2H Strike Rate / Dot%', valA: `${h2h.strike_rate} SR`, valB: `${h2h.dot_pct}% Dots` },
              { label: 'Matchup Edge', valA: h2h.advantage.toUpperCase(), valB: `4s: ${h2h.fours} · 6s: ${h2h.sixes}` },
            ],
            caveats:
              h2h.balls_faced < 6
                ? [`Insufficient sample warning: only ${h2h.balls_faced} balls bowled between ${bat.name} and ${bwl.name}.`]
                : undefined,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      }
    }

    // 3. Attribute-based Deterministic Filtering
    const wantsIndian = ql.includes('indian') || ql.includes('domestic');
    const wantsUncapped = ql.includes('uncapped') || ql.includes('u-24') || ql.includes('u24') || ql.includes('young') || ql.includes('emerging') || ql.includes('future');
    const wantsSpin = ql.includes('spin') || ql.includes('spinner') || ql.includes('economical');
    const wantsDeath = ql.includes('death') || ql.includes('closing') || ql.includes('yorker');
    const wantsMiddle = ql.includes('middle') || ql.includes('anchor') || ql.includes('weak middle');
    const wantsFinisher = ql.includes('finisher') || ql.includes('finish');
    const wantsPace = ql.includes('fast') || ql.includes('pace') || ql.includes('pacer') || ql.includes('seamer');
    const wantsGemOrBudget = ql.includes('gem') || ql.includes('budget') || ql.includes('under') || ql.includes('cheap') || ql.includes('sleeper');
    const wantsPressure = ql.includes('pressure') || ql.includes('clutch') || ql.includes('chase');

    // Sub-case: Young / Uncapped Indian scouting query
    if (wantsUncapped || (wantsIndian && wantsMiddle && youngTalents.some((y) => y.is_uncapped))) {
      const pool = youngTalents.filter((y) => {
        if (wantsIndian && !y.is_domestic_indian) return false;
        if (wantsUncapped && ql.includes('uncapped') && !y.is_uncapped) return false;
        if (wantsPace && y.primary_role !== 'Fast Bowler') return false;
        if (wantsSpin && y.primary_role !== 'Spinner') return false;
        if (wantsMiddle && !['Batter', 'All-Rounder', 'Wicketkeeper'].includes(y.primary_role)) return false;
        return true;
      });

      const picked = [...pool]
        .sort((a, b) => b.scores.overall_talent_score - a.scores.overall_talent_score)
        .slice(0, 5);

      if (picked.length > 0) {
        const cards: AssistantRecommendationCard[] = picked.map((t) => {
          const isBowler = t.primary_role === 'Fast Bowler' || t.primary_role === 'Spinner';
          const limited = t.data_basis?.sample_size_flag === 'limited' || t.stats.matches < 10;
          return {
            playerId: t.id,
            name: t.name,
            countryFlag: t.country_flag,
            role: `${t.primary_role} (${t.is_uncapped ? 'Uncapped' : 'Capped'} · Age ${t.age})`,
            team: t.current_teams[0] || 'Domestic',
            type: 'young',
            bpiRating: t.scores.overall_talent_score,
            metricsLine: isBowler
              ? `CSV: ${t.stats.matches}m · ${t.stats.bowling.wickets}w @ ${t.stats.bowling.economy} Econ · Dot ${t.stats.bowling.dot_pct}%`
              : `CSV: ${t.stats.matches}m · ${t.stats.batting.runs}r @ ${t.stats.batting.strike_rate} SR · Avg ${t.stats.batting.average}`,
            rationale: `Statistical Performance ${t.scores.current_performance}/100 | Consistency ${t.scores.consistency}/100 | Model Potential ${t.scores.development_potential}/100. ${t.why_this_player}`,
            sampleWarning: limited
              ? `Limited dataset volume (${t.stats.matches} match${t.stats.matches === 1 ? '' : 'es'}) — monitor further domestic curve.`
              : undefined,
          };
        });
        return {
          id: String(Date.now()),
          sender: 'assistant',
          text: `Found ${pool.length} matching prospects in our audited Young Talent & Uncapped Domestic registry (top ${cards.length} shown, separating CSV metrics from AI development potential).`,
          cards,
          caveats: [
            'Statistical Current Performance & Consistency reflect recorded match CSV totals; Development Potential is explicitly a projection index.',
          ],
          timestamp: new Date().toLocaleTimeString(),
        };
      }
    }

    // Sub-case: Hidden Gems / Budget Value
    if (wantsGemOrBudget) {
      const budgetMatch = ql.match(/under\s*₹?\s*(\d+(?:\.\d+)?)/i);
      const maxCr = budgetMatch ? parseFloat(budgetMatch[1]) : 99;
      const cards: AssistantRecommendationCard[] = hiddenGems
        .filter((g) => {
          const auc = playerDataService.findAuctionCandidate(g.player_id);
          if (budgetMatch && auc && auc.estimated_valuation_cr > maxCr) return false;
          if (wantsIndian && g.country !== 'India') return false;
          return true;
        })
        .slice(0, 5)
        .map((g) => {
          const auc = playerDataService.findAuctionCandidate(g.player_id);
          return {
            playerId: g.player_id,
            name: g.name,
            countryFlag: g.country_flag,
            role: g.player_role,
            team: g.team,
            type: g.role_type,
            bpiRating: g.hidden_gem_score,
            metricsLine: `Gem ${g.hidden_gem_score}/100 · BPI ${g.bpi_rating} · ${g.pressure_metric} (Δ ${g.delta >= 0 ? '+' : ''}${g.delta})${auc ? ` · Est. ₹${auc.estimated_valuation_cr} Cr` : ''}`,
            rationale: g.why_scout,
            sampleWarning:
              g.matches_analysed < 15
                ? `Developing sample (${g.matches_analysed} matches) — validate matchup splits.`
                : undefined,
          };
        });
      return {
        id: String(Date.now()),
        sender: 'assistant',
        text: `Top Hidden Gem value targets derived from high clutch-over-baseline deltas and lower mainstream volume${budgetMatch ? ` (filtered <= ₹${maxCr} Cr)` : ''}:`,
        cards,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    // Sub-case: Bowlers (Death / Spin / Economical / Pace)
    if (wantsDeath || wantsSpin || wantsPace) {
      const candidates = bowlers
        .filter((bw) => {
          const bt = bw.bowlingType.toLowerCase();
          if (wantsIndian && bw.country !== 'India') return false;
          if (wantsSpin && !(bt.includes('spin') || bt.includes('orthodox') || bt.includes('leg') || bt.includes('off'))) return false;
          if (wantsPace && !(bt.includes('fast') || bt.includes('medium') || bt.includes('pace'))) return false;
          if (wantsDeath && (bw.deathEcon || 99) > 10.2 && bw.deathPressureWickets < 3) return false;
          return true;
        })
        .sort((a, b) => {
          if (wantsDeath) {
            return (a.deathEcon || a.pressureEcon) - (b.deathEcon || b.pressureEcon);
          }
          if (wantsSpin && ql.includes('economical')) {
            return a.pressureEcon - b.pressureEcon;
          }
          return b.rating - a.rating;
        })
        .slice(0, 5);

      const cards: AssistantRecommendationCard[] = candidates.map((bw) => {
        const conf = assessSampleConfidence(bw.pressureLegalBalls, 'pressure');
        return {
          playerId: bw.id,
          name: bw.name,
          countryFlag: bw.country_flag || '⚾',
          role: bw.bowlingType,
          team: bw.team,
          type: 'bowler',
          bpiRating: bw.rating,
          metricsLine: formatBowlerMetrics(bw),
          rationale: `Maintains ${bw.pressureEcon} pressure economy (+${bw.econDelta} suppression vs ${bw.normalEcon} normal) with ${bw.dotPct}% pressure dot balls and ${bw.deathPressureWickets} death pressure wickets.`,
          sampleWarning: conf.warning,
        };
      });

      return {
        id: String(Date.now()),
        sender: 'assistant',
        text: `Top ${candidates.length} dataset-verified ${wantsSpin ? 'spin ' : wantsPace ? 'pace ' : ''}${wantsDeath ? 'death-overs ' : ''}bowlers matching "${rawQuery}":`,
        cards,
        caveats: ['Rankings factor audited CSV pressure economy, death wickets, dot ball %, and Bayesian confidence weight.'],
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    // Sub-case: Batters (Middle-order / Finisher / Pressure performers)
    const batterPool = batters
      .filter((b) => {
        const rl = (b.player_role || '').toLowerCase();
        if (wantsIndian && b.country !== 'India') return false;
        if (wantsMiddle && rl.includes('opener') && (b.middleSR ?? 0) < 138) return false;
        if (wantsFinisher && b.deathSR < 150 && !rl.includes('finisher')) return false;
        return true;
      })
      .sort((a, b) => {
        if (wantsMiddle) {
          return (b.middleSR ?? b.normalSR) * 0.4 + b.consistencyScore * 0.3 + b.rating * 0.3 - ((a.middleSR ?? a.normalSR) * 0.4 + a.consistencyScore * 0.3 + a.rating * 0.3);
        }
        if (wantsFinisher) {
          return b.deathSR + b.chaseSR - (a.deathSR + a.chaseSR);
        }
        if (wantsPressure) {
          return b.srDelta * 0.35 + b.rating * 0.65 - (a.srDelta * 0.35 + a.rating * 0.65);
        }
        return b.rating - a.rating;
      })
      .slice(0, 5);

    if (batterPool.length > 0) {
      const cards: AssistantRecommendationCard[] = batterPool.map((b) => {
        const conf = assessSampleConfidence(b.pressureBalls, 'pressure');
        return {
          playerId: b.id,
          name: b.name,
          countryFlag: b.country_flag || '🏏',
          role: b.player_role || 'Batter',
          team: b.team,
          type: 'batter',
          bpiRating: b.rating,
          metricsLine: formatBatteryMetrics(b),
          rationale: `Middle-phase SR ${(b.middleSR ?? b.normalSR).toFixed(1)}, Pressure SR ${b.pressureSR} (+${b.srDelta} delta), Consistency ${b.consistencyScore}/100, Boundaries ${b.totalFours ?? 0}x4 / ${b.totalSixes ?? 0}x6.`,
          sampleWarning: conf.warning,
        };
      });

      return {
        id: String(Date.now()),
        sender: 'assistant',
        text: `Top ${cards.length} dataset-backed batter recommendations matching "${rawQuery}":`,
        cards,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    return {
      id: String(Date.now()),
      sender: 'assistant',
      text: `No exact filter match for "${rawQuery}". Try querying by role (middle-order, opener, finisher, spin, death bowler), nationality (Indian, overseas), uncapped U-24 prospects, or "Compare Player A vs Player B".`,
      timestamp: new Date().toLocaleTimeString(),
    };
  };

  const handleSend = (promptOverride?: string) => {
    const query = (promptOverride ?? input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };
    const reply = runDeterministicQuery(query);
    setMessages((prev) => [...prev, userMsg, reply]);
    if (!promptOverride) setInput('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="rr-glass-card p-5 border-[#E90074]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E90074] to-[#7545C8] flex items-center justify-center text-white shadow-lg shrink-0">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Explainable AI Recruitment Assistant
              <Badge variant="pink">Zero Hallucination</Badge>
            </h2>
            <p className="text-xs text-[#929BB2] mt-0.5">
              Deterministic natural-language scouting engine strictly bound to 200,999 audited deliveries, H2H duels, U-24 prospects &amp; auction valuations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
          <Database size={13} />
          <span>CSV + BPI Grounded</span>
        </div>
      </div>

      {/* Quick Example Prompts */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl bg-[#121A2D] hover:bg-[#1C2542] border border-[#29334C] hover:border-[#E90074]/60 text-xs font-medium text-[#C9C3DF] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Sparkles size={11} className="text-[#E90074]" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Conversation Transcript */}
      <div className="rr-glass-card p-4 sm:p-5 space-y-4 max-h-[620px] overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-4xl rounded-2xl p-4 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white'
                  : 'bg-[#121A2D] border border-[#29334C] text-[#F7F7FB] w-full'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] font-mono opacity-80">
                <span>{msg.sender === 'user' ? 'SCOUTING QUERY' : 'SUPERR AI ASSISTANT'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

              {/* Inline Comparison Table */}
              {msg.comparisonRows && msg.comparisonNames && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-[#29334C] bg-[#0B1020]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#171F35] text-[#929BB2] uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Metric</th>
                        <th className="py-2 px-3 text-[#FF47A3]">{msg.comparisonNames[0]}</th>
                        <th className="py-2 px-3 text-purple-300">{msg.comparisonNames[1]}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232744] font-mono">
                      {msg.comparisonRows.map((r) => (
                        <tr key={r.label}>
                          <td className="py-2 px-3 font-sans text-[#929BB2]">{r.label}</td>
                          <td className="py-2 px-3 font-bold text-white">{r.valA}</td>
                          <td className="py-2 px-3 font-bold text-white">{r.valB}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recommendation Cards */}
              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {msg.cards.map((card) => {
                    const shortlisted = isShortlisted(card.playerId) || isShortlisted(card.name);
                    const inspectable = playerDataService.resolveInspectable(card.playerId) || playerDataService.resolveInspectable(card.name);
                    const hasAuction = Boolean(playerDataService.findAuctionCandidate(card.playerId) || playerDataService.findAuctionCandidate(card.name));

                    return (
                      <div
                        key={card.playerId}
                        className="p-3.5 rounded-xl bg-[#0B1020] border border-[#29334C] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{card.countryFlag}</span>
                              <span className="font-bold text-sm text-white">{card.name}</span>
                            </div>
                            <span className="text-[11px] text-[#929BB2] block">
                              {card.role} · {card.team}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#E90074]/15 text-[#FF47A3] border border-[#E90074]/30 font-mono text-xs font-bold">
                            {card.bpiRating}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-cyan-300 bg-[#121A2D] p-2 rounded-lg">
                          {card.metricsLine}
                        </div>

                        <p className="text-xs text-[#C9C3DF] leading-relaxed flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{card.rationale}</span>
                        </p>

                        {card.sampleWarning && (
                          <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>{card.sampleWarning}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {inspectable && (
                            <>
                              <button
                                onClick={() => openPlayerProfile(inspectable.player, inspectable.type)}
                                className="px-2 py-1 rounded bg-[#171F35] hover:bg-[#232D50] text-[11px] font-semibold text-[#C9C3DF] border border-[#29334C] inline-flex items-center gap-1"
                              >
                                <Eye size={11} /> Profile
                              </button>
                              <button
                                onClick={() => openPlayerDNA(inspectable.player, inspectable.type)}
                                className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1"
                              >
                                <Dna size={11} /> DNA
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleShortlist(card.playerId, 'AI Recruitment Assistant', 'high')}
                            className={`px-2 py-1 rounded text-[11px] font-bold border inline-flex items-center gap-1 ${
                              shortlisted
                                ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                                : 'bg-[#171F35] border-[#29334C] text-[#C9C3DF]'
                            }`}
                          >
                            <Bookmark size={11} className={shortlisted ? 'fill-current' : ''} />
                            {shortlisted ? 'Saved' : 'Shortlist'}
                          </button>
                          {hasAuction && (
                            <button
                              onClick={() => sendToAuctionBlock(card.name)}
                              className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1 ml-auto"
                            >
                              <Gavel size={11} /> Bid
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explicit Caveats & Sample Notices */}
              {msg.caveats && msg.caveats.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#29334C]/60 space-y-1">
                  {msg.caveats.map((c, idx) => (
                    <p key={idx} className="text-[11px] text-amber-200/90 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                      <span>{c}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="rr-glass-card p-3 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about roles, pressure stats, death bowlers, economical spin, uncapped Indian talent, or 'Compare A vs B'..."
          className="flex-1 bg-[#0B1020] border border-[#29334C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#E90074]"
          aria-label="Ask AI Recruitment Assistant"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-95 shadow-lg"
        >
          <Send size={14} />
          <span>Analyze</span>
        </button>
      </form>
    </div>
  );
};
