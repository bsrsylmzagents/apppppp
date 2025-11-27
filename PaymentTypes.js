import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, CreditCard, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import useConfirmDialog from '../hooks/useConfirmDialog';

const PaymentTypes = () => {
  const { confirm, dialog } = useConfirmDialog();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState(null);
  const [formData, setFormData] = useState({
    is_active: true
  });

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/payment-types?active_only=false`);
      setPaymentTypes(response.data);
    } catch (error) {
      toast.error('Ödeme tipleri yüklenemedi');
      console.error('Error fetching payment types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/payment-types/${editingPaymentType.id}`, {
        is_active: formData.is_active
      });
      toast.success('Ödeme tipi güncellendi');
      setDialogOpen(false);
      resetForm();
      fetchPaymentTypes();
    } catch (error) {
      toast.error('Ödeme tipi güncellenemedi');
      console.error('Error updating payment type:', error);
    }
  };


  const handleEdit = (paymentType) => {
    setEditingPaymentType(paymentType);
    setFormData({
      is_active: paymentType.is_active !== undefined ? paymentType.is_active : true
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      is_active: true
    });
    setEditingPaymentType(null);
  };

  const handleDialogClose = (open) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payment-types-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ödeme Tipleri</h1>
          <p className="text-muted-foreground">Ödeme yöntemlerini yönetin (Sadece aktif/pasif durumu değiştirilebilir)</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                await axios.post(`${API}/payment-types/initialize-defaults`);
                toast.success('Default ödeme tipleri oluşturuldu');
                fetchPaymentTypes();
              } catch (error) {
                toast.error('Default ödeme tipleri oluşturulamadı');
                console.error('Error initializing default payment types:', error);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-primary-foreground"
          >
            <RefreshCw size={20} className="mr-2" />
            Default Tipleri Oluştur
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (!editingPaymentType) {
                  toast.info('Sadece mevcut ödeme tiplerini düzenleyebilirsiniz');
                  return;
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!editingPaymentType}
            >
              <Edit size={20} className="mr-2" />
              Düzenle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingPaymentType ? 'Ödeme Tipi Düzenle' : 'Yeni Ödeme Tipi'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {editingPaymentType && (
                <>
                  <div className="bg-card rounded-lg p-4 mb-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Ödeme Tipi</p>
                    <p className="text-foreground font-semibold">{editingPaymentType.name}</p>
                    {editingPaymentType.code && (
                      <p className="text-xs text-muted-foreground mt-1">Kod: {editingPaymentType.code}</p>
                    )}
                    {editingPaymentType.description && (
                      <p className="text-sm text-muted-foreground mt-2">{editingPaymentType.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary"
                    />
                    <label htmlFor="is_active" className="text-sm text-white">
                      Aktif
                    </label>
                  </div>
                </>
              )}

              {editingPaymentType && (
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    className="flex-1 border-border text-muted-foreground hover:bg-muted"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Güncelle
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {paymentTypes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CreditCard size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Henüz ödeme tipi eklenmemiş</p>
          <p className="text-muted-foreground text-sm">Yeni ödeme tipi eklemek için yukarıdaki butonu kullanın</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Ödeme Tipi Adı</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Kod</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Açıklama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Durum</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentTypes.map((paymentType) => (
                  <tr key={paymentType.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-foreground font-medium">{paymentType.name}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{paymentType.code || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{paymentType.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        paymentType.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {paymentType.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(paymentType)}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit size={18} className="text-primary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
};

export default PaymentTypes;

