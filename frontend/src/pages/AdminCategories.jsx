import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCategoryTree, updateCategory } from '../services/categories'

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

const selectStyle = { ...input }

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
}

const statusBadge = (isActive) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: isActive ? 'rgba(34,197,94,0.14)' : 'rgba(248,113,113,0.14)',
  color: isActive ? '#34d399' : '#f87171',
})

const featuredBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  background: 'rgba(59,130,246,0.14)',
  color: '#60a5fa',
}

const IconBox = ({ children }) => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      border: '1px solid #1f2a44',
      background: '#0b1324',
      display: 'grid',
      placeItems: 'center',
      color: '#94a3b8',
      fontWeight: 700,
    }}
  >
    {children}
  </div>
)

const flattenTree = (nodes, depth = 0) => {
  let list = []
  nodes.forEach((node) => {
    list.push({ ...node, depth })
    if (node.children?.length) {
      list = list.concat(flattenTree(node.children, depth + 1))
    }
  })
  return list
}

function AdminCategories() {
  const navigate = useNavigate()
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: 'all', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const treeData = await fetchCategoryTree()
      setTree(Array.isArray(treeData) ? treeData : treeData?.results || [])
    } catch (err) {
      setError(err.message || 'Unable to load categories')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    load()
  }, [load])

  const flatWithDepth = useMemo(() => {
    const list = flattenTree(tree)
    return list.filter((item) => {
      if (filters.status === 'active' && !item.is_active) return false
      if (filters.status === 'inactive' && item.is_active) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          item.name?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.seo_keywords?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tree, filters])

  const handleToggle = async (id, field, value) => {
    try {
      await updateCategory(id, { [field]: value })
      load()
    } catch (err) {
      setError(err.message || 'Unable to update category')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading categories...</div>
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Categories</h2>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Manage your product categories</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/categories/new')}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #2563eb',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          + Add Category
        </button>
      </div>

      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <label style={label}>
          <span>Filter by Status</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            style={selectStyle}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label style={label}>
          <span>Search Categories</span>
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by name or description..."
            style={input}
          />
        </label>
      </div>

      {error ? <div style={{ ...card, color: '#f87171' }}>{error}</div> : null}

      <div style={{ ...card, padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Category</th>
              <th style={th}>Slug</th>
              <th style={th}>Products</th>
              <th style={th}>Status</th>
              <th style={th}>Featured</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flatWithDepth.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center' }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              flatWithDepth.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #1f2a44' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: cat.depth * 16 }}>
                      <IconBox>
                        <span aria-label="folder">Folder</span>
                      </IconBox>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{cat.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                          {cat.description
                            ? `${cat.description.slice(0, 50)}${cat.description.length > 50 ? '...' : ''}`
                            : 'No description'}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {cat.featured ? <span style={featuredBadge}>Featured</span> : null}
                          {cat.seo_keywords ? <span style={{ ...pill }}>{cat.seo_keywords.split(',').slice(0, 3).join(', ')}</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>{cat.slug}</td>
                  <td style={td}>{cat.product_count ?? 0}</td>
                  <td style={td}>
                    <span style={statusBadge(cat.is_active)}>{cat.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={td}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!cat.featured}
                        onChange={(e) => handleToggle(cat.id, 'featured', e.target.checked)}
                      />
                      <span style={{ color: '#cbd5e1', fontSize: 13 }}>{cat.featured ? 'On' : 'Off'}</span>
                    </label>
                  </td>
                  <td style={{ ...td, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to={`/admin/categories/${cat.id}`} style={linkButton}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggle(cat.id, 'is_active', !cat.is_active)}
                      style={linkButton}
                    >
                      {cat.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1f2a44' }
const td = { padding: '12px 8px', fontSize: 14, color: '#e2e8f0', borderBottom: '1px solid #0f172a' }

const linkButton = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
}

const pill = {
  padding: '4px 8px',
  borderRadius: 999,
  background: '#0b1324',
  border: '1px solid #1f2a44',
  color: '#cbd5e1',
  fontSize: 12,
}

export default AdminCategories
