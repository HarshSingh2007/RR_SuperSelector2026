import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Gavel,
  DollarSign,
  Users,
  Shield,
  Award,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  RefreshCw,
  Search,
  Filter,
  Download,
  Flame,
  ChevronRight,
  Info,
  Crown,
} from 'lucide-react';
import { AuctionPlayer, SquadPlayer } from '../types';
import auctionPlayersData from '../data/auction_players.json';
import { PlayerAvatar } from '../components/PlayerAvatar';
import {
  AuctionGavelIcon,
  RoyalCrestEmblem,
  CricketBatIcon,
  CricketBallIcon,
  AllRounderIcon,
  WicketkeeperIcon,
  BowlingMotionIcon,
} from '../components/CricketIcons';

const RIVAL_FRANCHISES = [
  'Mumbai Indians',
  'Chennai Super Kings',
  'Kolkata Knight Riders',
  'Royal Challengers Bengaluru',
  'Gujarat Titans',
  'Sunrisers Hyderabad',
  'Delhi Capitals',
  'Lucknow Super Giants',
];

export const AuctionWarRoomPage: React.FC = () => {
  const allPlayers = useMemo(() => auctionPlayersData as AuctionPlayer[], []);

  // State
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [unsoldIds, setUnsoldIds] = useState<Set<string>>(new Set());
  const [activePlayer, setActivePlayer] = useState<AuctionPlayer | null>(allPlayers[0] || null);
  const [currentBid, setCurrentBid] = useState<number>(allPlayers[0]?.base_price_cr || 0.5);
  const [currentBidder, setCurrentBidder] = useState<string>('Base Price');
  const [bidHistory, setBidHistory] = useState<Array<{ bidder: string; amountCr: number }>>([]);
  const [isSimulatingRival, setIsSimulatingRival] = useState<boolean>(false);
  const [evalModalOpen, setEvalModalOpen] = useState<boolean>(false);
  const [auctionNotice, setAuctionNotice] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'bpi' | 'val' | 'base' | 'name'>('bpi');

  // Purse calculations (in ₹ Crores)
  const TOTAL_PURSE_CR = 100.0;
  const spentPurseCr = useMemo(
    () => squad.reduce((sum, p) => sum + p.purchase_price_cr, 0),
    [squad]
  );
  const remainingPurseCr = useMemo(
    () => parseFloat(Math.max(0, TOTAL_PURSE_CR - spentPurseCr).toFixed(2)),
    [TOTAL_PURSE_CR, spentPurseCr]
  );

  // Squad restrictions
  const MIN_SQUAD = 18;
  const MAX_SQUAD = 25;
  const MAX_OVERSEAS = 8;

  const overseasCount = useMemo(
    () => squad.filter((p) => p.is_overseas).length,
    [squad]
  );
  const domesticCount = squad.length - overseasCount;

  // Max bid allowable on current player to ensure user can fill minimum squad with 20L each
  const unfilledMinSlots = Math.max(0, MIN_SQUAD - (squad.length + 1));
  const reserveNeededCr = unfilledMinSlots * 0.2;
  const maxAllowableBidCr = parseFloat(
    Math.max(0, remainingPurseCr - reserveNeededCr).toFixed(2)
  );

  // Role Breakdown
  const roleCounts = useMemo(() => {
    let batters = 0;
    let bowlers = 0;
    let allRounders = 0;
    let wicketKeepers = 0;

    squad.forEach((p) => {
      const r = p.player_role.toLowerCase();
      if (r.includes('all-rounder')) allRounders++;
      else if (r.includes('keeper')) wicketKeepers++;
      else if (p.role_type === 'bowler') bowlers++;
      else batters++;
    });

    return { batters, bowlers, allRounders, wicketKeepers };
  }, [squad]);

  // Squad Strength Score (0 to 100)
  const squadStrength = useMemo(() => {
    if (squad.length === 0) return 0;
    const avgBPI = squad.reduce((sum, p) => sum + p.bpi_rating, 0) / squad.length;

    // Balance points
    let balanceBonus = 0;
    if (roleCounts.batters >= 5) balanceBonus += 4;
    if (roleCounts.bowlers >= 5) balanceBonus += 4;
    if (roleCounts.allRounders >= 2) balanceBonus += 4;
    if (roleCounts.wicketKeepers >= 1) balanceBonus += 4;
    if (squad.length >= MIN_SQUAD) balanceBonus += 4;

    const raw = avgBPI * 0.8 + balanceBonus;
    return Math.min(100, Math.max(20, Math.round(raw)));
  }, [squad, roleCounts, MIN_SQUAD]);

  // AI Tactical Recommendations
  const aiRecommendations = useMemo(() => {
    const list: string[] = [];
    if (squad.length === 0) {
      list.push('Your squad is empty. Target a marquee pressure finisher and anchor to start building.');
      return list;
    }

    if (roleCounts.wicketKeepers === 0) {
      const topKeeper = availablePlayers.find((p) => p.player_role.toLowerCase().includes('keeper'));
      list.push(`Critical: No designated Wicketkeeper signed yet.${topKeeper ? ` Target ${topKeeper.name} (₹${topKeeper.base_price_cr.toFixed(2)} Cr base).` : ''}`);
    }
    if (roleCounts.allRounders < 2) {
      const topAR = availablePlayers.find((p) => p.player_role.toLowerCase().includes('all-rounder'));
      list.push(`Depth Alert: Acquire at least 2 All-rounders to lengthen batting depth.${topAR ? ` Top available: ${topAR.name} (BPI ${topAR.bpi_rating}).` : ''}`);
    }
    if (roleCounts.bowlers < 5) {
      list.push('Bowling Reserve Needed: Sign at least 5 specialist bowlers for tactical rotation across death and powerplay.');
    }
    if (overseasCount >= 7) {
      list.push('Overseas Limit Alert: You have used 7+ overseas slots. Prioritize elite domestic Indian talent.');
    }
    if (remainingPurseCr < 15.0 && squad.length < MIN_SQUAD) {
      list.push(`Budget Constraint: ₹${remainingPurseCr} Cr remaining with ${MIN_SQUAD - squad.length} slots left to hit minimum quota.`);
    }
    if (list.length === 0 && squad.length >= MIN_SQUAD) {
      list.push('Squad is optimally balanced across all core roles with formidable clutch ratings.');
    }
    return list;
  }, [squad, roleCounts, overseasCount, remainingPurseCr, MIN_SQUAD]);

  // Filtered available player list
  const availablePlayers = useMemo(() => {
    const squadSet = new Set(squad.map((p) => p.player_id));
    return allPlayers.filter((p) => {
      if (squadSet.has(p.player_id)) return false;
      if (unsoldIds.has(p.player_id)) return false;

      // Search
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.country.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Role Filter
      if (roleFilter === 'BATTER' && p.role_type !== 'batter') return false;
      if (roleFilter === 'BOWLER' && p.role_type !== 'bowler') return false;
      if (
        roleFilter === 'ALLROUNDER' &&
        !p.player_role.toLowerCase().includes('all-rounder')
      )
        return false;
      if (
        roleFilter === 'WICKETKEEPER' &&
        !p.player_role.toLowerCase().includes('keeper')
      )
        return false;

      // Nationality Filter
      if (nationalityFilter === 'DOMESTIC' && p.is_overseas) return false;
      if (nationalityFilter === 'OVERSEAS' && !p.is_overseas) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'bpi') return b.bpi_rating - a.bpi_rating;
      if (sortBy === 'val') return b.estimated_valuation_cr - a.estimated_valuation_cr;
      if (sortBy === 'base') return b.base_price_cr - a.base_price_cr;
      return a.name.localeCompare(b.name);
    });
  }, [allPlayers, squad, unsoldIds, searchQuery, roleFilter, nationalityFilter, sortBy]);

  // Handle placing a player on the auction block
  const handleSelectAuctionBlock = (player: AuctionPlayer) => {
    setActivePlayer(player);
    setCurrentBid(player.base_price_cr);
    setCurrentBidder('Base Price');
    setBidHistory([{ bidder: 'Opening Base Price', amountCr: player.base_price_cr }]);
  };

  // Place RR bid increment
  const handlePlaceRRBid = (incrementCr: number) => {
    if (!activePlayer) return;
    setAuctionNotice(null);
    const nextBid = parseFloat((currentBid + incrementCr).toFixed(2));

    if (squad.length >= MAX_SQUAD) {
      setAuctionNotice({ type: 'error', message: `Squad is full (${MAX_SQUAD} players max).` });
      return;
    }
    if (nextBid > remainingPurseCr) {
      setAuctionNotice({ type: 'error', message: `Cannot bid ₹${nextBid} Cr — exceeds remaining purse (₹${remainingPurseCr.toFixed(2)} Cr).` });
      return;
    }
    if (nextBid > maxAllowableBidCr) {
      setAuctionNotice({ type: 'error', message: `Cannot bid ₹${nextBid} Cr — reserve ₹${reserveNeededCr.toFixed(2)} Cr for remaining ${unfilledMinSlots} minimum squad slots.` });
      return;
    }
    if (activePlayer.is_overseas && overseasCount >= MAX_OVERSEAS) {
      setAuctionNotice({ type: 'error', message: `Cannot bid on ${activePlayer.name}: Maximum ${MAX_OVERSEAS} overseas players reached.` });
      return;
    }

    setCurrentBid(nextBid);
    setCurrentBidder('Rajasthan Royals');
    setBidHistory((prev) => [
      { bidder: 'Rajasthan Royals', amountCr: nextBid },
      ...prev,
    ]);
  };

  // Simulate rival AI franchise counter-bid
  const handleSimulateRivalBid = () => {
    if (!activePlayer || isSimulatingRival) return;
    setAuctionNotice(null);
    setIsSimulatingRival(true);

    const rival = RIVAL_FRANCHISES[Math.floor(Math.random() * RIVAL_FRANCHISES.length)];
    const increment = currentBid < 2.0 ? 0.2 : currentBid < 5.0 ? 0.5 : 1.0;
    const nextBid = parseFloat((currentBid + increment).toFixed(2));

    setTimeout(() => {
      setCurrentBid(nextBid);
      setCurrentBidder(rival);
      setBidHistory((prev) => [
        { bidder: rival, amountCr: nextBid },
        ...prev,
      ]);
      setIsSimulatingRival(false);
    }, 350);
  };

  // Hammer down: Sold to Rajasthan Royals
  const handleSoldToRR = () => {
    if (!activePlayer) return;
    setAuctionNotice(null);

    if (currentBidder !== 'Rajasthan Royals') {
      setAuctionNotice({ type: 'info', message: `Highest bid is currently with ${currentBidder}. Place a Rajasthan Royals bid before hammering Sold.` });
      return;
    }
    if (squad.length >= MAX_SQUAD) {
      setAuctionNotice({ type: 'error', message: `Squad is full! Maximum ${MAX_SQUAD} players reached.` });
      return;
    }
    if (activePlayer.is_overseas && overseasCount >= MAX_OVERSEAS) {
      setAuctionNotice({ type: 'error', message: `Maximum overseas quota (${MAX_OVERSEAS}) reached.` });
      return;
    }
    if (currentBid > maxAllowableBidCr) {
      setAuctionNotice({ type: 'error', message: `Purchase price ₹${currentBid} Cr violates ₹${reserveNeededCr.toFixed(2)} Cr minimum-squad reserve.` });
      return;
    }

    const boughtPlayer: SquadPlayer = {
      ...activePlayer,
      purchase_price_cr: currentBid,
      acquired_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSquad((prev) => [boughtPlayer, ...prev]);
    setAuctionNotice({ type: 'success', message: `Signed ${activePlayer.name} for ₹${currentBid.toFixed(2)} Cr!` });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#E90074', '#7545C8', '#FBBF24'],
    });

    const remaining = availablePlayers.filter((p) => p.player_id !== activePlayer.player_id);
    if (remaining.length > 0) {
      handleSelectAuctionBlock(remaining[0]);
    } else {
      setActivePlayer(null);
    }
  };

  // Mark player as unsold
  const handlePassUnsold = () => {
    if (!activePlayer) return;
    setAuctionNotice({ type: 'info', message: `${activePlayer.name} marked unsold and moved out of active queue.` });
    setUnsoldIds((prev) => new Set([...prev, activePlayer.player_id]));
    const remaining = availablePlayers.filter((p) => p.player_id !== activePlayer.player_id);
    if (remaining.length > 0) {
      handleSelectAuctionBlock(remaining[0]);
    } else {
      setActivePlayer(null);
    }
  };

  // Remove player from squad and refund purse
  const handleRemoveFromSquad = (playerId: string) => {
    setSquad((prev) => prev.filter((p) => p.player_id !== playerId));
    setAuctionNotice(null);
  };

  // Quick Sign at Simulated Estimated Valuation (enforces reserve & overseas caps)
  const handleQuickSign = (player: AuctionPlayer) => {
    setAuctionNotice(null);
    if (squad.length >= MAX_SQUAD) {
      setAuctionNotice({ type: 'error', message: `Squad is full (${MAX_SQUAD} players max).` });
      return;
    }
    if (squad.some((p) => p.player_id === player.player_id)) return;
    if (player.is_overseas && overseasCount >= MAX_OVERSEAS) {
      setAuctionNotice({ type: 'error', message: `Overseas quota (${MAX_OVERSEAS}) reached.` });
      return;
    }
    if (player.estimated_valuation_cr > maxAllowableBidCr) {
      setAuctionNotice({
        type: 'error',
        message: `Cannot quick-sign ${player.name} at ₹${player.estimated_valuation_cr.toFixed(2)} Cr — violates ₹${reserveNeededCr.toFixed(2)} Cr reserve for ${unfilledMinSlots} remaining slots.`
      });
      return;
    }

    const boughtPlayer: SquadPlayer = {
      ...player,
      purchase_price_cr: player.estimated_valuation_cr,
      acquired_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSquad((prev) => [boughtPlayer, ...prev]);
    setAuctionNotice({ type: 'success', message: `Quick-signed ${player.name} at simulated valuation ₹${player.estimated_valuation_cr.toFixed(2)} Cr.` });
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#E90074', '#7545C8'] });
  };

  // Auto-Assemble Balanced 18-Player RR Dream Squad respecting Purse, Overseas & Role Quotas
  const handleAutoAssembleDreamSquad = () => {
    setAuctionNotice(null);
    const poolByBpi = [...allPlayers].sort((a, b) => b.bpi_rating - a.bpi_rating);
    const dream: SquadPlayer[] = [];
    const addedIds = new Set<string>();
    let currentPurse = 100.0;
    let overseas = 0;

    const tryAdd = (p: AuctionPlayer, multiplier: number) => {
      if (dream.length >= 18) return false;
      if (addedIds.has(p.player_id)) return false;
      if (p.is_overseas && overseas >= MAX_OVERSEAS) return false;
      const price = parseFloat((p.base_price_cr * multiplier).toFixed(2));
      const minReserve = Math.max(0, 18 - (dream.length + 1)) * 0.2;
      if (currentPurse - price < minReserve) return false;

      dream.push({
        ...p,
        purchase_price_cr: price,
        acquired_at: 'Dream Draft',
      });
      addedIds.add(p.player_id);
      currentPurse = parseFloat((currentPurse - price).toFixed(2));
      if (p.is_overseas) overseas++;
      return true;
    };

    // 1. Core Wicketkeepers (target 2)
    let wkCount = 0;
    for (const p of poolByBpi) {
      if (wkCount >= 2) break;
      if (p.player_role.toLowerCase().includes('keeper') && tryAdd(p, 1.4)) wkCount++;
    }
    // 2. Core All-Rounders (target 3)
    let arCount = 0;
    for (const p of poolByBpi) {
      if (arCount >= 3) break;
      if (p.player_role.toLowerCase().includes('all-rounder') && tryAdd(p, 1.4)) arCount++;
    }
    // 3. Specialist Bowlers (target 6)
    let bwCount = 0;
    for (const p of poolByBpi) {
      if (bwCount >= 6) break;
      if (p.role_type === 'bowler' && !p.player_role.toLowerCase().includes('all-rounder') && tryAdd(p, 1.4)) bwCount++;
    }
    // 4. Specialist Batters (target 5)
    let btCount = 0;
    for (const p of poolByBpi) {
      if (btCount >= 5) break;
      const r = p.player_role.toLowerCase();
      if (p.role_type === 'batter' && !r.includes('all-rounder') && !r.includes('keeper') && tryAdd(p, 1.4)) btCount++;
    }
    // 5. Fill remaining slots up to 18 (prioritizing domestic budget gems if near purse/overseas ceiling)
    for (const p of poolByBpi) {
      if (dream.length >= 18) break;
      if (!tryAdd(p, 1.2)) tryAdd(p, 1.0);
    }

    setSquad(dream);
    setEvalModalOpen(true);
    setAuctionNotice({ type: 'success', message: `Assembled ${dream.length}-player balanced RR Dream Squad (${overseas}/${MAX_OVERSEAS} overseas).` });
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors: ['#E90074', '#7545C8', '#38BDF8'] });
  };

  // Export Squad CSV
  const handleExportSquad = () => {
    if (squad.length === 0) return;
    const rows = [
      ['Name', 'Country', 'Overseas', 'Role', 'BPI', 'Base_Cr', 'Purchase_Cr', 'Origin'],
      ...squad.map((p) => [
        `"${p.name}"`,
        `"${p.country}"`,
        p.is_overseas ? 'Yes' : 'No',
        `"${p.player_role}"`,
        p.bpi_rating,
        p.base_price_cr.toFixed(2),
        p.purchase_price_cr.toFixed(2),
        `"${p.acquired_at}"`,
      ]),
    ].map((r) => r.join(',')).join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RR_Auction_Squad_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset Auction
  const handleResetAuction = () => {
    setSquad([]);
    setUnsoldIds(new Set());
    setAuctionNotice({ type: 'info', message: 'Auction War Room reset to full ₹100.00 Cr purse.' });
    if (allPlayers.length > 0) {
      handleSelectAuctionBlock(allPlayers[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-[#171F35] via-[#121A2D] to-[#0B1020] border border-[#29334C] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-gradient-to-br from-[#E90074]/15 to-[#7545C8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E90074]/15 border border-[#E90074]/30 rounded-full text-xs font-semibold text-[#E90074] tracking-wider uppercase">
              <AuctionGavelIcon size={14} className="text-[#E90074]" />
              IPL 2026 Strategy Simulator
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F7FB] flex items-center gap-3">
              <RoyalCrestEmblem size={32} />
              AI Auction War Room
            </h1>
            <p className="text-sm text-[#929BB2] max-w-2xl leading-relaxed">
              Real-time Rajasthan Royals auction simulator. Bid against AI rival franchises, balance your ₹100.00 Cr purse, ensure strict domestic-overseas compliance, and build an invincible pressure-rated squad.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleAutoAssembleDreamSquad}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E90074] to-[#7545C8] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-[#E90074]/25 hover:brightness-110 transition-all cursor-pointer"
            >
              <Crown size={16} />
              Build Dream RR Squad
            </button>
            <button
              onClick={() => setEvalModalOpen(true)}
              disabled={squad.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#171F35] border border-[#29334C] text-[#C9C3DF] hover:text-white font-medium text-xs sm:text-sm rounded-xl hover:border-[#E90074]/40 transition-all cursor-pointer disabled:opacity-40"
            >
              <Shield size={16} className="text-[#E90074]" />
              Evaluate Squad
            </button>
            <button
              onClick={handleResetAuction}
              title="Reset Auction"
              className="p-2.5 bg-[#171F35] border border-[#29334C] text-[#929BB2] hover:text-white rounded-xl hover:border-red-500/40 transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Live Purse & Status Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#29334C]/60">
          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Purse Remaining</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#E90074]">₹{remainingPurseCr.toFixed(2)}</span>
              <span className="text-xs text-[#929BB2]">/ 100 Cr</span>
            </div>
            <div className="w-full bg-[#121A2D] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#E90074] to-[#7545C8] h-full transition-all"
                style={{ width: `${(remainingPurseCr / TOTAL_PURSE_CR) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Squad Count</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#F7F7FB]">{squad.length}</span>
              <span className="text-xs text-[#929BB2]">/ {MAX_SQUAD} (Min {MIN_SQUAD})</span>
            </div>
            <span className={`text-[10px] block mt-1 font-medium ${squad.length >= MIN_SQUAD ? 'text-emerald-400' : 'text-amber-400'}`}>
              {squad.length >= MIN_SQUAD ? '✓ Minimum quota met' : `${MIN_SQUAD - squad.length} more needed`}
            </span>
          </div>

          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Overseas Cap</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-purple-400">{overseasCount}</span>
              <span className="text-xs text-[#929BB2]">/ {MAX_OVERSEAS} Max</span>
            </div>
            <span className="text-[10px] text-[#929BB2] block mt-1 font-medium">
              {MAX_OVERSEAS - overseasCount} slots open
            </span>
          </div>

          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Squad Strength</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-amber-400">{squadStrength}</span>
              <span className="text-xs text-[#929BB2]">/ 100</span>
            </div>
            <span className="text-[10px] text-[#C9C3DF] block mt-1 font-medium">
              {squadStrength >= 80 ? 'Elite Contender' : squadStrength >= 60 ? 'Competitive' : 'Building'}
            </span>
          </div>

          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Max Single Bid</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-cyan-400">₹{maxAllowableBidCr.toFixed(2)}</span>
              <span className="text-xs text-[#929BB2]">Cr</span>
            </div>
            <span className="text-[10px] text-[#929BB2] block mt-1">
              Reserving ₹{reserveNeededCr.toFixed(2)} Cr
            </span>
          </div>

          <div className="bg-[#0B1020]/70 border border-[#29334C] rounded-xl p-3">
            <span className="text-[11px] text-[#929BB2] uppercase tracking-wider block font-medium">Role Balance</span>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#C9C3DF]">
              <span title="Batters" className="flex items-center gap-0.5 text-amber-300">
                <CricketBatIcon size={12} /> {roleCounts.batters}
              </span>
              <span title="Bowlers" className="flex items-center gap-0.5 text-purple-300">
                <BowlingMotionIcon size={12} /> {roleCounts.bowlers}
              </span>
              <span title="All-rounders" className="flex items-center gap-0.5 text-cyan-300">
                <AllRounderIcon size={12} /> {roleCounts.allRounders}
              </span>
              <span title="Keepers" className="flex items-center gap-0.5 text-emerald-300">
                <WicketkeeperIcon size={12} /> {roleCounts.wicketKeepers}
              </span>
            </div>
            <span className="text-[10px] text-[#929BB2] block mt-1">Total {squad.length} Signings</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Pool & Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#E90074]" />
                <h3 className="text-sm font-bold text-[#F7F7FB] uppercase tracking-wider">
                  Auction Pool ({availablePlayers.length})
                </h3>
              </div>
              <span className="text-xs text-[#929BB2]">BPI Ranked</span>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929BB2]" />
              <input
                type="text"
                placeholder="Search player or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#29334C] rounded-xl text-xs text-[#F7F7FB] placeholder-[#929BB2]/60 focus:outline-none focus:border-[#E90074]"
              />
            </div>

            {/* Quick Role & Nationality Filters */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              {['ALL', 'BATTER', 'BOWLER', 'ALLROUNDER', 'WICKETKEEPER'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#E90074] text-white shadow-md'
                      : 'bg-[#121A2D] text-[#929BB2] hover:text-[#F7F7FB] hover:bg-[#1E294B]'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r === 'ALLROUNDER' ? 'All-Rounder' : r === 'WICKETKEEPER' ? 'Keepers' : `${r}s`}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#29334C]/60 text-[11px] text-[#929BB2]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNationalityFilter('ALL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${nationalityFilter === 'ALL' ? 'bg-[#29334C] text-white' : 'hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setNationalityFilter('DOMESTIC')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${nationalityFilter === 'DOMESTIC' ? 'bg-[#29334C] text-white' : 'hover:text-white'}`}
                >
                  Domestic 🇮🇳
                </button>
                <button
                  onClick={() => setNationalityFilter('OVERSEAS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${nationalityFilter === 'OVERSEAS' ? 'bg-[#29334C] text-white' : 'hover:text-white'}`}
                >
                  Overseas ✈
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0B1020] border border-[#29334C] text-[#C9C3DF] text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="bpi">Sort: BPI Rating (Hist.)</option>
                <option value="val">Sort: Sim. Est. Value</option>
                <option value="base">Sort: Base Price</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {/* Player Pool List */}
            <div className="mt-3 space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {availablePlayers.slice(0, 50).map((player) => {
                const isSelected = activePlayer?.player_id === player.player_id;
                return (
                  <div
                    key={player.player_id}
                    onClick={() => handleSelectAuctionBlock(player)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#E90074]/15 border-[#E90074] shadow-lg shadow-[#E90074]/10'
                        : 'bg-[#121A2D] border-[#29334C] hover:border-[#7545C8]/50 hover:bg-[#171F35]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlayerAvatar
                        name={player.name}
                        team={player.current_franchise}
                        role={player.role_type}
                        avatarIcon={player.avatar_icon}
                        countryFlag={player.country_flag}
                        countryCode={player.country_code}
                        size="sm"
                        showRank={false}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#F7F7FB] truncate">{player.name}</h4>
                          <span className="text-[10px] text-[#929BB2]">{player.country_flag}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#929BB2] mt-0.5">
                          <span>{player.player_role}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">BPI {player.bpi_rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-[#E90074]">₹{player.base_price_cr.toFixed(2)} Cr</div>
                      <div className="text-[10px] text-[#929BB2]" title="Simulated Auction Estimate">Sim ₹{player.estimated_valuation_cr.toFixed(2)} Cr</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: Live Bidding Arena / The Auction Block (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activePlayer ? (
            <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#E90074]/10 via-[#7545C8]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#29334C]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C9C3DF]">
                    Live On Auction Block
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#121A2D] border border-[#29334C] text-[11px] font-medium text-[#929BB2] rounded-md">
                    {activePlayer.is_overseas ? '✈ Overseas Asset' : '🇮🇳 Domestic Indian'}
                  </span>
                </div>
              </div>

              {auctionNotice && (
                <div
                  className={`mt-3 px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    auctionNotice.type === 'error'
                      ? 'bg-red-500/15 border-red-500/40 text-red-200'
                      : auctionNotice.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : 'bg-sky-500/15 border-sky-500/40 text-sky-200'
                  }`}
                >
                  <span>{auctionNotice.message}</span>
                  <button
                    onClick={() => setAuctionNotice(null)}
                    className="text-[11px] opacity-75 hover:opacity-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Player Profile Spotlight */}
              <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#121A2D] rounded-xl border border-[#29334C]">
                <PlayerAvatar
                  name={activePlayer.name}
                  team={activePlayer.current_franchise}
                  role={activePlayer.role_type}
                  avatarIcon={activePlayer.avatar_icon}
                  countryFlag={activePlayer.country_flag}
                  countryCode={activePlayer.country_code}
                  size="xl"
                  showRank={false}
                />
                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-lg font-black text-[#F7F7FB]">{activePlayer.name}</h2>
                    <span className="text-base">{activePlayer.country_flag}</span>
                    <span className="text-xs px-2 py-0.5 bg-[#0B1020] border border-[#29334C] text-[#C9C3DF] rounded">
                      {activePlayer.country}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#929BB2]">
                    <span className="text-[#F7F7FB] font-medium">{activePlayer.player_role}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">BPI {activePlayer.bpi_rating}/100</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-medium">{activePlayer.key_stat}</span>
                  </div>

                  <p className="text-xs text-[#929BB2] leading-relaxed pt-1 line-clamp-2">
                    {activePlayer.scouting_summary}
                  </p>
                </div>
              </div>

              {/* Live Bid Board */}
              <div className="mt-5 p-4 bg-gradient-to-br from-[#0B1020] to-[#121A2D] border-2 border-[#E90074]/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#929BB2] uppercase tracking-wider">
                    Current Highest Bid
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    currentBidder === 'Rajasthan Royals'
                      ? 'bg-[#E90074] text-white shadow'
                      : currentBidder === 'Base Price'
                      ? 'bg-[#29334C] text-[#C9C3DF]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentBidder === 'Rajasthan Royals' ? '👑 Held by Rajasthan Royals' : `Held by: ${currentBidder}`}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div className="text-3xl sm:text-4xl font-black text-[#F7F7FB] tracking-tight">
                    ₹{currentBid.toFixed(2)}{' '}
                    <span className="text-lg font-semibold text-[#E90074]">Crore</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#929BB2] block">AI Fair Valuation</span>
                    <span className="text-xs font-bold text-cyan-400">₹{activePlayer.estimated_valuation_cr.toFixed(2)} Cr</span>
                  </div>
                </div>

                {/* Bidding Controls for Rajasthan Royals */}
                <div className="mt-4 pt-4 border-t border-[#29334C] space-y-3">
                  <div className="text-xs font-semibold text-[#C9C3DF] flex items-center gap-1.5">
                    <Plus size={14} className="text-[#E90074]" />
                    Raise Rajasthan Royals Bid:
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePlaceRRBid(0.2)}
                      disabled={currentBid + 0.2 > maxAllowableBidCr}
                      className="px-3 py-2 bg-[#171F35] border border-[#29334C] hover:border-[#E90074] text-xs font-bold text-[#F7F7FB] rounded-xl hover:bg-[#E90074]/10 transition-all cursor-pointer disabled:opacity-40"
                    >
                      +₹20 Lakhs
                    </button>
                    <button
                      onClick={() => handlePlaceRRBid(0.5)}
                      disabled={currentBid + 0.5 > maxAllowableBidCr}
                      className="px-3 py-2 bg-[#171F35] border border-[#29334C] hover:border-[#E90074] text-xs font-bold text-[#F7F7FB] rounded-xl hover:bg-[#E90074]/10 transition-all cursor-pointer disabled:opacity-40"
                    >
                      +₹50 Lakhs
                    </button>
                    <button
                      onClick={() => handlePlaceRRBid(1.0)}
                      disabled={currentBid + 1.0 > maxAllowableBidCr}
                      className="px-3 py-2 bg-[#171F35] border border-[#29334C] hover:border-[#E90074] text-xs font-bold text-[#F7F7FB] rounded-xl hover:bg-[#E90074]/10 transition-all cursor-pointer disabled:opacity-40"
                    >
                      +₹1.00 Crore
                    </button>
                  </div>

                  {/* Rival Action & Hammer Down Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleSimulateRivalBid}
                      disabled={isSimulatingRival}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#121A2D] border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Zap size={14} />
                      {isSimulatingRival ? 'Rival Thinking...' : 'Simulate Rival Bid'}
                    </button>

                    <button
                      onClick={handleSoldToRR}
                      disabled={currentBidder !== 'Rajasthan Royals'}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg ${
                        currentBidder === 'Rajasthan Royals'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 shadow-emerald-500/20'
                          : 'bg-[#29334C] text-[#929BB2] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Gavel size={15} />
                      Hammer Down (Sold to RR)
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handlePassUnsold}
                      className="text-xs text-[#929BB2] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Mark Player Unsold / Pass
                    </button>

                    <button
                      onClick={() => handleQuickSign(activePlayer)}
                      disabled={activePlayer.estimated_valuation_cr > remainingPurseCr}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer disabled:opacity-40"
                    >
                      Instant Sign at Fair Valuation (₹{activePlayer.estimated_valuation_cr.toFixed(2)} Cr)
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Bidding Feed Log */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-[#929BB2] uppercase tracking-wider block mb-2">
                  Bidding Transcript
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {bidHistory.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg ${
                        b.bidder === 'Rajasthan Royals'
                          ? 'bg-[#E90074]/15 text-[#F7F7FB] border border-[#E90074]/30'
                          : 'bg-[#0B1020] text-[#929BB2]'
                      }`}
                    >
                      <span className="font-medium">{b.bidder}</span>
                      <span className="font-bold text-[#F7F7FB]">₹{b.amountCr.toFixed(2)} Cr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-12 text-center shadow-xl">
              <AuctionGavelIcon size={48} className="mx-auto text-[#929BB2]" />
              <h3 className="text-lg font-bold text-[#F7F7FB] mt-4">Auction Block Empty</h3>
              <p className="text-xs text-[#929BB2] mt-1">Select a player from the pool on the left to begin bidding.</p>
            </div>
          )}
        </div>

        {/* Right Column: Live Rajasthan Royals Squad Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#29334C]">
              <div className="flex items-center gap-2">
                <RoyalCrestEmblem size={20} />
                <h3 className="text-sm font-bold text-[#F7F7FB] uppercase tracking-wider">
                  RR Squad ({squad.length}/{MAX_SQUAD})
                </h3>
              </div>
              <span className="text-xs font-bold text-[#E90074]">₹{spentPurseCr.toFixed(2)} Cr</span>
            </div>

            {/* AI Advisor Alerts Box */}
            <div className="mt-3 p-3 bg-[#0B1020] border border-[#29334C] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C9C3DF]">
                <Sparkles size={13} className="text-amber-400" />
                AI War Room Advisory
              </div>
              <p className="text-[11px] text-[#929BB2] leading-snug">
                {aiRecommendations[0]}
              </p>
            </div>

            {/* Signed Player List */}
            <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {squad.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#929BB2]">
                  No players signed yet. Start bidding or use "Build Dream RR Squad".
                </div>
              ) : (
                squad.map((player) => (
                  <div
                    key={player.player_id}
                    className="p-2.5 bg-[#121A2D] border border-[#29334C] rounded-xl flex items-center justify-between gap-2 group hover:border-[#E90074]/40 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerAvatar
                        name={player.name}
                        team="Rajasthan Royals"
                        role={player.role_type}
                        avatarIcon={player.avatar_icon}
                        countryFlag={player.country_flag}
                        countryCode={player.country_code}
                        size="sm"
                        showRank={false}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#F7F7FB] truncate">{player.name}</span>
                          <span className="text-[10px]">{player.country_flag}</span>
                        </div>
                        <div className="text-[10px] text-[#929BB2]">
                          {player.player_role} • <span className="text-amber-400 font-semibold">BPI {player.bpi_rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-[#E90074]">₹{player.purchase_price_cr.toFixed(2)} Cr</span>
                      <button
                        onClick={() => handleRemoveFromSquad(player.player_id)}
                        title="Release Player"
                        className="text-[#929BB2] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Squad Evaluation Modal */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#171F35] border border-[#29334C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#29334C]">
              <div className="flex items-center gap-3">
                <RoyalCrestEmblem size={28} />
                <div>
                  <h2 className="text-xl font-black text-[#F7F7FB]">Rajasthan Royals Squad Audit</h2>
                  <span className="text-xs text-[#929BB2]">AI Strategic Evaluation & Gap Analysis</span>
                </div>
              </div>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="text-[#929BB2] hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[11px] text-[#929BB2] block">Squad Strength</span>
                <span className="text-2xl font-black text-amber-400">{squadStrength}/100</span>
              </div>
              <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[11px] text-[#929BB2] block">Spent Budget</span>
                <span className="text-2xl font-black text-[#E90074]">₹{spentPurseCr.toFixed(2)} Cr</span>
              </div>
              <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[11px] text-[#929BB2] block">Squad Count</span>
                <span className="text-2xl font-black text-[#F7F7FB]">{squad.length} / 25</span>
              </div>
              <div className="bg-[#121A2D] p-3 rounded-xl border border-[#29334C]">
                <span className="text-[11px] text-[#929BB2] block">Overseas Assets</span>
                <span className="text-2xl font-black text-purple-400">{overseasCount} / 8</span>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1020] p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 size={15} /> Squad Strengths
                </div>
                <ul className="text-xs text-[#C9C3DF] space-y-1.5 list-disc pl-4">
                  <li>Formidable average BPI of {squad.length > 0 ? (squad.reduce((s, p) => s + p.bpi_rating, 0) / squad.length).toFixed(1) : 0} in high leverage situations.</li>
                  <li>Healthy purse discipline with ₹{remainingPurseCr.toFixed(2)} Cr flexible reserve.</li>
                  {roleCounts.allRounders >= 2 && <li>Deep batting order with multi-dimensional all-rounders.</li>}
                  {roleCounts.bowlers >= 5 && <li>Multi-phase bowling options for Powerplay and Death.</li>}
                </ul>
              </div>

              <div className="bg-[#0B1020] p-4 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <AlertCircle size={15} /> Vulnerabilities & Gaps
                </div>
                <ul className="text-xs text-[#C9C3DF] space-y-1.5 list-disc pl-4">
                  {roleCounts.wicketKeepers === 0 && <li className="text-red-400">Zero designated wicketkeepers signed.</li>}
                  {squad.length < MIN_SQUAD && <li>Below minimum required IPL squad quota of {MIN_SQUAD} players.</li>}
                  {roleCounts.bowlers < 5 && <li>Bowling unit needs more specialist options to withstand tournament injuries.</li>}
                  {overseasCount > 8 && <li className="text-red-400">Exceeded 8-player overseas limit!</li>}
                  {roleCounts.wicketKeepers > 0 && squad.length >= MIN_SQUAD && roleCounts.bowlers >= 5 && (
                    <li>No critical tactical vulnerabilities detected. Excellent squad structure.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Signed Roster Overview */}
            <div>
              <h4 className="text-xs font-bold text-[#F7F7FB] uppercase tracking-wider mb-2">Signed Roster ({squad.length} Players)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {squad.map((p) => (
                  <div key={p.player_id} className="p-2 bg-[#121A2D] rounded-lg border border-[#29334C] flex items-center justify-between">
                    <span className="truncate text-[#F7F7FB] font-medium">{p.name} {p.country_flag}</span>
                    <span className="text-[10px] text-[#E90074] font-bold">₹{p.purchase_price_cr.toFixed(1)} Cr</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#29334C] flex items-center justify-between gap-3">
              <button
                onClick={handleExportSquad}
                disabled={squad.length === 0}
                className="px-4 py-2 bg-[#121A2D] hover:bg-[#1E2744] border border-[#29334C] disabled:opacity-50 text-[#F7F7FB] font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Download size={14} /> Export Squad CSV
              </button>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="px-5 py-2 bg-[#E90074] hover:bg-[#E90074]/90 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

