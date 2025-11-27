import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import { RefreshCcw } from 'lucide-react';
const CurrencyConverter = () => {
  const [rates, setRates] = useState({ EUR: 35.0, USD: 34.0, TRY: 1.0 });
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [showConverter, setShowConverter] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Her dakika güncelle (manuel güncellemeleri yakalamak için)
    
    // Sayfa focus olduğunda kurları yeniden yükle
    const handleFocus = () => {
      fetchRates();
    };
    
    // Manuel kur güncellemesi event'ini dinle
    const handleCurrencyRatesUpdated = (event) => {
      if (event.detail?.type === 'header') {
        fetchRates();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('currencyRatesUpdated', handleCurrencyRatesUpdated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('currencyRatesUpdated', handleCurrencyRatesUpdated);
    };
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowConverter(false);
      }
    };

    if (showConverter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConverter]);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/currency/rates/header`);
      // Backend'den gelen kurlar TRY bazlı: { EUR: 35.0, USD: 34.0, TRY: 1.0 }
      setRates(response.data.rates || { EUR: 35.0, USD: 34.0, TRY: 1.0 });
    } catch (error) {
      console.error('Döviz kurları alınamadı:', error);
    }
  };

  const convert = (amount, from) => {
    // Tüm dövizler TRY karşılığı olarak tutuluyor
    const amountInTry = amount * rates[from]; // from'dan TRY'ye çevir
    
    return {
      EUR: (amountInTry / rates.EUR).toFixed(2),  // TRY'den EUR'ye
      USD: (amountInTry / rates.USD).toFixed(2),  // TRY'den USD'ye
      TRY: amountInTry.toFixed(2)  // TRY'den TRY'ye (aynı)
    };
  };

  const converted = amount ? convert(parseFloat(amount), selectedCurrency) : { EUR: '0.00', USD: '0.00', TRY: '0.00' };

  return (
    <div className="relative z-[10001]" ref={dropdownRef}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowConverter(!showConverter)}
          className="px-3 py-2 md:px-4 md:py-2.5 rounded-full border border-primary bg-card/10 hover:bg-card/20 text-primary flex items-center gap-2 md:gap-3 btn-hover"
          data-testid="currency-converter-toggle"
          title="Döviz Çevirici"
          >
          <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-primary/30 bg-card/10">
            <RefreshCcw size={18} className="text-primary" />
          </span>
          <span className="hidden md:inline text-sm font-semibold opacity-95">Döviz</span>
        </button>
        {/* Currency Rates - Compact pill badges */}
        <div className="hidden md:flex items-center gap-3 text-sm text-primary">
          <div className="px-3 py-1.5 rounded-full bg-white/70">
            <span className="font-semibold">1 EUR</span> = {rates.EUR.toFixed(2)} TRY
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/70">
            <span className="font-semibold">1 USD</span> = {rates.USD.toFixed(2)} TRY
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {showConverter && (
        <div 
          className="absolute left-0 top-full mt-2 w-80 rounded-2xl shadow-2xl p-4 z-[10002] bg-[var(--card)] border border-[hsl(var(--border))] card-hover"
          data-testid="currency-converter-panel"
        >
          <h3 className="text-lg font-bold mb-1 tc-text-heading">Döviz Çevirici</h3>
          
          {/* Quick Rates Display */}
          <div className="mb-4 pb-4 border-b border-[hsl(var(--border))]/60">
            <p className="text-xs mb-2 tc-text-muted">Güncel Kurlar</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="tc-text-muted">1 EUR =</span>
                <span className="font-semibold tc-text-heading">{rates.EUR.toFixed(4)} TRY</span>
              </div>
              <div className="flex justify-between">
                <span className="tc-text-muted">1 USD =</span>
                <span className="font-semibold tc-text-heading">{rates.USD.toFixed(4)} TRY</span>
              </div>
              <div className="flex justify-between">
                <span className="tc-text-muted">1 EUR =</span>
                <span className="font-semibold tc-text-heading">{(rates.EUR / rates.USD).toFixed(4)} USD</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mt-3">
            <div>
              <label className="block text-sm mb-2 tc-text-muted">Miktar</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Miktar girin"
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border)] text-[var(--color-text-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:border-[hsl(var(--primary))] transition-colors"
                data-testid="currency-amount-input"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 tc-text-muted">Para Birimi</label>
              <div className="flex gap-2">
                {['EUR', 'USD', 'TRY'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors border ${
                      selectedCurrency === curr
                        ? 'bg-[hsl(var(--primary))] text-[rgb(var(--primary-foreground))] border-[hsl(var(--primary))]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-body)] border-[var(--color-border)] hover:bg-[var(--color-input-bg)]'
                    } btn-hover`}
                    data-testid={`currency-select-${curr.toLowerCase()}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {amount && (
              <div className="pt-4 border-t border-[hsl(var(--border))]/60">
                <p className="text-xs mb-2 tc-text-muted">Çevrilmiş Tutarlar</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tc-text-muted">EUR</span>
                    <span className="font-semibold tc-text-heading" data-testid="converted-eur">{converted.EUR}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tc-text-muted">USD</span>
                    <span className="font-semibold tc-text-heading" data-testid="converted-usd">{converted.USD}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tc-text-muted">TRY</span>
                    <span className="font-semibold tc-text-heading" data-testid="converted-try">{converted.TRY}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;