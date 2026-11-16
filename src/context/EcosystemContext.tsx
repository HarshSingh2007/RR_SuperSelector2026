import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type {
  Batter,
  Bowler,
  NavigationTab,
  RecruitmentScenario,
  ShortlistEntry,
  SquadPlayer,
} from '../types';
import { playerDataService } from '../services/playerDataService';

const SHORTLIST_STORAGE_KEY = 'superr_shortlist_v2';
const AUCTION_SQUAD_STORAGE_KEY = 'superr_active_auction_squad_v1';
const SCENARIOS_STORAGE_KEY = 'superr_auction_scenarios_v1';

const DEFAULT_SCENARIOS: Record<'A' | 'B', RecruitmentScenario> = {
  A: {
    id: 'A',
    name: 'Scenario A — Balanced Core (Pace + Finisher)',
    description: 'Prioritize an Indian middle-order/finisher anchor plus reliable death pace.',
    startingPurseCr: 100,
    minSquad: 18,
    maxSquad: 25,
    maxOverseas: 8,
    squad: [],
  },
  B: {
    id: 'B',
    name: 'Scenario B — High-Upside Spin & Youth Value',
    description: 'Maximize uncovered domestic gems and economical spin depth within budget.',
    startingPurseCr: 100,
    minSquad: 18,
    maxSquad: 25,
    maxOverseas: 8,
    squad: [],
  },
};

export interface EcosystemContextValue {
  activeTab: NavigationTab;
  navigateTo: (tab: NavigationTab) => void;
  selectedComp: string;
  setSelectedComp: (comp: string) => void;
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Player Profile Modal & Dedicated Page
  selectedPlayerProfileId: string | null;
  setSelectedPlayerProfileId: (id: string | null) => void;
  previousTab: NavigationTab;
  inspectedPlayer: Batter | Bowler | null;
  inspectedPlayerType: 'batter' | 'bowler';
  openPlayerProfile: (playerOrId: Batter | Bowler | string, preferredType?: 'batter' | 'bowler') => boolean;
  closePlayerProfile: () => void;

  // Player DNA & Comparison Studio
  comparisonQueue: Array<Batter | Bowler>;
  dnaFocusPlayer: { id: string; type: 'batter' | 'bowler' } | null;
  clearDnaFocus: () => void;
  addToCompare: (player: Batter | Bowler, navigateToStudio?: boolean) => void;
  openPlayerDNA: (playerOrId: Batter | Bowler | string, preferredType?: 'batter' | 'bowler') => boolean;
  clearComparisonQueue: () => void;

  // Matchup & Pressure Deep Links
  matchupFocus: { batterId?: string; bowlerId?: string } | null;
  openMatchupLab: (batterId?: string, bowlerId?: string) => void;
  clearMatchupFocus: () => void;

  pressureContextFocus: { innings: 1 | 2; label?: string } | null;
  openPressureWithContext: (innings: 1 | 2, label?: string) => void;
  clearPressureContextFocus: () => void;

  // Persistent Shortlist
  shortlist: ShortlistEntry[];
  shortlistOpen: boolean;
  setShortlistOpen: (open: boolean) => void;
  isShortlisted: (playerIdOrName: string) => boolean;
  toggleShortlist: (
    playerIdOrName: string,
    sourceModule: string,
    priority?: ShortlistEntry['priority'],
    notes?: string
  ) => boolean;
  updateShortlistEntry: (playerId: string, patch: Partial<ShortlistEntry>) => void;
  removeFromShortlist: (playerId: string) => void;
  clearShortlist: () => void;

  // Auction Simulator Sync & What-If Scenarios
  queuedAuctionTargetId: string | null;
  sendToAuctionBlock: (playerIdOrName: string) => boolean;
  clearQueuedAuctionTarget: () => void;
  activeAuctionSquad: SquadPlayer[];
  setActiveAuctionSquad: React.Dispatch<React.SetStateAction<SquadPlayer[]>>;
  scenarios: Record<'A' | 'B', RecruitmentScenario>;
  updateScenario: (key: 'A' | 'B', updater: (prev: RecruitmentScenario) => RecruitmentScenario) => void;
  resetScenarios: () => void;
}

const EcosystemContext = createContext<EcosystemContextValue | null>(null);

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const EcosystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [previousTab, setPreviousTab] = useState<NavigationTab>('overview');
  const [selectedPlayerProfileId, setSelectedPlayerProfileId] = useState<string | null>('7897');
  const [selectedComp, setSelectedComp] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [inspectedPlayer, setInspectedPlayer] = useState<Batter | Bowler | null>(null);
  const [inspectedPlayerType, setInspectedPlayerType] = useState<'batter' | 'bowler'>('batter');

  const [comparisonQueue, setComparisonQueue] = useState<Array<Batter | Bowler>>([]);
  const [dnaFocusPlayer, setDnaFocusPlayer] = useState<{ id: string; type: 'batter' | 'bowler' } | null>(null);

  const [matchupFocus, setMatchupFocus] = useState<{ batterId?: string; bowlerId?: string } | null>(null);
  const [pressureContextFocus, setPressureContextFocus] = useState<{ innings: 1 | 2; label?: string } | null>(null);

  const [shortlist, setShortlist] = useState<ShortlistEntry[]>(() =>
    typeof window !== 'undefined' ? safeReadJson<ShortlistEntry[]>(SHORTLIST_STORAGE_KEY, []) : []
  );
  const [shortlistOpen, setShortlistOpen] = useState<boolean>(false);

  const [queuedAuctionTargetId, setQueuedAuctionTargetId] = useState<string | null>(null);
  const [activeAuctionSquad, setActiveAuctionSquad] = useState<SquadPlayer[]>(() =>
    typeof window !== 'undefined' ? safeReadJson<SquadPlayer[]>(AUCTION_SQUAD_STORAGE_KEY, []) : []
  );
  const [scenarios, setScenarios] = useState<Record<'A' | 'B', RecruitmentScenario>>(() =>
    typeof window !== 'undefined'
      ? safeReadJson<Record<'A' | 'B', RecruitmentScenario>>(SCENARIOS_STORAGE_KEY, DEFAULT_SCENARIOS)
      : DEFAULT_SCENARIOS
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    } catch {
      // Ignore storage quota errors
    }
  }, [shortlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUCTION_SQUAD_STORAGE_KEY, JSON.stringify(activeAuctionSquad));
    } catch {
      // Ignore storage quota errors
    }
  }, [activeAuctionSquad]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // Ignore storage quota errors
    }
  }, [scenarios]);

  const navigateTo = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'rankings') {
      confetti({
        particleCount: 36,
        spread: 56,
        origin: { y: 0.82 },
        colors: ['#E90074', '#7545C8', '#C9C3DF'],
      });
    }
  };

  const openPlayerProfile = (
    playerOrId: Batter | Bowler | string,
    preferredType?: 'batter' | 'bowler'
  ): boolean => {
    let playerId = '';
    if (typeof playerOrId === 'string') {
      playerId = playerOrId;
      const resolved = playerDataService.resolveInspectable(playerOrId, preferredType);
      if (resolved) {
        setInspectedPlayer(resolved.player);
        setInspectedPlayerType(resolved.type);
      }
    } else {
      playerId = playerOrId.id;
      const inferredType: 'batter' | 'bowler' =
        preferredType ?? ('pressureEcon' in playerOrId ? 'bowler' : 'batter');
      setInspectedPlayer(playerOrId);
      setInspectedPlayerType(inferredType);
    }

    if (activeTab !== 'player-profile') {
      setPreviousTab(activeTab);
    }
    setSelectedPlayerProfileId(playerId);
    setActiveTab('player-profile');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  const closePlayerProfile = () => {
    setInspectedPlayer(null);
    if (activeTab === 'player-profile') {
      setActiveTab(previousTab || 'overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addToCompare = (player: Batter | Bowler, navigateToStudio = true) => {
    setComparisonQueue((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [player, ...prev].slice(0, 3);
    });
    if (navigateToStudio) {
      navigateTo('comparison');
    }
  };

  const openPlayerDNA = (
    playerOrId: Batter | Bowler | string,
    preferredType?: 'batter' | 'bowler'
  ): boolean => {
    let target: { player: Batter | Bowler; type: 'batter' | 'bowler' } | undefined;
    if (typeof playerOrId === 'string') {
      target = playerDataService.resolveInspectable(playerOrId, preferredType);
    } else {
      const inferred: 'batter' | 'bowler' =
        preferredType ?? ('pressureEcon' in playerOrId ? 'bowler' : 'batter');
      target = { player: playerOrId, type: inferred };
    }
    if (!target) return false;

    setDnaFocusPlayer({ id: target.player.id, type: target.type });
    addToCompare(target.player, false);
    setInspectedPlayer(null);
    navigateTo('comparison');
    return true;
  };

  const openMatchupLab = (batterId?: string, bowlerId?: string) => {
    setMatchupFocus({ batterId, bowlerId });
    setInspectedPlayer(null);
    navigateTo('head-to-head');
  };

  const openPressureWithContext = (innings: 1 | 2, label?: string) => {
    setPressureContextFocus({ innings, label });
    navigateTo('pressure-engine');
  };

  const isShortlisted = (playerIdOrName: string): boolean => {
    const unified = playerDataService.findPlayer(playerIdOrName);
    const id = unified?.primaryId ?? playerIdOrName;
    const norm = playerIdOrName.trim().toLowerCase();
    return shortlist.some(
      (s) => s.playerId === id || s.playerId === playerIdOrName || s.name.trim().toLowerCase() === norm
    );
  };

  const toggleShortlist = (
    playerIdOrName: string,
    sourceModule: string,
    priority: ShortlistEntry['priority'] = 'high',
    notes = ''
  ): boolean => {
    const unified = playerDataService.findPlayer(playerIdOrName);
    const canonicalId = unified?.primaryId ?? playerIdOrName;
    const exists = shortlist.some((s) => s.playerId === canonicalId || s.playerId === playerIdOrName);
    if (exists) {
      setShortlist((prev) => prev.filter((s) => s.playerId !== canonicalId && s.playerId !== playerIdOrName));
      return false;
    }
    const entry = playerDataService.toShortlistEntry(playerIdOrName, sourceModule, priority, notes);
    if (!entry) return false;
    setShortlist((prev) => [entry, ...prev]);
    return true;
  };

  const updateShortlistEntry = (playerId: string, patch: Partial<ShortlistEntry>) => {
    setShortlist((prev) => prev.map((s) => (s.playerId === playerId ? { ...s, ...patch } : s)));
  };

  const removeFromShortlist = (playerId: string) => {
    setShortlist((prev) => prev.filter((s) => s.playerId !== playerId));
  };

  const clearShortlist = () => setShortlist([]);

  const sendToAuctionBlock = (playerIdOrName: string): boolean => {
    const candidate = playerDataService.findAuctionCandidate(playerIdOrName);
    if (!candidate) return false;
    setQueuedAuctionTargetId(candidate.player_id);
    setInspectedPlayer(null);
    setShortlistOpen(false);
    navigateTo('auction');
    return true;
  };

  const updateScenario = (
    key: 'A' | 'B',
    updater: (prev: RecruitmentScenario) => RecruitmentScenario
  ) => {
    setScenarios((prev) => ({
      ...prev,
      [key]: updater(prev[key]),
    }));
  };

  const resetScenarios = () => setScenarios(DEFAULT_SCENARIOS);

  return (
    <EcosystemContext.Provider
      value={{
        activeTab,
        navigateTo,
        selectedComp,
        setSelectedComp,
        selectedSeason,
        setSelectedSeason,
        mobileMenuOpen,
        setMobileMenuOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        selectedPlayerProfileId,
        setSelectedPlayerProfileId,
        previousTab,
        inspectedPlayer,
        inspectedPlayerType,
        openPlayerProfile,
        closePlayerProfile,
        comparisonQueue,
        dnaFocusPlayer,
        clearDnaFocus: () => setDnaFocusPlayer(null),
        addToCompare,
        openPlayerDNA,
        clearComparisonQueue: () => setComparisonQueue([]),
        matchupFocus,
        openMatchupLab,
        clearMatchupFocus: () => setMatchupFocus(null),
        pressureContextFocus,
        openPressureWithContext,
        clearPressureContextFocus: () => setPressureContextFocus(null),
        shortlist,
        shortlistOpen,
        setShortlistOpen,
        isShortlisted,
        toggleShortlist,
        updateShortlistEntry,
        removeFromShortlist,
        clearShortlist,
        queuedAuctionTargetId,
        sendToAuctionBlock,
        clearQueuedAuctionTarget: () => setQueuedAuctionTargetId(null),
        activeAuctionSquad,
        setActiveAuctionSquad,
        scenarios,
        updateScenario,
        resetScenarios,
      }}
    >
      {children}
    </EcosystemContext.Provider>
  );
};

export function useEcosystem(): EcosystemContextValue {
  const ctx = useContext(EcosystemContext);
  if (!ctx) {
    throw new Error('useEcosystem must be used inside <EcosystemProvider>');
  }
  return ctx;
}

