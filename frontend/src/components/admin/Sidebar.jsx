import { NavLink } from 'react-router-dom'
import './AdminLayout.css'

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: 'home', end: true },
  { label: 'Products', to: '/admin/products', icon: 'box' },
  { label: 'Categories', to: '/admin/categories', icon: 'layers' },
  { label: 'Brands', to: '/admin/brands', icon: 'tag' },
  { label: 'Orders', to: '/admin/orders', icon: 'list' },
  { label: 'Settings', to: '/admin/settings', icon: 'gear' },
]

const Icon = ({ name }) => {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 11.5L12 4l8 7.5V20a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4h-4v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5z"
            fill="currentColor"
          />
        </svg>
      )
    case 'box':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7.5L12 4l8 3.5v9L12 20l-8-3.5v-9z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 10l8 3 8-3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4l9 4-9 4-9-4 9-4zm-9 8l9 4 9-4m-9 4v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 13l-8.293 8.293a1 1 0 01-1.414 0L4 15V4a1 1 0 011-1h11l4 4v6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 7h14M7 12h14M7 17h14M3 7h1M3 12h1M3 17h1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 9a3 3 0 100 6 3 3 0 000-6zm7 3a6.966 6.966 0 00-.2-1.6l2.2-1.7-2-3.4-2.6 1a7.033 7.033 0 00-2.8-1.6l-.4-2.7h-4l-.4 2.7a7.033 7.033 0 00-2.8 1.6l-2.6-1-2 3.4 2.2 1.7a6.966 6.966 0 00-.2 1.6c0 .55.07 1.09.2 1.6l-2.2 1.7 2 3.4 2.6-1a7.033 7.033 0 002.8 1.6l.4 2.7h4l.4-2.7a7.033 7.033 0 002.8-1.6l2.6 1 2-3.4-2.2-1.7c.13-.51.2-1.05.2-1.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

const Sidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-title">Surgical Mart Nepal</div>
          <div className="brand-subtitle">Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
