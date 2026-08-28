import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

export const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/users', label: 'Data Pengguna' },
    { path: '/admin/predictions', label: 'Data Prediksi' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans">
      
      {/* 1. TOP HEADER BAR SESUAI FIGMA SEMPRO */}
      <header className="bg-[#5dbb7d] text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo Kiri */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                PANEL ADMIN
              </span>
            </div>

            {/* Logout & Notification Bell Kanan */}
            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-semibold">
              <button
                onClick={handleLogout}
                className="hover:underline text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-white/10"
              >
                Logout
              </button>
              
              {/* Lonceng Notifikasi Interaktif */}
              <NotificationBell />
            </div>

          </div>
        </div>
      </header>

      {/* 2. BODY DENGAN GARIS PEMISAH VERTIKAL PERSIS FIGMA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full flex-1 flex flex-col md:flex-row">
        
        {/* SIDEBAR DENGAN TAMPILAN RESPONSIVE (HORIZONTAL DI HP, VERTIKAL DI DESKTOP) */}
        <aside className="w-full md:w-48 py-4 md:py-8 md:pr-6 md:border-r md:border-slate-200 flex-shrink-0 border-b md:border-b-0 border-slate-100">
          <div className="flex md:flex-col gap-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 md:flex-none block px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center md:text-left ${
                    active
                      ? 'bg-[#a7f3d0] text-[#065f46] font-bold shadow-sm'
                      : 'text-slate-800 hover:bg-slate-100 bg-white border border-slate-100 md:border-transparent'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* CONTENT UTAMA DI KANAN */}
        <main className="flex-1 py-6 md:py-8 md:pl-10">
          <Outlet />
        </main>

      </div>

    </div>
  );
};
