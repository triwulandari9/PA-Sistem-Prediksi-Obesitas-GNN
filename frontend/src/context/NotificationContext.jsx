import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Bell, CheckCircle2, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `gnn_notifications_${user?.id || 'guest'}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
    return [
      {
        id: 'init-1',
        title: 'Sistem GNN Siap',
        message: 'Model AI GraphSAGE aktif dan siap melakukan deteksi dini risiko obesitas.',
        time: 'Tersedia',
        read: true,
        createdAt: new Date().toISOString()
      }
    ];
  });

  // State untuk Toast Banner Pop-up otomatis di layar
  const [activeToast, setActiveToast] = useState(null);

  // Simpan ke localStorage setiap kali notifications berubah
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`gnn_notifications_${user.id}`, JSON.stringify(notifications));
      } catch (e) {
        console.error('Failed to save notifications', e);
      }
    }
  }, [notifications, user]);

  // Tambah notifikasi baru secara dinamis & Tampilkan Toast langsung di layar
  const addNotification = ({ title, message, type = 'info' }) => {
    const newNotif = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Munculkan Toast Alert di pojok kanan atas layar selama 4 detik
    setActiveToast(newNotif);
    setTimeout(() => {
      setActiveToast(prev => (prev?.id === newNotif.id ? null : prev));
    }, 4000);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      clearAll
    }}>
      {children}

      {/* FLOATING TOAST POP-UP DI POJOK ATAS LAYAR */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 flex items-start space-x-3 animate-in slide-in-from-top-5 duration-300">
          <div className="p-2 rounded-xl bg-[#5dbb7d] text-white flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {activeToast.title}
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeToast.time}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              {activeToast.message}
            </p>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
