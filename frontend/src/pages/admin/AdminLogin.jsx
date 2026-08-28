import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { AlertCircle } from 'lucide-react';

export const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
      setError('Admin dan Kata Sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(cleanUsername, formData.password);
      if (user.role !== 'admin') {
        setError('Akses ditolak: Akun ini bukan administrator.');
        return;
      }
      navigate('/admin/users', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Nama Admin atau Kata Sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center p-4 fade-in">
      {/* Modal Card matching Figma Prototype */}
      <div className="w-full max-w-lg bg-[#f0f0f0] rounded-3xl shadow-xl p-8 sm:p-12 border border-slate-200/80">
        
        {/* Logo Center */}
        <div className="flex justify-center mb-4">
          <Logo className="w-16 h-16" />
        </div>

        <h2 className="text-center text-base sm:text-lg font-semibold text-slate-800 mb-8">
          Login Administrator
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admin
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
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] bg-white text-sm transition-all shadow-inner"
            />
          </div>

          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-36 py-2.5 px-6 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
