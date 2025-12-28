import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchOrderDetail, updateOrderStatus } from '../services/orders'

const statusOptions = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      setError('')
      setLoading(true)
      try {
        const data = await fetchOrderDetail(id)
        setOrder(data)
        setStatus(data.status)
      } catch (err) {
        setError(err.message || 'Unable to load order')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id, navigate])

  const handleUpdateStatus = async () => {
    if (!status || saving) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateOrderStatus(id, status)
      setOrder(updated)
      setStatus(updated.status)
      setMessage('Status updated')
    } catch (err) {
      setError(err.message || 'Unable to update status')
      if (err.message?.toLowerCase().includes('unauthorized')) {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading order...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <p>Order not found.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <button type="button" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <h2>Order #{order.id}</h2>
      <p style={{ color: '#555' }}>Placed: {new Date(order.created_at).toLocaleString()}</p>

      <div style={{ marginTop: 16, display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr' }}>
        <div style={card}>
          <h4>Customer</h4>
          <p>{order.full_name}</p>
          <p>{order.email}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
        </div>

        <div style={card}>
          <h4>Status</h4>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={saving}
            style={{ marginTop: 12 }}
          >
            {saving ? 'Updating...' : 'Update status'}
          </button>
          {message ? <p style={{ color: 'green' }}>{message}</p> : null}
          {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>Items</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Price</th>
                <th style={th}>Qty</th>
                <th style={th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={`${item.product}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{item.product_detail?.name || item.product}</td>
                  <td style={td}>${item.price}</td>
                  <td style={td}>{item.quantity}</td>
                  <td style={td}>${item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16, fontWeight: 600 }}>Total: ${order.total_amount}</div>
    </div>
  )
}

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
}

const th = {
  textAlign: 'left',
  padding: '12px 8px',
  fontSize: 14,
  color: '#444',
  borderBottom: '1px solid #ddd',
}

const td = {
  padding: '12px 8px',
  fontSize: 14,
}

export default OrderDetail
