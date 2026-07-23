import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Flame,
  History,
  Menu,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  X,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import Logo from '../Logo';
import NotificationDropdown from '../ui/NotificationDropdown';
import NotificationBanner from '../ui/NotificationBanner';
import NotificationPrompt from '../ui/NotificationPrompt';

const menuItems = [
  { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/staff/orders/new', label: 'New Orders', icon: ClipboardList },
  { path: '/staff/orders/active', label: 'Active Orders', icon: Flame },
  { path: '/staff/orders/history', label: 'Order History', icon: History },
  { path: '/staff/orders/create-inshop', label: 'New In-Shop Order', icon: ShoppingCart },
  { path: '/staff/orders/in-shop-history', label: 'In-Shop History', icon: Store },
];

const StaffLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-heading">
      <NotificationBanner />
      <div className="flex flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border flex-shrink-0">
        <div className="px-5 py-6 border-b border-border">
          <Link to="/staff/dashboard" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-black text-heading tracking-tight">Kitchen Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md font-black translate-x-1.5'
                    : 'text-stone-800 dark:text-stone-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-transparent'
                }`}
              >
                <item.icon
                  size={18}
                  className={isActive ? 'text-white dark:text-slate-950' : 'text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform'}
                />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto text-white dark:text-slate-950" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-stone-700" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-amber-900/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center text-sm font-extrabold">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-stone-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400">Staff</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="px-5 py-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo className="w-7 h-7" />
                  <span className="text-base font-black text-stone-900 dark:text-white">Kitchen Panel</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md font-black'
                          : 'text-stone-800 dark:text-stone-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white dark:text-slate-950' : 'text-amber-700 dark:text-amber-400'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-all"
                >
                  <LogOut size={18} /><span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 hover:bg-border rounded-xl transition-colors lg:hidden"
            >
              <Menu size={20} className="text-heading" />
            </button>
            <h1 className="text-lg font-bold text-heading">
              {menuItems.find((m) => location.pathname === m.path)?.label || 'Staff'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      </div>
      <NotificationPrompt />
    </div>
  );
};

export default StaffLayout;