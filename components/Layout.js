import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, ShoppingCart, ArrowLeft, ChevronDown, ExternalLink, Clock, Sun, Moon, CheckSquare, Square, Package, Calendar as CalendarIcon
} from 'lucide-react';
// Phosphor Icons - Warm/Premium Theme
import { 
  SquaresFour, 
  Ticket, 
  CalendarBlank, 
  Users as UsersPhosphor, 
  Tag, 
  Wallet as WalletPhosphor, 
  ChartPieSlice, 
  GearSix,
  Bell as BellPhosphor,
  PencilSimple,
  Trash,
  Safe,
  ClipboardText,
  SteeringWheel
} from '@phosphor-icons/react';
import CurrencyConverter from './CurrencyConverter';
import BottomNavigation from './BottomNavigation';
import NotificationCenter from './NotificationCenter';
// Theme toggle removed - always dark mode
import axios from 'axios';
import { API } from '../App';
import { format } from 'date-fns';

const Layout = () => {
  // Get user preferences for sidebar
  const getUserPreferences = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.preferences || {};
      }
    } catch (error) {
      console.error('Error reading user preferences:', error);
    }
    return {};
  };

  const preferences = getUserPreferences();
  const sidebarCollapsedPref = preferences.sidebarCollapsed || false;
  
  // Helper function to get menu item classes based on active state
  const getMenuItemClasses = (isActive) => {
    if (isActive) {
      // Aktif: sidebar üzerinde hafif vurgulu koyu arka plan, beyaz metin
      return 'nav-item flex items-center gap-3 px-4 md:px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-colors bg-sidebar-hover text-sidebar-foreground shadow-sm';
    }
    // Pasif: transparan; hover’da hafif koyu yeşil arka plan
    return 'nav-item flex items-center gap-3 px-4 md:px-6 py-3.5 rounded-xl text-[15px] transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground';
  };
  
  // Sidebar: closed on mobile by default, open on desktop
  // On desktop, respect user preference for collapsed state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize sidebar state based on screen size and user preference
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 768) { // md breakpoint (desktop)
        // On desktop, use user preference (inverted: collapsed = false means open)
        setSidebarOpen(!sidebarCollapsedPref);
      } else {
        // On mobile, always closed by default
        setSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarCollapsedPref]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const company = JSON.parse(localStorage.getItem('company') || '{}');
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  // Theme toggle removed - always dark mode

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('is_admin_view');
    window.location.href = '/login';
  };

  // Role-based access control
  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'owner' || user.is_admin;
  const isAdminView = localStorage.getItem('is_admin_view') === 'true';
  // Owner kontrolü: Firma sahibi (admin role) tüm yetkilere sahip
  const isOwner = user.role === 'admin' || user.role === 'owner' || (user.is_admin && !isSuperAdmin); // Company admin, not super admin
  // Corporate user kontrolü - corporate_user rolüne sahip kullanıcılar admin menüsünü görmemeli
  const isCorporateUser = user.role === 'corporate_user' || user.role === 'cari';

  // Firma bilgilerini yükle
  useEffect(() => {
    if (profileDropdownOpen) {
      fetchCompanyInfo();
    }
  }, [profileDropdownOpen]);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${API}/company/profile`);
      setCompanyInfo(response.data);
    } catch (error) {
      console.error('Firma bilgileri yüklenemedi:', error);
    }
  };


  // Kalan paket süresini hesapla
  const getRemainingDays = () => {
    if (!companyInfo?.package_end_date) return null;
    const endDate = new Date(companyInfo.package_end_date);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Bildirimleri yükle (tur başlangıcı için)
  useEffect(() => {
    fetchNotifications();
    // Her dakika kontrol et
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Notification dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    if (notificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationDropdownOpen]);

  // localStorage'dan okundu bildirimleri yükle
  const getReadNotifications = () => {
    try {
      const read = localStorage.getItem('read_notifications');
      return read ? JSON.parse(read) : [];
    } catch (error) {
      return [];
    }
  };

  // Bildirimi okundu olarak işaretle
  const markNotificationAsRead = (notificationId) => {
    try {
      const read = getReadNotifications();
      if (!read.includes(notificationId)) {
        read.push(notificationId);
        localStorage.setItem('read_notifications', JSON.stringify(read));
        // Bildirimleri güncelle
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        // Okunmamış sayısını güncelle
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Okundu bildirimleri yükle
      const readNotifications = getReadNotifications();
      
      // Pending reservations bildirimlerini getir
      let pendingNotifications = [];
      let pendingCount = 0;
      try {
        const pendingResponse = await axios.get(`${API}/notifications`, {
          params: { unread_only: true }
        });
        pendingNotifications = (pendingResponse.data?.notifications || []).filter(n => 
          n.type === 'pending_reservation' && !readNotifications.includes(n.id)
        );
        pendingCount = pendingResponse.data?.unread_count || 0;
      } catch (error) {
        console.error('Pending notifications yüklenemedi:', error);
      }
      
      // Bugünkü rezervasyonları getir
      const response = await axios.get(`${API}/reservations`, {
        params: { 
          date_from: today,
          date_to: today,
          status: 'confirmed'
        }
      });
      
      const reservations = response.data || [];
      
      // Tur başlangıcı bildirimleri oluştur (tur başlangıcından 30 dakika önce başlayarak, tur başlangıcına kadar)
      const upcomingTours = reservations.filter(reservation => {
        if (!reservation.date || !reservation.time) return false;
        
        const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
        const now = new Date();
        const diffMinutes = (reservationDateTime - now) / (1000 * 60);
        
        // 30 dakika öncesinden başlayarak, tur başlangıcına kadar bildirim göster
        // Yani: -30 <= diffMinutes <= 0 (tur başlangıcından 30 dk önce ile tur başlangıcı arası)
        return diffMinutes <= 30 && diffMinutes >= -30;
      });
      
      // Bildirimleri formatla
      const formattedNotifications = upcomingTours.map(reservation => {
        const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
        const now = new Date();
        const diffMinutes = Math.floor((reservationDateTime - now) / (1000 * 60));
        
        let message = '';
        if (diffMinutes < 0) {
          message = `Tur başladı (${Math.abs(diffMinutes)} dakika önce)`;
        } else if (diffMinutes === 0) {
          message = 'Tur şimdi başlıyor';
        } else {
          message = `Tur ${diffMinutes} dakika sonra başlayacak`;
        }
        
        // Okundu durumunu kontrol et
        const isRead = readNotifications.includes(reservation.id);
        
        return {
          id: reservation.id,
          type: 'tour_start',
          title: 'Tur Başlangıcı',
          message: message,
          reservation: reservation,
          time: reservation.time,
          date: reservation.date,
          customer: reservation.customer_name,
          tourType: reservation.tour_type_name,
          atvCount: reservation.atv_count,
          createdAt: new Date().toISOString(),
          read: isRead
        };
      });
      
      // Pending reservations bildirimlerini formatla ve ekle
      const formattedPendingNotifications = pendingNotifications.map(notif => ({
        id: notif.id,
        type: 'pending_reservation',
        title: notif.title || 'Yeni Rezervasyon Talebi',
        message: notif.message,
        entity_id: notif.entity_id,
        createdAt: notif.created_at || new Date().toISOString(),
        read: false
      }));
      
      // Tüm bildirimleri birleştir
      const allNotifications = [...formattedPendingNotifications, ...formattedNotifications];
      
      // En yeni bildirimler üstte
      allNotifications.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length + pendingCount);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    }
  };

  const handleExitAdminView = () => {
    // Admin bilgilerini geri yükle
    const adminUser = sessionStorage.getItem('admin_user');
    const adminCompany = sessionStorage.getItem('admin_company');
    const adminToken = sessionStorage.getItem('admin_token');
    
    if (adminUser && adminCompany && adminToken) {
      localStorage.setItem('user', adminUser);
      localStorage.setItem('company', adminCompany);
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('is_admin_view');
      sessionStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_company');
      sessionStorage.removeItem('admin_token');
      
      navigate('/admin/customers');
    } else {
      // Session storage'da bilgi yoksa admin paneline yönlendir
      localStorage.removeItem('is_admin_view');
      navigate('/admin/customers');
    }
  };
  
  // Permission kontrolü için user bilgilerini al
  const userPermissions = user.permissions || {};

  // Get active module from localStorage or default to 'tour'
  const activeModule = localStorage.getItem('activeModule') || 'tour';

  // Modül bazlı menü yapısı - Phosphor Icons
  const moduleMenus = {
    tour: [
      { path: '/', icon: SquaresFour, label: 'Dashboard', testId: 'nav-dashboard', permission: 'dashboard.view' },
      { path: '/reservations', icon: Ticket, label: 'Rezervasyonlar', testId: 'nav-reservations', permission: 'reservation.create' },
      { path: '/calendar', icon: CalendarBlank, label: 'Takvim', testId: 'nav-calendar', permission: 'reservation.create' },
      { path: '/operations', icon: SteeringWheel, label: 'Operasyon', testId: 'nav-operations', permission: 'reservation.edit' },
      { path: '/customers', icon: UsersPhosphor, label: 'Müşteriler', testId: 'nav-customers', permission: 'cari.view' },
      { path: '/cari-accounts', icon: UsersPhosphor, label: 'Cari Firmalar', testId: 'nav-cari', permission: 'cari.view' },
      { path: '/seasonal-prices', icon: Tag, label: 'Fiyat Yönetimi', testId: 'nav-seasonal-prices', permission: 'reservation.edit_price' },
      { path: '/extra-sales', icon: ShoppingCart, label: 'Açık Satışlar', testId: 'nav-extra-sales', permission: 'finance.view_revenue' },
      { path: '/service-purchases', icon: ShoppingCart, label: 'Hizmet Al', testId: 'nav-service-purchases', permission: 'finance.kasa_edit' },
      { path: '/cash', icon: WalletPhosphor, label: 'Kasa', testId: 'nav-cash', permission: 'finance.kasa_view' },
      { path: '/reports', icon: ChartPieSlice, label: 'Raporlar', testId: 'nav-reports', permission: 'reports.view_all_reports' },
      { path: '/inventory', icon: ShoppingCart, label: 'Envanter', testId: 'nav-inventory', permission: 'atv.view' },
      { path: '/settings', icon: GearSix, label: 'Ayarlar', testId: 'nav-settings', permission: 'settings.view' },
    ]
  };

  // Aktif modüle göre menüleri al
  const menuItems = moduleMenus[activeModule] || moduleMenus.tour;

  // Permission kontrolü yapan helper fonksiyon
  const hasPermission = (permission) => {
    // Sistem admini veya firma sahibi (owner) her şeyi yapabilir
    if (isAdmin || isOwner) return true;
    // Web panel aktif değilse hiçbir yetki yok
    if (user.web_panel_active === false) return false;
    // Permission string'i parse et (module.action formatında)
    const [module, action] = permission.split('.');
    if (!module || !action) return false;
    // Permissions objesinden kontrol et
    return userPermissions[module]?.[action] === true;
  };

  // Yetkisi olan menü item'larını filtrele
  // GEÇİCİ: Tüm menüleri göster (permission kontrolünü devre dışı)
  const filteredMenuItems = menuItems;

  // Admin panel menüsü
  // GEÇİCİ: Tüm kullanıcılar için göster (yetki kontrolü kapalı)
  const adminMenuItems = [
    { path: '/admin/customers', icon: UsersPhosphor, label: 'Müşteriler', testId: 'nav-admin-customers' },
    { path: '/admin/customers/new', icon: UsersPhosphor, label: 'Yeni Müşteri', testId: 'nav-admin-new-customer' },
    { path: '/admin/demo-requests', icon: ClipboardText, label: 'Demo Talepleri', testId: 'nav-admin-demo-requests' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`sidebar fixed md:relative inset-y-0 left-0 z-[9999] w-64 md:w-72 h-screen transform transition-transform duration-300 ease-in-out bg-sidebar text-sidebar-foreground shadow-md ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center px-6 py-6 relative border-b border-border bg-transparent">
            <Link 
              to="/dashboard" 
              className="text-center cursor-pointer group"
              data-testid="app-logo"
            >
              <h1 className="text-3xl md:text-4xl font-bold transition-transform group-hover:scale-105 text-sidebar-foreground">
                TourCast
              </h1>
              <p className="text-xs mt-1 text-sidebar-foreground/80">
                v0.1.0
              </p>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="absolute top-4 right-4 md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
              data-testid="close-sidebar-btn"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
            <ul className="space-y-3">
              {/* Admin Panel Menüsü - Kategorizasyon olmadan */}
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path === '/admin/demo-requests' && location.pathname.startsWith('/admin/demo-requests'));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      data-testid={item.testId}
                      className={getMenuItemClasses(isActive)}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "duotone"} 
                        size={22}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {/* Ayırıcı Çizgi - Admin menülerini diğer menülerden ayırır */}
              {adminMenuItems.length > 0 && (
              <li className="py-2">
                  <div className="h-px bg-border"></div>
                </li>
              )}
              {/* Normal Menü - Tüm öğeler tek listede, kategorizasyon yok */}
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path === '/customers' && location.pathname.startsWith('/customers')) ||
                  (item.path === '/cash' && location.pathname.startsWith('/cash')) ||
                  (item.path === '/settings' && location.pathname.startsWith('/settings'));
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      data-testid={item.testId}
                      className={getMenuItemClasses(isActive)}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "duotone"} 
                        size={22}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="px-4 md:px-6 py-4 border-t border-border relative z-[10001]" ref={profileDropdownRef}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:bg-sidebar-hover p-2 rounded-lg transition-colors cursor-pointer flex-1 text-sidebar-foreground"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sidebar-foreground font-semibold">
                  {user.full_name?.charAt(0).toUpperCase() || company.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-sidebar-foreground" data-testid="user-name">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs truncate text-sidebar-foreground/70">
                    {company.name || 'Firma Profili'}
                  </p>
                </div>
                    <ChevronDown 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-sidebar border border-border rounded-lg shadow-xl z-[10002] overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Paket Kullanım Süresi */}
                  {companyInfo?.package_end_date ? (
                    <div className="pb-3 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon size={16} className="text-primary" />
                        <span className="text-xs text-muted-foreground">Paket Kullanım Süresi</span>
                      </div>
                      {(() => {
                        const remainingDays = getRemainingDays();
                        if (remainingDays === null) return null;
                        const isExpired = remainingDays < 0;
                        const isExpiringSoon = remainingDays <= 7 && remainingDays >= 0;
                        return (
                          <div>
                            <p className={`text-sm font-semibold ${
                              isExpired ? 'text-red-400' : 
                              isExpiringSoon ? 'text-yellow-300' : 
                              'text-primary'
                            }`}>
                              {isExpired 
                                ? `Süresi Doldu (${Math.abs(remainingDays)} gün önce)`
                                : `Kalan Süre: ${remainingDays} gün`
                              }
                            </p>
                            {companyInfo.package_start_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(companyInfo.package_start_date).toLocaleDateString('tr-TR')} - {new Date(companyInfo.package_end_date).toLocaleDateString('tr-TR')}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon size={16} className="text-red-500" />
                        <span className="text-xs text-muted-foreground">Paket Kullanım Süresi</span>
                      </div>
                      <p className="text-sm font-semibold text-red-500">Paket bulunamadı</p>
                    </div>
                  )}

                  {/* Firma Kodu */}
                  {company.code && (
                    <div className="pb-3 border-b border-border">
                      <p className="text-xs text-muted-foreground mb-1">Firma Kodu</p>
                      <p className="text-sm font-semibold text-primary">{company.code}</p>
                    </div>
                  )}

                  {/* Detay Linki */}
                  <Link
                    to="/company-profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between w-full px-3 py-2 bg-sidebar hover:bg-sidebar-hover rounded-lg transition-colors group"
                  >
                    <span className="text-sm text-sidebar-foreground">Detay</span>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary" />
                  </Link>

                  {/* Paketler */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={16} className="text-primary" />
                      <span className="text-sm font-semibold text-sidebar-foreground">Paketler</span>
                    </div>
                    <div className="space-y-2">
                      {/* Mevcut Paket */}
                      {companyInfo?.package_end_date ? (
                        <div className="px-3 py-2 bg-sidebar rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Mevcut Paket</p>
                          <p className="text-sm text-sidebar-foreground">
                            {companyInfo.package_start_date && companyInfo.package_end_date
                              ? `${new Date(companyInfo.package_start_date).toLocaleDateString('tr-TR')} - ${new Date(companyInfo.package_end_date).toLocaleDateString('tr-TR')}`
                              : 'Aktif Paket'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-xs text-red-400">Paket bulunamadı</p>
                        </div>
                      )}
                      
                      {/* Paket Yükselt Butonu */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          // Paket yükseltme sayfasına yönlendir veya modal aç
                          // Şimdilik company-profile sayfasına yönlendiriyoruz
                          navigate('/company-profile');
                        }}
                        className="w-full px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Package size={14} />
                        Paket Yükselt
                      </button>
                    </div>
                  </div>

                  {/* Çıkış Yap */}
                  <button
                    onClick={handleLogout}
                    className="w-full mt-4 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    data-testid="logout-btn"
                  >
                    <LogOut size={16} />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - brand background, flat with bottom border */}
        <header className="px-4 md:px-8 py-4 flex items-center justify-between relative z-[10000] bg-background border-b border-border">
          
          {/* Left Side: Mobile Menu and Currency Converter (aligned with Dashboard title) */}
          <div className="flex items-center gap-4 relative z-[10001]">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-brand-muted hover:text-brand-text"
              data-testid="open-sidebar-btn"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block pl-0 md:pl-4 text-[15px]">
              <CurrencyConverter />
            </div>
          </div>
          
          {/* Right Side: Admin View, Notifications, Profile */}
          <div className="flex items-center gap-4 relative z-[10001]">
            {isAdminView && (
              <button
                onClick={handleExitAdminView}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-accent/40 text-brand-accent bg-white hover:bg-brand-accent/5 transition-colors"
                title="Admin paneline geri dön"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Admin Paneline Dön</span>
              </button>
            )}
            {isAdminView && (
              <span className="px-2 py-1 text-xs rounded-full bg-brand-accent/10 text-brand-accent px-3">
                Admin Görünümü
              </span>
            )}
            {/* Bildirim İkonu */}
            <div className="relative z-[10001]" ref={notificationDropdownRef}>
            <button
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative p-2.5 md:p-3 rounded-full transition-colors border border-brand-accent/40 hover:bg-brand-accent/10"
              title="Bildirimler"
            >
              <BellPhosphor weight="duotone" size={22} className="text-brand-accent" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Center */}
            {notificationDropdownOpen && (
              <NotificationCenter
                onClose={() => setNotificationDropdownOpen(false)}
                onNotificationUpdate={(count) => setUnreadCount(count)}
              />
            )}
            </div>
          </div>
        </header>

        {/* Page Content - Dark Mode Only */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 bg-background">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation menuItems={menuItems} filteredMenuItems={filteredMenuItems} />

      {/* Mobile Sidebar Overlay - Only show when sidebar is open on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
