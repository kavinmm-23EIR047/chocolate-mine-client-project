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
import Contact from './pages/Contact';
import Help from './pages/Help';
import Stores from './pages/Stores';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';

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
import UserNotifications from './pages/user/Notifications';
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
import AdminGoogleReviews from './pages/admin/AdminGoogleReviews';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStaff from './pages/admin/AdminStaff';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import CategoryManager from './pages/admin/CategoryManager';
import OccasionManager from './pages/admin/OccasionManager';
import AdminBanner from './pages/admin/AdminBanner';
import AdminCustomCakes from './pages/admin/AdminCustomCakes';
import AdminReviews from './pages/admin/AdminReviews';
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

import { toast } from 'react-hot-toast'; // Import toast if missing
import { getSocket } from './sockets/socketManager';

// Handles foreground push notifications and global socket events
const GlobalNotificationHandler = () => {
  useEffect(() => {
    // 1. Firebase Foreground Push Notifications
    const unsubscribe = onMessageListener((payload) => {
      // Support both standard notification payloads AND data-only payloads
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
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/refund" element={<RefundPolicy />} />

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
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </WishlistProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

<<<<<<< HEAD
// export default App;
function App() {
  return (
    <div className="maintenance-wrapper">
      <div className="maintenance-card">
        {/* Decorative gear icon */}
        <div className="gear-icon">⚙️</div>
=======
export default App;
// App.jsx - Maintenance Page Only
// This component renders a "Under Maintenance" landing page
// No external resources, no loading of unfinished code

// function App() {
//   return (
//     <div className="maintenance-wrapper">
//       <div className="maintenance-card">
//         {/* Decorative gear icon */}
//         <div className="gear-icon">⚙️</div>
>>>>>>> 4b24b1058c31ca49a50583b3f741c29ec16b46b9
        
//         <h1>Under Maintenance</h1>
//         <div className="sub-headline">🚧 We'll be back soon</div>
        
//         <div className="divider"></div>
        
//         <div className="message-box">
//           <p>
//             <strong>🔧 Site is being rebuilt</strong><br />
//             We're working hard to bring you a better experience.<br />
//             Please check back later.
//           </p>
//         </div>
        
//         <div className="status-badge">
//           <span className="status-dot"></span>
//           <span className="status-text">
//             Status: <span>Maintenance in progress</span>
//           </span>
//         </div>
        
//         <div className="notice">
//           <span>⏳ Estimated completion: soon</span>
//         </div>
//       </div>

//       <style>{`
//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }

//         .maintenance-wrapper {
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #0b1120;
//           font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
//           padding: 1.5rem;
//         }

//         .maintenance-card {
//           background: #141e2f;
//           max-width: 720px;
//           width: 100%;
//           padding: 3rem 2.5rem;
//           border-radius: 2.5rem;
//           box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.8);
//           text-align: center;
//           border: 1px solid rgba(255, 255, 255, 0.04);
//         }

//         .gear-icon {
//           display: inline-block;
//           font-size: 3.8rem;
//           line-height: 1;
//           margin-bottom: 0.75rem;
//           color: #b9d0ff;
//           animation: gentle-rotate 18s infinite linear;
//         }

//         @keyframes gentle-rotate {
//           0% { transform: rotate(0deg) scale(1); }
//           50% { transform: rotate(8deg) scale(1.02); }
//           100% { transform: rotate(0deg) scale(1); }
//         }

//         h1 {
//           font-size: 2.6rem;
//           font-weight: 600;
//           color: #ecf3ff;
//           margin: 0.5rem 0 0.25rem;
//         }

//         .sub-headline {
//           font-size: 1.1rem;
//           color: #9bb1d9;
//           display: inline-block;
//           padding: 0.3rem 1.2rem;
//           border-radius: 40px;
//           border: 1px solid rgba(255, 255, 255, 0.03);
//           margin-top: 0.1rem;
//           margin-bottom: 1.8rem;
//         }

//         .divider {
//           width: 70px;
//           height: 3px;
//           background: #3b5688;
//           margin: 0.8rem auto 2rem;
//           border-radius: 6px;
//           opacity: 0.7;
//         }

//         .message-box {
//           background: #0f1829;
//           padding: 1.6rem 1.8rem;
//           border-radius: 1.8rem;
//           margin: 1.8rem 0 2.2rem;
//           border-left: 3px solid #4a7ab5;
//         }

//         .message-box p {
//           color: #d3e2ff;
//           font-size: 1.15rem;
//           line-height: 1.6;
//         }

//         .message-box strong {
//           color: #b8d0ff;
//           background: #1f3150;
//           padding: 0.1rem 0.6rem;
//           border-radius: 24px;
//         }

//         .status-badge {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 10px;
//           background: #1b2740;
//           padding: 0.8rem 1.6rem;
//           border-radius: 60px;
//           margin: 1.2rem 0 0.8rem;
//           border: 1px solid #2f4670;
//         }

//         .status-dot {
//           display: inline-block;
//           width: 12px;
//           height: 12px;
//           border-radius: 50%;
//           background: #f5b342;
//           box-shadow: 0 0 8px #f5b34288;
//           animation: pulse-dot 1.8s infinite ease-in-out;
//         }

//         @keyframes pulse-dot {
//           0% { opacity: 0.6; transform: scale(0.9); }
//           50% { opacity: 1; transform: scale(1.2); background: #facc6b; }
//           100% { opacity: 0.6; transform: scale(0.9); }
//         }

//         .status-text {
//           color: #d3e2ff;
//           font-size: 1rem;
//         }

//         .status-text span {
//           font-weight: 500;
//           color: #f5d78e;
//         }

//         .notice {
//           margin-top: 2.2rem;
//           font-size: 0.95rem;
//           color: #7f93bb;
//           border-top: 1px dashed #253c5e;
//           padding-top: 1.6rem;
//           display: flex;
//           justify-content: center;
//           gap: 0.6rem 1.6rem;
//           flex-wrap: wrap;
//         }

//         .notice span {
//           background: #0d1629;
//           padding: 0.25rem 1rem;
//           border-radius: 40px;
//         }
//       `}</style>
//     </div>
//   );
// }

// export default App;