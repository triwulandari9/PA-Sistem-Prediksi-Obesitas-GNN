import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inisialisasi session dari localStorage saat reload
  useEffect(() => {
    const savedUser = localStorage.getItem('pa_gnn_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
        localStorage.removeItem('pa_gnn_auth_user');
      }
    }
    setLoading(false);
  }, []);

  // LOGIN MENGGUNAKAN NAMA PENGGUNA & KATA SANDI (SESUAI ERD)
  const login = async (username, password) => {
    const cleanUser = username.trim();
    const cleanUserLower = cleanUser.toLowerCase();

    // 1. Cek Akun Admin Khusus Pilihan Anda
    const isAdminAccount = 
      (cleanUserLower === 'sariadmin' && password === 'Saricomel9!') ||
      (cleanUserLower === 'sari' && password === 'triwjsari09') ||
      (cleanUserLower === 'admin' && password === 'SayaSari') ||
      (cleanUserLower === 'admin' && password === 'admin123');

    if (isAdminAccount) {
      const adminUser = {
        id: 'admin-sari-id',
        name: cleanUser,
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('pa_gnn_auth_user', JSON.stringify(adminUser));
      return adminUser;
    }

    if (isSupabaseConfigured && supabase) {
      // Cari di tabel profiles Supabase (Case-Insensitive pada Nama Pengguna)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', cleanUser)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error('Supabase login error:', error);
        throw new Error('Gagal terhubung ke database.');
      }

      if (!data) {
        throw new Error('Nama Pengguna atau Kata Sandi salah. Silakan periksa kembali.');
      }

      const loggedInUser = {
        id: data.id,
        name: data.name,
        role: data.role || 'user'
      };

      setUser(loggedInUser);
      localStorage.setItem('pa_gnn_auth_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    } else {
      // Fallback ke Local DB jika Supabase belum terhubung
      const { data, error } = await localDb.signIn({ email: cleanUser, password });
      if (error) throw error;
      setUser(data.user);
      localStorage.setItem('pa_gnn_auth_user', JSON.stringify(data.user));
      return data.user;
    }
  };

  // REGISTER MENGGUNAKAN NAMA PENGGUNA & KATA SANDI (SESUAI ERD)
  const register = async (username, password, role = 'user') => {
    const cleanUser = username.trim();

    if (isSupabaseConfigured && supabase) {
      // 1. Cek apakah Nama Pengguna sudah pernah didaftarkan (Case-Insensitive)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', cleanUser)
        .maybeSingle();

      if (existingUser) {
        throw new Error(`Nama Pengguna "${cleanUser}" sudah terdaftar. Silakan langsung login.`);
      }

      // 2. Simpan langsung ke tabel profiles
      const newUserRecord = {
        name: cleanUser,
        password: password,
        role: role,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newUserRecord])
        .select()
        .single();

      if (error) {
        console.error('Supabase register error:', error);
        throw new Error('Gagal mendaftarkan akun: ' + error.message);
      }

      const createdUser = {
        id: data.id,
        name: data.name,
        role: data.role || 'user'
      };

      setUser(createdUser);
      localStorage.setItem('pa_gnn_auth_user', JSON.stringify(createdUser));
      return createdUser;
    } else {
      const { data, error } = await localDb.signUp({ email: cleanUser, password, name: cleanUser, role });
      if (error) throw error;
      setUser(data.user);
      localStorage.setItem('pa_gnn_auth_user', JSON.stringify(data.user));
      return data.user;
    }
  };

  // RESET / LUPA KATA SANDI (UPDATE PASSWORD DI SUPABASE)
  const resetPassword = async (username, newPassword) => {
    const cleanUser = username.trim();

    if (isSupabaseConfigured && supabase) {
      // 1. Cek apakah Nama Pengguna ada
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', cleanUser)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existingUser) {
        throw new Error(`Nama Pengguna "${cleanUser}" tidak ditemukan.`);
      }

      // 2. Update password baru
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ password: newPassword })
        .eq('id', existingUser.id);

      if (updateError) {
        throw new Error('Gagal memperbarui kata sandi: ' + updateError.message);
      }

      return { success: true };
    } else {
      const users = JSON.parse(localStorage.getItem('gnn_obesity_users') || '[]');
      const userIdx = users.findIndex(u => u.name.toLowerCase() === cleanUser.toLowerCase());
      if (userIdx === -1) {
        throw new Error(`Nama Pengguna "${cleanUser}" tidak ditemukan.`);
      }
      users[userIdx].password = newPassword;
      localStorage.setItem('gnn_obesity_users', JSON.stringify(users));
      return { success: true };
    }
  };

  // LOGOUT
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('pa_gnn_auth_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    resetPassword,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
