import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, RefreshCw, Search, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }
      // Use new super-admin endpoint
      const response = await axios.get(`${API}/super-admin/companies`, { params });
      console.log('Customers response:', response.data);
      const customersData = response.data || [];
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      if (customersData.length === 0) {
        console.warn('No customers found. Make sure you are logged in as super admin');
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 403) {
        toast.error('Bu sayfaya erişim yetkiniz yok. Super admin olarak giriş yapmalısınız.');
        navigate('/');
      } else if (error.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın');
        navigate('/login');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Backend bağlantısı yapılamadı! Backend\'in çalıştığından emin olun.');
      } else {
        let errorMessage = 'Müşteriler yüklenemedi';
        const detail = error.response?.data?.detail;
        
        // Handle different error formats
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Pydantic validation errors - extract first error message
          const firstError = detail[0];
          errorMessage = typeof firstError === 'string' 
            ? firstError 
            : firstError?.msg || 'Müşteriler yüklenemedi';
        } else if (detail && typeof detail === 'object') {
          // If detail is an object, try to extract a message
          errorMessage = detail.msg || detail.message || 'Müşteriler yüklenemedi';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      }
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  useEffect(() => {
    let filtered = customers;

    // Arama filtresi
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => {
        const companyName = (customer.company_name || '').toLowerCase();
        const companyCode = (customer.company_code || '').toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const ownerUsername = (customer.owner?.username || '').toLowerCase();
        
        return companyName.includes(query) ||
               companyCode.includes(query) ||
               email.includes(query) ||
               ownerUsername.includes(query);
      });
    }

    // Tarih filtresi
    if (dateFrom) {
      filtered = filtered.filter(customer => customer.package_start_date && customer.package_start_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(customer => customer.package_start_date && customer.package_start_date <= dateTo);
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, customers, dateFrom, dateTo]);

  const handleViewCompany = async (customer) => {
    try {
      // Admin bilgilerini sakla
      const adminUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminCompany = JSON.parse(localStorage.getItem('company') || '{}');
      const adminToken = localStorage.getItem('token');
      
      // Admin bilgilerini sakla (geri dönmek için)
      sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
      sessionStorage.setItem('admin_company', JSON.stringify(adminCompany));
      sessionStorage.setItem('admin_token', adminToken);
      
      // Use new super-admin impersonate endpoint (no need to fetch owner separately)
      const loginResponse = await axios.post(`${API}/super-admin/impersonate/${customer.id}`, {}, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      // Yeni token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', loginResponse.data.access_token);
      localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
      localStorage.setItem('company', JSON.stringify(loginResponse.data.company));
      
      // Admin modunda olduğunu işaretle
      localStorage.setItem('is_admin_view', 'true');
      
      toast.success(`${customer.company_name} hesabı görüntüleniyor...`);
      
      // Dashboard'a yönlendir
      navigate('/');
    } catch (error) {
      console.error('View company error:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 404) {
        toast.error('Firma veya kullanıcı bulunamadı');
      } else if (error.response?.status === 403) {
        toast.error('Bu işlem için yetkiniz yok');
      } else if (error.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.detail || 'Firma hesabı görüntülenemedi');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Müşteriler</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Yenile</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/customers/new')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            <span>Yeni Müşteri</span>
          </button>
        </div>
      </div>

      <Card className="bg-card border border-border text-foreground">
        <CardHeader>
          <CardTitle className="text-foreground">Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Arama Alanı */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-grow min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <input
                type="text"
                placeholder="Firma ismi, Firma Kodu, Mail adresi veya Kullanıcı adı ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-card border border-border text-foreground">
                <SelectValue placeholder="Kalan Süre Filtresi" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif (90+ gün)</SelectItem>
                <SelectItem value="expiring_3_months">3 Ay İçinde Dolacak</SelectItem>
                <SelectItem value="expiring_1_month">1 Ay İçinde Dolacak</SelectItem>
                <SelectItem value="expired">Süresi Dolmuş</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Başlangıç Tarihi"
              className="form-input"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Bitiş Tarihi"
              className="form-input"
            />
          </div>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b border-border">Firma Kodu</TableHead>
                  <TableHead className="border-b border-border">Firma Adı</TableHead>
                  <TableHead className="border-b border-border">Paket Başlangıç</TableHead>
                  <TableHead className="border-b border-border">Paket Bitiş</TableHead>
                  <TableHead className="border-b border-border">Kalan Süre</TableHead>
                  <TableHead className="border-b border-border">Admin Kullanıcı</TableHead>
                  <TableHead className="border-b border-border">Email</TableHead>
                  <TableHead className="border-b border-border">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {customers.length === 0 ? 'Henüz müşteri bulunmuyor' : 'Arama sonucu bulunamadı'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const getRemainingDaysColor = (days, status) => {
                      if (status === 'expired' || days < 0) return 'text-red-400';
                      if (status === 'expiring_1_month' || days <= 30) return 'text-yellow-400';
                      if (status === 'expiring_3_months' || days <= 90) return 'tc-text-heading';
                      return 'text-green-400';
                    };

                    const remainingDays = customer.remaining_days !== undefined ? customer.remaining_days : 
                      (customer.package_end_date ? 
                        Math.ceil((new Date(customer.package_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 
                        null);
                    
                    const status = customer.status || 
                      (remainingDays === null ? 'unknown' :
                       remainingDays < 0 ? 'expired' :
                       remainingDays <= 30 ? 'expiring_1_month' :
                       remainingDays <= 90 ? 'expiring_3_months' : 'active');

                    return (
                      <TableRow key={customer.id || customer.company_code}>
                        <TableCell className="font-mono text-foreground">{customer.company_code}</TableCell>
                        <TableCell className="text-foreground">{customer.company_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.package_start_date ? new Date(customer.package_start_date).toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.package_end_date ? new Date(customer.package_end_date).toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell>
                          {remainingDays !== null ? (
                            <span className={`font-semibold ${getRemainingDaysColor(remainingDays, status)}`}>
                              {remainingDays > 0 ? `${remainingDays} gün` : 'Süresi dolmuş'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.admin?.username || customer.admin?.full_name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.contact_email || customer.admin?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewCompany(customer)}
                              className="btn btn-secondary"
                              title="Bu firma hesabına giriş yap (Impersonate)"
                            >
                              <LogIn size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/customers/${customer.id}`)}
                              className="btn btn-secondary"
                              title="Düzenle"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;

