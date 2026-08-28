import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5dbb7d] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-xs">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  // 1. Jika Belum Login
  if (!user) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role || 'user';

  // 2. KEAMANAN KETAT ADMIN: Jika sudah login sebagai Admin, TIDAK BISA kembali ke halaman pengguna!
  if (userRole === 'admin') {
    if (!location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/users" replace />;
    }
  }

  // 3. KEAMANAN PENGGUNA BIASA: Pengguna biasa tidak bisa masuk ke panel admin
  if (userRole !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  // 4. Role checking umum
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
