import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getProduct } from '../services/shop'
import { addToCart } from '../services/shop'

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  background: '#fff',
}

function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getProduct(slug)
        setProduct(data)
        document.title = data.seo_title || data.name
        if (data.seo_description) {
          const meta = document.querySelector('meta[name="description"]')
          if (meta) meta.setAttribute('content', data.seo_description)
        }
      } catch (err) {
        setError(err.message || 'Unable to load product')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const handleAdd = async () => {
    setMessage('')
    try {
      await addToCart(product.id, Number(qty) || 1)
      setMessage('Added to cart')
    } catch (err) {
      setError(err.message || 'Unable to add to cart')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading product...</div>
  if (error) return <div style={{ padding: 24 }}>{error}</div>
  if (!product) return null

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
      <div>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 10 }}
          />
        ) : null}
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>{product.name}</h2>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Rs {product.price}</div>
        <p style={{ color: '#6b7280' }}>
          Category: {product.category?.name || product.category?.slug || '—'}
        </p>
        <p style={{ color: '#6b7280' }}>Brand: {product.brand?.name || '—'}</p>
        <p>{product.description}</p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <span>Qty</span>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button type="button" onClick={handleAdd} style={button}>
            Add to cart
          </button>
          <Link to="/cart" style={link}>
            Go to cart
          </Link>
        </div>
        {message ? <p style={{ color: 'green' }}>{message}</p> : null}
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      </div>
    </div>
  )
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
  padding: '10px 14px',
  background: '#2563eb',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
}

export default ProductDetailPage
