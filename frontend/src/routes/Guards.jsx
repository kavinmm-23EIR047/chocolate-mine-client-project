import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowUnverified = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowUnverified && user.role === 'user' && user.phoneVerified !== true) {
    return <Navigate to="/verify-phone" replace />;
  }

  return children;
};

export const PhoneVerificationGate = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (user?.role === 'user' && user.phoneVerified !== true) {
    return <Navigate to="/verify-phone" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'staff' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // A first-time guest should not wait for auth initialization. If local
  // session data exists, keep the existing loading gate until AuthContext has
  // restored or rejected it, avoiding an authenticated-user/page flicker and
  // preserving correct handling of expired sessions.
  let hasStoredSession = false;
  try {
    hasStoredSession = Boolean(
      sessionStorage.getItem('user') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('user') ||
      localStorage.getItem('token')
    );
  } catch {
    // Storage may be unavailable in privacy-restricted environments.
  }

  if (loading && hasStoredSession && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    if (user.role === 'user' && user.phoneVerified !== true) return <Navigate to="/verify-phone" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};
