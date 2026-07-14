import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '../store/authStore'

export function ProtectedLayout() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function PublicOnly({ children }) {
  const token = useAuthStore((s) => s.token)
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <h1 className="page-title text-balance">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
