import React, { useState, useEffect } from 'react';
import { Bell, CheckSquare, Square, Trash2, AlertTriangle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';
import { format } from 'date-fns';
import { toast } from 'sonner';

const NotificationCenter = ({ onClose, onNotificationUpdate }) => {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'warnings'
  const [notifications, setNotifications] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Tüm bildirimleri getir (include_archived: false ile arşivlenmemiş olanlar)
      const allResponse = await axios.get(`${API}/notifications`, {
        params: {
          include_archived: false
        }
      });

      const allItems = allResponse.data?.notifications || [];
      
      // Tur başlangıcı bildirimlerini oluştur (Layout.js ile aynı mantık)
      const today = format(new Date(), 'yyyy-MM-dd');
      let tourStartNotifications = [];
      
      try {
        const reservationsResponse = await axios.get(`${API}/reservations`, {
          params: { 
            date_from: today,
            date_to: today,
            status: 'confirmed'
          }
        });
        
        const reservations = reservationsResponse.data || [];
        
        // Tur başlangıcı bildirimleri oluştur (tur başlangıcından 30 dakika önce başlayarak, tur başlangıcına kadar)
        const upcomingTours = reservations.filter(reservation => {
          if (!reservation.date || !reservation.time) return false;
          
          const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
          const now = new Date();
          const diffMinutes = (reservationDateTime - now) / (1000 * 60);
          
          // 30 dakika öncesinden başlayarak, tur başlangıcına kadar bildirim göster
          return diffMinutes <= 30 && diffMinutes >= -30;
        });
        
        // localStorage'dan okundu bildirimleri yükle
        const getReadNotifications = () => {
          try {
            const read = localStorage.getItem('read_notifications');
            return read ? JSON.parse(read) : [];
          } catch (error) {
            return [];
          }
        };
        
        const readNotifications = getReadNotifications();
        
        // Bildirimleri formatla
        tourStartNotifications = upcomingTours.map(reservation => {
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
            id: `tour_start_${reservation.id}`,
            type: 'info',
            title: 'Tur Başlangıcı',
            message: message,
            body: `${reservation.customer_name} - ${reservation.tour_type_name} (${reservation.atv_count} Araç)`,
            is_read: isRead,
            created_at: new Date().toISOString(),
            reservation: reservation
          };
        });
      } catch (error) {
        console.error('Tur başlangıcı bildirimleri yüklenemedi:', error);
      }
      
      // Backend bildirimleri ile tur başlangıcı bildirimlerini birleştir
      const combinedItems = [...allItems, ...tourStartNotifications];
      
      // Info ve success bildirimleri (Notifications tab)
      const allNotifications = combinedItems.filter(n => 
        n.type === 'info' || n.type === 'success' || !n.type // Backward compatibility
      );

      // Warning ve error bildirimleri (Warnings tab)
      const allWarnings = combinedItems.filter(n => 
        n.type === 'warning' || n.type === 'error'
      );

      setNotifications(allNotifications);
      setWarnings(allWarnings);
      
      // Okunmamış sayısı: backend'den gelen + tur başlangıcı bildirimlerinden okunmamış olanlar
      const backendUnread = allResponse.data?.unread_count || 0;
      const tourStartUnread = tourStartNotifications.filter(n => !n.is_read).length;
      const totalUnread = backendUnread + tourStartUnread;
      
      setUnreadCount(totalUnread);

      if (onNotificationUpdate) {
        onNotificationUpdate(totalUnread);
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const currentItems = activeTab === 'notifications' ? notifications : warnings;
    const unreadItems = currentItems.filter(item => !item.is_read);
    
    if (selectedIds.length === unreadItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unreadItems.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen silmek için bildirim seçin');
      return;
    }

    try {
      await axios.delete(`${API}/notifications/batch`, {
        data: { notification_ids: selectedIds }
      });
      
      toast.success(`${selectedIds.length} bildirim silindi`);
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      console.error('Bildirimler silinemedi:', error);
      toast.error('Bildirimler silinirken hata oluştu');
    }
  };

  const handleMarkAsRead = async (ids) => {
    try {
      // Tur başlangıcı bildirimlerini ayır (tour_start_ prefix'i ile başlayanlar)
      const tourStartIds = ids.filter(id => id.startsWith('tour_start_'));
      const backendIds = ids.filter(id => !id.startsWith('tour_start_'));
      
      // Backend bildirimlerini okundu olarak işaretle
      if (backendIds.length > 0) {
        await axios.post(`${API}/notifications/mark-read`, {
          notification_ids: backendIds
        });
      }
      
      // Tur başlangıcı bildirimlerini localStorage'a kaydet
      if (tourStartIds.length > 0) {
        try {
          const read = JSON.parse(localStorage.getItem('read_notifications') || '[]');
          const reservationIds = tourStartIds.map(id => id.replace('tour_start_', ''));
          const newRead = [...new Set([...read, ...reservationIds])];
          localStorage.setItem('read_notifications', JSON.stringify(newRead));
        } catch (error) {
          console.error('Tur başlangıcı bildirimleri kaydedilemedi:', error);
        }
      }
      
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      console.error('Bildirimler okundu olarak işaretlenemedi:', error);
      toast.error('Bildirimler güncellenirken hata oluştu');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-emerald-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-600" />;
      case 'error':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Info size={16} className="text-[hsl(var(--primary))]" />;
    }
  };

  const currentItems = activeTab === 'notifications' ? notifications : warnings;
  const hasUnread = currentItems.some(item => !item.is_read);
  const allUnreadSelected = hasUnread && currentItems.filter(item => !item.is_read).every(item => selectedIds.includes(item.id));

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-[var(--card)] border border-[hsl(var(--border))] rounded-2xl shadow-2xl z-[10002] max-h-[600px] flex flex-col card-hover">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-[hsl(var(--border))]/60 bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold tc-text-heading">Bildirimler</h3>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--primary))/0.08] text-[hsl(var(--primary))] font-medium">
              {unreadCount} yeni
            </span>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 bg-[var(--color-background)] p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('notifications');
              setSelectedIds([]);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-[hsl(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'tc-text-muted hover:bg-[var(--color-surface)]'
            } btn-hover`}
          >
            Bildirimler ({notifications.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('warnings');
              setSelectedIds([]);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'warnings'
                ? 'bg-amber-50 text-amber-700'
                : 'tc-text-muted hover:bg-[var(--color-surface)]'
            } btn-hover`}
          >
            Uyarılar ({warnings.length})
          </button>
        </div>
      </div>

      {/* Actions Bar (Only for Notifications tab) */}
      {activeTab === 'notifications' && currentItems.length > 0 && (
        <div className="px-4 py-2 border-b border-[hsl(var(--border))]/60 bg-[var(--color-background)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs tc-text-muted hover:tc-text-heading"
            >
              {allUnreadSelected ? (
                <CheckSquare size={16} className="text-[hsl(var(--primary))]" />
              ) : (
                <Square size={16} />
              )}
              <span>Tümünü Seç</span>
            </button>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs btn-hover"
            >
              <Trash2 size={14} />
              <span>Seçilenleri Sil ({selectedIds.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm tc-text-muted">Yükleniyor...</p>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="divide-y divide-[hsl(var(--border))]/60">
            {currentItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isWarningTab = activeTab === 'warnings';
              const bgColor = isWarningTab 
                ? (item.type === 'error' 
                    ? 'bg-red-50 border-l-4 border-red-500'
                    : 'bg-amber-50 border-l-4 border-amber-500')
                : (!item.is_read ? 'bg-[hsl(var(--primary))/0.05]' : '');

              return (
                <div
                  key={item.id}
                  className={`p-4 hover:bg-[var(--color-surface)] transition-colors ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox (Only for Notifications tab) */}
                    {activeTab === 'notifications' && (
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-[hsl(var(--primary))]" />
                        ) : (
                          <Square size={18} className="tc-text-muted" />
                        )}
                      </button>
                    )}

                    {/* Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold tc-text-heading">
                          {item.title || 'Bildirim'}
                        </p>
                        {!item.is_read && (
                          <span className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm mb-1 tc-text-body">
                        {item.message || ''}
                      </p>
                      {item.body && (
                        <p className="text-xs mb-2 tc-text-muted">
                          {item.body}
                        </p>
                      )}
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs tc-text-muted">
                          <Clock size={12} />
                          <span>
                            {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell size={32} className="tc-icon-muted mx-auto mb-2 opacity-60" />
            <p className="text-sm tc-text-muted">
              {activeTab === 'notifications' ? 'Yeni bildirim yok' : 'Yeni uyarı yok'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

