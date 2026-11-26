import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Loader2,
  ChevronRight,
  Tag,
  Gift,
  Image as ImageIcon,
  Cake,
  Star,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

import Logo from '../Logo';
import NotificationDropdown from '../ui/NotificationDropdown';
import NotificationBanner from '../ui/NotificationBanner';
import NotificationPrompt from '../ui/NotificationPrompt';
import '../../styles/admin-neobrutalist.css';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/custom-cakes', label: 'Custom Cakes', icon: Cake },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/staff', label: 'Staff', icon: Users },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/occasions', label: 'Occasions', icon: Gift },
  { path: '/admin/addons', label: 'Add-ons', icon: PlusSquare },
  { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { path: '/admin/themes', label: 'Themes', icon: Sparkles },
  { path: '/admin/google-reviews', label: 'Google Reviews', icon: Star },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleAdminLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (e) {
      setIsLoggingOut(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-black text-heading tracking-tight whitespace-nowrap"
            >
              Admin Panel
            </motion.span>
          )}
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-xl text-heading hover:bg-heading/10 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`admin-nav-link ${isActive ? 'is-active' : ''}
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm
                transition-all duration-200 group
                ${isActive
                  ? 'bg-card text-heading border border-border shadow-md'
                  : 'text-muted hover:bg-border/40 hover:text-heading'
                }
              `}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-primary shrink-0' : 'text-muted group-hover:text-heading shrink-0'}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {isActive && sidebarOpen && (
                <ChevronRight size={16} className="ml-auto text-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border space-y-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-border/50 hover:text-heading transition-all"
        >
          {isDark ? <Sun size={18} className="text-yellow-400 shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {sidebarOpen && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(user?.name)}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-heading truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleAdminLogout}
          disabled={isLoggingOut}
          className="logout-btn-danger flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-80"
        >
          {isLoggingOut ? (
            <>
              <Loader2 size={18} className="animate-spin text-white shrink-0" />
              {sidebarOpen && <span>Logging out...</span>}
            </>
          ) : (
            <>
              <LogOut size={18} className="text-white shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex h-screen h-dvh bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside
        className={`
          admin-sidebar hidden lg:flex flex-col bg-card border-r border-border
          transition-all duration-300 shrink-0 h-full
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="admin-sidebar fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-card border-r border-border z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Optional Notification Banner */}
        <NotificationBanner />

        {/* Top Header */}
        <header className="admin-topbar min-h-16 bg-card border-b border-border flex items-center justify-between gap-3 px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setMobileOpen(!mobileOpen);
                else setSidebarOpen(!sidebarOpen);
              }}
              className="p-2 hover:bg-border rounded-xl transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                Workspace / Admin
              </p>
              <h1 className="text-base sm:text-lg font-bold text-heading truncate">
                {menuItems.find((m) => location.pathname.startsWith(m.path))?.label || 'Admin'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <NotificationDropdown />
            <Link
              to="/"
              className="text-xs font-medium text-muted hover:text-heading bg-border/50 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            >
              View Store
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 tv:p-10 min-w-0">
          <Outlet />
        </main>
      </div>

      <NotificationPrompt />
    </div>
  );
};

export default AdminLayout;
