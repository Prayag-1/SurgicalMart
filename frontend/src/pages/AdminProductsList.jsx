import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProducts, toggleProductActive } from '../services/products'
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

const primaryButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  fontWeight: 700,
  textDecoration: 'none',
}

const linkButton = {
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontWeight: 600,
  textDecoration: 'none',
}

const ActionButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      ...linkButton,
      cursor: 'pointer',
      border: '1px solid #1f2a44',
    }}
  >
    {children}
  </button>
)

function AdminProductsList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    category: '',
    status: 'all',
    search: '',
    brand: '',
  })

  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

  const loadOptions = async () => {
    const [cats, brs] = await Promise.all([fetchCategoryTree(), fetchBrands()])
    setCategories(Array.isArray(cats) ? cats : cats?.results || [])
    setBrands(Array.isArray(brs) ? brs : brs?.results || [])
  }

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.category) params.category = Number(filters.category)
      if (filters.brand) params.brand = Number(filters.brand)
      if (filters.status === 'active') params.is_active = true
      if (filters.status === 'inactive') params.is_active = false
      if (filters.search) params.search = filters.search

      const data = await fetchProducts(params)
      const items = Array.isArray(data) ? data : data.results || []
      setProducts(items)
    } catch (err) {
      setError(err.message || 'Unable to load products')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleToggleActive = async (id) => {
    try {
      await toggleProductActive(id)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Unable to update product')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    }
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Products</h2>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Manage your medical supplies inventory</p>
        </div>
        <button type="button" onClick={() => navigate('/admin/products/new')} style={primaryButton}>
          + Add Product
        </button>
      </div>

      <div style={{ ...card, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={label}>
              <span>Filter by Category</span>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                style={selectStyle}
              >
                <option value="">All Categories</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
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
          </div>

          <div>
            <label style={label}>
              <span>Filter by Brand</span>
              <select
                value={filters.brand}
                onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
                style={selectStyle}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label style={label}>
              <span>Search</span>
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Name, description, or SKU"
                style={input}
              />
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ ...card }}>Loading products...</div>
      ) : error ? (
        <div style={{ ...card, color: '#f87171' }}>{error}</div>
      ) : (
        <div style={{ ...card, overflowX: 'auto' }}>
          {products.length === 0 ? (
            <p style={{ margin: 0, color: '#cbd5e1' }}>No products found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Brand</th>
                  <th style={th}>Price</th>
                  <th style={th}>Stock</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #1f2a44' }}>
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
                            fontWeight: 700,
                            color: '#94a3b8',
                            overflow: 'hidden',
                          }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            product.name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{product.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'grid', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{product.brand?.name || 'No brand'}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{product.brand?.slug || ''}</span>
                      </div>
                    </td>
                    <td style={td}>{formatCurrency(product.price)}</td>
                    <td style={td}>{product.stock ?? 'N/A'}</td>
                    <td style={td}>
                      <span style={statusBadge(product.is_active)}>{product.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ ...td, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link to={`/admin/products/${product.id}`} style={linkButton}>
                        Edit
                      </Link>
                      <ActionButton onClick={() => handleToggleActive(product.id)}>
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rs.0'
  return `Rs.${num.toLocaleString()}`
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
}

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1f2a44' }
const td = { padding: '12px 8px', fontSize: 14, color: '#e2e8f0', borderBottom: '1px solid #0f172a' }

export default AdminProductsList
