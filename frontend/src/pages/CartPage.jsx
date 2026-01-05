import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCart, updateCartItem, removeCartItem } from '../services/shop'

function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCart()
      setItems(data.items || data || [])
    } catch (err) {
      setError(err.message || 'Unable to load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleQty = async (productId, quantity) => {
    setSaving(true)
    try {
      await updateCartItem(productId, Number(quantity))
      await load()
    } catch (err) {
      setError(err.message || 'Unable to update cart')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (productId) => {
    setSaving(true)
    try {
      await removeCartItem(productId)
      await load()
    } catch (err) {
      setError(err.message || 'Unable to remove item')
    } finally {
      setSaving(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)

  if (loading) return <div style={{ padding: 24 }}>Loading cart...</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Cart</h2>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {items.length === 0 ? (
        <p>
          Cart is empty. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Price</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Subtotal</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>{item.name}</td>
                    <td style={td}>Rs {item.price}</td>
                    <td style={td}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQty(item.product_id, e.target.value)}
                        style={{ width: 70, padding: '6px 8px' }}
                        disabled={saving}
                      />
                    </td>
                    <td style={td}>Rs {item.subtotal}</td>
                    <td style={td}>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.product_id)}
                        disabled={saving}
                        style={buttonSecondary}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, fontWeight: 700 }}>Subtotal: Rs {subtotal.toFixed(2)}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link to="/products" style={link}>
              Continue shopping
            </Link>
            <button type="button" style={button} onClick={() => navigate('/checkout')} disabled={saving}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#555' }
const td = { padding: '10px 8px', fontSize: 14 }
const button = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}
const buttonSecondary = { ...button, background: '#6b7280' }
const link = {
  ...button,
  textDecoration: 'none',
  display: 'inline-block',
}

export default CartPage
