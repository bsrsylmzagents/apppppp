import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor.');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API}/auth/reset-password/${resetToken}`, { password });
      toast.success('Şifreniz başarıyla güncellendi. Lütfen tekrar giriş yapın.');
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border px-6 py-8 shadow-xl">
        <div className="text-center mb-6">
          <h1
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground"
            style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
          >
            Şifreyi Sıfırla
          </h1>
          <p
            className="mt-2 text-sm text-muted-foreground"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Yeni şifrenizi belirleyin ve hesabınıza güvenle geri dönün.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2 text-foreground"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Yeni Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Yeni şifrenizi girin"
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2 text-foreground"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Yeni şifrenizi tekrar girin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground text-center"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Giriş sayfasına dön
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;




