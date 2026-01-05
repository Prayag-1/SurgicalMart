import { Link, useLocation, useParams } from 'react-router-dom'

function OrderConfirmation() {
  const { orderId } = useParams()
  const location = useLocation()
  const summary = location.state || {}

  return (
    <div style={{ padding: 24 }}>
      <h2>Thank you!</h2>
      <p>Your order has been placed. We will contact you shortly.</p>
      {orderId ? <p>Order ID: #{orderId}</p> : null}
      {summary.items ? (
        <div style={{ marginTop: 12 }}>
          <h4>Summary</h4>
          {summary.items.map((item) => (
            <div key={item.product_id}>
              {item.name} x {item.quantity} — Rs {item.subtotal}
            </div>
          ))}
          <div style={{ fontWeight: 700, marginTop: 8 }}>Subtotal: Rs {summary.subtotal}</div>
        </div>
      ) : null}
      <div style={{ marginTop: 16 }}>
        <Link to="/products" style={link}>
          Continue shopping
        </Link>
      </div>
    </div>
  )
}

const link = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
}

export default OrderConfirmation
