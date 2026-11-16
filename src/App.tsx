import React from 'react';
import { EcosystemProvider, useEcosystem } from './context/EcosystemContext';
import { playerDataService } from './services/playerDataService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';
import { ShortlistDrawer } from './components/ShortlistDrawer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { PressureIntelligencePage } from './pages/PressureIntelligencePage';
import { BattingAnalyticsPage } from './pages/BattingAnalyticsPage';
import { BowlingAnalyticsPage } from './pages/BowlingAnalyticsPage';
import { PlayerRankingsPage } from './pages/PlayerRankingsPage';
import { PlayerComparisonStudio } from './pages/PlayerComparisonStudio';
import { SquadGapAnalyzerPage } from './pages/SquadGapAnalyzerPage';
import { RecruitmentAssistantPage } from './pages/RecruitmentAssistantPage';
import { AuctionWarRoomPage } from './pages/AuctionWarRoomPage';
import { HiddenGemsPage } from './pages/HiddenGemsPage';
import { BatterBowlerPage } from './pages/BatterBowlerPage';
import { YoungTalentPage } from './pages/YoungTalentPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AboutPage } from './pages/AboutPage';

const AppShell: React.FC = () => {
  const {
    activeTab,
    navigateTo,
    selectedComp,
    setSelectedComp,
    selectedSeason,
    setSelectedSeason,
    mobileMenuOpen,
    setMobileMenuOpen,
    inspectedPlayer,
    inspectedPlayerType,
    openPlayerProfile,
    closePlayerProfile,
    comparisonQueue,
    addToCompare,
    clearComparisonQueue,
  } = useEcosystem();

  const metadata = playerDataService.getMetadata();
  const batters = playerDataService.getBatters();
  const bowlers = playerDataService.getBowlers();

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F7F7FB] flex flex-col font-sans selection:bg-[#E90074] selection:text-white">
      <Header
        activeTab={activeTab}
        onTabChange={navigateTo}
        selectedComp={selectedComp}
        onCompChange={setSelectedComp}
        selectedSeason={selectedSeason}
        onSeasonChange={setSelectedSeason}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-1 relative">
        <Sidebar
          activeTab={activeTab}
          onTabChange={navigateTo}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeTab === 'overview' && (
            <OverviewPage
              metadata={metadata}
              onNavigate={navigateTo}
              onSelectPlayer={openPlayerProfile}
            />
          )}

          {activeTab === 'player-profile' && (
            <PlayerProfilePage
              onBack={closePlayerProfile}
              onSelectPlayer={(id) => openPlayerProfile(id)}
            />
          )}

          {activeTab === 'pressure-engine' && <PressureIntelligencePage />}

          {activeTab === 'batting' && (
            <BattingAnalyticsPage
              batters={batters}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={(b) => openPlayerProfile(b, 'batter')}
              onComparePlayer={(b) => addToCompare(b, true)}
            />
          )}

          {activeTab === 'bowling' && (
            <BowlingAnalyticsPage
              bowlers={bowlers}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={(bw) => openPlayerProfile(bw, 'bowler')}
              onComparePlayer={(bw) => addToCompare(bw, true)}
            />
          )}

          {activeTab === 'rankings' && (
            <PlayerRankingsPage
              batters={batters}
              bowlers={bowlers}
              selectedComp={selectedComp}
              selectedSeason={selectedSeason}
              onSelectPlayer={openPlayerProfile}
              onComparePlayer={(p) => addToCompare(p, true)}
            />
          )}

          {activeTab === 'comparison' && (
            <PlayerComparisonStudio
              batters={batters}
              bowlers={bowlers}
              comparisonQueue={comparisonQueue}
              onClearQueue={clearComparisonQueue}
            />
          )}

          {activeTab === 'squad-gaps' && <SquadGapAnalyzerPage />}

          {activeTab === 'ai-assistant' && <RecruitmentAssistantPage />}

          {activeTab === 'auction' && <AuctionWarRoomPage />}

          {activeTab === 'hidden-gems' && <HiddenGemsPage />}

          {activeTab === 'head-to-head' && <BatterBowlerPage />}

          {activeTab === 'young-talent' && <YoungTalentPage />}

          {activeTab === 'methodology' && <MethodologyPage />}

          {activeTab === 'about' && <AboutPage />}
        </main>
      </div>

      <ShortlistDrawer />

      {inspectedPlayer && activeTab !== 'player-profile' && (
        <PlayerModal
          player={inspectedPlayer}
          type={inspectedPlayerType}
          onClose={closePlayerProfile}
          onCompare={(p) => addToCompare(p, true)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <EcosystemProvider>
      <AppShell />
    </EcosystemProvider>
  );
}

export default App;
