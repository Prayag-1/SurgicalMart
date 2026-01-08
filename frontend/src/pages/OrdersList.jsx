import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportOrdersCsv, fetchOrders } from '../services/orders'

const statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const paymentStatuses = ['ALL', 'PENDING', 'PAID', 'FAILED']

const card = {
  background: '#0f182b',
  border: '1px solid #1f2a44',
  borderRadius: 14,
  padding: 16,
  color: '#e2e8f0',
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
}

const input = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontSize: 14,
}

const primaryButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const ghostButton = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontWeight: 600,
  cursor: 'pointer',
}

const badgeStyle = (tone) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: tone.background,
  color: tone.color,
})

const toneForStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return { background: 'rgba(251, 191, 36, 0.18)', color: '#fbbf24' }
    case 'CONFIRMED':
      return { background: 'rgba(34,197,94,0.14)', color: '#34d399' }
    case 'SHIPPED':
      return { background: 'rgba(59,130,246,0.14)', color: '#60a5fa' }
    case 'DELIVERED':
      return { background: 'rgba(16,185,129,0.14)', color: '#34d399' }
    case 'CANCELLED':
      return { background: 'rgba(248,113,113,0.14)', color: '#f87171' }
    default:
      return { background: 'rgba(148,163,184,0.18)', color: '#cbd5e1' }
  }
}

const toneForPayment = (paymentStatus) => {
  switch (paymentStatus) {
    case 'PAID':
      return { background: 'rgba(34,197,94,0.14)', color: '#34d399' }
    case 'FAILED':
      return { background: 'rgba(248,113,113,0.14)', color: '#f87171' }
    default:
      return { background: 'rgba(251,191,36,0.14)', color: '#fbbf24' }
  }
}

function OrdersList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    payment_status: 'ALL',
  })

  const queryParams = useMemo(() => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.status && filters.status !== 'ALL') params.status = filters.status
    if (filters.payment_status && filters.payment_status !== 'ALL') params.payment_status = filters.payment_status
    return params
  }, [filters])

  useEffect(() => {
    const loadOrders = async () => {
      setError('')
      setLoading(true)
      try {
        const data = await fetchOrders(queryParams)
        setOrders(data)
      } catch (err) {
        setError(err.message || 'Unable to load orders')
        if (err.code === 'unauthorized') {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [navigate, queryParams])

  const handleExport = async () => {
    try {
      setExporting(true)
      const { blob, filename } = await exportOrdersCsv(queryParams)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Unable to export orders')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>Operations</p>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Orders</h2>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Search, filter, and manage every order in one place.</p>
        </div>
        <button type="button" onClick={handleExport} disabled={exporting} style={primaryButton}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div style={{ ...card, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <label style={label}>
            <span>Search order number</span>
            <input
              style={input}
              placeholder="e.g. SMN-ABCD1234"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </label>
          <label style={label}>
            <span>Status</span>
            <select
              style={input}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'ALL' ? 'All statuses' : opt}
                </option>
              ))}
            </select>
          </label>
          <label style={label}>
            <span>Payment</span>
            <select
              style={input}
              value={filters.payment_status}
              onChange={(e) => setFilters((prev) => ({ ...prev, payment_status: e.target.value }))}
            >
              {paymentStatuses.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'ALL' ? 'All payments' : opt}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={() => setFilters({ search: '', status: 'ALL', payment_status: 'ALL' })} style={ghostButton}>
              Clear filters
            </button>
          </div>
        </div>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
          Showing <strong>{orders.length}</strong> orders
        </p>
      </div>

      <div style={{ ...card, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ margin: 0, color: '#cbd5e1' }}>Loading orders...</p>
        ) : error ? (
          <p style={{ margin: 0, color: '#f87171' }}>{error}</p>
        ) : orders.length === 0 ? (
          <p style={{ margin: 0, color: '#cbd5e1' }}>No orders found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Order</th>
                <th style={th}>Customer</th>
                <th style={th}>Date</th>
                <th style={th}>Status</th>
                <th style={th}>Payment</th>
                <th style={th}>Total</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #1f2a44' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{order.order_number || `#${order.id}`}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>#{order.id}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{order.customer_name || 'Customer'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{order.customer_email}</div>
                  </td>
                  <td style={td}>{formatDate(order.created_at)}</td>
                  <td style={td}>
                    <span style={badgeStyle(toneForStatus(order.status))}>{order.status}</span>
                  </td>
                  <td style={td}>
                    <span style={badgeStyle(toneForPayment(order.payment_status))}>
                      {order.payment_method} · {order.payment_status}
                    </span>
                  </td>
                  <td style={td}>{formatCurrency(order.total_amount)}</td>
                  <td style={{ ...td }}>
                    <button type="button" onClick={() => navigate(`/admin/orders/${order.id}`)} style={ghostButton}>
                      View &amp; Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const label = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
}

const th = {
  textAlign: 'left',
  padding: '10px 8px',
  fontSize: 13,
  color: '#cbd5e1',
  borderBottom: '1px solid #1f2a44',
}

const td = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#e2e8f0',
  borderBottom: '1px solid #0f172a',
}

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rs.0'
  return `Rs.${num.toLocaleString()}`
}

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default OrdersList
