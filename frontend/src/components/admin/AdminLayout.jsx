import { useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { logout as authLogout } from '../../services/auth'
import './AdminLayout.css'

const AdminLayout = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const adminName = useMemo(() => 'Admin User', [])
  const initials = useMemo(() => adminName?.[0]?.toUpperCase() || 'A', [adminName])

  const handleSettings = () => {
    setMenuOpen(false)
    navigate('/admin/settings')
  }

  const handleLogout = () => {
    setMenuOpen(false)
    authLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <div className="welcome">
              <p className="eyebrow">Welcome back</p>
              <h1>Surgical Mart Nepal</h1>
            </div>
            <div className="search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M11 4a7 7 0 105.293 12.293l3.707 3.707 1.414-1.414-3.707-3.707A7 7 0 0011 4z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="search"
                placeholder="Search dashboard... (UI only)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications (UI only)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3a5 5 0 00-5 5v3.382l-.894 2.236A1 1 0 007.055 15h9.89a1 1 0 00.949-1.382L17 11.382V8a5 5 0 00-5-5zm0 18a2.5 2.5 0 01-2.45-2h4.9A2.5 2.5 0 0112 21z"
                  fill="currentColor"
                />
              </svg>
              <span className="badge-dot" />
            </button>

            <div className="user-menu">
              <button
                type="button"
                className="user-trigger"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="avatar">{initials}</div>
                <div className="user-meta">
                  <span className="user-name">{adminName}</span>
                  <span className="user-role">Administrator</span>
                </div>
                <svg viewBox="0 0 24 24" aria-hidden="true" className={`chevron${menuOpen ? ' open' : ''}`}>
                  <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                </svg>
              </button>

              {menuOpen ? (
                <div className="user-dropdown">
                  <button type="button" onClick={handleSettings}>
                    Settings
                  </button>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
