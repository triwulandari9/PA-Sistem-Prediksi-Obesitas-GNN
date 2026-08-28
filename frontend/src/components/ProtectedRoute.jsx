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

  if (!user) {
    // If attempting to access admin route, redirect to admin login
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check using user.role
  const userRole = user.role || 'user';
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
