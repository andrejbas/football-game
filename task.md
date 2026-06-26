# Task List

## Backend Fixes
- [x] Fix `MatchSimulationService.php` — null guard for `$player->team`
- [x] Fix `AdvanceGameDayJob.php` — use MatchStatus enum values
- [x] Fix `config/cors.php` — allow localhost:5173

## Frontend (React + Vite)
- [/] Scaffold Vite project in `frontend/`
- [ ] `index.css` — global design system (dark glassmorphism)
- [ ] `src/api/` — axios client + all API modules
- [ ] `src/store/` — zustand auth store
- [ ] `src/components/` — shared UI components
- [ ] `src/pages/LoginPage.jsx`
- [ ] `src/pages/RegisterPage.jsx`
- [ ] `src/pages/DashboardPage.jsx`
- [ ] `src/pages/PlayerPage.jsx`
- [ ] `src/pages/TeamsPage.jsx`
- [ ] `src/pages/TeamDetailPage.jsx`
- [ ] `src/pages/LeaguesPage.jsx`
- [ ] `src/pages/LeagueDetailPage.jsx`
- [ ] `src/pages/MatchesPage.jsx`
- [ ] `src/pages/MatchDetailPage.jsx`
- [ ] `src/pages/EquipmentPage.jsx`
- [ ] `src/pages/RewardsPage.jsx`
- [ ] `src/pages/SeasonsPage.jsx`
- [ ] `src/App.jsx` — routing
- [ ] `src/main.jsx`
- [ ] `vite.config.js` — proxy to backend
