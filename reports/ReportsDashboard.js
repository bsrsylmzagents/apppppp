import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { createNewPdf, createTitle, savePdf, safeText } from '../../utils/pdfTemplate';
import { Button } from '@/components/ui/button';

const ReportsDashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/dashboard`);
      setReportData(response.data);
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) return;

    try {
      toast.info('PDF hazırlanıyor...');
      
      const doc = createNewPdf();
      let yPos = createTitle(doc, 'GENEL DASHBOARD RAPORU', {});
      
      // Bugünkü Özet
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Bugunku Ozet', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Toplam Rezervasyon: ${reportData.today.total_reservations}`, 20, yPos);
      yPos += 6;
      doc.text(`Toplam ATV: ${reportData.today.total_atvs}`, 20, yPos);
      yPos += 6;
      doc.text(`EUR: ${reportData.today.revenue.EUR?.toFixed(2) || '0.00'}`, 20, yPos);
      yPos += 6;
      doc.text(`USD: ${reportData.today.revenue.USD?.toFixed(2) || '0.00'}`, 20, yPos);
      yPos += 6;
      doc.text(`TRY: ${reportData.today.revenue.TRY?.toFixed(2) || '0.00'}`, 20, yPos);
      
      const filename = `genel-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      savePdf(doc, filename, 'Genel Dashboard Raporu');
      toast.success('PDF oluşturuldu');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  const COLORS = [
    'var(--primary-accent)',
    'rgb(16,185,129)',   // emerald-500
    'rgb(245,158,11)',   // amber-500
    'rgb(239,68,68)',    // red-500
    'rgb(139,92,246)',   // violet-500
    'rgb(236,72,153)'    // pink-500
  ];

  const dailyTrendData = reportData?.daily_trend ? reportData.daily_trend
    .slice(-7) // Son 7 gün
    .map((item) => {
      try {
        const dateObj = new Date(item.date);
        if (isNaN(dateObj.getTime())) {
          return null;
        }
        return {
          tarih: format(dateObj, 'dd.MM'),
          rezervasyon: item.reservations || 0,
          atv: item.atvs || 0
        };
      } catch (error) {
        console.error('Date format error:', error, item);
        return null;
      }
    })
    .filter(item => item !== null) : [];

  const tourTypeChartData = reportData?.top_tour_types ? reportData.top_tour_types
    .map((item) => ({
      name: item.tour_type_name || '-',
      value: item.count || 0
    })) : [];

  const pickupChartData = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-dashboard-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Genel Dashboard</h1>
        </div>
        <Button onClick={generatePDF} variant="outline" className="border-border text-foreground hover:bg-muted" title="PDF İndir">
          <Download size={18} />
        </Button>
      </div>

      {reportData && (
        <>
          {/* Bugünkü Özet */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-muted-foreground text-sm mb-2">Toplam Rezervasyon</div>
              <div className="text-3xl font-bold text-foreground">{reportData.today.total_reservations}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-muted-foreground text-sm mb-2">Toplam ATV</div>
              <div className="text-3xl font-bold text-foreground">{reportData.today.total_atvs}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-muted-foreground text-sm mb-2">EUR Gelir</div>
              <div className="text-2xl font-bold text-primary">{reportData.today.revenue.EUR?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-muted-foreground text-sm mb-2">USD/TRY Gelir</div>
              <div className="text-lg font-bold text-primary">
                {reportData.today.revenue.USD?.toFixed(2) || '0.00'} / {reportData.today.revenue.TRY?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Günlük Trend */}
          {dailyTrendData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Son 7 Günlük Trend</h2>
              <div className="space-y-3">
                {dailyTrendData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="text-foreground font-semibold">{item.tarih}</div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs mb-1">Rezervasyon</div>
                        <div className="text-primary font-bold">{item.rezervasyon}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs mb-1">ATV</div>
                        <div className="text-emerald-500 font-bold">{item.atv}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grafikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tourTypeChartData.length > 0 && (
              <div className="backdrop-blur-xl rounded-xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tur Tipi Dağılımı</h2>
                <div className="space-y-2">
                  {tourTypeChartData.map((entry, index) => {
                    const total = tourTypeChartData.reduce((sum, e) => sum + e.value, 0);
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{percent}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pickupChartData.length > 0 && (
              <div className="backdrop-blur-xl rounded-xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Pick-Up Nokta Dağılımı</h2>
                <div className="space-y-2">
                  {pickupChartData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsDashboard;


