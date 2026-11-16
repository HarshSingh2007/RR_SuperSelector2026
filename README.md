# SupeRR Selector 2.0 — Cricket Performance Intelligence Platform

A data-driven T20 cricket scouting, recruitment, and performance intelligence platform built for **Rajasthan Royals**. SupeRR Selector 2.0 evaluates players across **200,999 historical deliveries from 883 IPL and T20 International matches (2022–2026)** to quantify who performs best when match pressure is highest.

![SupeRR Selector 2.0 Executive Overview](demo-assets/RR_Demo_Thumbnail.png)

---

## Problem Statement & Objective

In high-stakes Twenty20 cricket, standard aggregate averages (overall Strike Rate, Economy Rate, Batting Average) often conflate low-leverage runs or wickets in decided games with clutch execution under pressure.

**SupeRR Selector 2.0** addresses this challenge with a reproducible analytical pipeline and interactive scouting workspace designed to:

1. Quantify match-context leverage for every delivery using a continuous dual-phase **Pressure Index** ($P \in [0, 1]$).
2. Identify and rank the **Top 10 Batters** and **Top 10 Bowlers** under pressure relative to their own normal-situation baselines.
3. Equip franchise analysts with an integrated **11-module scouting ecosystem** (`DISCOVER → ANALYZE → COMPARE → IDENTIFY → RECOMMEND → RECRUIT → SIMULATE`) spanning **Player DNA**, **Hidden Gem Detection**, **Young Talent Radar (Ages 15–24)**, **Matchup Intelligence Lab**, **Squad Gap Analyzer**, **AI Recruitment Assistant**, and an **AI Auction War Room** with configurable rules and `Scenario A/B` planning.

---

## Key Features & Modules

### Core Performance, Analytics & Preserved Reference Views
- **RR Command Center (`src/pages/OverviewPage.tsx`)** — Executive KPI board (`883` matches, `200,999` deliveries processed, `1,217` players evaluated, `14,422` high/extreme pressure deliveries, `141` competitions), Squad Readiness summary, automated Recruitment Alerts, U-24 emerging spotlight, and quick navigation across all modules.
- **Batting Leaderboard (`src/pages/BattingAnalyticsPage.tsx`)** — Evaluates `72` qualified batters on Pressure Strike Rate, Strike Rate Delta ($\Delta\text{SR}$), batting average, highest score, boundaries (`4s`/`6s`/Boundary%), consistency, trend, shortlist controls, and one-click Player DNA links.
- **Bowling Leaderboard (`src/pages/BowlingAnalyticsPage.tsx`)** — Evaluates `84` qualified bowlers on Pressure Economy, Economy Suppression ($\Delta\text{Econ}$), dot-ball percentage, maidens, best bowling figures, Powerplay/Middle/Death splits, shortlist controls, and DNA profiling.
- **Official SupeRR 20 (`src/pages/PlayerRankingsPage.tsx`)** — Preserved Top 10 Pressure Batter and Top 10 Bowler leaderboards (`top20_identities.json`) with podium hierarchy, detailed player dossiers, and CSV export (`src/utils/csvExport.ts`).
- **Pressure Intelligence Engine (`src/pages/PressureIntelligencePage.tsx`)** — Interactive Dual-Phase ($P \in [0, 1]$) First Innings & Second Innings (chase) match-state simulator with synchronized Overs Completed and Balls Remaining controls alongside dataset-grounded context specialists.
- **Player DNA & Comparison Studio (`src/pages/PlayerComparisonStudio.tsx`)** — 1-Player 6-Axis DNA mode and 2/3-Player radar comparison (`computeBatterDNA` / `computeBowlerDNA`) with strengths/weaknesses diagnostics, Bayesian sample confidence warnings, and downloadable `.md` scouting reports.

### Talent Discovery, Recruitment Intelligence & Auction Management
- **Hidden Gem Detector (`src/pages/HiddenGemsPage.tsx`)** — Algorithmic talent scanner scoring `139` profiles on baseline improvement delta, sample volume upside, and clutch consistency, with structured qualification breakdowns, Shortlist sync, DNA deep-links, and Auction routing.
- **Young Talent Radar (`src/pages/YoungTalentPage.tsx`)** — Discovery portal for `28` tracked emerging prospects (ages `15–24`) distinguishing verified CSV youth/domestic/IPL statistics from development potential projections (`null`-safe `pressure_sr` formatting), synchronized bidirectionally with the platform Shortlist.
- **Matchup Intelligence Lab (`src/pages/BatterBowlerPage.tsx`)** — Ball-by-ball Head-to-Head duel lookup (`head_to_head_matrix.json`), `< 6` balls statistical sample reliability warnings (`assessMatchupSample`), and aggregated Pace vs Spin and batting role splits.
- **Squad Gap Analyzer (`src/pages/SquadGapAnalyzerPage.tsx`)** — 9-dimension structural squad evaluator across `RR Dataset Core`, `Sim Squad`, and `Shortlist` baselines with a Balance Meter, Recharts Priority Map, dataset-validated target recommendations, and Recruitment Decision Timeline.
- **AI Recruitment Assistant (`src/pages/RecruitmentAssistantPage.tsx`)** — Deterministic zero-hallucination natural-language scouting console supporting prompt chips, dynamic `Compare A vs B` breakdowns, H2H queries, confidence warnings, and explicit out-of-scope caveats.
- **Auction & Squad Simulator (`src/pages/AuctionWarRoomPage.tsx`)** — Interactive franchise auction simulator across `153` pooled players with configurable rules (`totalPurseCr`, min/max squad size, overseas cap), budget visualizer chart, Shortlist target queue integration, rival bidding, and independent `Scenario A` vs `Scenario B` What-If planning.
- **Ecosystem State, Shortlist Drawer & Methodology (`src/context/EcosystemContext.tsx`, `src/components/ShortlistDrawer.tsx`, `src/pages/MethodologyPage.tsx`, `src/pages/AboutPage.tsx`)** — Cross-module navigation, canonical dataset unification (`src/services/playerDataService.ts`), `localStorage`-persisted Shortlist drawer, and transparent mathematical documentation.

---

## Technology Stack

- **Frontend Framework:** React 18 (`react`, `react-dom`), TypeScript 5.7
- **Build & Tooling:** Vite 6 (`vite`, `@vitejs/plugin-react`), Node.js
- **Styling & UI:** Tailwind CSS 3.4, `clsx`, `tailwind-merge`, `lucide-react`, `canvas-confetti`, custom cricket SVG components
- **Data Visualizations:** Recharts 2.15 (Radar, Scatter, Bar, and Trend charts)
- **Data Processing Pipeline:** Custom streaming Node.js scripts (`scripts/generate_analytics_data.cjs`, `scripts/generate_new_modules_data.cjs`, `scripts/generate_young_talent_data.cjs`, `scripts/run_pipeline.cjs`)

---

## Datasets & Reproducibility

Raw match and delivery files live in `data/raw/`:

| File | Description | Size |
|---|---|---:|
| `data/raw/ball_by_ball.csv` | Historical ball-by-ball records (`200,999` deliveries across `867` matches) | ~39.2 MB |
| `data/raw/playing_eleven.csv` | Match playing XI rosters | ~0.9 MB |
| `data/raw/competition_team_player_mapping.csv` | Competition, franchise, and player mappings | ~0.4 MB |
| `data/raw/matches.csv` | Match metadata, venues, DLS revised overs/targets, and outcomes (`883` matches) | ~0.1 MB |
| `data/raw/competitions.csv` | IPL & T20I competition definitions (`141` competitions) | ~7.4 KB |
| `data/raw/teams.csv` | Franchise and national team registry | ~6.8 KB |

Processed JSON datasets powering the frontend are stored in `src/data/` (`metadata.json`, `batters.json`, `bowlers.json`, `top20_identities.json`, `hidden_gems.json`, `young_talents.json`, `auction_players.json`, `head_to_head_matrix.json`, `pressure_matches.json`, `competitions.json`).

For formal methodology documentation, see [`reports/methodology/supeRR_methodology_report.md`](reports/methodology/supeRR_methodology_report.md).

---

## Installation & Running Locally

### Prerequisites
- **Node.js** (v18+ recommended) and **npm**

### Setup & Run

```bash
# 1. Clone the repository
git clone https://github.com/HarshSingh2007/RR_SuperSelector2026.git
cd RR_SuperSelector2026

# 2. Install frontend dependencies
npm install

# 3. (Optional) Re-run the streaming CSV analytics pipeline from data/raw/
npm run process-data

# 4. Start the local Vite development server (default: http://localhost:5173)
npm run dev
```

### Other Scripts

```bash
# Run unit tests (pressure math, Bayesian confidence & dataset integrity)
npm test

# Type-check and create production build in dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```text
RR/
├── data/
│   └── raw/                  # Raw IPL & T20I CSV datasets + Round 1 Problem Statement PDF
├── demo-assets/              # Browser demo automation scripts & dashboard thumbnail
├── reports/
│   └── methodology/          # Technical methodology report
├── scripts/                  # Data ingestion pipeline, formula core (lib/formulas.cjs) & Node tests
├── src/
│   ├── components/           # Shared UI, Header, Sidebar, ShortlistDrawer, Modals, Cricket SVG icons
│   ├── context/              # Shared cross-module state & localStorage persistence (EcosystemContext.tsx)
│   ├── data/                 # Generated JSON datasets consumed by the React app
│   ├── pages/                # 14 interactive analytics, scouting, gap-analysis, AI & auction pages
│   ├── services/             # Canonical cross-dataset identity & report service (playerDataService.ts)
│   ├── types/                # TypeScript domain interfaces
│   ├── utils/                # Client pressure/DNA engine (analyticsEngine.ts), CSV export & themes
│   ├── App.tsx               # Application shell, EcosystemProvider wrapper & module routing
│   └── main.tsx              # React DOM entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Screenshots

| View | Preview |
|---|---|
| **Overview Dashboard** | ![Overview Dashboard](demo-assets/RR_Demo_Thumbnail.png) |
| **Pressure Intelligence Engine** | *\[Placeholder: Add screenshot of Pressure Context Simulator\]* |
| **Player Rankings & Head-to-Head** | *\[Placeholder: Add screenshot of Top 10 Leaderboards / Batter vs Bowler Matrix\]* |
| **AI Auction War Room & Young Talent** | *\[Placeholder: Add screenshot of Live Auction & Squad Builder\]* |
