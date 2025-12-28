import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../services/dashboard'

const MetricCard = ({ label, value }) => (
  <div style={card}>
    <div style={{ color: '#6b7280', fontSize: 14 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
)

function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const payload = await fetchDashboard()
        setData(payload)
      } catch (err) {
        setError(err.message || 'Unable to load dashboard')
        if (err.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const pendingOrders = useMemo(() => {
    if (!data?.orders_by_status) return 0
    return data.orders_by_status.PENDING || 0
  }, [data])

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <p>Dashboard data unavailable.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Operational summary for Surgical Mart</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/orders" style={buttonLink}>
            View all orders
          </Link>
          <Link to="/admin/products" style={buttonLinkSecondary}>
            View products
          </Link>
        </div>
      </div>

      <div style={grid3}>
        <MetricCard label="Total Orders" value={data.total_orders} />
        <MetricCard label="Orders Today" value={data.orders_today} />
        <MetricCard label="Pending Orders" value={pendingOrders} />
      </div>

      <div style={grid2}>
        <div style={card}>
          <div style={sectionHeader}>
            <h4 style={{ margin: 0 }}>Recent Orders</h4>
            <Link to="/admin/orders" style={linkStyle}>
              View all
            </Link>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {data.recent_orders?.length ? (
              data.recent_orders.map((order) => (
                <div key={order.id} style={row}>
                  <div>
                    <div style={{ fontWeight: 600 }}>#{order.id}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{order.full_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>${order.total_amount}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{order.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: '#6b7280' }}>No recent orders.</p>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <h4 style={{ margin: 0 }}>Low-Stock Products</h4>
            <Link to="/admin/products" style={linkStyle}>
              View products
            </Link>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {data.low_stock_products?.length ? (
              data.low_stock_products.map((product) => (
                <div key={product.id} style={row}>
                  <div style={{ fontWeight: 600 }}>{product.name}</div>
                  <div style={{ color: '#b91c1c', fontWeight: 700 }}>{product.stock}</div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: '#6b7280' }}>No low-stock products.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  background: '#fff',
}

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 12,
}

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
}

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: 14,
}

const buttonLink = {
  display: 'inline-block',
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
}

const buttonLinkSecondary = {
  ...buttonLink,
  background: '#4b5563',
}

export default AdminDashboard
