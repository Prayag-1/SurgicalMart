import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBrand, fetchBrand, updateBrand } from '../services/brands'

const initialForm = {
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  is_active: true,
  featured: false,
  logo: null,
}

const slugify = (val) =>
  (val || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const FieldError = ({ msg }) => (
  <span style={{ color: '#f87171', fontSize: 12 }}>{Array.isArray(msg) ? msg.join(', ') : msg}</span>
)

function AdminBrandEdit() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      setFieldErrors({})
      try {
        if (!isNew && id) {
          const data = await fetchBrand(id)
          setForm({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            seo_title: data.seo_title || '',
            seo_description: data.seo_description || '',
            seo_keywords: data.seo_keywords || '',
            is_active: data.is_active !== undefined ? data.is_active : true,
            featured: data.featured || false,
            logo: null,
          })
          setLogoPreview(data.logo || '')
        } else {
          setForm(initialForm)
          setLogoPreview('')
        }
      } catch (err) {
        setError(err.message || 'Unable to load brand')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isNew, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    const useForm = Boolean(form.logo)
    let payload

    if (useForm) {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('slug', form.slug)
      if (form.description) fd.append('description', form.description)
      fd.append('is_active', form.is_active ? 'true' : 'false')
      fd.append('featured', form.featured ? 'true' : 'false')
      if (form.seo_title) fd.append('seo_title', form.seo_title)
      if (form.seo_description) fd.append('seo_description', form.seo_description)
      if (form.seo_keywords) fd.append('seo_keywords', form.seo_keywords)
      if (form.logo) fd.append('logo', form.logo)
      payload = fd
    } else {
      payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        is_active: form.is_active,
        featured: form.featured,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        seo_keywords: form.seo_keywords,
      }
    }

    try {
      if (isNew) {
        await createBrand(payload)
      } else {
        await updateBrand(id, payload)
      }
      navigate('/admin/brands', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to save brand')
      setFieldErrors(err.fields || {})
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleNameChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, name: value }
      if (!prev.slug || prev.slug === slugify(prev.name || '')) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading brand...</div>
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 820 }}>
      <Link to="/admin/brands" style={{ color: '#2563eb', textDecoration: 'none' }}>
        Back to brands
      </Link>

      <form onSubmit={handleSubmit} style={{ ...card, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc' }}>{isNew ? 'Add Brand' : 'Edit Brand'}</h2>
            <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Fill required fields and save.</p>
          </div>
        </div>

        {error ? <div style={{ color: '#f87171' }}>{error}</div> : null}
        {fieldErrors.non_field_errors ? <FieldError msg={fieldErrors.non_field_errors} /> : null}

        <div style={twoCol}>
          <label style={label}>
            <span>Name</span>
            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} style={input} />
            {fieldErrors.name ? <FieldError msg={fieldErrors.name} /> : null}
          </label>

          <label style={label}>
            <span>Slug</span>
            <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} style={input} />
            {fieldErrors.slug ? <FieldError msg={fieldErrors.slug} /> : null}
          </label>
        </div>

        <label style={label}>
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            style={{ ...input, minHeight: 120 }}
          />
          {fieldErrors.description ? <FieldError msg={fieldErrors.description} /> : null}
        </label>

        <div style={twoCol}>
          <label style={label}>
            <span>Meta Title</span>
            <input
              value={form.seo_title}
              onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
              style={input}
            />
            {fieldErrors.seo_title ? <FieldError msg={fieldErrors.seo_title} /> : null}
          </label>

          <label style={label}>
            <span>Keywords (comma separated)</span>
            <input
              value={form.seo_keywords}
              onChange={(e) => setForm((p) => ({ ...p, seo_keywords: e.target.value }))}
              style={input}
            />
            {fieldErrors.seo_keywords ? <FieldError msg={fieldErrors.seo_keywords} /> : null}
          </label>
        </div>

        <label style={label}>
          <span>Meta Description</span>
          <textarea
            value={form.seo_description}
            onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
            style={{ ...input, minHeight: 90 }}
          />
          {fieldErrors.seo_description ? <FieldError msg={fieldErrors.seo_description} /> : null}
        </label>

        <label style={label}>
          <span>Logo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setForm((p) => ({ ...p, logo: file }))
              setLogoPreview(file ? URL.createObjectURL(file) : logoPreview)
            }}
          />
          {logoPreview ? (
            <div style={{ marginTop: 8 }}>
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid #1f2a44' }}
              />
            </div>
          ) : null}
          {fieldErrors.logo ? <FieldError msg={fieldErrors.logo} /> : null}
        </label>

        <div style={twoCol}>
          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <span>Active</span>
          </label>

          <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
            />
            <span>Featured</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="submit" disabled={saving} style={primaryButton}>
            {saving ? 'Saving...' : isNew ? 'Create Brand' : 'Save Changes'}
          </button>
          <Link to="/admin/brands" style={linkButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

const card = {
  background: '#0f182b',
  border: '1px solid #1f2a44',
  borderRadius: 14,
  padding: 16,
  color: '#e2e8f0',
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
}

const input = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontSize: 14,
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
}

const twoCol = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const primaryButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  fontWeight: 700,
}

const linkButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontWeight: 700,
  textDecoration: 'none',
}

export default AdminBrandEdit
