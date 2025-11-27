import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../../App';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, DollarSign, FileText } from 'lucide-react';

const CariDetailView = () => {
  const [cari, setCari] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({ balance_eur: 0, balance_usd: 0, balance_try: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // general | reservations | statement
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('cari_token');
    const cariData = JSON.parse(localStorage.getItem('cari') || '{}');

    if (!token || !cariData.id) {
      navigate('/cari/login', { replace: true });
      return;
    }

    setCari(cariData);
    fetchReservations();
    fetchTransactions();
  }, [navigate]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('cari_token');
      const response = await axios.get(`${API}/cari/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error('Fetch reservations error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('cari_token');
        localStorage.removeItem('cari');
        navigate('/cari/login', { replace: true });
      } else {
        toast.error('Rezervasyonlar yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('cari_token');
      const response = await axios.get(`${API}/cari/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
      setBalances({
        balance_eur: response.data.balance_eur || 0,
        balance_usd: response.data.balance_usd || 0,
        balance_try: response.data.balance_try || 0
      });
    } catch (error) {
      console.error('Fetch transactions error:', error);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  if (loading && !cari) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-sm text-orange-100/70">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 print:bg-white"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom right, rgba(0,0,0,0.15), transparent)',
        backgroundSize: '24px 24px, 24px 24px, 100% 100%'
      }}
    >
      {/* Header / Brand Strip */}
      <div className="bg-gradient-to-r from-orange-600/95 to-orange-500/95 shadow-lg border-b border-orange-400/40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-100/80">
              B2B Panel
            </p>
            {cari && (
              <>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white">
                  {cari.display_name}
                </h1>
                <p className="text-xs md:text-sm mt-1 text-orange-100/90">
                  Cari Kodu:{' '}
                  <span className="font-semibold tracking-wide">
                    {cari.cari_code}
                  </span>
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              to="/cari/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={16} />
              Panele Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="rounded-xl bg-white/95 shadow-lg border border-orange-100">
          <nav className="flex gap-4 overflow-x-auto px-4 pt-4 border-b border-orange-100/60 text-[15px]">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Genel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reservations')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reservations'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Rezervasyonlar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'statement'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Ekstre
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'services'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Hizmetler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('purchased_services')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'purchased_services'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Alınan Hizmetler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Tahsilatlar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outgoing_payments')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'outgoing_payments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent'
              }`}
              style={{ color: 'rgb(15 23 42)' }}
            >
              Ödemeler
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-6 bg-white shadow-md border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Toplam Rezervasyon</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900">
                    {reservations.length}
                  </p>
                </div>
                <Calendar size={32} className="text-orange-500" />
              </div>
            </div>
            <div className="rounded-xl p-6 bg-white shadow-md border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">EUR Bakiye</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900">
                    {balances.balance_eur.toFixed(2)} EUR
                  </p>
                </div>
                <DollarSign size={32} className="text-orange-500" />
              </div>
            </div>
            <div className="rounded-xl p-6 bg-white shadow-md border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">TRY Bakiye</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900">
                    {balances.balance_try.toFixed(2)} TRY
                  </p>
                </div>
                <DollarSign size={32} className="text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60">
              <h2 className="text-xl font-bold text-slate-900">
                Rezervasyonlarım (Salt Okunur)
              </h2>
            </div>
            <div className="p-6">
              {reservations.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz rezervasyon yok</p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-4 rounded-lg border border-orange-100/60 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {reservation.customer_name}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm text-slate-700">
                            <div>
                              <span className="font-medium">Tarih:</span> {reservation.date}
                            </div>
                            <div>
                              <span className="font-medium">Saat:</span> {reservation.time}
                            </div>
                            <div>
                              <span className="font-medium">Tur:</span> {reservation.tour_type_name || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Tutar:</span> {reservation.price} {reservation.currency}
                            </div>
                          </div>
                          {reservation.notes && (
                            <p className="mt-2 text-sm text-slate-500">
                              {reservation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Ekstre (Salt Okunur)
              </h2>
              <button
                type="button"
                onClick={handlePrintStatement}
                className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
              >
                <FileText size={18} />
                Ekstreyi PDF Al
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg p-4 bg-orange-50 border border-orange-100">
                  <p className="text-sm text-slate-600">EUR Bakiye</p>
                  <p className="text-xl font-bold mt-1 text-slate-900">
                    {balances.balance_eur.toFixed(2)} EUR
                  </p>
                </div>
                <div className="rounded-lg p-4 bg-orange-50 border border-orange-100">
                  <p className="text-sm text-slate-600">USD Bakiye</p>
                  <p className="text-xl font-bold mt-1 text-slate-900">
                    {balances.balance_usd.toFixed(2)} USD
                  </p>
                </div>
                <div className="rounded-lg p-4 bg-orange-50 border border-orange-100">
                  <p className="text-sm text-slate-600">TRY Bakiye</p>
                  <p className="text-xl font-bold mt-1 text-slate-900">
                    {balances.balance_try.toFixed(2)} TRY
                  </p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz işlem yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-orange-100/60">
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tarih
                        </th>
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tip
                        </th>
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Açıklama
                        </th>
                        <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tutar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-orange-50 hover:bg-orange-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-xs md:text-sm text-slate-600">
                            {transaction.date} {transaction.time || ''}
                          </td>
                          <td className="py-3 px-4 text-xs md:text-sm text-slate-700">
                            {transaction.transaction_type}
                          </td>
                          <td className="py-3 px-4 text-xs md:text-sm text-slate-800">
                            {transaction.description}
                          </td>
                          <td className="py-3 px-4 text-right text-xs md:text-sm font-semibold text-slate-900">
                            {transaction.amount.toFixed(2)} {transaction.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tahsilatlar - sadece ödeme/credit hareketleri, salt okunur */}
        {activeTab === 'payments' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Tahsilatlar (Salt Okunur)
              </h2>
            </div>
            <div className="p-6">
              {transactions.filter(t => t.transaction_type === 'payment' || t.transaction_type === 'credit').length === 0 ? (
                <p className="text-sm text-slate-500">Henüz tahsilat kaydı yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-100/60">
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tarih
                        </th>
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Açıklama
                        </th>
                        <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tutar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter(t => t.transaction_type === 'payment' || t.transaction_type === 'credit')
                        .map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-orange-50 hover:bg-orange-50/60 transition-colors"
                          >
                            <td className="py-3 px-4 text-xs md:text-sm text-slate-600">
                              {transaction.date} {transaction.time || ''}
                            </td>
                            <td className="py-3 px-4 text-xs md:text-sm text-slate-800">
                              {transaction.description}
                            </td>
                            <td className="py-3 px-4 text-right text-xs md:text-sm font-semibold text-slate-900">
                              {transaction.amount.toFixed(2)} {transaction.currency}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ödemeler - borç / iade hareketleri, salt okunur */}
        {activeTab === 'outgoing_payments' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Ödemeler (Salt Okunur)
              </h2>
            </div>
            <div className="p-6">
              {transactions.filter(t => t.transaction_type === 'debit' || t.transaction_type === 'refund').length === 0 ? (
                <p className="text-sm text-slate-500">Henüz ödeme kaydı yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-100/60">
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tarih
                        </th>
                        <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Açıklama
                        </th>
                        <th className="text-right py-3 px-4 text-xs md:text-sm font-semibold text-slate-600">
                          Tutar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter(t => t.transaction_type === 'debit' || t.transaction_type === 'refund')
                        .map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-orange-50 hover:bg-orange-50/60 transition-colors"
                          >
                            <td className="py-3 px-4 text-xs md:text-sm text-slate-600">
                              {transaction.date} {transaction.time || ''}
                            </td>
                            <td className="py-3 px-4 text-xs md:text-sm text-slate-800">
                              {transaction.description}
                            </td>
                            <td className="py-3 px-4 text-right text-xs md:text-sm font-semibold text-slate-900">
                              {transaction.amount.toFixed(2)} {transaction.currency}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hizmetler & Alınan Hizmetler - bilgi amaçlı placeholder, salt okunur */}
        {activeTab === 'services' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Hizmetler
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Satın aldığınız hizmetlerin detayları için acentanızın Hizmetler bölümünü kullanabilirsiniz. Bu alan bilgi amaçlıdır ve B2B panelinden değiştirilemez.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'purchased_services' && (
          <div className="rounded-xl bg-white shadow-md border border-orange-100">
            <div className="p-6 border-b border-orange-100/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Alınan Hizmetler
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Alınan hizmetlerin ekstre ve rezervasyon detaylarındaki yansımalarını üstteki sekmelerden takip edebilirsiniz. Bu alan B2B panelinde salt okunurdur.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CariDetailView;


