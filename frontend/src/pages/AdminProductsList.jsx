import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProducts } from '../services/products'

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#555', borderBottom: '1px solid #eee' }
const td = { padding: '10px 8px', fontSize: 14, borderBottom: '1px solid #f3f4f6' }

function AdminProductsList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchProducts()
        setProducts(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        setError(err.message || 'Unable to load products')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  if (loading) {
    return <div style={{ padding: 24 }}>Loading products...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <Link to="/admin/dashboard" style={linkStyle}>
          ← Back to dashboard
        </Link>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>SKU</th>
              <th style={th}>Price</th>
              <th style={th}>Stock</th>
              <th style={th}>Active</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const lowStock = Number(product.stock) <= 5
              return (
                <tr key={product.id} style={{ background: lowStock ? '#fff7ed' : 'transparent' }}>
                  <td style={td}>{product.name}</td>
                  <td style={td}>{product.sku}</td>
                  <td style={td}>${product.price}</td>
                  <td style={{ ...td, color: lowStock ? '#b91c1c' : '#111827', fontWeight: lowStock ? 700 : 500 }}>
                    {product.stock}
                  </td>
                  <td style={td}>{product.is_active ? 'Yes' : 'No'}</td>
                  <td style={td}>
                    <Link to={`/admin/products/${product.id}`} style={linkButton}>
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: 14,
}

const linkButton = {
  display: 'inline-block',
  padding: '6px 10px',
  background: '#111827',
  color: '#fff',
  borderRadius: 6,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
}

export default AdminProductsList
