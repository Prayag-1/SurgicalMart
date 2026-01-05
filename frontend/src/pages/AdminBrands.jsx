import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchBrands, updateBrand } from '../services/brands'

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

function AdminBrands() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: 'all', search: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.status === 'active') params.is_active = true
      if (filters.status === 'inactive') params.is_active = false
      if (filters.search) params.search = filters.search
      const data = await fetchBrands(params)
      setBrands(Array.isArray(data) ? data : data.results || [])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleToggle = async (id, field, value) => {
    try {
      await updateBrand(id, { [field]: value })
      load()
    } catch (err) {
      setError(err.message || 'Unable to update brand')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    }
  }

  const filtered = useMemo(() => {
    if (!filters.search) return brands
    const q = filters.search.toLowerCase()
    return brands.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.seo_keywords?.toLowerCase().includes(q),
    )
  }, [brands, filters.search])

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Brands</h2>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Manage your product brands</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/brands/new')}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #2563eb',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          + Add Brand
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
          <span>Search Brands</span>
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by name or description..."
            style={input}
          />
        </label>
      </div>

      {error ? <div style={{ ...card, color: '#f87171' }}>{error}</div> : null}

      {loading ? (
        <div style={{ ...card }}>Loading brands...</div>
      ) : (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Brand</th>
                <th style={th}>Slug</th>
                <th style={th}>Status</th>
                <th style={th}>Featured</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center' }}>
                    No brands found.
                  </td>
                </tr>
              ) : (
                filtered.map((brand) => (
                  <tr key={brand.id} style={{ borderBottom: '1px solid #1f2a44' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 10,
                            background: '#0b1324',
                            border: '1px solid #1f2a44',
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ color: '#94a3b8', fontWeight: 700 }}>{brand.name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{brand.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>
                            {brand.description
                              ? `${brand.description.slice(0, 50)}${brand.description.length > 50 ? '...' : ''}`
                              : 'No description'}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            {brand.featured ? <span style={featuredBadge}>Featured</span> : null}
                            {brand.seo_keywords ? <span style={{ ...pill }}>{brand.seo_keywords.split(',').slice(0, 3).join(', ')}</span> : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>{brand.slug}</td>
                    <td style={td}>
                      <span style={statusBadge(brand.is_active)}>{brand.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={td}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!brand.featured}
                          onChange={(e) => handleToggle(brand.id, 'featured', e.target.checked)}
                        />
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>{brand.featured ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                    <td style={{ ...td, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link to={`/admin/brands/${brand.id}`} style={linkButton}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggle(brand.id, 'is_active', !brand.is_active)}
                        style={linkButton}
                      >
                        {brand.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1f2a44' }
const td = { padding: '12px 8px', fontSize: 14, color: '#e2e8f0', borderBottom: '1px solid #0f172a' }

const pill = {
  padding: '4px 8px',
  borderRadius: 999,
  background: '#0b1324',
  border: '1px solid #1f2a44',
  color: '#cbd5e1',
  fontSize: 12,
}

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

export default AdminBrands
