import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, listCategories } from '../services/shop'

const grid = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  background: '#fff',
}

function HomePage() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, prods] = await Promise.all([
          listCategories(),
          listProducts({ is_featured: true }),
        ])
        const catList = Array.isArray(cats) ? cats : cats?.results || []
        const prodList = Array.isArray(prods) ? prods : prods?.results || []
        setCategories(catList)
        setFeatured(prodList)
      } catch {
        setCategories([])
        setFeatured([])
      }
    }
    load()
  }, [])

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <section style={{ display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Surgical Mart Nepal</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Reliable surgical supplies with fast delivery across Nepal. No accounts, just order and we handle the rest.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/products" style={button}>
            Browse products
          </Link>
          <a href="tel:+977-0000000" style={buttonSecondary}>
            Call us
          </a>
        </div>
      </section>

      <section>
        <h3>Categories</h3>
        <div style={grid}>
          {categories.slice(0, 6).map((cat) => (
            <div key={cat.slug} style={card}>
              <div style={{ fontWeight: 700 }}>{cat.name}</div>
              <p style={{ color: '#6b7280', fontSize: 13 }}>{cat.description?.slice(0, 80)}</p>
              <Link to={`/products?category=${cat.slug}`} style={link}>
                View
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Featured products</h3>
        <div style={grid}>
          {featured.map((product) => (
            <div key={product.id} style={card}>
              <h4 style={{ margin: '8px 0' }}>{product.name}</h4>
              <div style={{ fontWeight: 700 }}>Rs {product.price}</div>
              <Link to={`/products/${product.slug}`} style={link}>
                View
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer style={card}>
        <h4>Need help?</h4>
        <p style={{ margin: 0 }}>Email: support@surgicalmart.test</p>
        <p style={{ margin: 0 }}>Phone: +977-0000000</p>
      </footer>
    </div>
  )
}

const button = {
  padding: '10px 14px',
  background: '#111827',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
}
const buttonSecondary = { ...button, background: '#2563eb' }
const link = { ...button, padding: '8px 12px', background: '#2563eb' }

export default HomePage
