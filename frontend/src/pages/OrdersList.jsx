import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../services/orders'

function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadOrders = async () => {
      setError('')
      setLoading(true)
      try {
        const data = await fetchOrders()
        setOrders(data)
      } catch (err) {
        setError(err.message || 'Unable to load orders')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [navigate])

  if (loading) {
    return <div style={{ padding: 24 }}>Loading orders...</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Orders</h2>
        <span style={{ color: '#555' }}>{orders.length} orders</span>
      </div>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Customer</th>
                <th style={th}>Total</th>
                <th style={th}>Status</th>
                <th style={th}>Updated</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>#{order.id}</td>
                  <td style={td}>
                    <div>{order.full_name}</div>
                    <div style={{ fontSize: 12, color: '#777' }}>{order.email}</div>
                  </td>
                  <td style={td}>${order.total_amount}</td>
                  <td style={td}>{order.status}</td>
                  <td style={td}>{new Date(order.updated_at).toLocaleString()}</td>
                  <td style={td}>
                    <button type="button" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
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

export default OrdersList
