import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createProduct, fetchProduct, updateProduct, updateProductStock, toggleProductActive } from '../services/products'
import { fetchCategoryTree } from '../services/categories'
import { fetchBrands } from '../services/brands'

const flattenCategories = (nodes, prefix = '') => {
  let options = []
  nodes.forEach((node) => {
    options.push({ id: node.id, label: `${prefix}${node.name}` })
    if (node.children?.length) {
      options = options.concat(flattenCategories(node.children, `${prefix}-- `))
    }
  })
  return options
}

const initialForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  stock: '',
  category: '',
  brand: '',
  short_description: '',
  description: '',
  is_featured: false,
  is_active: true,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  image: null,
}

const FieldError = ({ msg }) => (
  <span style={{ color: 'red', fontSize: 12 }}>{Array.isArray(msg) ? msg.join(', ') : msg}</span>
)

const slugify = (val) =>
  (val || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])

  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

  const loadOptions = async () => {
    const [cats, brs] = await Promise.all([fetchCategoryTree(), fetchBrands()])
    setCategories(Array.isArray(cats) ? cats : cats?.results || [])
    setBrands(Array.isArray(brs) ? brs : brs?.results || [])
  }

  const refreshOptions = async () => {
    try {
      await loadOptions()
      setMessage('Updated category/brand lists')
    } catch (err) {
      setError(err.message || 'Unable to refresh options')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      setFieldErrors({})
      try {
        await loadOptions()
        if (!isNew && id) {
          const data = await fetchProduct(id)
          setForm({
            name: data.name || '',
            slug: data.slug || '',
            sku: data.sku || '',
            price: data.price ?? '',
            stock: data.stock ?? '',
            category: data.category?.id || '',
            brand: data.brand?.id || '',
            short_description: data.short_description || '',
            description: data.description || '',
            is_featured: Boolean(data.is_featured),
            is_active: Boolean(data.is_active),
            seo_title: data.seo_title || '',
            seo_description: data.seo_description || '',
            seo_keywords: data.seo_keywords || '',
            image: null,
          })
          setMessage('')
        } else {
          setForm(initialForm)
        }
      } catch (err) {
        setError(err.message || 'Unable to load product')
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
    e?.preventDefault?.()
    setSaving(true)
    setError('')
    setMessage('')
    setFieldErrors({})

    const useFormData = Boolean(form.image)
    const payload = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      price: form.price === '' ? '' : Number(form.price),
      stock: form.stock === '' ? 0 : Number(form.stock),
      description: form.description,
      short_description: form.short_description || '',
      category: form.category || null,
      brand: form.brand || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      seo_title: form.seo_title || '',
      seo_description: form.seo_description || '',
      seo_keywords: form.seo_keywords || '',
    }

    const fd = new FormData()
    if (useFormData) {
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (typeof value === 'boolean') {
          fd.append(key, value ? 'true' : 'false')
        } else {
          fd.append(key, value)
        }
      })
      if (form.image) fd.append('image', form.image)
    }

    try {
      if (isNew) {
        await createProduct(useFormData ? fd : payload)
        setMessage('Product created')
        navigate('/admin/products', { replace: true })
      } else {
        const updated = await updateProduct(id, useFormData ? fd : payload)
        setMessage('Saved')
        setForm((prev) => ({
          ...prev,
          ...updated,
          category: updated.category?.id || '',
          brand: updated.brand?.id || '',
          price: updated.price ?? '',
          stock: updated.stock ?? '',
        }))
      }
    } catch (err) {
      setError(err.message || 'Unable to save product')
      setFieldErrors(err.fields || {})
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStockUpdate = async () => {
    if (isNew) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateProductStock(id, Number(form.stock))
      setForm((prev) => ({ ...prev, stock: updated.stock ?? '' }))
      setMessage('Stock updated')
    } catch (err) {
      setError(err.message || 'Unable to update stock')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    if (isNew) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await toggleProductActive(id)
      setForm((prev) => ({ ...prev, is_active: updated.is_active }))
      setMessage('Visibility updated')
    } catch (err) {
      setError(err.message || 'Unable to update product')
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
    return <div style={{ padding: 24 }}>Loading product...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>
      <Link to="/admin/products" style={{ color: '#2563eb', textDecoration: 'none' }}>
        Back to products
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        <form onSubmit={handleSubmit} style={{ ...card, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>{isNew ? 'Add Product' : 'Edit Product'}</h2>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                SKU: {form.sku || '-'} {form.is_active ? '' : '(Inactive)'}
              </p>
            </div>
            <button type="button" onClick={refreshOptions} style={ghostButton}>
              Refresh categories/brands
            </button>
          </div>

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

          <div style={twoCol}>
            <label style={label}>
              <span>SKU</span>
              <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} style={input} />
              {fieldErrors.sku ? <FieldError msg={fieldErrors.sku} /> : null}
            </label>

            <label style={label}>
              <span>Price</span>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                style={input}
              />
              {fieldErrors.price ? <FieldError msg={fieldErrors.price} /> : null}
            </label>
          </div>

          <div style={twoCol}>
            <label style={label}>
              <span>Stock</span>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                style={input}
              />
              {fieldErrors.stock ? <FieldError msg={fieldErrors.stock} /> : null}
            </label>

            <label style={label}>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                style={input}
              >
                <option value="">Select category</option>
                {flatCategories.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.category ? <FieldError msg={fieldErrors.category} /> : null}
            </label>
          </div>

          <div style={twoCol}>
            <label style={label}>
              <span>Brand</span>
              <select
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                style={input}
              >
                <option value="">None</option>
                {(brands || []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {fieldErrors.brand ? <FieldError msg={fieldErrors.brand} /> : null}
            </label>

            <label style={label}>
              <span>Short Description</span>
              <input
                value={form.short_description}
                onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                style={input}
              />
              {fieldErrors.short_description ? <FieldError msg={fieldErrors.short_description} /> : null}
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
                checked={form.is_featured}
                onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
              />
              <span>Featured</span>
            </label>
          </div>

          <div style={twoCol}>
            <label style={label}>
              <span>SEO Title</span>
              <input
                value={form.seo_title}
                onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                style={input}
              />
              {fieldErrors.seo_title ? <FieldError msg={fieldErrors.seo_title} /> : null}
            </label>

            <label style={label}>
              <span>SEO Keywords</span>
              <input
                value={form.seo_keywords}
                onChange={(e) => setForm((p) => ({ ...p, seo_keywords: e.target.value }))}
                style={input}
              />
              {fieldErrors.seo_keywords ? <FieldError msg={fieldErrors.seo_keywords} /> : null}
            </label>
          </div>

          <label style={label}>
            <span>SEO Description</span>
            <textarea
              value={form.seo_description}
              onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
              style={{ ...input, minHeight: 90 }}
            />
            {fieldErrors.seo_description ? <FieldError msg={fieldErrors.seo_description} /> : null}
          </label>

          <label style={label}>
            <span>Product Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
            />
            {fieldErrors.image ? <FieldError msg={fieldErrors.image} /> : null}
          </label>

          {error ? <p style={{ color: 'red' }}>{error}</p> : null}
          {message ? <p style={{ color: 'green' }}>{message}</p> : null}
          {fieldErrors.non_field_errors ? <FieldError msg={fieldErrors.non_field_errors} /> : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} style={button}>
              {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
            </button>
            {!isNew ? (
              <>
                <button type="button" onClick={handleStockUpdate} disabled={saving} style={buttonSecondary}>
                  {saving ? 'Updating...' : 'Update stock only'}
                </button>
                <button type="button" onClick={handleToggle} disabled={saving} style={buttonSecondary}>
                  {saving ? 'Working...' : form.is_active ? 'Disable' : 'Enable'}
                </button>
              </>
            ) : null}
          </div>
        </form>

        <div style={{ ...card, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Tips</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Fill required fields: name, slug, SKU, category, price, stock, and description. Slugs must be unique.
          </p>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Use "Refresh categories/brands" after creating a new category or brand to see it here.
          </p>
        </div>
      </div>
    </div>
  )
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#cbd5e1',
  fontWeight: 600,
}

const input = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontSize: 14,
}

const card = {
  background: '#0f182b',
  border: '1px solid #1f2a44',
  borderRadius: 14,
  padding: 16,
  color: '#e2e8f0',
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
}

const twoCol = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const button = {
  padding: '10px 14px',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  border: '1px solid #2563eb',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 700,
}

const buttonSecondary = {
  padding: '10px 14px',
  background: '#0b1324',
  color: '#e2e8f0',
  border: '1px solid #1f2a44',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 600,
}

const ghostButton = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  cursor: 'pointer',
  fontWeight: 600,
}

export default AdminProductEdit
