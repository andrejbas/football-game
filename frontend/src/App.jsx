import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { ProtectedLayout, PublicOnly } from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PlayerPage from './pages/PlayerPage'
import TeamsPage from './pages/TeamsPage'
import TeamDetailPage from './pages/TeamDetailPage'
import LeaguesPage from './pages/LeaguesPage'
import LeagueDetailPage from './pages/LeagueDetailPage'
import MatchesPage from './pages/MatchesPage'
import MatchDetailPage from './pages/MatchDetailPage'
import EquipmentPage from './pages/EquipmentPage'
import RewardsPage from './pages/RewardsPage'
import SeasonsPage from './pages/SeasonsPage'

export default function App() {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <RegisterPage />
              </PublicOnly>
            }
          />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/player" element={<PlayerPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/leagues" element={<LeaguesPage />} />
            <Route path="/leagues/:id" element={<LeagueDetailPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/matches/:id" element={<MatchDetailPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </SWRConfig>
  )
}