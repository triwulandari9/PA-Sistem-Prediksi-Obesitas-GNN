import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdminLayout } from './components/AdminLayout';

// User Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Predict } from './pages/Predict';
import { Result } from './pages/Result';
import { History } from './pages/History';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPredictions } from './pages/admin/AdminPredictions';

// Layout wrapper for User Pages (Terkunci jika Admin sedang login)
const UserLayout = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin/users" replace />;
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
          
          {/* USER PUBLIC & AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<UserLayout><Home /></UserLayout>} />

          {/* USER PROTECTED ROUTES */}
          <Route 
            path="/predict" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <UserLayout>
                  <Predict />
                </UserLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/result" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <UserLayout>
                  <Result />
                </UserLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <UserLayout>
                  <History />
                </UserLayout>
              </ProtectedRoute>
            } 
          />

          {/* ADMIN PUBLIC LOGIN */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ADMIN PROTECTED ROUTES */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="predictions" element={<AdminPredictions />} />
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
