import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';

// --- SAYFA IMPORTLARI ---
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Calendar from './pages/Calendar';
import Customers from './pages/Customers';
import MunferitCustomers from './pages/customers/MunferitCustomers';
import CariCustomers from './pages/customers/CariCustomers';
import ExtraSales from './pages/ExtraSales';
import CariAccounts from './pages/CariAccounts';
import CariDetail from './pages/CariDetail';
import SeasonalPrices from './pages/SeasonalPrices';
import ServicePurchases from './pages/ServicePurchases';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Operations from './pages/Operations';
import TourTypes from './pages/TourTypes';
import PaymentTypes from './pages/PaymentTypes';
import StaffManagement from './pages/StaffManagement';
import Cash from './pages/Cash';
import CashIncome from './pages/cash/CashIncome';
import CashExpense from './pages/cash/CashExpense';
import CashDetail from './pages/cash/CashDetail';
import Definitions from './pages/Definitions';
import Notifications from './pages/Notifications';
import Security from './pages/Security';
import Integrations from './pages/Integrations';
import Preferences from './pages/Preferences';
import SettingsCurrencyRates from './pages/settings/SettingsCurrencyRates';
import PublicLayout from './components/PublicLayout';
import PublicBooking from './pages/PublicBooking';
import PortalLogin from './pages/portal/PortalLogin';
import PortalDashboard from './pages/portal/PortalDashboard';
import AdminCustomers from './pages/AdminCustomers';
import AdminNewCustomer from './pages/AdminNewCustomer';
import AdminEditCustomer from './pages/AdminEditCustomer';
import AdminDemoRequests from './pages/AdminDemoRequests';
import AdminRoute from './components/AdminRoute';
import CariLogin from './pages/cari/CariLogin';
import CariDashboard from './pages/cari/CariDashboard';
import CariCreateReservation from './pages/cari/CariCreateReservation';
import CariTransactions from './pages/cari/CariTransactions';
import CariRequirePasswordChange from './pages/cari/CariRequirePasswordChange';
import CariDetailView from './pages/cari/CariDetailView';
import CompanyProfile from './pages/CompanyProfile';

// ============================================================
// 1. GLOBAL AYARLAR
// ============================================================
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

axios.defaults.baseURL = BACKEND_URL;

// AXIOS INTERCEPTOR (Token ve Impersonate Ayarı)
axios.interceptors.request.use(
  (config) => {
    // URL Düzeltme
    if (config.url && !config.url.startsWith('http')) {
      if (config.url.startsWith('/api')) {
        config.url = `${BACKEND_URL}${config.url}`;
      } else if (config.url.startsWith('/')) {
        config.url = `${BACKEND_URL}/api${config.url}`;
      }
    }
    
    // Token Ayarlama Mantığı
    if (config.url?.includes('/portal/') || config.url?.includes('/api/portal/') || 
        config.url?.includes('/cari/') || config.url?.includes('/api/cari/') ||
        config.url?.includes('/auth/b2b-login')) {
      const cariToken = localStorage.getItem('cari_token');
      if (cariToken) {
        config.headers.Authorization = `Bearer ${cariToken}`;
      } else {
        const portalToken = localStorage.getItem('portal_token');
        if (portalToken) {
          config.headers.Authorization = `Bearer ${portalToken}`;
        }
      }
    } else {
      // Normal Yönetim Paneli Tokenı
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // --- SÜPER ADMIN VEKALET (IMPERSONATE) ---
      const isAdminView = localStorage.getItem('is_admin_view') === 'true';
      const currentCompany = JSON.parse(localStorage.getItem('company') || '{}');

      if (isAdminView && currentCompany && (currentCompany.id || currentCompany._id)) {
        config.headers['x-company-id'] = currentCompany.id || currentCompany._id;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isPublic = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isPublic) {
        localStorage.removeItem('token'); 
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// 2. UYGULAMA BİLEŞENİ
// ============================================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // TEMA ZORLAYICI (Brand Teması)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'brand');
  }, []);

  // OTURUM KONTROLÜ (GELİŞTİRİLMİŞ VERSİYON)
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Public alanlardaysak kontrol etme
      const pathname = window.location.pathname;
      const isPublicArea = pathname.startsWith('/cari/') || pathname.startsWith('/r/') || 
                          pathname.startsWith('/portal/') || pathname.startsWith('/booking/');
      
      if (isPublicArea) {
        setLoading(false);
        return;
      }

      // 2. Token yoksa at
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      // 3. SUNUCU KONTROLÜ (Dev Mode Kodu Kaldırıldı!)
      try {
        // Her seferinde sunucudan güncel kullanıcıyı çek
        const response = await axios.get(`${API}/auth/me`);
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          if (response.data.company) {
            localStorage.setItem('company', JSON.stringify(response.data.company));
          }
          setIsAuthenticated(true);
        } else {
          throw new Error('Kullanıcı verisi yok');
        }
      } catch (error) {
        console.error('Oturum doğrulanamadı:', error);
        // Token geçersizse temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('company');
        localStorage.removeItem('is_admin_view');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthChange = (status) => {
    if (status) {
      // Giriş yapıldığında eski vekil modunu kesinlikle temizle
      localStorage.removeItem('is_admin_view');
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;

  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={!isAuthenticated ? <Login setAuth={handleAuthChange} /> : <Navigate to="/" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
            
            {/* Ana Panel */}
            <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="operations" element={<Operations />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/munferit" element={<MunferitCustomers />} />
              <Route path="customers/cari" element={<CariCustomers />} />
              <Route path="extra-sales" element={<ExtraSales />} />
              <Route path="cari-accounts" element={<CariAccounts />} />
              <Route path="cari-accounts/:id" element={<CariDetail />} />
              <Route path="seasonal-prices" element={<SeasonalPrices />} />
              <Route path="service-purchases" element={<ServicePurchases />} />
              <Route path="reports/*" element={<Reports />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="cash/*" element={<Cash />} />
              <Route path="settings/*" element={<Settings />} />
              <Route path="company-profile" element={<CompanyProfile />} />
              
              {/* Admin Routes */}
              <Route path="admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
              <Route path="admin/customers/new" element={<AdminRoute><AdminNewCustomer /></AdminRoute>} />
              <Route path="admin/customers/:company_id" element={<AdminRoute><AdminEditCustomer /></AdminRoute>} />
              <Route path="admin/demo-requests" element={<AdminRoute><AdminDemoRequests /></AdminRoute>} />
            </Route>
            
            {/* Diğer Route'lar */}
            <Route element={<PublicLayout />}>
              <Route path="booking/:agencySlug" element={<PublicBooking />} />
            </Route>
            <Route path="portal/:agencySlug/login" element={<PortalLogin />} />
            <Route path="portal/:agencySlug/dashboard" element={<PortalDashboard />} />
            <Route path="cari/*" element={<CariLogin />} />
            <Route path="/:companySlug" element={<CariLogin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;