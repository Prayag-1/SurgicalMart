import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchCategoryTree,
  fetchCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categories'

const initialForm = {
  id: null,
  name: '',
  slug: '',
  parent: '',
  description: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
}

const flattenTree = (nodes, prefix = '') => {
  let options = []
  nodes.forEach((node) => {
    options.push({ id: node.id, label: `${prefix}${node.name}` })
    if (node.children?.length) {
      options = options.concat(flattenTree(node.children, `${prefix}-- `))
    }
  })
  return options
}

const collectDescendants = (node) => {
  let ids = []
  node.children?.forEach((child) => {
    ids.push(child.id, ...collectDescendants(child))
  })
  return ids
}

const FieldError = ({ msg }) => (
  <span style={{ color: 'red', fontSize: 12 }}>{Array.isArray(msg) ? msg.join(', ') : msg}</span>
)

function AdminCategories() {
  const navigate = useNavigate()
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState(initialForm)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCategoryTree()
      setTree(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load categories')
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

  const handleEdit = async (node) => {
    setFieldErrors({})
    try {
      const full = await fetchCategory(node.id)
      setForm({
        id: full.id,
        name: full.name || '',
        slug: full.slug || '',
        parent: full.parent || '',
        description: full.description || '',
        seo_title: full.seo_title || '',
        seo_description: full.seo_description || '',
        seo_keywords: full.seo_keywords || '',
      })
    } catch (err) {
      setError(err.message || 'Unable to load category')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    setError('')
    try {
      await deleteCategory(id)
      await load()
      if (form.id === id) {
        setForm(initialForm)
      }
    } catch (err) {
      setError(err.message || 'Unable to delete category')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      name: form.name,
      slug: form.slug,
      parent: form.parent || null,
      description: form.description,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      seo_keywords: form.seo_keywords,
    }
    try {
      if (form.id) {
        await updateCategory(form.id, payload)
      } else {
        await createCategory(payload)
      }
      await load()
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Unable to save category')
      setFieldErrors(err.fields || {})
    } finally {
      setSaving(false)
    }
  }

  const findNode = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children?.length) {
        const child = findNode(node.children, id)
        if (child) return child
      }
    }
    return null
  }

  const options = useMemo(() => flattenTree(tree), [tree])
  const excludedIds = useMemo(() => {
    if (!form.id) return []
    const target = findNode(tree, form.id)
    if (!target) return []
    return [form.id, ...collectDescendants(target)]
  }, [form.id, tree])

  const availableParents = options.filter((opt) => !excludedIds.includes(opt.id))

  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: depth * 16, padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{node.name}</strong> <span style={{ color: '#6b7280' }}>({node.slug})</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => handleEdit(node)} style={smallButton}>
              Edit
            </button>
            <button type="button" onClick={() => handleDelete(node.id)} style={smallDanger}>
              Delete
            </button>
          </div>
        </div>
        {node.children?.length ? renderTree(node.children, depth + 1) : null}
      </div>
    ))

  if (loading) return <div style={{ padding: 24 }}>Loading categories...</div>

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Categories</h2>
          <Link to="/admin/dashboard" style={linkStyle}>
            ƒ+? Back
          </Link>
        </div>
        <div style={card}>{tree.length ? renderTree(tree) : <p>No categories yet.</p>}</div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>{form.id ? 'Edit category' : 'Add category'}</h3>
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          {renderField('Name', 'name', form, setForm, fieldErrors)}
          {renderField('Slug', 'slug', form, setForm, fieldErrors)}
          <label style={label}>
            <span>Parent</span>
            <select
              value={form.parent}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
              style={input}
            >
              <option value="">None</option>
              {availableParents.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.parent ? <FieldError msg={fieldErrors.parent} /> : null}
          </label>
          {renderField('Description', 'description', form, setForm, fieldErrors, true)}
          {renderField('SEO Title', 'seo_title', form, setForm, fieldErrors)}
          {renderField('SEO Description', 'seo_description', form, setForm, fieldErrors, true)}
          {renderField('SEO Keywords', 'seo_keywords', form, setForm, fieldErrors)}

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

const smallButton = {
  padding: '6px 10px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
}

const smallDanger = { ...smallButton, background: '#b91c1c' }

const buttonPrimary = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

const buttonSecondary = { ...buttonPrimary, background: '#6b7280' }

export default AdminCategories
