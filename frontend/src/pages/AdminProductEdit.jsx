import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProduct, updateProduct, updateProductStock, toggleProductActive } from '../services/products'

function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchProduct(id)
        setProduct(data)
        setPrice(data.price)
        setStock(data.stock)
        setIsActive(data.is_active)
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
  }, [id, navigate])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateProduct(id, { price: Number(price), stock: Number(stock), is_active: isActive })
      setProduct(updated)
      setPrice(updated.price)
      setStock(updated.stock)
      setIsActive(updated.is_active)
      setMessage('Saved')
    } catch (err) {
      setError(err.message || 'Unable to save')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStockUpdate = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateProductStock(id, Number(stock))
      setProduct(updated)
      setStock(updated.stock)
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
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await toggleProductActive(id)
      setProduct(updated)
      setIsActive(updated.is_active)
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

  if (loading) {
    return <div style={{ padding: 24 }}>Loading product...</div>
  }

  if (error && !product) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <Link to="/admin/products" style={{ color: '#2563eb', textDecoration: 'none' }}>
        ← Back to products
      </Link>

      <h2 style={{ marginBottom: 4 }}>{product?.name}</h2>
      <p style={{ marginTop: 0, color: '#6b7280' }}>SKU: {product?.sku}</p>

      <label style={label}>
        <span>Price</span>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={input}
        />
      </label>

      <label style={label}>
        <span>Stock</span>
        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} style={input} />
      </label>

      <label style={{ ...label, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Active</span>
      </label>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {message ? <p style={{ color: 'green' }}>{message}</p> : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" onClick={handleSave} disabled={saving} style={button}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={handleStockUpdate} disabled={saving} style={buttonSecondary}>
          {saving ? 'Updating...' : 'Update stock only'}
        </button>
        <button type="button" onClick={handleToggle} disabled={saving} style={buttonSecondary}>
          {saving ? 'Working...' : isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  )
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 12,
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

const buttonSecondary = {
  ...button,
  background: '#4b5563',
}

export default AdminProductEdit
