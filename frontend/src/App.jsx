import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminProductsList from './pages/AdminProductsList'
import AdminProductEdit from './pages/AdminProductEdit'
import AdminCategories from './pages/AdminCategories'
import AdminBrands from './pages/AdminBrands'
import OrdersList from './pages/OrdersList'
import OrderDetail from './pages/OrderDetail'
import { isAuthenticated } from './utils/tokenStorage'

// -------------------------------
// Simple public pages (no auth required)
// -------------------------------
const HomePage = () => <div style={{ padding: 24 }}>Public store home (no login required)</div>
const ProductsPage = () => <div style={{ padding: 24 }}>Product listing (public)</div>
const ProductDetailPage = () => <div style={{ padding: 24 }}>Product detail (public)</div>
const CartPage = () => <div style={{ padding: 24 }}>Cart (public)</div>
const CheckoutPage = () => (
  <div style={{ padding: 24 }}>
    Checkout (public) — customers provide full name, email, phone, and address; they are not users.
  </div>
)

// -------------------------------
// ProtectedRoute helper for admin-only routes
// -------------------------------
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())

  useEffect(() => {
    const syncAuth = () => setAuthenticated(isAuthenticated())
    window.addEventListener('storage', syncAuth)
    return () => window.removeEventListener('storage', syncAuth)
  }, [])

  const handleAuthSuccess = () => {
    setAuthenticated(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public store routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Legacy admin login path redirect */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin auth route */}
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />

        {/* Admin protected routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <OrdersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <AdminProductsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute>
              <AdminProductEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute>
              <AdminBrands />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
