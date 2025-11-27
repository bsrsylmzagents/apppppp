import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminNewCustomer = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    package_start_date: '',
    package_end_date: '',
    owner_username: '',
    admin_full_name: '',
    admin_password: '',
    address: '',
    tax_office: '',
    tax_number: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = {
      ...formData,
      admin_username: formData.owner_username,
      contact_phone: formData.phone,
    };

    try {
      const response = await axios.post(`${API}/auth/register`, submissionData);
      setCreatedCustomer(response.data);
      toast.success('Müşteri başarıyla oluşturuldu!');
      
      // 2 saniye sonra müşteriler listesine yönlendir
      setTimeout(() => {
        navigate('/admin/customers');
      }, 2000);
    } catch (error) {
      console.error('Create customer error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 403) {
        toast.error('Bu işlem için yetkiniz yok');
        navigate('/');
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Müşteri oluşturulamadı';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (createdCustomer) {
    return (
      <div className="space-y-6">
        <Card className="bg-[#25272A] border-[#2D2F33]">
          <CardHeader>
            <CardTitle className="text-white text-green-400">✓ Müşteri Başarıyla Oluşturuldu!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-[#2D2F33] p-4 rounded-lg space-y-3">
              <div>
                <label className="font-bold text-gray-400">Firma Kodu:</label>
                <p className="text-white font-mono text-lg">{createdCustomer.company.company_code}</p>
              </div>
              <div>
                <label className="font-bold text-gray-400">Firma Adı:</label>
                <p className="text-white">{createdCustomer.company.company_name}</p>
              </div>
              <div>
                <label className="font-bold text-gray-400">Adres:</label>
                <p className="text-white">{createdCustomer.company.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-400">Vergi Dairesi:</label>
                  <p className="text-white">{createdCustomer.company.tax_office}</p>
                </div>
                <div>
                  <label className="font-bold text-gray-400">Vergi Numarası:</label>
                  <p className="text-white">{createdCustomer.company.tax_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-400">Telefon:</label>
                  <p className="text-white">{createdCustomer.company.phone}</p>
                </div>
                <div>
                  <label className="font-bold text-gray-400">Email:</label>
                  <p className="text-white">{createdCustomer.company.email}</p>
                </div>
              </div>
              <div className="border-t border-[#2D2F33] pt-3 mt-3">
                <div>
                  <label className="font-bold text-gray-400">Kullanıcı Adı:</label>
                  <p className="text-white">{formData.owner_username}</p>
                </div>
                <div className="mt-2">
                  <label className="font-bold text-gray-400">Şifre:</label>
                  <p className="text-white font-mono bg-[#0a0e1a] p-2 rounded">{formData.admin_password}</p>
                  <p className="text-xs text-gray-500 mt-1">Bu şifreyi müşteriye iletiniz</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/customers')}
                className="btn btn-primary"
              >
                Müşteriler Listesine Dön
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedCustomer(null);
                  setFormData({
                    company_name: '',
                    package_start_date: '',
                    package_end_date: '',
                    owner_username: '',
                    admin_full_name: '',
                    admin_password: '',
                    address: '',
                    tax_office: '',
                    tax_number: '',
                    phone: '',
                    email: ''
                  });
                }}
              >
                Yeni Müşteri Ekle
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Yeni Müşteri Oluştur</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/admin/customers')}
        >
          Geri Dön
        </button>
      </div>

      <Card className="bg-[#0f1419]/80 border-[hsl(var(--primary))]/20">
        <CardHeader>
          <CardTitle className="text-white">Müşteri Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="company_name" className="font-bold">
                Firma Adı *
              </label>
              <input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="package_start_date" className="font-bold">
                  Paket Başlangıç Tarihi *
                </label>
                <input
                  id="package_start_date"
                  type="date"
                  value={formData.package_start_date}
                  onChange={(e) => setFormData({ ...formData, package_start_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="package_end_date" className="font-bold">
                  Paket Bitiş Tarihi *
                </label>
                <input
                  id="package_end_date"
                  type="date"
                  value={formData.package_end_date}
                  onChange={(e) => setFormData({ ...formData, package_end_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="owner_username" className="font-bold">
                Owner Kullanıcı Adı *
              </label>
              <input
                id="owner_username"
                value={formData.owner_username}
                onChange={(e) => setFormData({ ...formData, owner_username: e.target.value })}
                className="form-input"
                placeholder="Kullanıcı adı (şifre de aynı olacak)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu kullanıcı adı, yeni firmanın sahibi (admin) olacaktır.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="admin_full_name" className="font-bold">
                Ad Soyad *
              </label>
              <input
                id="admin_full_name"
                value={formData.admin_full_name}
                onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                className="form-input"
                placeholder="Sahip kullanıcının adı ve soyadı"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin_password" className="font-bold">
                Şifre *
              </label>
              <input
                id="admin_password"
                type="password"
                value={formData.admin_password}
                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                className="form-input"
                placeholder="Güçlü bir şifre belirleyin"
                required
              />
            </div>

            <div className="border-t border-[hsl(var(--primary))]/20 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Firma İletişim Bilgileri</h3>

              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="address" className="font-bold">
                    Adres *
                  </label>
                  <input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-input"
                    placeholder="Tam adres"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="tax_office" className="font-bold">
                      Vergi Dairesi *
                    </label>
                    <input
                      id="tax_office"
                      value={formData.tax_office}
                      onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                      className="form-input"
                      placeholder="Vergi dairesi adı"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tax_number" className="font-bold">
                      Vergi Numarası *
                    </label>
                    <input
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      className="form-input"
                      placeholder="Vergi numarası"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="phone" className="font-bold">
                      Telefon Numarası *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input"
                      placeholder="0XXX XXX XX XX"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="font-bold">
                      Email Adresi *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Oluşturuluyor...' : 'Müşteri Oluştur'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/customers')}
              >
                İptal
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewCustomer;


