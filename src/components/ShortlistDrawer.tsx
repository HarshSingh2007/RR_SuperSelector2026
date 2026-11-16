import React from 'react';
import {
  Bookmark,
  X,
  Trash2,
  Gavel,
  GitCompare,
  Eye,
  Swords,
  Sparkles,
  Download,
} from 'lucide-react';
import { useEcosystem } from '../context/EcosystemContext';
import { playerDataService } from '../services/playerDataService';

export const ShortlistDrawer: React.FC = () => {
  const {
    shortlist,
    shortlistOpen,
    setShortlistOpen,
    removeFromShortlist,
    updateShortlistEntry,
    clearShortlist,
    openPlayerProfile,
    openPlayerDNA,
    openMatchupLab,
    sendToAuctionBlock,
    navigateTo,
  } = useEcosystem();

  if (!shortlistOpen) return null;

  const handleExportShortlist = () => {
    const header = 'PlayerID,Name,Role,Country,Team,BPI,Priority,SourceModule,KeyMetric,Notes\n';
    const rows = shortlist
      .map((s) =>
        [
          s.playerId,
          `"${s.name.replace(/"/g, '""')}"`,
          `"${s.role}"`,
          `"${s.country}"`,
          `"${s.team}"`,
          s.bpiRating,
          s.priority,
          `"${s.sourceModule}"`,
          `"${s.keyMetric.replace(/"/g, '""')}"`,
          `"${(s.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superr-recruitment-shortlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInspect = (id: string, name: string) => {
    setShortlistOpen(false);
    if (!openPlayerProfile(id)) {
      openPlayerProfile(name);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={() => setShortlistOpen(false)}
      role="dialog"
      aria-label="Persistent Recruitment Shortlist Drawer"
    >
      <div
        className="w-full max-w-lg bg-[#0D1326] border-l border-[#2D314F] h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2D314F] flex items-center justify-between bg-[#11172D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E90074] to-[#7545C8] flex items-center justify-center text-white shadow-lg shadow-[#E90074]/25">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Scouting Shortlist
                <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-[#E90074]/20 text-[#FF47A3] border border-[#E90074]/40">
                  {shortlist.length}
                </span>
              </h2>
              <p className="text-[11px] text-[#9B96B3]">
                Synced across all modules &amp; persisted in browser storage
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortlistOpen(false)}
            className="p-2 rounded-lg text-[#9B96B3] hover:text-white hover:bg-[#192040] transition-colors"
            aria-label="Close shortlist drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        {shortlist.length > 0 && (
          <div className="px-5 py-2.5 border-b border-[#232744] bg-[#0B1020] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportShortlist}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#192040] hover:bg-[#232D58] text-xs font-semibold text-[#C9C3DF] border border-[#2D314F] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#E90074]" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setShortlistOpen(false);
                  navigateTo('squad-gaps');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#192040] hover:bg-[#232D58] text-xs font-semibold text-[#C9C3DF] border border-[#2D314F] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7545C8]" />
                Test in Squad Gaps
              </button>
            </div>
            <button
              onClick={clearShortlist}
              className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {shortlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#161E3D] border border-[#2D314F] flex items-center justify-center mb-4">
                <Bookmark className="w-7 h-7 text-[#9B96B3]" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Your recruitment shortlist is empty</p>
              <p className="text-xs text-[#9B96B3] max-w-xs leading-relaxed mb-5">
                Click the shortlist button on any player card across Leaderboards, Hidden Gems, Young Talents, AI Assistant, or Squad Gap Analyzer to pin targets here.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => {
                    setShortlistOpen(false);
                    navigateTo('batting');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#E90074] hover:bg-[#FF1A8B] text-white text-xs font-bold transition-colors"
                >
                  Explore Batters
                </button>
                <button
                  onClick={() => {
                    setShortlistOpen(false);
                    navigateTo('hidden-gems');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#192040] hover:bg-[#242E58] text-white text-xs font-bold border border-[#2D314F] transition-colors"
                >
                  Hidden Gems
                </button>
              </div>
            </div>
          ) : (
            shortlist.map((item) => {
              const hasProfile = Boolean(playerDataService.resolveInspectable(item.playerId) || playerDataService.resolveInspectable(item.name));
              const hasAuction = Boolean(playerDataService.findAuctionCandidate(item.playerId) || playerDataService.findAuctionCandidate(item.name));
              const rec = playerDataService.findPlayer(item.playerId) || playerDataService.findPlayer(item.name);

              return (
                <div
                  key={item.playerId}
                  className="p-3.5 rounded-xl bg-[#14192E] border border-[#282C4A] hover:border-[#E90074]/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white truncate">{item.name}</span>
                        <span>{item.countryFlag}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#7545C8]/25 text-[#D8B4FE] border border-[#7545C8]/40">
                          {item.bpiRating.toFixed(1)} Index
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9B96B3] mt-0.5">
                        {item.role} · {item.team} · <span className="text-[#C9C3DF]">From {item.sourceModule}</span>
                      </p>
                      <p className="text-[11px] font-mono text-[#FF47A3] mt-1">{item.keyMetric}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={item.priority}
                        onChange={(e) =>
                          updateShortlistEntry(item.playerId, {
                            priority: e.target.value as 'critical' | 'high' | 'watch',
                          })
                        }
                        aria-label={`Priority for ${item.name}`}
                        className="bg-[#0B1020] text-[10px] font-bold px-2 py-1 rounded border border-[#2D314F] text-[#C9C3DF] focus:outline-none focus:border-[#E90074]"
                      >
                        <option value="critical">CRITICAL</option>
                        <option value="high">HIGH</option>
                        <option value="watch">WATCH</option>
                      </select>
                      <button
                        onClick={() => removeFromShortlist(item.playerId)}
                        className="p-1.5 rounded-lg text-[#9B96B3] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove from shortlist"
                        aria-label={`Remove ${item.name} from shortlist`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes input */}
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateShortlistEntry(item.playerId, { notes: e.target.value })}
                    placeholder="Add scouting note (e.g. target at <= 6 Cr for middle overs)..."
                    className="mt-2.5 w-full bg-[#0B1020] border border-[#232744] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-[#5B5870] focus:outline-none focus:border-[#7545C8]"
                  />

                  {/* Deep Link Actions */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {hasProfile && (
                      <>
                        <button
                          onClick={() => handleInspect(item.playerId, item.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1B2240] hover:bg-[#252E54] text-[11px] font-semibold text-[#C9C3DF] transition-colors"
                        >
                          <Eye className="w-3 h-3 text-[#FF47A3]" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setShortlistOpen(false);
                            openPlayerDNA(item.name);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1B2240] hover:bg-[#252E54] text-[11px] font-semibold text-[#C9C3DF] transition-colors"
                        >
                          <GitCompare className="w-3 h-3 text-[#7545C8]" />
                          DNA
                        </button>
                      </>
                    )}
                    {(rec?.batter || rec?.bowler) && (
                      <button
                        onClick={() => {
                          setShortlistOpen(false);
                          openMatchupLab(rec?.batter?.id, rec?.bowler?.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1B2240] hover:bg-[#252E54] text-[11px] font-semibold text-[#C9C3DF] transition-colors"
                      >
                        <Swords className="w-3 h-3 text-amber-400" />
                        Matchups
                      </button>
                    )}
                    {hasAuction && (
                      <button
                        onClick={() => sendToAuctionBlock(item.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#E90074]/15 hover:bg-[#E90074]/30 border border-[#E90074]/40 text-[11px] font-bold text-[#FF47A3] transition-colors ml-auto"
                      >
                        <Gavel className="w-3 h-3" />
                        Send to Auction
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

