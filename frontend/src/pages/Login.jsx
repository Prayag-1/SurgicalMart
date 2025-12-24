import { useState } from 'react'
import '../App.css'
import { login } from '../services/auth'
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const tokens = await login(email, password)
      setTokens(tokens)
      window.location.assign('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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
            Surgical Mart Г?" Admin Portal
          </div>
          <h2>Sign in to continue</h2>
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
                placeholder="Г?ЫГ?ЫГ?ЫГ?ЫГ?ЫГ?ЫГ?ЫГ?ЫГ?ЫГ?Ы"
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

            {error ? <p className="error">{error}</p> : null}
            {loading ? <p className="status">Signing in...</p> : null}

            <button type="submit" className="primary-btn" disabled={loading}>
              Sign in
            </button>
          </form>

          <p className="switch-auth">
            DonГ?Tt have an account?{' '}
            <a href="#" className="link-quiet">
              Create an account
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}

export default Login

