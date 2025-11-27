import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';
import { Edit, Search, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CustomerDetailDialog from '../../components/CustomerDetailDialog';

const CariCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [cariAccounts, setCariAccounts] = useState([]);
  const [selectedCariId, setSelectedCariId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailDialogOpen, setCustomerDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchCariAccounts();
  }, []);

  useEffect(() => {
    if (selectedCariId) {
      fetchCustomers();
    } else {
      setCustomers([]);
    }
  }, [selectedCariId]);

  const fetchCariAccounts = async () => {
    try {
      const response = await axios.get(`${API}/cari-accounts`);
      // Münferit hariç cari hesapları filtrele
      const filtered = response.data.filter(c => !c.is_munferit && c.name !== "Münferit");
      setCariAccounts(filtered);
    } catch (error) {
      console.error('Cari hesaplar yüklenemedi');
    }
  };

  const fetchCustomers = async () => {
    try {
      const params = { cari_id: selectedCariId };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await axios.get(`${API}/cari-customers`, { params });
      setCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailDialogOpen(true);
  };

  const handleSaveCustomerDetails = async (details) => {
    if (!selectedCustomer) return;
    
    try {
      await axios.put(`${API}/cari-customers/${selectedCustomer.id}`, details);
      toast.success('Müşteri güncellendi');
      setCustomerDetailDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error('Müşteri güncellenemedi');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.customer_name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.nationality?.toLowerCase().includes(query) ||
      customer.id_number?.toLowerCase().includes(query)
    );
  });

  const buildWhatsAppLink = (phone) => {
    if (!phone) return null;
    const normalized = phone.replace(/[^0-9]/g, '');
    if (!normalized) return null;
    return `https://wa.me/${normalized}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cari Müşteriler</h1>
        <p className="text-[#A5A5A5]">Cari hesap müşterileri ve yönetimi</p>
      </div>

      {/* Filtreler */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2 text-white">Cari Firma Seçin</label>
          <select
            value={selectedCariId}
            onChange={(e) => setSelectedCariId(e.target.value)}
            className="w-full px-3 py-2 bg-[#2D2F33] border border-[#2D2F33] rounded-lg text-white focus:border-[#3EA6FF]"
          >
            <option value="">Cari firma seçin</option>
            {cariAccounts.map(cari => (
              <option key={cari.id} value={cari.id}>{cari.name}</option>
            ))}
          </select>
        </div>
        {selectedCariId && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A5A5A5] size-5" />
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-[#2D2F33] border border-[#2D2F33] rounded-lg text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#3EA6FF]"
            />
          </div>
        )}
      </div>

      {/* Müşteriler Tablosu - Desktop View */}
      {selectedCariId ? (
        <>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Müşteri Adı</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telefon</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uyruk</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">TC/Pasaport</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doğum Tarihi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Toplam Rezervasyon</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Son Rezervasyon</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{customer.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.phone ? (
                        <a
                          href={buildWhatsAppLink(customer.phone) || `tel:${customer.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4A7062] hover:underline"
                        >
                          {customer.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-[#4A7062] hover:underline"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{customer.nationality || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{customer.id_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.birth_date ? new Date(customer.birth_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{customer.total_reservations || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.last_reservation_date ? new Date(customer.last_reservation_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 hover:bg-[#3EA6FF]/20 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit size={18} className="text-[#3EA6FF]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Arama kriterlerinize uygun müşteri bulunamadı' 
                    : 'Bu cari firmaya ait müşteri bulunmamaktadır'}
                </p>
              </div>
            )}
          </div>
        </div>

          {/* Mobile Card View */}
          <div className="grid md:hidden gap-4 mt-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Arama kriterlerinize uygun müşteri bulunamadı' 
                  : 'Bu cari firmaya ait müşteri bulunmamaktadır'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;
              return (
              <div
                key={customer.id}
                className={`border rounded-2xl p-4 space-y-3 shadow-sm transition-colors ${
                  isSelected
                    ? 'bg-[#457259] border-[#457259] text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{customer.customer_name}</h3>
                    <div className="flex flex-col gap-1 text-sm">
                      {customer.phone && (
                        <a
                          href={buildWhatsAppLink(customer.phone) || `tel:${customer.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1 ${isSelected ? 'text-white' : 'text-[#4A7062]'}`}
                        >
                          <span>📞</span>
                          <span>{customer.phone}</span>
                        </a>
                      )}
                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className={`flex items-center gap-1 ${isSelected ? 'text-white' : 'text-[#4A7062]'}`}
                        >
                          <span>✉️</span>
                          <span>{customer.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(customer)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      isSelected ? 'bg-white/10 hover:bg-white/20 text-white' : 'hover:bg-[#4A7062]/10'
                    }`}
                    title="Düzenle"
                  >
                    <Edit size={18} className={isSelected ? 'text-white' : 'text-[#4A7062]'} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {customer.email && (
                    <div>
                      <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>Email</p>
                      <a
                        href={`mailto:${customer.email}`}
                        className={isSelected
                          ? 'text-white underline decoration-white/60 decoration-1 underline-offset-2'
                          : 'text-[#4A7062] underline decoration-[#4A7062]/40 decoration-1 underline-offset-2'}
                      >
                        {customer.email}
                      </a>
                    </div>
                  )}
                    {customer.nationality && (
                      <div>
                        <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>Uyruk</p>
                        <p className={isSelected ? 'text-white' : 'text-gray-700'}>{customer.nationality}</p>
                      </div>
                    )}
                    {customer.id_number && (
                      <div>
                        <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>TC/Pasaport</p>
                        <p className={isSelected ? 'text-white' : 'text-gray-700'}>{customer.id_number}</p>
                      </div>
                    )}
                    {customer.birth_date && (
                      <div>
                        <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>Doğum Tarihi</p>
                        <p className={isSelected ? 'text-white' : 'text-gray-700'}>
                          {new Date(customer.birth_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>Toplam Rezervasyon</p>
                      <p className={isSelected ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                        {customer.total_reservations || 0}
                      </p>
                    </div>
                  {customer.last_reservation_date && (
                    <div>
                      <p className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>Son Rezervasyon</p>
                      <p className={isSelected ? 'text-white' : 'text-gray-700'}>
                        {new Date(customer.last_reservation_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )})
          )}
          </div>
        </>
      ) : (
        <div className="bg-[#25272A] backdrop-blur-xl border border-[#2D2F33] rounded-lg p-6">
          <p className="text-[#A5A5A5] text-center py-8">
            Lütfen bir cari firma seçin
          </p>
        </div>
      )}

      {/* Müşteri Detay Dialog */}
      {selectedCustomer && (
        <CustomerDetailDialog
          open={customerDetailDialogOpen}
          onOpenChange={(open) => {
            setCustomerDetailDialogOpen(open);
            if (!open) {
              setSelectedCustomer(null);
            }
          }}
          customerName={selectedCustomer.customer_name}
          initialData={selectedCustomer}
          onSave={handleSaveCustomerDetails}
        />
      )}
    </div>
  );
};

export default CariCustomers;

