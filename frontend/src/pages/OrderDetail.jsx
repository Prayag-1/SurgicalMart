import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addShipment,
  fetchOrderDetail,
  fetchTimeline,
  generateInvoice,
  getInvoiceDownloadUrl,
  markPaymentReceived,
  updateOrderStatus,
} from '../services/orders'

const statusOptions = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const paymentStatusLabels = {
  PENDING: { color: '#fbbf24', background: 'rgba(251,191,36,0.14)' },
  PAID: { color: '#34d399', background: 'rgba(34,197,94,0.14)' },
  FAILED: { color: '#f87171', background: 'rgba(248,113,113,0.14)' },
}

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

const button = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
}

const ghostButton = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  cursor: 'pointer',
  fontWeight: 600,
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

const statusTone = (status) => {
  switch (status) {
    case 'PENDING':
      return { background: 'rgba(251,191,36,0.14)', color: '#fbbf24' }
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

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [status, setStatus] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [shipmentSaving, setShipmentSaving] = useState(false)
  const [shipmentError, setShipmentError] = useState('')
  const [shipmentMessage, setShipmentMessage] = useState('')
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const paymentTone = paymentStatusLabels[order?.payment_status] || paymentStatusLabels.PENDING

  const loadTimeline = async () => {
    try {
      const events = await fetchTimeline(id)
      setTimeline(events || [])
    } catch {
      setTimeline([])
    }
  }

  const loadOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await fetchOrderDetail(id)
      setOrder(data)
      setStatus(data.status)
      setCourierName(data.courier_name || '')
      setTrackingNumber(data.tracking_number || '')
      await loadTimeline()
    } catch (err) {
      setError(err.message || 'Unable to load order')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpdateStatus = async () => {
    if (!status || statusSaving) return
    setStatusSaving(true)
    setStatusMessage('')
    setError('')
    try {
      const updated = await updateOrderStatus(id, status)
      setOrder(updated)
      setStatus(updated.status)
      setStatusMessage('Status updated')
      loadTimeline()
    } catch (err) {
      setError(err.message || 'Unable to update status')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setStatusSaving(false)
    }
  }

  const handleMarkPayment = async () => {
    setPaymentSaving(true)
    setError('')
    try {
      const updated = await markPaymentReceived(id)
      setOrder(updated)
      loadTimeline()
    } catch (err) {
      setError(err.message || 'Unable to confirm payment')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setInvoiceSaving(true)
    setError('')
    try {
      await generateInvoice(id)
      await loadOrder()
    } catch (err) {
      setError(err.message || 'Unable to generate invoice')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setInvoiceSaving(false)
    }
  }

  const handleShipmentSubmit = async () => {
    if (shipmentSaving) return
    setShipmentSaving(true)
    setShipmentMessage('')
    setShipmentError('')
    try {
      const updated = await addShipment(id, {
        courier_name: courierName,
        tracking_number: trackingNumber,
      })
      setOrder(updated)
      setShipmentMessage('Shipment saved')
      loadTimeline()
    } catch (err) {
      setShipmentError(err.message || 'Unable to save shipment')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setShipmentSaving(false)
    }
  }

  const canConfirmCod = useMemo(
    () => order?.payment_method === 'COD' && order?.payment_status === 'PENDING',
    [order],
  )
  const canGenerateInvoice = useMemo(
    () => order?.payment_status === 'PAID' && !order?.invoice,
    [order],
  )
  const canEditShipment = useMemo(
    () => order?.payment_status === 'PAID' && !['CANCELLED', 'DELIVERED'].includes(order?.status || ''),
    [order],
  )

  if (loading) {
    return <div style={{ padding: 24, color: '#e2e8f0' }}>Loading order...</div>
  }

  if (error && !order) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: '#f87171' }}>{error}</p>
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
    <div style={{ padding: 24, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" onClick={() => navigate(-1)} style={ghostButton}>
          ← Back
        </button>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Updated: {formatDateTime(order.updated_at)}</div>
      </div>

      <div style={{ ...card, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>
              Order summary
            </p>
            <h2 style={{ margin: 0, color: '#f8fafc' }}>{order.order_number || `Order #${order.id}`}</h2>
            <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>
              Placed {formatDateTime(order.created_at)} · {order.items?.length || 0} items
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={badgeStyle(statusTone(order.status))}>{order.status}</span>
            <span style={badgeStyle(paymentTone)}>{order.payment_method} · {order.payment_status}</span>
            <span style={{ ...badgeStyle({ background: 'rgba(37,99,235,0.12)', color: '#60a5fa' }), fontSize: 13 }}>
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>
        {statusMessage ? <p style={{ margin: 0, color: '#34d399' }}>{statusMessage}</p> : null}
        {error ? <p style={{ margin: 0, color: '#f87171' }}>{error}</p> : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Customer</h3>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>{order.phone}</span>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
            <div style={{ color: '#94a3b8' }}>{order.customer_email}</div>
            <div style={{ color: '#94a3b8' }}>{order.address}</div>
          </div>
        </div>

        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Status</h3>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleUpdateStatus} disabled={statusSaving} style={button}>
            {statusSaving ? 'Updating...' : 'Update status'}
          </button>
        </div>
      </div>

      <div style={{ ...card, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Items</h3>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{order.items?.length || 0} items</span>
        </div>
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
              {order.items?.map((item, idx) => (
                <tr key={`${item.product}-${idx}`} style={{ borderBottom: '1px solid #1f2a44' }}>
                  <td style={td}>{item.product_detail?.name || item.product}</td>
                  <td style={td}>{formatCurrency(item.price)}</td>
                  <td style={td}>{item.quantity}</td>
                  <td style={td}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Payment</h3>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Method: <strong>{order.payment_method}</strong>
          </p>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Status: <span style={badgeStyle(paymentTone)}>{order.payment_status}</span>
          </p>
          {canConfirmCod ? (
            <button type="button" onClick={handleMarkPayment} disabled={paymentSaving} style={button}>
              {paymentSaving ? 'Marking...' : 'Mark COD as received'}
            </button>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Payment recorded.</p>
          )}
        </div>

        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Invoice</h3>
          {order.invoice ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <p style={{ margin: 0, color: '#cbd5e1' }}>Invoice #{order.invoice.number}</p>
              {order.invoice.pdf_url ? (
                <a href={order.invoice.pdf_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
                  Download PDF
                </a>
              ) : (
                <a href={getInvoiceDownloadUrl(id)} style={{ color: '#60a5fa' }}>
                  Download PDF
                </a>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#94a3b8' }}>No invoice yet.</p>
          )}
          {canGenerateInvoice ? (
            <button type="button" onClick={handleGenerateInvoice} disabled={invoiceSaving} style={button}>
              {invoiceSaving ? 'Generating...' : 'Generate invoice'}
            </button>
          ) : null}
        </div>

        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Shipment</h3>
          <p style={{ margin: 0, color: '#cbd5e1' }}>Courier: {order.courier_name || 'N/A'}</p>
          <p style={{ margin: 0, color: '#cbd5e1' }}>Tracking: {order.tracking_number || 'N/A'}</p>
          <p style={{ margin: 0, color: '#cbd5e1' }}>Shipped at: {formatDateTime(order.shipped_at) || 'N/A'}</p>
          {shipmentMessage ? <p style={{ margin: 0, color: '#34d399' }}>{shipmentMessage}</p> : null}
          {shipmentError ? <p style={{ margin: 0, color: '#f87171' }}>{shipmentError}</p> : null}
          {canEditShipment ? (
            <>
              <label style={label}>
                <span>Courier Name</span>
                <input value={courierName} onChange={(e) => setCourierName(e.target.value)} style={input} />
              </label>
              <label style={label}>
                <span>Tracking Number</span>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} style={input} />
              </label>
              <button type="button" onClick={handleShipmentSubmit} disabled={shipmentSaving} style={button}>
                {shipmentSaving ? 'Saving...' : 'Save shipment'}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ ...card, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Timeline</h3>
          <button type="button" onClick={loadTimeline} style={ghostButton}>
            Refresh
          </button>
        </div>
        {timeline.length === 0 ? (
          <p style={{ margin: 0, color: '#94a3b8' }}>No timeline events yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {timeline.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #1f2a44',
                  background: '#0b1324',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{renderTimelineTitle(event)}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(event.created_at)}</span>
                </div>
                {event.event_type === 'note' ? (
                  <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>{event.note}</p>
                ) : null}
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}>
                  {event.actor_email ? `By ${event.actor_email}` : 'System'}
                </p>
              </div>
            ))}
          </div>
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

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid #1f2a44' }
const td = { padding: '12px 8px', fontSize: 14, color: '#e2e8f0', borderBottom: '1px solid #0f172a' }

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rs.0'
  return `Rs.${num.toLocaleString()}`
}

const formatDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const renderTimelineTitle = (event) => {
  if (event.event_type === 'status_change') {
    return `Status: ${event.from_status} → ${event.to_status}`
  }
  if (event.event_type === 'note') {
    return 'Note'
  }
  return 'Event'
}

export default OrderDetail
