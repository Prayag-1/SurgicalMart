import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCart, checkout } from '../services/shop'

function CheckoutPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchCart()
        const items = data.items || data || []
        setCart(items)
      } catch (err) {
        setError(err.message || 'Unable to load cart')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await checkout({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      })
      setMessage('Order placed')
      navigate(`/order-confirmation/${res.order_id || ''}`, {
        state: { subtotal, items: cart },
      })
    } catch (err) {
      setError(err.message || 'Unable to place order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading checkout...</div>

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16, gridTemplateColumns: '1.5fr 1fr' }}>
      <div>
        <h2>Checkout</h2>
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        {message ? <p style={{ color: 'green' }}>{message}</p> : null}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          {renderField('Full name', 'full_name', form, setForm)}
          {renderField('Email', 'email', form, setForm)}
          {renderField('Phone', 'phone', form, setForm)}
          {renderTextarea('Address', 'address', form, setForm)}
          <div>
            <div style={{ fontWeight: 700 }}>Payment method</div>
            <p style={{ margin: 0, color: '#6b7280' }}>Cash on Delivery</p>
          </div>
          <button type="submit" disabled={saving} style={button}>
            {saving ? 'Placing order...' : 'Place order'}
          </button>
        </form>
      </div>

      <div style={card}>
        <h4>Order Summary</h4>
        {cart.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          cart.map((item) => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>Rs {item.subtotal}</span>
            </div>
          ))
        )}
        <div style={{ marginTop: 12, fontWeight: 700 }}>Subtotal: Rs {subtotal.toFixed(2)}</div>
      </div>
    </div>
  )
}

const renderField = (labelText, field, form, setForm) => (
  <label style={label}>
    <span>{labelText}</span>
    <input
      value={form[field] || ''}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={input}
      required={field !== 'email'}
    />
  </label>
)

const renderTextarea = (labelText, field, form, setForm) => (
  <label style={label}>
    <span>{labelText}</span>
    <textarea
      value={form[field] || ''}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={{ ...input, minHeight: 100 }}
      required
    />
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

const button = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

export default CheckoutPage
