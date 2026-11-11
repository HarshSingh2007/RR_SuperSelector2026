import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { NavigationTab, Batter, Bowler, Metadata } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { PressureIntelligencePage } from './pages/PressureIntelligencePage';
import { BattingAnalyticsPage } from './pages/BattingAnalyticsPage';
import { BowlingAnalyticsPage } from './pages/BowlingAnalyticsPage';
import { PlayerRankingsPage } from './pages/PlayerRankingsPage';
import { PlayerComparisonStudio } from './pages/PlayerComparisonStudio';
import { AuctionWarRoomPage } from './pages/AuctionWarRoomPage';
import { HiddenGemsPage } from './pages/HiddenGemsPage';
import { BatterBowlerPage } from './pages/BatterBowlerPage';
import { YoungTalentPage } from './pages/YoungTalentPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AboutPage } from './pages/AboutPage';

// Imported Data
import metadataData from './data/metadata.json';
import battersData from './data/batters.json';
import bowlersData from './data/bowlers.json';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [selectedComp, setSelectedComp] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modal inspection state
  const [inspectedPlayer, setInspectedPlayer] = useState<Batter | Bowler | null>(null);
  const [inspectedPlayerType, setInspectedPlayerType] = useState<'batter' | 'bowler'>('batter');

  // Player comparison queue
  const [comparisonQueue, setComparisonQueue] = useState<Array<Batter | Bowler>>([]);

  const metadata = metadataData as unknown as Metadata;
  const batters = battersData as unknown as Batter[];
  const bowlers = bowlersData as unknown as Bowler[];

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'rankings') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#E90074', '#7545C8', '#C9C3DF'],
      });
    }
  };

  const handleSelectPlayer = (player: Batter | Bowler, type: 'batter' | 'bowler' = 'batter') => {
    setInspectedPlayer(player);
    setInspectedPlayerType(type);
  };

  const handleAddToCompare = (player: Batter | Bowler) => {
    setComparisonQueue((prev) => {
      const exists = prev.some((p) => p.id === player.id);
      if (exists) return prev;
      return [player, ...prev].slice(0, 3);
    });
    setActiveTab('comparison');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F7F7FB] flex flex-col font-sans selection:bg-[#E90074] selection:text-white">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedComp={selectedComp}
        onCompChange={setSelectedComp}
        selectedSeason={selectedSeason}
        onSeasonChange={setSelectedSeason}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 relative">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
          {activeTab === 'overview' && (
            <OverviewPage
              metadata={metadata}
              onNavigate={handleTabChange}
              onSelectPlayer={handleSelectPlayer}
            />
          )}

          {activeTab === 'pressure-engine' && <PressureIntelligencePage />}

          {activeTab === 'batting' && (
            <BattingAnalyticsPage
              batters={batters}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={(b) => handleSelectPlayer(b, 'batter')}
              onComparePlayer={handleAddToCompare}
            />
          )}

          {activeTab === 'bowling' && (
            <BowlingAnalyticsPage
              bowlers={bowlers}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={(bw) => handleSelectPlayer(bw, 'bowler')}
              onComparePlayer={handleAddToCompare}
            />
          )}

          {activeTab === 'rankings' && (
            <PlayerRankingsPage
              batters={batters}
              bowlers={bowlers}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={handleSelectPlayer}
              onComparePlayer={handleAddToCompare}
            />
          )}

          {activeTab === 'auction' && <AuctionWarRoomPage />}

          {activeTab === 'hidden-gems' && <HiddenGemsPage />}

          {activeTab === 'head-to-head' && <BatterBowlerPage />}

          {activeTab === 'young-talent' && <YoungTalentPage />}

          {activeTab === 'comparison' && (
            <PlayerComparisonStudio
              batters={batters}
              bowlers={bowlers}
              comparisonQueue={comparisonQueue}
              onClearQueue={() => setComparisonQueue([])}
            />
          )}

          {activeTab === 'methodology' && <MethodologyPage />}

          {activeTab === 'about' && <AboutPage />}
        </main>
      </div>

      {/* Detailed Analytical Profile Drawer / Modal */}
      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          type={inspectedPlayerType}
          onClose={() => setInspectedPlayer(null)}
          onCompare={handleAddToCompare}
        />
      )}
    </div>
  );
}
export default App;
