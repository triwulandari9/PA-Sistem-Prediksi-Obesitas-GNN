import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Info, Sparkles, CheckCheck, Trash2 } from 'lucide-react';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className="relative p-1.5 rounded-full hover:bg-white/20 transition-colors text-white focus:outline-none"
        title="Notifikasi Sistem"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-emerald-500 animate-pulse"></span>
        )}
      </button>

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 text-xs animate-in">
          
          {/* Header Popover */}
          <div className="bg-[#5dbb7d] px-4 py-3 text-white flex items-center justify-between font-bold shadow-sm">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Pemberitahuan Sistem</span>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] bg-white/20 hover:bg-rose-500/80 px-2 py-0.5 rounded-md text-white transition-colors flex items-center gap-1"
                  title="Bersihkan Semua Notifikasi"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>

          {/* List Notifikasi Riil */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Belum ada notifikasi baru</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-start space-x-3 transition-colors ${
                    !item.read ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="p-1.5 bg-[#5dbb7d]/20 text-[#065f46] rounded-lg mt-0.5 flex-shrink-0">
                    <Info className="w-4 h-4 text-[#5dbb7d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Popover */}
          <div className="bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
            Sistem Prediksi Risiko Obesitas GNN
          </div>

        </div>
      )}
    </div>
  );
};
