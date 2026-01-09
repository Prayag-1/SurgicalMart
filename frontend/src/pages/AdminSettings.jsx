import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBrands } from '../services/brands'
import { fetchCategories } from '../services/categories'
import { fetchProducts } from '../services/products'
import {
  createSlide,
  deleteSlide,
  fetchSlides,
  getHomepageSettings,
  updateHomepageSettings,
  updateSlide,
} from '../services/settings'

const pageStyle = { padding: 28, display: 'grid', gap: 24 }

const card = {
  background: '#0f182b',
  border: '1px solid #1f2a44',
  borderRadius: 14,
  padding: 20,
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

const iconButton = {
  width: 36,
  height: 36,
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 10,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  cursor: 'pointer',
}

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #1f2a44',
  background: '#0b1324',
  color: '#e2e8f0',
  fontSize: 13,
}

const normalizeList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function AdminSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [slides, setSlides] = useState([])

  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])

  const [modalType, setModalType] = useState(null)

  const [slideForm, setSlideForm] = useState({
    image: null,
    link_url: '',
    order: 0,
  })
  const [slideSaving, setSlideSaving] = useState(false)

  const loadData = async () => {
    setError('')
    setLoading(true)
    try {
      const [config, prods, cats, brs, heroSlides] = await Promise.all([
        getHomepageSettings(),
        fetchProducts({ page_size: 200 }),
        fetchCategories({ page_size: 200 }),
        fetchBrands({ page_size: 200 }),
        fetchSlides(),
      ])

      setProducts(normalizeList(prods))
      setCategories(normalizeList(cats))
      setBrands(normalizeList(brs))
      setSlides(normalizeList(heroSlides))

      setSelectedProducts((config.new_arrivals || []).map((p) => p.id))
      setSelectedCategories((config.featured_categories || []).map((c) => c.id))
      setSelectedBrands((config.featured_brands || []).map((b) => b.id))
      setSlideForm((prev) => ({ ...prev, order: normalizeList(heroSlides).length }))
    } catch (err) {
      setError(err.message || 'Unable to load settings')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateHomepageSettings({
        new_arrival_ids: selectedProducts,
        featured_category_ids: selectedCategories,
        featured_brand_ids: selectedBrands,
      })
      setMessage('Homepage settings updated')
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save settings')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleSelection = (type, id) => {
    const updater = {
      products: [selectedProducts, setSelectedProducts],
      categories: [selectedCategories, setSelectedCategories],
      brands: [selectedBrands, setSelectedBrands],
    }[type]

    if (!updater) return
    const [list, setList] = updater
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id])
  }

  const selectedEntities = useMemo(
    () => ({
      products: products.filter((p) => selectedProducts.includes(p.id)),
      categories: categories.filter((c) => selectedCategories.includes(c.id)),
      brands: brands.filter((b) => selectedBrands.includes(b.id)),
    }),
    [products, categories, brands, selectedProducts, selectedCategories, selectedBrands],
  )

  const handleAddSlide = async () => {
    if (!slideForm.image) {
      setError('Please choose a slide image')
      return
    }
    setSlideSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', slideForm.image)
      if (slideForm.link_url) fd.append('link_url', slideForm.link_url)
      fd.append('order', slideForm.order || 0)
      await createSlide(fd)
      setSlideForm({ image: null, link_url: '', order: (slides?.length || 0) + 1 })
      await loadData()
      setMessage('Slide added')
    } catch (err) {
      setError(err.message || 'Unable to add slide')
      if (err.code === 'unauthorized') {
        navigate('/login', { replace: true })
      }
    } finally {
      setSlideSaving(false)
    }
  }

  const handleUpdateSlide = async (slideId, payload) => {
    try {
      await updateSlide(slideId, payload)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to update slide')
    }
  }

  const handleDeleteSlide = async (slideId) => {
    try {
      await deleteSlide(slideId)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to delete slide')
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#e2e8f0' }}>Loading settings...</div>

  return (
    <div style={pageStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>
            Homepage
          </p>
          <h1 style={{ margin: 0, color: '#f8fafc' }}>Content Settings</h1>
          <p style={{ margin: '6px 0 0', color: '#cbd5e1' }}>Control hero slider, featured sections, and listings.</p>
        </div>
      </header>

      {error ? <p style={{ margin: 0, color: '#f87171' }}>{error}</p> : null}
      {message ? <p style={{ margin: 0, color: '#34d399' }}>{message}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <SelectionCard
          title="New arrivals"
          description="Products highlighted on the homepage hero grid."
          items={selectedEntities.products}
          fallback="No products selected"
          onChange={() => setModalType('products')}
        />
        <SelectionCard
          title="Featured categories"
          description="Categories surfaced for quick discovery."
          items={selectedEntities.categories}
          fallback="No categories selected"
          onChange={() => setModalType('categories')}
        />
        <SelectionCard
          title="Featured brands"
          description="Brands highlighted for trust and recall."
          items={selectedEntities.brands}
          fallback="No brands selected"
          onChange={() => setModalType('brands')}
        />
      </div>

      <div style={{ ...card, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Hero slider</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Upload slides and link to key destinations.</p>
          </div>
          <button type="button" onClick={handleAddSlide} disabled={slideSaving} style={primaryButton}>
            {slideSaving ? 'Uploading...' : 'Add slide'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {slides.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8' }}>No slides added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  style={{
                    border: '1px solid #1f2a44',
                    borderRadius: 12,
                    padding: 12,
                    background: '#0b1324',
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      height: 110,
                      borderRadius: 10,
                      background: '#0f172a',
                      border: '1px solid #1f2a44',
                      overflow: 'hidden',
                    }}
                  >
                    {slide.image_url || slide.image ? (
                      <img
                        src={slide.image_url || slide.image}
                        alt="Slide"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', display: 'grid', placeItems: 'center', height: '100%' }}>No image</div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13 }}>Link: {slide.link_url || 'Not set'}</p>
                    <label style={{ ...labelRow, color: '#cbd5e1' }}>
                      <span>Order</span>
                      <input
                        type="number"
                        value={slide.order}
                        onChange={(e) => handleUpdateSlide(slide.id, { order: Number(e.target.value) })}
                        style={{ ...input, width: 90 }}
                      />
                    </label>
                    <label style={{ ...labelRow, color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={slide.is_active}
                        onChange={(e) => handleUpdateSlide(slide.id, { is_active: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button type="button" aria-label="Delete slide" onClick={() => handleDeleteSlide(slide.id)} style={iconButton}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: '1px solid #1f2a44', borderRadius: 12, padding: 14, background: '#0b1324', display: 'grid', gap: 10 }}>
            <h4 style={{ margin: 0, color: '#f8fafc' }}>Add slide</h4>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <label style={label}>
                <span>Link URL</span>
                <input
                  value={slideForm.link_url}
                  onChange={(e) => setSlideForm((prev) => ({ ...prev, link_url: e.target.value }))}
                  style={input}
                  placeholder="https://..."
                />
              </label>
              <label style={label}>
                <span>Order</span>
                <input
                  type="number"
                  value={slideForm.order}
                  onChange={(e) => setSlideForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                  style={input}
                />
              </label>
            </div>
            <label style={label}>
              <span>Slide image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSlideForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleSaveConfig} disabled={saving} style={primaryButton}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {modalType ? (
        <SelectionModal
          type={modalType}
          onClose={() => setModalType(null)}
          products={products}
          categories={categories}
          brands={brands}
          selectedProducts={selectedProducts}
          selectedCategories={selectedCategories}
          selectedBrands={selectedBrands}
          toggleSelection={toggleSelection}
        />
      ) : null}
    </div>
  )
}

const SelectionCard = ({ title, description, items, fallback, onChange }) => (
  <div style={{ ...card, display: 'grid', gap: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: 0, color: '#f8fafc' }}>{title}</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{description}</p>
      </div>
      <button type="button" onClick={onChange} style={ghostButton}>
        Change
      </button>
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.length ? items.map((item) => <span key={item.id} style={pill}>{item.name}</span>) : (
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{fallback}</span>
      )}
    </div>
  </div>
)

const SelectionModal = ({
  type,
  onClose,
  products,
  categories,
  brands,
  selectedProducts,
  selectedCategories,
  selectedBrands,
  toggleSelection,
}) => {
  const titleMap = {
    products: 'Select products',
    categories: 'Select categories',
    brands: 'Select brands',
  }

  const optionsMap = {
    products,
    categories,
    brands,
  }

  const selectedMap = {
    products: selectedProducts,
    categories: selectedCategories,
    brands: selectedBrands,
  }

  const options = optionsMap[type] || []
  const selected = selectedMap[type] || []

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20,
        padding: 16,
      }}
    >
      <div style={{ ...card, width: 'min(720px, 100%)', maxHeight: '80vh', overflow: 'auto', display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>{titleMap[type] || 'Select'}</h3>
          <button type="button" onClick={onClose} style={ghostButton}>
            Close
          </button>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {options.map((opt) => (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, border: '1px solid #1f2a44' }}>
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggleSelection(type, opt.id)}
              />
              <div>
                <div style={{ fontWeight: 700 }}>{opt.name}</div>
                {opt.price ? <div style={{ color: '#94a3b8', fontSize: 12 }}>{formatCurrency(opt.price)}</div> : null}
              </div>
            </label>
          ))}
          {!options.length ? <p style={{ color: '#94a3b8' }}>No options available.</p> : null}
        </div>
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

const labelRow = { display: 'flex', alignItems: 'center', gap: 8 }

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 'Rs.0'
  return `Rs.${num.toLocaleString()}`
}

export default AdminSettings
