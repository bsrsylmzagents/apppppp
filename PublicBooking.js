import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Calendar, Users, Mail, Phone, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PublicBooking = () => {
  const { agencySlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agency, setAgency] = useState(null);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    pax: 1,
    customerName: '',
    email: '',
    phone: '',
    note: ''
  });

  useEffect(() => {
    fetchAgencyTours();
  }, [agencySlug]);

  const fetchAgencyTours = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/public/agency/${agencySlug}/tours`);
      setAgency(response.data.agency);
      setTours(response.data.tours || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
      if (error.response?.status === 404) {
        toast.error('Acenta bulunamadı');
      } else {
        toast.error('Turlar yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTourClick = (tour) => {
    setSelectedTour(tour);
    setBookingForm({
      ...bookingForm,
      date: '',
      pax: 1
    });
    setBookingDialogOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedTour) return;
    
    // Validation
    if (!bookingForm.date) {
      toast.error('Lütfen tarih seçin');
      return;
    }
    
    if (bookingForm.pax < 1) {
      toast.error('Kişi sayısı en az 1 olmalıdır');
      return;
    }
    
    if (!bookingForm.customerName.trim()) {
      toast.error('Lütfen adınızı girin');
      return;
    }
    
    if (!bookingForm.email.trim()) {
      toast.error('Lütfen e-posta adresinizi girin');
      return;
    }
    
    if (!bookingForm.phone.trim()) {
      toast.error('Lütfen telefon numaranızı girin');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/public/booking`, {
        tourId: selectedTour.id,
        date: bookingForm.date,
        pax: bookingForm.pax,
        customerName: bookingForm.customerName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        note: bookingForm.note
      });
      
      toast.success('Rezervasyon talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
      setBookingDialogOpen(false);
      setBookingForm({
        date: '',
        pax: 1,
        customerName: '',
        email: '',
        phone: '',
        note: ''
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      if (error.response?.status === 429) {
        toast.error('Çok fazla istek gönderdiniz. Lütfen bir süre sonra tekrar deneyin.');
      } else {
        toast.error(error.response?.data?.detail || 'Rezervasyon talebi gönderilirken bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground mb-2">Acenta Bulunamadı</p>
          <p className="text-muted-foreground">Bu acenta aktif değil veya mevcut değil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-8 mb-8 border border-border">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {agency.logo_url && (
              <img 
                src={agency.logo_url} 
                alt={agency.name}
                className="h-20 w-20 object-contain rounded-lg"
              />
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {agency.name}
              </h1>
              {agency.contact_phone && (
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <Phone className="h-4 w-4" />
                  {agency.contact_phone}
                </p>
              )}
              {agency.contact_email && (
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {agency.contact_email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Mevcut Turlar
          </h2>
          
          {tours.length === 0 ? (
            <div className="bg-card rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-12 text-center border border-border">
              <p className="text-muted-foreground">Henüz tur bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="bg-card rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6 hover:shadow-lg transition-shadow cursor-pointer border border-border"
                  onClick={() => handleTourClick(tour)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      {tour.name}
                    </h3>
                    {tour.color && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tour.color }}
                      />
                    )}
                  </div>
                  
                  {tour.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {tour.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{tour.duration_hours} saat</span>
                    </div>
                  </div>
                  
                  {tour.default_price && tour.default_price > 0 && (
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary">
                        {tour.default_price.toFixed(2)} {tour.default_currency}
                      </p>
                      <p className="text-xs text-muted-foreground">ATV başına</p>
                    </div>
                  )}
                  
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTourClick(tour);
                    }}
                  >
                    Rezervasyon Yap
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Rezervasyon Talebi
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedTour?.name} için rezervasyon talebinizi gönderin
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitBooking} className="space-y-6 mt-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground">
                  Tarih <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="bg-input border border-border text-foreground"
                  required
                />
              </div>

              {/* Pax */}
              <div className="space-y-2">
                <Label htmlFor="pax" className="text-foreground">
                  Kişi Sayısı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pax"
                  type="number"
                  min="1"
                  value={bookingForm.pax}
                  onChange={(e) => setBookingForm({ ...bookingForm, pax: parseInt(e.target.value) || 1 })}
                  className="bg-input border border-border text-foreground"
                  required
                />
              </div>

              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-foreground">
                  Ad Soyad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  className="bg-input border border-border text-foreground"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  E-posta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  className="bg-input border border-border text-foreground"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Telefon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="bg-input border border-border text-foreground"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="text-foreground">
                  Notlar (Opsiyonel)
                </Label>
                <Textarea
                  id="note"
                  value={bookingForm.note}
                  onChange={(e) => setBookingForm({ ...bookingForm, note: e.target.value })}
                  className="bg-input border border-border text-foreground"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingDialogOpen(false)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Rezervasyon Talebi Gönder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PublicBooking;





