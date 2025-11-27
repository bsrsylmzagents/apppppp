import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../App';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Smartphone, Building2, Phone, Mail, Bike } from 'lucide-react';
import { CircleNotch, Eye, EyeSlash, ClockCounterClockwise, Sparkle, Question, Headset, X, ShieldCheck, Database, LockKey } from '@phosphor-icons/react';
import { faqData } from '../data/faqData';
import { privacyPolicy, termsOfUse } from '../data/legalData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const FOOTER_LINKS = [
  { id: 'version', label: 'Sürüm Geçmişi (v2.1.0)', icon: ClockCounterClockwise },
  { id: 'roadmap', label: 'Yakında Gelecek Özellikler', icon: Sparkle },
  { id: 'faq', label: 'Sıkça Sorulan Sorular', icon: Question },
  { id: 'contact', label: 'Bize Ulaşın', icon: Headset }
];

const SLOGANS = [
  {
    title: "Operasyonları Hızlandırın.",
    desc: "Rezervasyonlardan araç atamalarına kadar tüm süreci tek panelden yönetin."
  },
  {
    title: "Finansal Kontrol Sizde.",
    desc: "Cari hesaplar, tahsilatlar ve kar/zarar raporları parmaklarınızın ucunda."
  },
  {
    title: "Saha ile Anlık İletişim.",
    desc: "Şoför ve rehberlerinize görev emirlerini WhatsApp üzerinden otomatik iletin."
  }
];

const VERSIONS = [
  {
    version: 'v2.1.0',
    date: '24 Kasım 2025',
    title: 'Dinamik Tema & B2B',
    items: [
      'B2B Portalı ayrıştırıldı.',
      'Turuncu dinamik tema motoru eklendi.',
      'Mobil performans artırıldı.'
    ]
  },
  {
    version: 'v2.0.5',
    date: '15 Kasım 2025',
    title: 'Operasyon Modülü',
    items: [
      'Sürükle-bırak sıralama eklendi.',
      'WhatsApp görev emri özelliği.'
    ]
  }
];

const ROADMAP = [
  { title: 'WhatsApp Otomasyonu', status: 'In Progress', color: 'bg-green-100 text-green-800', desc: 'Rezervasyon onaylarının otomatik gönderimi.' },
  { title: 'Mobil Saha Uygulaması', status: 'Planned', color: 'bg-blue-100 text-blue-800', desc: 'Şoförler için native mobil uygulama.' },
  { title: 'Gelişmiş Raporlama', status: 'Researching', color: 'bg-yellow-100 text-yellow-800', desc: 'Kar/Zarar analizleri ve grafikler.' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 12,
      duration: 0.5
    } 
  }
};

const sentence1Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0
  },
  exit: {
    opacity: 0,
    y: -30
  }
};

const sentence2Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0
  },
  exit: {
    opacity: 0,
    y: -30
  }
};

// Glassmorphism panel animations
const glassContainerVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 14,
      duration: 0.6
    }
  }
};

const glassLogoVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.15, duration: 0.4, ease: 'easeOut' }
  }
};

const glassHeadingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.25, duration: 0.45, ease: 'easeOut' }
  }
};

const glassBodyVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.35, duration: 0.45, ease: 'easeOut' }
  }
};

const glassFooterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.45, duration: 0.4, ease: 'easeOut' }
  }
};

// Eski InfoAccordion ve TestimonialSlider kaldırıldı; yeni footer link + modal sistemi kullanılacak.

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoFormData, setDemoFormData] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: ''
  });
  const [demoLoading, setDemoLoading] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sloganIndex, setSloganIndex] = useState(0);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

  // OAuth callback handler
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`OAuth hatası: ${error}`);
      navigate('/login', { replace: true });
      return;
    }

    if (code && state) {
      // OAuth callback - backend'e code ve state gönder
      handleOAuthCallback(code, state);
    }
  }, [searchParams, navigate]);

  // Remember Me: saved email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('saved_email');
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, username: savedEmail }));
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('localStorage erişimi başarısız (saved_email okunamadı):', e);
    }
  }, []);

  // Rotating slogan carousel (left panel)
  useEffect(() => {
    const interval = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        ...formData,
        remember_me: rememberMe,
      });

      const isDevEnv =
        process.env.NODE_ENV === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      
      // Geliştirme ortamında 2FA'yı bypass et
      if (response.data.require2FA && isDevEnv) {
        const tokenToUse = response.data.access_token || response.data.tempToken;

        if (tokenToUse) {
          // Remember Me storage
          try {
            if (rememberMe) {
              localStorage.setItem('saved_email', formData.username || '');
            } else {
              localStorage.removeItem('saved_email');
            }
          } catch (eStorage) {
            console.warn('localStorage erişimi başarısız (saved_email yazılamadı):', eStorage);
          }

          // 2FA bayraklarına bakmadan direkt login akışına gir
          localStorage.setItem('token', tokenToUse);
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          if (response.data.company) {
            localStorage.setItem('company', JSON.stringify(response.data.company));
          }

          toast.success('Giriş başarılı! (DEV - 2FA bypass edildi)');
          setAuth(true);
          setRedirecting(true);
          setLoading(false);

          const startPage = response.data.user?.preferences?.startPage || '/dashboard';
          navigate(startPage, { replace: true });
          return;
        }
        // Kullanılabilir bir token yoksa normal 2FA akışına düş
      }
      
      if (response.data.require2FA) {
        setRequire2FA(true);
        setTempToken(response.data.tempToken);
        toast.info('İki faktörlü kimlik doğrulama gerekiyor');
        setLoading(false);
        return;
      }
      
      // Remember Me storage
      try {
        if (rememberMe) {
          localStorage.setItem('saved_email', formData.username || '');
        } else {
          localStorage.removeItem('saved_email');
        }
      } catch (eStorage) {
        console.warn('localStorage erişimi başarısız (saved_email yazılamadı):', eStorage);
      }
      
      // Normal login flow
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));
      toast.success('Giriş başarılı!');
      setAuth(true);
      setRedirecting(true);
      setLoading(false);
      
      // Get user's preferred start page
      const startPage = response.data.user?.preferences?.startPage || '/dashboard';
      
      // Navigate to user's preferred start page
      navigate(startPage, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Backend bağlantısı yapılamadı! Backend\'in çalıştığından emin olun. (http://localhost:8000)');
      } else if (error.response) {
        let errorMessage = 'Giriş başarısız';
        const detail = error.response?.data?.detail;
        
        if (detail) {
          if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (Array.isArray(detail)) {
            const messages = detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                return err.msg;
              }
              return String(err);
            });
            errorMessage = messages.join(', ');
          } else if (typeof detail === 'object' && detail.msg) {
            errorMessage = detail.msg;
          } else {
            errorMessage = String(detail);
          }
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('Bağlantı hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  };

  const handleOAuthCallback = async (code, state) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/oauth/callback`, {
        code,
        state
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('company', JSON.stringify(response.data.company));
        toast.success('Giriş başarılı!');
        setAuth(true);
        setRedirecting(true);
        setLoading(false);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('OAuth girişi başarısız oldu. Lütfen tekrar deneyin.');
      navigate('/login', { replace: true });
    }
  };

  const handle2FAValidation = async (e) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/2fa/validate-login`, {
        tempToken: tempToken,
        code: twoFactorCode
      });

      if (response.data.recovery_code_used) {
        toast.warning('Kurtarma kodu kullanıldı. Lütfen yeni bir kurtarma kodu oluşturun.');
      }

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));
      toast.success('Giriş başarılı!');
      setAuth(true);
      setRedirecting(true);
      setLoading(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('2FA validation error:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Backend bağlantısı yapılamadı! Backend\'in çalıştığından emin olun.');
      } else if (error.response) {
        let errorMessage = 'Doğrulama kodu geçersiz';
        const detail = error.response?.data?.detail;
        
        if (detail) {
          if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (Array.isArray(detail)) {
            const messages = detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                return err.msg;
              }
              return String(err);
            });
            errorMessage = messages.join(', ');
          } else if (typeof detail === 'object' && detail.msg) {
            errorMessage = detail.msg;
          } else {
            errorMessage = String(detail);
          }
        }
        
        toast.error(errorMessage);
      } else {
        toast.error('Bağlantı hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  };

  const handleDemoRequest = async (e) => {
    e.preventDefault();
    setDemoLoading(true);

    try {
      // Validate form data
      if (!demoFormData.company_name || !demoFormData.email) {
        toast.error('Lütfen firma adı ve e-posta adresini doldurun');
        setDemoLoading(false);
        return;
      }

      console.log('Sending demo request:', demoFormData);
      console.log('API URL:', `${API}/auth/demo-request`);
      
      const response = await axios.post(`${API}/auth/demo-request`, demoFormData);
      
      console.log('Demo request response:', response.data);
      
      if (response.data && response.data.success !== false) {
        toast.success('Demo talebiniz alındı! En kısa sürede size dönüş yapacağız.');
        setDemoModalOpen(false);
        setDemoFormData({
          company_name: '',
          contact_name: '',
          phone: '',
          email: ''
        });
      } else {
        toast.error('Demo talebi gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Demo request error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response) {
        let errorMessage = 'Demo talebi gönderilemedi';
        const detail = error.response?.data?.detail;
        
        if (detail) {
          if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (Array.isArray(detail)) {
            const messages = detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                return err.msg;
              }
              return String(err);
            });
            errorMessage = messages.join(', ');
          } else if (typeof detail === 'object' && detail.msg) {
            errorMessage = detail.msg;
          } else {
            errorMessage = String(detail);
          }
        }
        
        toast.error(errorMessage);
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Backend bağlantısı yapılamadı! Backend\'in çalıştığından emin olun.');
      } else {
        toast.error('Bağlantı hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setDemoLoading(false);
    }
  };

  const AnimatedATVIcon = () => (
      <div className="relative inline-flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center">
          <Bike 
            size={64} 
          className="text-[#f6f8f8] opacity-90"
          />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-hidden bg-[#102222] text-white">
      {/* Sol taraf - VoyageFlow brand panel (desktop) */}
      <div className="relative hidden h-screen lg:flex lg:w-1/2 bg-[#102222]">
        {/* Arka plan fotoğrafı (referans temadaki gibi hafif opak) */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCqq9e194BCFo7Gr4l1eOy71n-VJdwMTIWz5I1j2OHfKO6Nrtssy-5wvuWG6HE0Xa2KgE4bIaJrhlfsAXIJFVcPyvF_l3qdDmdbGWOvCMaBi1G6frt0UbikP_Mmt-0oiAOD7df896ivuoTT84-NfYrlbPQZOUKcN1vmV3r7h48iZepDO6bing9v3fLSXjS2sEqKa4dc1OL7KQar47lXKkfg-_tau1T6Cz11z1fpAFAKN_FPmWZ04phIr7AytUe79ofIeioH6IeRkC6c')",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between px-8 lg:px-12 py-10">
          {/* Sol üst logo / marka */}
          <div className="flex items-start justify-between">
            <p
              className="text-sm md:text-base tracking-[0.25em] text-[#ff6f61]"
              style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
            >
              TOURCAST
            </p>
          </div>

          {/* Ortadaki başlık + açıklama - dönen sloganlar */}
          <div className="flex-1 flex flex-col justify-center px-0 lg:px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={sloganIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h1
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight"
                  style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                >
                  {SLOGANS[sloganIndex].title}
                </h1>
                <p
                  className="text-base lg:text-lg text-orange-100/90 font-light max-w-md leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {SLOGANS[sloganIndex].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* İlerleme göstergeleri (noktalı) */}
            <div className="flex gap-2 mt-8">
              {SLOGANS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === sloganIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Alt linkler + telif (sol altta) */}
          <div className="space-y-6 pb-4">
            <div className="space-y-3">
              {FOOTER_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => setActiveFooterModal(link.id)}
                    className="flex items-center gap-3 text-sm text-[#e5e7eb] hover:text-white transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Legal footer - sol alt */}
            <div
              className="text-[10px] lg:text-xs text-white/70"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              © {new Date().getFullYear()} TourCast Teknoloji A.Ş. |
              <button
                type="button"
                onClick={() => setActiveFooterModal('privacy')}
                className="ml-1 underline hover:text-white"
              >
                Gizlilik Politikası
              </button>
              <span> | </span>
              <button
                type="button"
                onClick={() => setActiveFooterModal('terms')}
                className="underline hover:text-white"
              >
                Kullanım Şartları
              </button>
            </div>
          </div>
        </div>
        </div>

      {/* Sağ taraf - Login / Yönlendirme Durumu */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-10 lg:px-16 lg:py-12 bg-[#102222]">
        <div className="w-full max-w-md flex-1 flex flex-col">
          {redirecting ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <CircleNotch size={40} className="text-slate-300 animate-spin" />
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Giriş Başarılı
              </h2>
              <p
                className="text-base md:text-lg text-[#9ca3af]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Hesabınıza yönlendiriliyorsunuz, lütfen bekleyin...
              </p>
            </div>
          ) : !require2FA ? (
            <div className="flex-1 flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-10">
                <h2
                  className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#f9fafb]"
                  style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                >
                  Giriş Yap
                </h2>
                <p
                  className="mt-3 text-base md:text-lg"
                  style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff' }}
                >
                  Rezervasyonlarınızı ve müşterilerinizi yönetmek için giriş yapın.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Email */}
                <div className="flex flex-col">
                  <label
                    htmlFor="email"
                    className="pb-2 text-sm font-medium !text-white"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    E-posta Adresi
                  </label>
                  <div className="relative flex w-full items-stretch">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                <input
                      id="email"
                  type="text"
                  value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="form-input flex w-full min-w-0 flex-1 rounded-lg border border-transparent bg-[#1a2c2c] px-3 pl-10 py-3 text-sm text-white placeholder:text-white shadow-sm focus:border-[#ff6f61] focus:outline-none focus:ring-2 focus:ring-[#ff6f61]/60"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      placeholder="kullanici@ornek.com"
                  required
                  data-testid="username-input"
                />
              </div>
            </div>

                {/* Password */}
                <div className="flex flex-col">
                  <label
                    htmlFor="password"
                    className="pb-2 text-sm font-medium !text-white"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Şifre
                  </label>
                  <div className="relative flex w-full items-stretch">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                <input
                      id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="form-input flex w-full min-w-0 flex-1 rounded-lg border border-transparent bg-[#1a2c2c] px-3 pl-10 pr-10 py-3 text-sm text-white placeholder:text-white shadow-sm focus:border-[#ff6f61] focus:outline-none focus:ring-2 focus:ring-[#ff6f61]/60"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="Şifreniz"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#374151] bg-[#152020] text-[#ff6f61] focus:ring-[#ff6f61]"
                    />
                <span
                      className="text-sm text-[#e5e7eb]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                      Beni Hatırla
                </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-sm font-medium text-[#ff6f61] hover:underline"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Şifrenizi mi unuttunuz?
                  </button>
            </div>

                {/* Submit */}
                <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#ff6f61] px-5 py-3.5 text-base font-bold leading-normal text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#ff6f61] focus:ring-offset-2 focus:ring-offset-[#102222] disabled:opacity-70"
              style={{ fontFamily: 'Inter, sans-serif' }}
              data-testid="login-submit-btn"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
                </div>
          </form>

              {/* Alt metin (Demo CTA) */}
              <div className="mt-6 text-center">
                <p
                  className="text-sm text-[#9ca3af]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Henüz bir hesabınız yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(true)}
                    className="font-medium text-[#ff6f61] hover:underline"
                  >
                    Demo talebi oluştur
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <form onSubmit={handle2FAValidation} className="space-y-6">
                <div className="text-center mb-6">
                  <Smartphone size={56} className="mx-auto mb-6 text-[#ff6f61]" />
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', fontWeight: 700 }}>
                    İki Faktörlü Kimlik Doğrulama
                  </h2>
                  <p className="text-base text-[#9ca3af]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Authenticator uygulamanızdan 6 haneli kodu girin
                  </p>
                </div>

                <div>
                  <label className="twofa-label block text-sm font-semibold mb-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Doğrulama Kodu
                  </label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#152020] border border-[#374151] focus:outline-none focus:ring-2 focus:ring-[#ff6f61] focus:border-[#ff6f61] transition-all text-center text-3xl tracking-[0.5em] font-semibold text-white placeholder:text-gray-500"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs mt-3 text-[#9ca3af] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Kurtarma kodunuz varsa onu da kullanabilirsiniz
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full py-3.5 rounded-lg font-bold bg-[#ff6f61] hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative z-10 btn-hover"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px' }}
                >
                  {loading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequire2FA(false);
                    setTempToken(null);
                    setTwoFactorCode('');
                  }}
                  className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ← Geri Dön
                </button>
              </form>
            </div>
          )}

          {/* Sağ panel alt footer alanı (her zaman altta, sadece normal login görünümünde) */}
          {!redirecting && !require2FA && (
            <div className="mt-10 flex flex-col items-center">
              {/* Sistem durumu */}
              <div className="flex items-center justify-center text-xs text-gray-400">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="ml-2">Tüm Sistemler Aktif</span>
                </span>
              </div>

              {/* Trust & Security satırı */}
              <div className="mt-6 flex items-center justify-center gap-6 text-gray-300">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck weight="duotone" size={20} />
                  <span className="text-[11px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    256-bit SSL
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Database weight="duotone" size={20} />
                  <span className="text-[11px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Yedekli Altyapı
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <LockKey weight="duotone" size={20} />
                  <span className="text-[11px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    KVKK Uyumlu
                  </span>
                </div>
              </div>

              {/* Legal footer - sağ panelde sadece telif */}
              <div className="mt-8 pt-4 w-full border-t border-gray-700/60 text-center">
                <p className="text-[10px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  © {new Date().getFullYear()} TourCast Teknoloji A.Ş.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Linkleri - Mobile (en altta dikey liste) */}
      <div className="w-full bg-[#102222] border-t border-[#374151] px-4 py-4 space-y-2 lg:hidden">
        {FOOTER_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => setActiveFooterModal(link.id)}
              className="w-full flex items-center justify-between px-2 py-2 text-left"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-[#9ca3af]" />
                <span className="text-xs font-medium text-[#9ca3af] hover:text-white transition-colors">
                  {link.label}
                </span>
              </div>
            </button>
          );
        })}
        <p className="pt-2 text-center text-[11px] text-[#9ca3af]" style={{ fontFamily: 'Inter, sans-serif' }}>
          © {new Date().getFullYear()} TourCast. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Demo Request Modal */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className="text-2xl font-bold tracking-tight text-gray-900"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              TourCast Demo Talebi
            </DialogTitle>
            <DialogDescription
              className="text-base text-gray-700"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="font-semibold">Demo talebinizi gönderin</span>, size en kısa sürede dönüş yapalım.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDemoRequest} className="space-y-5 mt-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Firma Adı
              </label>
              <div className="relative">
                <Building2 size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={demoFormData.company_name}
                  onChange={(e) => setDemoFormData({ ...demoFormData, company_name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                  placeholder="Firma adınız"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Yetkili Kişi Adı
              </label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={demoFormData.contact_name}
                  onChange={(e) => setDemoFormData({ ...demoFormData, contact_name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                  placeholder="Adınız ve soyadınız"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={demoFormData.phone}
                  onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                E-posta
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={demoFormData.email}
                  onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
                  placeholder="ornek@firma.com"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDemoModalOpen(false)}
                className="flex-1 font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={demoLoading}
                className="flex-1 bg-[#ff6f61] hover:opacity-90 text-white font-semibold btn-hover"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {demoLoading ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
              Şifre Sıfırlama
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısını gönderelim.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!forgotEmail) {
                toast.error('Lütfen e-posta adresinizi girin');
                return;
              }
              try {
                await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
                toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (geliştirme ortamında konsola yazdırılır).');
                setForgotPasswordOpen(false);
                setForgotEmail('');
              } catch (err) {
                console.error('Forgot password error:', err);
                toast.error('Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.');
              }
            }}
          >
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                E-posta Adresi
              </label>
                <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856]"
                placeholder="ornek@firma.com"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
                className="font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="bg-[#ff6f61] hover:opacity-90 text:white font-semibold btn-hover"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Sıfırlama Linki Gönder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer Link Modalları - Demo talep modali ile uyumlu, açık zemin */}
      <AnimatePresence>
        {activeFooterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 md:p-7 text-gray-900"
            >
              <button
                type="button"
                onClick={() => setActiveFooterModal(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>

              {activeFooterModal === 'version' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Outfit, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    Sürüm Geçmişi
                  </h2>
                  <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    TourCast platformunun son güncellemeleri ve önemli değişiklikleri.
                  </p>
                  <div className="mt-4 space-y-4">
                    {VERSIONS.map((item) => (
                      <div
                        key={item.version}
                        className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm"
                      >
                        <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#ff6f61] shadow-sm">
                          <ClockCounterClockwise size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex.items-center justify-between gap-3 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                              {item.version}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.date}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600">
                            {item.items.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFooterModal === 'roadmap' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    Yakında Gelecek Özellikler
                  </h2>
                  <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Roadmap üzerinde çalışan ekibimizin odaklandığı başlıklar.
                  </p>
                  <div className="mt-4 space-y-4">
                    {ROADMAP.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm"
                      >
                        <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6f61]/10 text-[#ff6f61]">
                          <Sparkle size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.color}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFooterModal === 'faq' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    Sıkça Sorulan Sorular
                  </h2>
                  <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    TourCast hakkında en çok merak edilen sorular.
                  </p>
                  <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto">
            {faqData.map((item, index) => {
              const isActive = activeFaqIndex === index;
              return (
                <div
                  key={item.question}
                          className="rounded-xl border border-gray-200 bg-gray-50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFaqIndex(isActive ? null : index)
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span
                              className="text-sm font-semibold text-gray-900 text-left"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                                  ? 'bg-[#ff6f61]/20 text-[#ff6f61]'
                                  : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isActive ? 'Kapat' : 'Görüntüle'}
                    </span>
                  </button>
                  {isActive && (
                            <div className="px-4 pb-3 pt-1">
                      <p
                                className="text-sm text-gray-600 leading-relaxed"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
                  <div className="mt-4.pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      className="text-xs font-medium text-[#ff6f61] hover:opacity-90 underline"
                    >
                      Daha detaylı SSS için buraya tıklayın.
                    </button>
                  </div>
                </div>
              )}

              {activeFooterModal === 'contact' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    Bize Ulaşın
                  </h2>
                  <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Sorularınız, önerileriniz veya demo talepleriniz için formu doldurun.
                  </p>
                  <form
                    className="space-y-4 mt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success('Mesajınız alındı! En kısa sürede dönüş yapacağız.');
                      setContactForm({ name: '', email: '', message: '' });
                      setActiveFooterModal(null);
                    }}
                  >
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Adınız
                      </label>
                <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline:none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] placeholder:text-gray-400"
                        placeholder="Adınız ve soyadınız"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        E-posta
                      </label>
                <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] placeholder:text-gray-400"
                        placeholder="ornek@firma.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Mesajınız
                      </label>
                <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#406856] focus:border-[#406856] resize:none placeholder:text-gray-400"
                        placeholder="Kısaca talebinizi veya sorunuzu yazın"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveFooterModal(null)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#ff6f61] hover:opacity-90 shadow-sm"
                      >
                        Gönder
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Gizlilik Politikası Modali */}
              {activeFooterModal === 'privacy' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    {privacyPolicy.title}
                  </h2>
                  <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Son güncelleme: {privacyPolicy.lastUpdated}
                  </p>
                  <div
                    className="mt-2 space-y-3 text-sm text-gray-700 leading-relaxed max-h-[420px] overflow-y-auto prose prose-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: privacyPolicy.content }}
                  />
                </div>
              )}

              {/* Kullanım Şartları Modali */}
              {activeFooterModal === 'terms' && (
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight mb-1 text-gray-900"
                    style={{ fontFamily: 'Manrope, system-ui, sans-serif', letterSpacing: '-0.03em' }}
                  >
                    {termsOfUse.title}
                  </h2>
                  <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Son güncelleme: {termsOfUse.lastUpdated}
                  </p>
                  <div
                    className="mt-2 space-y-3 text-sm text-gray-700 leading-relaxed max-h-[420px] overflow-y-auto prose prose-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: termsOfUse.content }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;



