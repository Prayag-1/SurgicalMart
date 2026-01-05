import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listProducts, listCategories } from '../services/shop'

const grid = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  background: '#fff',
}

function ProductList() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [cats, prods] = await Promise.all([
        listCategories(),
        listProducts({
          category: params.get('category') || '',
          search: params.get('q') || '',
        }),
      ])
      setCategories(Array.isArray(cats) ? cats : cats?.results || [])
      setProducts(Array.isArray(prods) ? prods : prods?.results || [])
    } catch (err) {
      setError(err.message || 'Unable to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const applyFilters = () => {
    const next = new URLSearchParams()
    if (search) next.set('q', search)
    if (params.get('category')) next.set('category', params.get('category'))
    setParams(next)
  }

  if (loading) return <div style={{ padding: 24 }}>Loading products...</div>
  if (error) return <div style={{ padding: 24 }}>{error}</div>

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />
        <select
          value={params.get('category') || ''}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            if (e.target.value) {
              next.set('category', e.target.value)
            } else {
              next.delete('category')
            }
            setParams(next)
          }}
          style={input}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={applyFilters} style={button}>
          Apply
        </button>
      </div>

      <div style={grid}>
        {products.map((product) => (
          <div key={product.id} style={card}>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <h4 style={{ margin: '8px 0' }}>{product.name}</h4>
            <div style={{ color: '#111827', fontWeight: 700 }}>Rs {product.price}</div>
            <p style={{ color: '#6b7280', fontSize: 13 }}>
              {product.category?.name || product.category?.slug || 'Category'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Link to={`/products/${product.slug}`} style={link}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const input = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
}

const button = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

const link = {
  padding: '8px 12px',
  background: '#111827',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 14,
}

export default ProductList
