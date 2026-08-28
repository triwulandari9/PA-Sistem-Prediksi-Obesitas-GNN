import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { AlertCircle } from 'lucide-react';
import bgImage from '../assets/bg.png';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = formData.username.trim();

    if (!cleanUsername || !formData.password) {
      setError('Nama Pengguna dan Kata Sandi wajib diisi.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(cleanUsername, formData.password, 'user');
      navigate('/predict', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Pendaftaran akun gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-slate-900/10 pointer-events-none"></div>

      {/* Main Register Card matching Figma Prototype */}
      <div className="relative z-10 w-full max-w-lg bg-[#f2f2f2]/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/60">
        
        {/* Logo Center */}
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Pengguna
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder=""
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] bg-white text-sm transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder=""
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Kata Sandi
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder=""
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm transition-all shadow-inner"
            />
          </div>

          <div className="pt-3 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-40 py-2.5 px-6 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </div>

        </form>

        <div className="text-center mt-6 text-xs text-slate-600">
          <span>Sudah memiliki akun? </span>
          <Link to="/login" className="font-semibold text-slate-800 hover:text-[#5dbb7d] underline transition-colors">
            Masuk di sini
          </Link>
        </div>

      </div>
    </div>
  );
};
