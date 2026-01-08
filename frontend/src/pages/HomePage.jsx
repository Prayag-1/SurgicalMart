import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, listCategories, fetchHomepageConfig } from '../services/shop'

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
  const [homepageConfig, setHomepageConfig] = useState(null)
  const [slides, setSlides] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, prods, config] = await Promise.all([
          listCategories(),
          listProducts({ is_featured: true }),
          fetchHomepageConfig().catch(() => null),
        ])
        const catList = Array.isArray(cats) ? cats : cats?.results || []
        const prodList = Array.isArray(prods) ? prods : prods?.results || []
        setCategories((config?.homepage?.featured_categories?.length ? config.homepage.featured_categories : catList) || [])
        setFeatured((config?.homepage?.new_arrivals?.length ? config.homepage.new_arrivals : prodList) || [])
        setHomepageConfig(config?.homepage || null)
        setSlides(config?.slides || [])
      } catch {
        setCategories([])
        setFeatured([])
        setHomepageConfig(null)
        setSlides([])
      }
    }
    load()
  }, [])

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      {slides.length ? (
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h1 style={{ margin: 0 }}>Surgical Mart Nepal</h1>
            <p style={{ margin: 0, color: '#6b7280' }}>Trusted supplies curated for your homepage.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {slides.map((slide) => (
              <a
                href={slide.link_url || '#'}
                key={slide.id}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  background: '#000',
                  height: 180,
                  display: 'block',
                }}
              >
                {slide.image_url || slide.image ? (
                  <img
                    src={slide.image_url || slide.image}
                    alt="Hero slide"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
              </a>
            ))}
          </div>
        </section>
      ) : (
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
      )}

      <section style={{ display: 'grid', gap: 12 }}>
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

      {homepageConfig?.featured_brands?.length ? (
        <section>
          <h3>Brands</h3>
          <div style={grid}>
            {homepageConfig.featured_brands.map((brand) => (
              <div key={brand.id} style={card}>
                <div style={{ fontWeight: 700 }}>{brand.name}</div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>{brand.slug}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
