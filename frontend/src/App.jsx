import React, { useState, useEffect, useCallback } from 'react'; // VERSION 1.1
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { LocationProvider } from './context/LocationContext';

// Firebase & Socket Services
import { onMessageListener } from './firebase';
import { joinUserRoom, joinAdminRoom, joinStaffRoom, disconnectSocket, getSocket } from './sockets/socketManager';

// Layouts
import UserLayout from './components/layouts/UserLayout';
import AdminLayout from './components/layouts/AdminLayout';
import StaffLayout from './components/layouts/StaffLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Guards
import { ProtectedRoute, AdminRoute, StaffRoute, GuestRoute } from './routes/Guards';

// Public & User Pages
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
import Contact from './pages/Contact';
import Help from './pages/Help';
import Stores from './pages/Stores';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';
import Shop from './pages/Shop';
import CustomCake from './custom-cakes/CustomCake';
import BrandIntroLoader from './components/BrandIntroLoader.jsx';

// Dashboard Sub-pages
import DashboardHome from './pages/user/DashboardHome';
import ProfileDetails from './pages/user/ProfileDetails';
import AddressManager from './pages/user/AddressManager';
import AccountSettings from './pages/user/AccountSettings';
import OrderHistory from './pages/user/OrderHistory';
import OrderDetails from './pages/user/OrderDetails';
import Wishlist from './pages/user/Wishlist';
import MyReviews from './pages/user/Reviews';
import UserNotifications from './pages/user/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGoogleReviews from './pages/admin/AdminGoogleReviews';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStaff from './pages/admin/AdminStaff';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import CategoryManager from './pages/admin/CategoryManager';
import OccasionManager from './pages/admin/OccasionManager';
import AddonManager from './pages/admin/AddonManager';
import AdminBanner from './pages/admin/AdminBanner';
import AdminCustomCakes from './pages/admin/AdminCustomCakes';
import AdminReviews from './pages/admin/AdminReviews';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';

// Scroll To Top Helper
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
  }, [isAuthenticated, user]);

  return <>{children}</>;
};

/** Full-screen premium brand intro once per browser tab session */
function BrandIntroGate() {
  // Currently disabled by request
  return null;

  /*
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
      // ignore
    }
    setVisible(false);
  }, []);

  return <BrandIntroLoader show={visible} onFinish={onIntroDone} logoHoldMs={2500} />;
  */
}

// Global Push Notification & Real-time Socket Event Listener
const GlobalNotificationHandler = () => {
  useEffect(() => {
    // 1. Firebase Foreground Push Notifications
    const unsubscribe = onMessageListener((payload) => {
      const title = payload.data?.title || payload.notification?.title;
      const body = payload.data?.message || payload.notification?.body;

      if (title || body) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">{title || 'The Chocolate Mine'}</span>
            <span className="text-xs">{body || 'You have a new update'}</span>
          </div>,
          { duration: 6000, icon: '🍫' }
        );
      }
    });

    // 2. Global Socket Listeners
    const socket = getSocket();
    if (socket) {
      socket.on('product_updated', (data) => {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Product Updated</span>
            <span className="text-xs">{data.message || `${data.name} has been updated.`}</span>
          </div>,
          { duration: 6000, icon: '🔄' }
        );
      });
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (socket) socket.off('product_updated');
    };
  }, []);

  return null;
};

function App() {
  useEffect(() => {
    // Ping backend to wake up sleeping free tier backend server
    const healthUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '/health')
      : '/health';
    fetch(healthUrl, { method: 'GET' }).catch(() => { });
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <WishlistProvider>
          <ThemeProvider>
            <BrandIntroGate />
            <Router>
              <ScrollToTop />
              <SocketInitializer />
              <GlobalNotificationHandler />
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
                  },
                }}
              />
              <Routes>
                {/* Public / User Routes */}
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
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/refund" element={<RefundPolicy />} />

                  {/* Guest Routes */}
                  <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Protected User Routes */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/review/:orderId" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

                  {/* Legacy Redirects */}
                  <Route path="/profile" element={<Navigate to="/account/dashboard" replace />} />
                  <Route path="/orders" element={<Navigate to="/account/orders" replace />} />

                  {/* Dashboard Routes */}
                  <Route path="/account" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="profile" element={<ProfileDetails />} />
                    <Route path="addresses" element={<AddressManager />} />
                    <Route path="settings" element={<AccountSettings />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="notifications" element={<UserNotifications />} />
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
                  <Route path="addons" element={<AddonManager />} />
                  <Route path="banners" element={<AdminBanner />} />
                  <Route path="custom-cakes" element={<AdminCustomCakes />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="google-reviews" element={<AdminGoogleReviews />} />
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
                  <Route path="orders/create-inshop" element={<StaffDashboard />} />
                  <Route path="orders/in-shop-history" element={<StaffDashboard />} />
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