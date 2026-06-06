import React, { useState, useEffect, useCallback } from 'react'; // VERSION 1.1
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { LocationProvider } from './context/LocationContext';
import { onMessageListener } from './firebase';

// Layouts
import UserLayout from './components/layouts/UserLayout';
import AdminLayout from './components/layouts/AdminLayout';
import StaffLayout from './components/layouts/StaffLayout';

// Guards
import { ProtectedRoute, AdminRoute, StaffRoute, GuestRoute } from './routes/Guards';

// Pages
import Home from './pages/Home';
import ProductDetails from './product/ProductDetails';
import OccasionProducts from './pages/OccasionProducts';
import OrderTracking from './pages/OrderTracking';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import ForgotPassword from './pages/ForgotPassword';
import OAuthCallback from './pages/OAuthCallback';
import ReviewPage from './pages/ReviewPage';

// Premium User Dashboard Layout
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/user/DashboardHome';
import ProfileDetails from './pages/user/ProfileDetails';
import AddressManager from './pages/user/AddressManager';
import AccountSettings from './pages/user/AccountSettings';
import OrderHistory from './pages/user/OrderHistory';
import OrderDetails from './pages/user/OrderDetails';
import Wishlist from './pages/user/Wishlist';
import MyReviews from './pages/user/Reviews';
import Shop from './pages/Shop';
import CustomCake from './custom-cakes/CustomCake';
import BrandIntroLoader from './components/BrandIntroLoader.jsx';

import { useLocation } from 'react-router-dom';

// Import socket service for initialization
import { joinUserRoom, joinAdminRoom, joinStaffRoom, disconnectSocket } from './sockets/socketManager';
import { useAuth } from './context/AuthContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Socket Initializer Component
const SocketInitializer = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Join appropriate room based on user role
      if (user.role === 'admin') {
        joinAdminRoom();
        console.log('Admin joined admin room');
      } else if (user.role === 'staff') {
        joinStaffRoom(user._id);
        console.log('Staff joined staff room:', user._id);
      } else {
        joinUserRoom(user._id);
        console.log('User joined user room:', user._id);
      }
    }

    return () => {
      // Global disconnect handled in main.jsx if needed, 
      // but we could also disconnect on logout here.
    };
  }, [isAuthenticated, user]);

  return <>{children}</>;
};

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStaff from './pages/admin/AdminStaff';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import CategoryManager from './pages/admin/CategoryManager';
import OccasionManager from './pages/admin/OccasionManager';
import AdminBanner from './pages/admin/AdminBanner';
import AdminCustomCakes from './pages/admin/AdminCustomCakes';
import StaffDashboard from './pages/staff/StaffDashboard';

/** Full-screen premium brand intro once per browser tab session */
function BrandIntroGate() {
  // TEMPORARILY DISABLED AS REQUESTED
  return null;
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem('tcm_brand_intro_done');
    } catch {
      return true;
    }
  });

  const onIntroDone = useCallback(() => {
    try {
      sessionStorage.setItem('tcm_brand_intro_done', '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  return <BrandIntroLoader show={visible} onFinish={onIntroDone} logoHoldMs={2500} />;
}

// Handles foreground push notifications
const PushNotificationHandler = () => {
  useEffect(() => {
    onMessageListener().then(payload => {
      if (payload?.notification) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">{payload.notification.title}</span>
            <span className="text-xs">{payload.notification.body}</span>
          </div>,
          { duration: 6000, icon: '🔔' }
        );
      }
    }).catch(err => console.log('failed: ', err));
  }, []);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <WishlistProvider>
          <ThemeProvider>
            <BrandIntroGate />
            <Router>
              <ScrollToTop />
              <SocketInitializer />
              <PushNotificationHandler />
              <Toaster
                position="bottom-center"
                toastOptions={{
                  className: 'toast-premium',
                  duration: 4000,
                  style: {
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-premium)',
                  }
                }}
              />
              <Routes>
                {/* Public/User Routes */}
                <Route element={<UserLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/custom-cake" element={<CustomCake />} />
                  <Route path="/product/:slug" element={<ProductDetails />} />
                  <Route path="/occasion/:name" element={<OccasionProducts />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/track/:orderId?" element={<OrderTracking />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/oauth-callback" element={<OAuthCallback />} />

                  {/* Guest only */}
                  <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Protected User */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/review/:orderId" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

                  {/* Legacy Redirects */}
                  <Route path="/profile" element={<Navigate to="/account/dashboard" replace />} />
                  <Route path="/orders" element={<Navigate to="/account/orders" replace />} />

                  {/* Premium Dashboard */}
                  <Route path="/account" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="profile" element={<ProfileDetails />} />
                    <Route path="addresses" element={<AddressManager />} />
                    <Route path="settings" element={<AccountSettings />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="reviews" element={<MyReviews />} />
                  </Route>
                </Route>


                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/create" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="staff" element={<AdminStaff />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="categories" element={<CategoryManager />} />
                  <Route path="occasions" element={<OccasionManager />} />
                  <Route path="banners" element={<AdminBanner />} />
                  <Route path="custom-cakes" element={<AdminCustomCakes />} />
                  <Route path="settings" element={<AdminDashboard />} />
                </Route>

                {/* Staff Routes */}
                <Route path="/staff" element={<StaffRoute><StaffLayout /></StaffRoute>}>
                  <Route index element={<Navigate to="/staff/dashboard" replace />} />
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="orders/new" element={<StaffDashboard />} />
                  <Route path="orders/active" element={<StaffDashboard />} />
                  <Route path="orders/history" element={<StaffDashboard />} />
                  <Route path="orders/out-for-delivery" element={<StaffDashboard />} />
                  <Route path="orders/delivered" element={<StaffDashboard />} />
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </WishlistProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;