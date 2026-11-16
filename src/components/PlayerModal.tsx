import React from 'react';
import {
  X,
  Trophy,
  Flame,
  Target,
  Sparkles,
  ShieldCheck,
  Activity,
  Calendar,
  Layers,
  ChevronRight,
  GitCompare,
  Award,
  BarChart3,
  Bookmark,
  Dna,
  Swords,
  Gavel,
  Download,
} from 'lucide-react';
import { Batter, Bowler } from '../types';
import { Badge } from './Badge';
import { PlayerAvatar } from './PlayerAvatar';
import { getTeamTheme } from '../utils/teamColors';
import { MetricTooltip } from './MetricTooltip';
import { PressureMeter } from './PressureMeter';
import { BoundaryIndicator } from './BoundaryIndicator';
import { useEcosystem } from '../context/EcosystemContext';
import { downloadScoutingReport, playerDataService } from '../services/playerDataService';
import {
  CricketBatIcon,
  CricketBallIcon,
  CricketStumpsIcon,
  BowlingMotionIcon,
  AllRounderIcon,
  WicketkeeperIcon,
} from './CricketIcons';

interface PlayerModalProps {
  player: Batter | Bowler | null;
  type: 'batter' | 'bowler';
  onClose: () => void;
  onCompare: (player: Batter | Bowler) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  type,
  onClose,
  onCompare,
}) => {
  if (!player) return null;

  const {
    isShortlisted,
    toggleShortlist,
    openPlayerDNA,
    openMatchupLab,
    sendToAuctionBlock,
    openPlayerProfile,
  } = useEcosystem();
  const shortlisted = isShortlisted(player.id) || isShortlisted(player.name);
  const auctionCandidate = playerDataService.findAuctionCandidate(player.id) || playerDataService.findAuctionCandidate(player.name);

  const isBatter = type === 'batter';
  const batter = isBatter ? (player as Batter) : null;
  const bowler = !isBatter ? (player as Bowler) : null;

  const theme = getTeamTheme(player.team);

  const country = player.country || 'International';
  const countryFlag = player.country_flag || '🏏';
  const countryCode = player.country_code || 'INT';
  const playerRole = player.player_role || (isBatter ? 'Batter' : (bowler?.bowlingType || 'Bowler'));
  const avatarIcon = player.avatar_icon;

  const deltaValue = isBatter ? batter!.srDelta : bowler!.econDelta;
  const isDeltaPositive = deltaValue >= 0;

  // Render role icon
  const renderRoleIcon = () => {
    const roleLower = playerRole.toLowerCase();
    if (roleLower.includes('keeper') || roleLower.includes('wicket')) {
      return <WicketkeeperIcon size={13} className="text-emerald-400 inline mr-1" />;
    }
    if (roleLower.includes('all-rounder')) {
      return <AllRounderIcon size={13} className="text-purple-400 inline mr-1" />;
    }
    if (roleLower.includes('bowler')) {
      return <BowlingMotionIcon size={13} className="text-indigo-400 inline mr-1" />;
    }
    return <CricketBatIcon size={13} className="text-pink-400 inline mr-1" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#171F35] border border-[#29334C] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative text-[#F7F7FB]">
        {/* Top Header Banner with Team & Country Identity */}
        <div
          className="relative p-6 border-b border-[#29334C] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.secondary} 0%, #121A2D 70%, #0B1020 100%)`,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-[#0B1020]/80 text-[#929BB2] hover:text-white border border-[#29334C] transition-colors z-20"
            title="Close modal"
          >
            <X size={18} />
          </button>

          {/* Country flag pill banner */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{countryFlag}</span>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C9C3DF]">
              {country} ({countryCode})
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-[#929BB2]">
              Player ID: #{player.player_id || player.id}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* NO PHOTOGRAPHS: PlayerAvatar with unique icon & team theme */}
            <PlayerAvatar
              name={player.name}
              team={player.team}
              rank={player.rank}
              role={playerRole}
              size="xl"
              avatarIcon={avatarIcon}
              countryFlag={countryFlag}
              countryCode={countryCode}
              showFlag={false}
              showRank={true}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-[#F7F7FB] border border-white/10">
                  RANK #{player.rank}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center ${
                    playerRole.toLowerCase().includes('all-rounder')
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                      : playerRole.toLowerCase().includes('keeper')
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : isBatter
                      ? 'bg-pink-950/60 text-pink-300 border-pink-500/40'
                      : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {renderRoleIcon()}
                  {playerRole}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F7F7FB] truncate font-sans uppercase">
                {player.name}
              </h2>

              <p className="text-xs text-[#C9C3DF] mt-1 flex items-center gap-2 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: theme.primary }}
                />
                <span className="font-semibold">{player.team}</span>
                <span>•</span>
                <span>{player.matchesAnalysed} Career Matches ({player.pressureMatches} Pressure Matches)</span>
              </p>
            </div>
          </div>

          {/* Rating Score Banner & Pressure Meter */}
          <div className="mt-5 p-4 rounded-xl bg-[#0B1020]/90 border border-[#29334C] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-[#E90074]" />
              <div>
                <span className="text-[11px] text-[#929BB2] uppercase font-bold tracking-wider flex items-center gap-1">
                  {isBatter ? 'Batting Pressure Index (BPI)' : 'Bowling Pressure Index (BPI-Bowl)'}
                  <MetricTooltip term={isBatter ? 'BPI' : 'BPI-Bowl'} />
                </span>
                <div className="text-2xl font-mono font-black text-[#F7F7FB]">
                  {player.rating}{' '}
                  <span className="text-xs font-sans text-[#929BB2] font-normal">/ 100</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {Math.round(player.confidenceWeight * 100)}% Volume Confidence
                </span>
              </div>
            </div>

            {/* Stadium Pressure Gauge */}
            <div className="flex-shrink-0">
              <PressureMeter
                value={player.rating}
                size="sm"
                label={isBatter ? 'Batting Leverage' : 'Bowling Leverage'}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Comparison Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#929BB2] mb-3 flex items-center gap-1.5">
              <Activity size={14} className="text-[#E90074]" />
              Pressure vs Normal Performance Breakdown
            </h4>

            {isBatter && batter && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Pressure SR <MetricTooltip term="Pressure Strike Rate" />
                  </span>
                  <span className="text-xl font-mono font-bold text-[#E90074]">{batter.pressureSR}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">
                    {batter.pressureRuns} runs / {batter.pressureBalls} balls
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Normal SR <MetricTooltip term="Baseline Strike Rate" />
                  </span>
                  <span className="text-xl font-mono font-bold text-[#F7F7FB]">{batter.normalSR}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">
                    {batter.normalRuns} runs / {batter.normalBalls} balls
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Improvement <MetricTooltip term="SR Improvement" />
                  </span>
                  <span className={`text-xl font-mono font-bold ${batter.srDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {batter.srDelta >= 0 ? `+${batter.srDelta}` : batter.srDelta}
                  </span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">Clutch Elevation</span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Boundary % <MetricTooltip term="Boundary %" />
                  </span>
                  <span className="text-xl font-mono font-bold text-amber-400">{batter.boundaryPct}%</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">
                    {batter.fours} fours, {batter.sixes} sixes
                  </span>
                </div>
              </div>
            )}

            {!isBatter && bowler && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Pressure Econ <MetricTooltip term="Pressure Economy" />
                  </span>
                  <span className="text-xl font-mono font-bold text-[#7545C8]">{bowler.pressureEcon}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">
                    {bowler.pressureRunsConceded} runs / {bowler.pressureOvers} ov
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Normal Econ <MetricTooltip term="Baseline Economy" />
                  </span>
                  <span className="text-xl font-mono font-bold text-[#F7F7FB]">{bowler.normalEcon}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">Standard situations</span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Improvement <MetricTooltip term="Economy Suppression" />
                  </span>
                  <span className={`text-xl font-mono font-bold ${bowler.econDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {bowler.econDelta >= 0 ? `+${bowler.econDelta}` : bowler.econDelta}
                  </span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">rpo improvement</span>
                </div>

                <div className="p-3 rounded-xl bg-[#121A2D] border border-[#29334C]">
                  <span className="text-[11px] text-[#929BB2] flex items-center gap-1">
                    Pressure Wickets <MetricTooltip term="Pressure Wickets" />
                  </span>
                  <span className="text-xl font-mono font-bold text-amber-400">{bowler.pressureWickets}</span>
                  <span className="text-[10px] text-[#929BB2] block mt-0.5">
                    {bowler.dotPct}% dot balls
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Authentic Boundary Breakdown for Batters */}
          {isBatter && batter && (
            <BoundaryIndicator
              fours={batter.fours}
              sixes={batter.sixes}
              boundaryPct={batter.boundaryPct}
              totalPressureRuns={batter.pressureRuns}
            />
          )}

          {/* Why This Player Ranks Here */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E2744] to-[#141C30] border border-[#29334C]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9C3DF] mb-2 flex items-center gap-2">
              <Award size={15} className="text-[#E90074]" />
              Why {player.name} Ranks #{player.rank}
            </h4>
            <p className="text-sm text-[#F7F7FB] leading-relaxed">
              {player.verdict}
            </p>
          </div>

          {/* Performance Dimensional Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#929BB2] mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-[#7545C8]" />
              Performance Dimensional Breakdown
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-[#929BB2]">Pressure Execution Quality</span>
                  <span className="font-bold text-[#F7F7FB]">
                    {Math.round(Math.min(100, isBatter ? (batter!.pressureSR / 220) * 100 : ((12 - bowler!.pressureEcon) / 6) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-[#121A2D] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7545C8] to-[#E90074] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, isBatter ? (batter!.pressureSR / 220) * 100 : ((12 - bowler!.pressureEcon) / 6) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-[#929BB2]">Clutch Delta (Improvement Over Normal)</span>
                  <span className="font-bold text-[#F7F7FB]">
                    {Math.round(Math.min(100, Math.max(0, 50 + deltaValue * 1.5)))}%
                  </span>
                </div>
                <div className="w-full bg-[#121A2D] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, 50 + deltaValue * 1.5))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-[#929BB2]">Match Consistency Factor</span>
                  <span className="font-bold text-[#F7F7FB]">{player.consistencyScore}%</span>
                </div>
                <div className="w-full bg-[#121A2D] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, player.consistencyScore))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-[#929BB2]">Sample Reliability Weight</span>
                  <span className="font-bold text-[#F7F7FB]">
                    {Math.round(player.confidenceWeight * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#121A2D] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.round(player.confidenceWeight * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#29334C] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  openPlayerProfile(player.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-pink-500/20 transition-all"
              >
                <Sparkles size={13} />
                <span>Full Profile & Pitch Map</span>
              </button>

              <button
                onClick={() => {
                  onCompare(player);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-[#121A2D] hover:bg-[#192340] text-[#C9C3DF] border border-[#29334C] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <GitCompare size={13} />
                <span>Compare</span>
              </button>

              <button
                onClick={() => openPlayerDNA(player, type)}
                className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Dna size={13} />
                <span>6-Axis DNA</span>
              </button>

              <button
                onClick={() =>
                  openMatchupLab(isBatter ? player.id : undefined, !isBatter ? player.id : undefined)
                }
                className="px-3 py-2 rounded-xl bg-[#121A2D] hover:bg-[#192340] text-amber-300 border border-[#29334C] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Swords size={13} />
                <span>Matchups</span>
              </button>

              <button
                onClick={() => toggleShortlist(player.id, 'Player Dossier Modal')}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-colors ${
                  shortlisted
                    ? 'bg-[#E90074]/20 border-[#E90074] text-[#FF47A3]'
                    : 'bg-[#121A2D] hover:bg-[#192340] text-[#C9C3DF] border-[#29334C]'
                }`}
              >
                <Bookmark size={13} className={shortlisted ? 'fill-current' : ''} />
                <span>{shortlisted ? 'Shortlisted' : 'Shortlist'}</span>
              </button>

              {auctionCandidate && (
                <button
                  onClick={() => sendToAuctionBlock(player.id)}
                  className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Gavel size={13} />
                  <span>Send to Auction</span>
                </button>
              )}

              <button
                onClick={() => downloadScoutingReport(player, type)}
                className="px-3 py-2 rounded-xl bg-[#121A2D] hover:bg-[#192340] text-[#C9C3DF] border border-[#29334C] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                <span>Report (.md)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#121A2D] text-[#929BB2] hover:text-white border border-[#29334C] text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
