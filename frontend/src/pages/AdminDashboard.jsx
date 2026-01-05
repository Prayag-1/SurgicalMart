import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../services/dashboard'

const card = {
  background: '#0f182b',
  border: '1px solid #1f2a44',
  borderRadius: 14,
  padding: 16,
  color: '#e2e8f0',
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
}

const statGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
}

const sectionGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1.2fr',
  gap: 16,
  alignItems: 'start',
}

const badge = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: color === 'green' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
  color: color === 'green' ? '#34d399' : '#f87171',
})

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rs.0'
  return `Rs.${num.toLocaleString()}`
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const statusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return '#f59e0b'
    case 'CONFIRMED':
      return '#22c55e'
    case 'SHIPPED':
    case 'DELIVERED':
      return '#10b981'
    case 'CANCELLED':
      return '#f87171'
    default:
      return '#94a3b8'
  }
}

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

  const stats = useMemo(
    () => [
      { label: 'Total Orders', value: data?.total_orders ?? 0 },
      { label: 'Orders Today', value: data?.orders_today ?? 0 },
      { label: 'Pending Orders', value: data?.pending_orders ?? 0 },
      { label: 'Total Products', value: data?.total_products ?? 0 },
      { label: 'Revenue (This Month)', value: formatCurrency(data?.revenue_this_month ?? 0) },
    ],
    [data],
  )

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
          <p style={{ margin: 0, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Welcome back
          </p>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Operational Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>All numbers are real and updated live.</p>
        </div>
        <Link to="/admin/orders" style={{ ...primaryButton }}>
          View orders
        </Link>
      </div>

      <div style={statGrid}>
        {stats.map((item) => (
          <div key={item.label} style={{ ...card, minHeight: 110, display: 'grid', alignContent: 'center' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, letterSpacing: '0.02em' }}>{item.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={sectionGrid}>
        <div style={{ ...card, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Recent Orders</h3>
            <Link to="/admin/orders" style={{ ...ghostButton }}>
              View all
            </Link>
          </div>
          {data.recent_orders?.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.recent_orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #1f2a44',
                    background: '#0b1324',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>#{order.id}</div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>
                      {order.full_name || 'Customer'} · {order.phone || '—'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(order.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(order.total_amount)}</div>
                    <span style={{ ...badge('green'), background: 'rgba(59,130,246,0.12)', color: statusColor(order.status) }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8' }}>No recent orders.</p>
          )}
        </div>

        <div style={{ ...card, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Low Stock</h3>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>
              {data.low_stock_products_count || 0} items at or below threshold
            </span>
          </div>
          {data.low_stock_products?.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.low_stock_products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #1f2a44',
                    background: '#0b1324',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{product.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>
                      SKU: {product.sku || 'N/A'} · {product.category_name || 'No category'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>
                      {product.brand_name ? `Brand: ${product.brand_name}` : 'No brand'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(product.price)}</div>
                    <div style={{ color: '#f97316', fontWeight: 700 }}>Stock: {product.stock}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8' }}>No low-stock products.</p>
          )}
        </div>
      </div>

      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <MetricChip label="COD pending" value={data.cod_pending_count || 0} />
        <MetricChip label="Revenue (this month)" value={formatCurrency(data.revenue_this_month)} />
        <MetricChip label="Delivered" value={data.delivered_orders || 0} />
        <MetricChip label="Cancelled" value={data.cancelled_orders || 0} tone="red" />
      </div>
    </div>
  )
}

const MetricChip = ({ label, value, tone = 'blue' }) => (
  <div
    style={{
      padding: '12px 14px',
      borderRadius: 12,
      border: '1px solid #1f2a44',
      background: '#0b1324',
    }}
  >
    <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{label}</p>
    <p
      style={{
        margin: '6px 0 0',
        fontWeight: 700,
        color: tone === 'red' ? '#f87171' : '#38bdf8',
      }}
    >
      {value}
    </p>
  </div>
)

const primaryButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  fontWeight: 700,
  textDecoration: 'none',
}

const ghostButton = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  textDecoration: 'none',
  fontWeight: 600,
}

export default AdminDashboard
