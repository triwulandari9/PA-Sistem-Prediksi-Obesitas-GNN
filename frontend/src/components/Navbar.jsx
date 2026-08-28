import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { LogOut, Shield, Menu, X, Home, Activity, History as HistoryIcon, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/predict', label: 'Prediksi', icon: Activity },
    { path: '/history', label: 'Riwayat', icon: HistoryIcon },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#5dbb7d] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Figma & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-xl flex items-center justify-center p-1 backdrop-blur-sm shadow-inner flex-shrink-0">
              <Logo className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
              SISTEM GNN OBESITAS
            </span>
          </Link>

          {/* Desktop Nav Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-1 transition-all ${
                  isActive(link.path)
                    ? 'border-b-2 border-white font-bold text-white'
                    : 'text-emerald-50 hover:text-white hover:border-b-2 hover:border-emerald-200'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Login Admin link */}
            <Link
              to={isAdmin ? "/admin/users" : "/admin/login"}
              className={`py-1 transition-all flex items-center gap-1 ${
                location.pathname.startsWith('/admin')
                  ? 'border-b-2 border-white font-bold text-white'
                  : 'text-emerald-50 hover:text-white'
              }`}
            >
              Login Admin
            </Link>

            {/* Notification Bell & User Menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-emerald-400/60">
              <NotificationBell />
              
              {isAuthenticated && (
                <div className="flex items-center space-x-2 ml-1">
                  <span className="text-xs font-semibold bg-emerald-700/50 px-2.5 py-1 rounded-full text-white truncate max-w-[110px]">
                    {user?.name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="p-1.5 rounded-lg bg-emerald-700/40 hover:bg-rose-600 transition-colors text-white text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Controls: Bell + Hamburger Toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white focus:outline-none transition-colors"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu (Animasi slide-in untuk Layar HP/Android) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#4eaa6d] border-t border-emerald-400/60 px-4 pt-3 pb-5 space-y-2 text-sm shadow-xl animate-in slide-in-from-top-2 duration-200">
          
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors ${
                  active
                    ? 'bg-white text-[#065f46] font-bold shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#5dbb7d]' : 'text-emerald-100'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            to={isAdmin ? "/admin/users" : "/admin/login"}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors ${
              location.pathname.startsWith('/admin')
                ? 'bg-white text-[#065f46] font-bold shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-100" />
            <span>Login Admin</span>
          </Link>

          {isAuthenticated && (
            <div className="pt-3 border-t border-emerald-300/40 flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-700/50 flex items-center justify-center text-xs font-bold text-white">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[150px]">
                  {user?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

        </div>
      )}
    </nav>
  );
};
