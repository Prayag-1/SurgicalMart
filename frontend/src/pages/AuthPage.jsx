import { useState } from 'react'
import '../App.css'
import { login, register } from '../services/auth'
import { setTokens } from '../utils/tokenStorage'

const features = [
  {
    title: 'Fast order delivery ',
    description: 'Delivery inside the valley on the same day',
  },
  {
    title: 'Secure records',
    description: 'Purchase history and approvals for every shipment.',
  },
  {
    title: 'Instant access',
    description: 'One of the most Trusted Surgical Suppliers in Nepal.',
  },
]

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const tokens = await login(email, password)
        setTokens(tokens)
        setMessage('Logged in')
        onAuthSuccess?.()
      } else {
        await register(email, password)
        setMessage('Account created. Please sign in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setError('')
    setMessage('')
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="page">
      <div className="auth-shell">
        <section className="hero-panel">
          <div className="badge">
            <span className="dot" />
            Surgical supply management
          </div>
          <h1>
            Welcome to <span>Surgical Mart</span>
          </h1>
          <p className="lede">
            Manage orders, inventory, and approvals in a secure platform built for modern surgical
            teams.
          </p>

          <div className="feature-grid">
            {features.map((item) => (
              <div key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="form-panel">
          <div className="pill">
            <span className="dot" />
            Surgical Mart - Admin Portal
          </div>
          <h2>{mode === 'login' ? 'Sign in to continue' : 'Create an account'}</h2>
          <p className="support">
            Access your dashboard, manage orders, and keep your surgical supply chain moving.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email *</span>
              <input
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password *</span>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <div className="form-meta">
              <label className="checkbox">
                <input type="checkbox" />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="link-quiet">
                Forgot password?
              </a>
            </div>

            {error ? <p className="support">{error}</p> : null}
            {message ? <p className="support">{message}</p> : null}
            {loading ? <p className="support">Processing...</p> : null}

            <button type="submit" className="primary-btn" disabled={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="switch-auth">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <a
              href="#"
              className="link-quiet"
              onClick={(event) => {
                event.preventDefault()
                toggleMode()
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}

export default AuthPage
