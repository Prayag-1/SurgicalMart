import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminProductsList from './pages/AdminProductsList'
import AdminProductEdit from './pages/AdminProductEdit'
import AdminCategories from './pages/AdminCategories'
import AdminCategoryEdit from './pages/AdminCategoryEdit'
import AdminBrands from './pages/AdminBrands'
import AdminBrandEdit from './pages/AdminBrandEdit'
import AdminSettings from './pages/AdminSettings'
import OrdersList from './pages/OrdersList'
import OrderDetail from './pages/OrderDetail'
import ProductList from './pages/ProductList'
import ProductDetailPage from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmation from './pages/OrderConfirmation'
import HomePage from './pages/HomePage'
import AdminLayout from './components/admin/AdminLayout'
import { isAuthenticated } from './utils/tokenStorage'

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [authChecking, setAuthChecking] = useState(false)

  useEffect(() => {
    const syncAuth = () => setAuthenticated(isAuthenticated())
    window.addEventListener('storage', syncAuth)
    window.addEventListener('token-change', syncAuth)
    const clearBanners = () => {
      setAuthChecking(true)
      syncAuth()
      setAuthChecking(false)
    }
    window.addEventListener('auth-cleared', clearBanners)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('token-change', syncAuth)
      window.removeEventListener('auth-cleared', clearBanners)
    }
  }, [])

  const handleAuthSuccess = () => {
    setAuthenticated(true)
  }

  if (authChecking) {
    return <div style={{ padding: 24 }}>Checking session...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public store routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        {/* Legacy admin login path redirect */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin auth route */}
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />

        {/* Admin protected routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<AdminProductsList />} />
          <Route path="products/new" element={<AdminProductEdit />} />
          <Route path="products/:id" element={<AdminProductEdit />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/new" element={<AdminCategoryEdit />} />
          <Route path="categories/:id" element={<AdminCategoryEdit />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="brands/new" element={<AdminBrandEdit />} />
          <Route path="brands/:id" element={<AdminBrandEdit />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
