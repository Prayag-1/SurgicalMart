import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSettings, updateSettings } from '../services/settings'

const initial = {
  site_name: '',
  default_meta_title: '',
  default_meta_description: '',
  default_meta_keywords: '',
  admin_notification_email: '',
  notify_admin_email: true,
  notify_admin_whatsapp: false,
  notify_customer_email: true,
  notify_customer_whatsapp: false,
}

const FieldError = ({ msg }) => (
  <span style={{ color: 'red', fontSize: 12 }}>{Array.isArray(msg) ? msg.join(', ') : msg}</span>
)

function AdminSettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getSettings()
        setForm({ ...initial, ...data })
      } catch (err) {
        setError(err.message || 'Unable to load settings')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    setFieldErrors({})
    try {
      const updated = await updateSettings(form)
      setForm({ ...form, ...updated })
      setMessage('Settings saved')
    } catch (err) {
      setError(err.message || 'Unable to save settings')
      setFieldErrors(err.fields || {})
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading settings...</div>

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Admin Settings</h2>
        <Link to="/admin" style={linkStyle}>
          Back
        </Link>
      </div>

      <div style={card}>
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        {message ? <p style={{ color: 'green' }}>{message}</p> : null}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          {renderInput('Site name', 'site_name', form, setForm, fieldErrors)}
          {renderInput('Default meta title', 'default_meta_title', form, setForm, fieldErrors)}
          {renderTextarea('Default meta description', 'default_meta_description', form, setForm, fieldErrors)}
          {renderInput('Default meta keywords', 'default_meta_keywords', form, setForm, fieldErrors)}
          {renderInput('Admin notification email', 'admin_notification_email', form, setForm, fieldErrors)}

          <label style={labelRow}>
            <input
              type="checkbox"
              checked={!!form.notify_admin_email}
              onChange={(e) => setForm((f) => ({ ...f, notify_admin_email: e.target.checked }))}
            />
            <span>Notify admin via email</span>
          </label>
          <label style={labelRow}>
            <input
              type="checkbox"
              checked={!!form.notify_admin_whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, notify_admin_whatsapp: e.target.checked }))}
            />
            <span>Notify admin via WhatsApp</span>
          </label>
          <label style={labelRow}>
            <input
              type="checkbox"
              checked={!!form.notify_customer_email}
              onChange={(e) => setForm((f) => ({ ...f, notify_customer_email: e.target.checked }))}
            />
            <span>Notify customer via email</span>
          </label>
          <label style={labelRow}>
            <input
              type="checkbox"
              checked={!!form.notify_customer_whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, notify_customer_whatsapp: e.target.checked }))}
            />
            <span>Notify customer via WhatsApp</span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} style={button}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const renderInput = (labelText, field, form, setForm, fieldErrors) => (
  <label style={label}>
    <span>{labelText}</span>
    <input
      value={form[field] || ''}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={input}
    />
    {fieldErrors[field] ? <FieldError msg={fieldErrors[field]} /> : null}
  </label>
)

const renderTextarea = (labelText, field, form, setForm, fieldErrors) => (
  <label style={label}>
    <span>{labelText}</span>
    <textarea
      value={form[field] || ''}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={{ ...input, minHeight: 100 }}
    />
    {fieldErrors[field] ? <FieldError msg={fieldErrors[field]} /> : null}
  </label>
)

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  background: '#fff',
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const labelRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const input = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: 14,
}

const button = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

export default AdminSettings
