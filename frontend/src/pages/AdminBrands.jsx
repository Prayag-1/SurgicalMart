import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchBrands, createBrand, updateBrand, deleteBrand } from '../services/brands'

const initialForm = {
  id: null,
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  logo: null,
}

function AdminBrands() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState(initialForm)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchBrands()
      setBrands(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load brands')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      seo_keywords: form.seo_keywords,
    }
    if (form.logo) {
      payload.logo = form.logo
    }

    try {
      if (form.id) {
        await updateBrand(form.id, payload)
      } else {
        await createBrand(payload)
      }
      await load()
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Unable to save brand')
      setFieldErrors(err.fields || {})
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (brand) => {
    setFieldErrors({})
    setForm({
      id: brand.id,
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      seo_title: brand.seo_title || '',
      seo_description: brand.seo_description || '',
      seo_keywords: brand.seo_keywords || '',
      logo: null,
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return
    setError('')
    try {
      await deleteBrand(id)
      await load()
      if (form.id === id) {
        setForm(initialForm)
      }
    } catch (err) {
      setError(err.message || 'Unable to delete brand')
    }
  }

  const handleNameChange = (value) => {
    setForm((f) => {
      const next = { ...f, name: value }
      // Auto-fill slug only if user hasn't typed a custom slug (empty or matches previous auto)
      if (!f.slug || f.slug === slugify(f.name || '')) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const slugify = (val) =>
    (val || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  if (loading) return <div style={{ padding: 24 }}>Loading brands...</div>

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Brands</h2>
          <Link to="/admin/dashboard" style={linkStyle}>
             Back
          </Link>
        </div>
        <div style={card}>
          {error ? <p style={{ color: 'red' }}>{error}</p> : null}
          {brands.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Slug</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td style={td}>{brand.name}</td>
                    <td style={td}>{brand.slug}</td>
                    <td style={td}>
                      <button type="button" onClick={() => handleEdit(brand)} style={smallButton}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(brand.id)}
                        style={{ ...smallButton, marginLeft: 8, background: '#b91c1c' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No brands yet.</p>
          )}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>{form.id ? 'Edit brand' : 'Add brand'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <label style={label}>
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              style={input}
            />
            {fieldErrors.name ? <FieldError msg={fieldErrors.name} /> : null}
          </label>
          <label style={label}>
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              style={input}
            />
            {fieldErrors.slug ? <FieldError msg={fieldErrors.slug} /> : null}
          </label>
          {renderField('Description', 'description', form, setForm, fieldErrors, true)}
          {renderField('SEO Title', 'seo_title', form, setForm, fieldErrors)}
          {renderField('SEO Description', 'seo_description', form, setForm, fieldErrors, true)}
          {renderField('SEO Keywords', 'seo_keywords', form, setForm, fieldErrors)}
          <label style={label}>
            <span>Logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, logo: e.target.files?.[0] || null }))}
            />
            {fieldErrors.logo ? <FieldError msg={fieldErrors.logo} /> : null}
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="submit" disabled={saving} style={buttonPrimary}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {form.id ? (
              <button
                type="button"
                style={buttonSecondary}
                onClick={() => {
                  setForm(initialForm)
                  setFieldErrors({})
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

const renderField = (labelText, field, form, setForm, fieldErrors, multiline = false) => (
  <label style={label}>
    <span>{labelText}</span>
    {multiline ? (
      <textarea
        value={form[field]}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={{ ...input, minHeight: 80 }}
      />
    ) : (
      <input
        value={form[field]}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={input}
      />
    )}
    {fieldErrors[field] ? <FieldError msg={fieldErrors[field]} /> : null}
  </label>
)

const FieldError = ({ msg }) => (
  <span style={{ color: 'red', fontSize: 12 }}>{Array.isArray(msg) ? msg.join(', ') : msg}</span>
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

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#555', borderBottom: '1px solid #eee' }
const td = { padding: '10px 8px', fontSize: 14, borderBottom: '1px solid #f3f4f6' }

const smallButton = {
  padding: '6px 10px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const buttonPrimary = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

const buttonSecondary = { ...buttonPrimary, background: '#6b7280' }

export default AdminBrands
