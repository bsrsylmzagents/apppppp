import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API } from '../App';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Users, CarFront, AlertTriangle, CheckCircle2, Clock, User, Truck, GripVertical, MessageCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Operations = () => {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState({});
  const [staff, setStaff] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [savingGroupId, setSavingGroupId] = useState(null);

  const fetchDailyView = async (targetDate = date) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/operations/daily-view`, {
        params: { date: targetDate },
      });
      setGroups(response.data || []);
    } catch (error) {
      console.error('Operasyon görünümü yüklenemedi', error);
      toast.error(error.response?.data?.detail || 'Operasyon görünümü yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyView();
    fetchStaff();
    fetchVehicles();
    fetchRoles();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`, { params: { is_active: true } });
      setStaff(response.data || []);
    } catch (error) {
      console.error('Personeller yüklenemedi', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Araçlar yüklenemedi', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/staff-roles`);
      setRoles(response.data || []);
    } catch (error) {
      console.error('Roller yüklenemedi', error);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    fetchDailyView(newDate);
  };

  const toggleExpand = (key) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const stats = useMemo(() => {
    const totalPax = groups.reduce((sum, g) => sum + (g.totalPax || 0), 0);
    const totalVehicles = groups.reduce((sum, g) => sum + (g.totalVehicles || 0), 0);
    const unassigned = groups.filter(g => g.status === 'unassigned').length;
    return { totalPax, totalVehicles, unassigned };
  }, [groups]);

  const statsCards = useMemo(() => {
    return [
      {
        label: 'Toplam Pax',
        value: stats.totalPax || 0,
        icon: Users,
        color: 'from-orange-500 to-orange-400',
      },
      {
        label: 'Atanmamış Gruplar',
        value: stats.unassigned || 0,
        icon: AlertTriangle,
        color: 'from-red-500 to-red-400',
      },
      {
        label: 'Araç Sayısı',
        value: stats.totalVehicles || 0,
        icon: CarFront,
        color: 'from-emerald-500 to-emerald-400',
      },
    ];
  }, [stats]);

  const getStatusConfig = (group) => {
    if (group.status === 'full') {
      return {
        label: 'Tüm kaynaklar atandı',
        color: 'bg-emerald-500/15 text-emerald-300',
        border: 'border-l-4 border-emerald-400',
        icon: CheckCircle2,
      };
    }
    if (group.status === 'partial') {
      return {
        label: 'Kısmi atama',
        color: 'bg-amber-500/15 text-amber-300',
        border: 'border-l-4 border-amber-400',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Kaynak atanmamış',
      color: 'bg-red-500/15 text-red-300',
      border: 'border-l border-border',
      icon: AlertTriangle,
    };
  };

  const handleAssignResources = async (group, driverId, guideId, vehicleId, note) => {
    const reservationIds = (group.reservations || []).map(r => r.id);
    if (!reservationIds.length) {
      toast.error('Bu grup için atanacak rezervasyon bulunamadı');
      return;
    }

    if (!driverId && !guideId && !vehicleId) {
      toast.error('En az bir kaynak seçmelisiniz');
      return;
    }

    try {
      setSavingGroupId(`${group.time}-${group.tour_type_id}`);
      await axios.put(`${API}/operations/assign-resources`, {
        reservationIds,
        orderedReservationIds: reservationIds,
        driverId: driverId || null,
        guideId: guideId || null,
        vehicleId: vehicleId || null,
        note: note || null,
      });
      toast.success('Kaynak atamaları kaydedildi');
      fetchDailyView();
    } catch (error) {
      console.error('Kaynak ataması kaydedilemedi', error);
      toast.error(error.response?.data?.detail || 'Kaynak ataması kaydedilemedi');
    } finally {
      setSavingGroupId(null);
    }
  };

  const handlePrintManifest = async (reservationIds) => {
    if (!reservationIds.length) {
      toast.error('Yazdırılacak rezervasyon bulunamadı');
      return;
    }
    try {
      const response = await axios.post(
        `${API}/operations/manifesto`,
        { reservationIds },
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Manifesto oluşturulamadı', error);
      toast.error(error.response?.data?.detail || 'Manifesto oluşturulamadı');
    }
  };

  const handlePrintAll = () => {
    const allIds = groups.flatMap(g => (g.reservations || []).map(r => r.id));
    handlePrintManifest(allIds);
  };

  const handleWhatsApp = (group) => {
    const dateLabel = date || '';
    const timeLabel = group.time || '';
    const tourName = group.tourName || '';
    const driverName = group.assignedDriver?.name || '-';
    const totalPax = group.totalPax || 0;

    const lines = (group.reservations || []).map((r, idx) => {
      const hotel = r.pickup_location || r.cari_name || '-';
      const pax = r.person_count || 0;
      const name = r.customer_name || '';
      return `${idx + 1}. ${hotel} - ${pax} Kişi (${name})`;
    });

    const message = [
      `📅 *GÖREV EMRİ* - ${dateLabel} ${timeLabel}`,
      `🚜 Tur: ${tourName}`,
      `👤 Şoför: ${driverName}`,
      ``,
      `📋 *ALINIŞ LİSTESİ (Sıralı):*`,
      ...lines,
      ``,
      `📍 Toplam: ${totalPax} Kişi`,
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenMap = (group) => {
    const pickups = (group.reservations || [])
      .map((r) => r.pickup_maps_link || r.pickup_location)
      .filter(Boolean);

    if (!pickups.length) {
      toast.error('Bu grup için kayıtlı pickup lokasyonu bulunamadı');
      return;
    }

    // Google Maps yönlendirme linki ile harita görünümü aç
    const base = 'https://www.google.com/maps/dir/';
    const path = pickups.map(encodeURIComponent).join('/');
    window.open(`${base}${path}`, '_blank');
  };

  return (
    <div className="space-y-6" data-testid="operations-page">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center">Operasyon</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="hidden md:block w-32" />
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <CalendarIcon className="w-5 h-5 text-orange-300" />
              <div className="flex flex-col">
                <span className="text-xs text-white/60 text-center md:text-left">Tarih Seç</span>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="bg-transparent border-0 text-sm text-white focus:outline-none focus:ring-0 text-center md:text-left"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center md:justify-end gap-2">
            <button
              type="button"
              onClick={handlePrintAll}
              className="inline-flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-semibold shadow-md hover:from-orange-500 hover:to-orange-400 transition-colors"
            >
              Manifestoları Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900 border border-white/10 p-4 flex items-center gap-4"
            >
              <div className={`absolute inset-0 opacity-40 bg-gradient-to-tr ${card.color}`} />
              <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-black/30 border border-white/10">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-white/70">{card.label}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Groups Accordion */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-400" />
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground text-lg mb-1">Bu tarih için rezervasyon bulunamadı</p>
            <p className="text-sm text-muted-foreground">
              Farklı bir tarih seçerek veya yeni rezervasyon oluşturarak operasyon planını başlatabilirsiniz.
            </p>
          </div>
        )}

        {groups.map((group) => {
          const key = `${group.time}-${group.tour_type_id}`;
          const statusCfg = getStatusConfig(group);
          const StatusIcon = statusCfg.icon;
          const timeLabel = group.time || '00:00';
          const subtitle = `${group.reservations.length} rezervasyon • ${group.totalPax} pax`;
          const driverName = group.assignedDriver?.name || 'Şoför atanmadı';
          const guideName = group.assignedGuide?.name || 'Rehber atanmadı';
          const vehiclePlate = group.assignedVehicle?.plate || 'Araç atanmadı';

          return (
            <div
              key={key}
              className={`rounded-2xl bg-card border border-border ${statusCfg.border} overflow-hidden`}
            >
              {/* Card Header */}
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-400 text-white font-semibold">
                    {timeLabel}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {group.tourName}
                    </p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusCfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {driverName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {guideName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {vehiclePlate}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(group);
                      }}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white hover:bg-green-400"
                      title="WhatsApp ile Gönder"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMap(group);
                      }}
                      className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-white/10 text-white text-[10px] hover:bg-white/20"
                    >
                      Haritada Gör
                    </button>
                  </div>
                </div>
              </button>

              {/* Card Body */}
              {expandedKeys[key] && (
                <div className="px-4 pb-4 pt-1 space-y-4">
                  {/* Reservations list */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;
                        const sourceIdx = result.source.index;
                        const destIdx = result.destination.index;
                        if (sourceIdx === destIdx) return;
                        setGroups((prev) =>
                          prev.map((g) => {
                            if (`${g.time}-${g.tour_type_id}` !== key) return g;
                            const items = Array.from(g.reservations || []);
                            const [moved] = items.splice(sourceIdx, 1);
                            items.splice(destIdx, 0, moved);
                            return { ...g, reservations: items };
                          })
                        );
                      }}
                    >
                      <Droppable droppableId={key}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            <div className="hidden md:block">
                              <table className="w-full text-sm">
                                <thead className="bg-muted text-xs text-muted-foreground">
                                  <tr>
                                    <th className="px-3 py-2 text-left w-8"></th>
                                    <th className="px-3 py-2 text-left">No</th>
                                    <th className="px-3 py-2 text-left">Müşteri</th>
                                    <th className="px-3 py-2 text-left">Pax</th>
                                    <th className="px-3 py-2 text-left">Pickup / Otel</th>
                                    <th className="px-3 py-2 text-left">Not</th>
                                    <th className="px-3 py-2 text-left">Ödeme</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {group.reservations.map((r, idx) => (
                                    <Draggable key={r.id} draggableId={r.id} index={idx}>
                                      {(dragProvided) => (
                                        <tr
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          className="hover:bg-muted/60"
                                        >
                                          <td className="px-3 py-2 text-xs text-muted-foreground" {...dragProvided.dragHandleProps}>
                                            <GripVertical className="w-3 h-3" />
                                          </td>
                                          <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                                          <td className="px-3 py-2 text-sm text-foreground">{r.customer_name}</td>
                                          <td className="px-3 py-2 text-sm text-foreground">{r.person_count}</td>
                                          <td className="px-3 py-2 text-sm text-foreground">{r.pickup_location || '-'}</td>
                                          <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes || '-'}</td>
                                          <td className="px-3 py-2 text-xs text-foreground">
                                            {r.has_payment ? 'Ödendi' : 'Ödeme Yok'}
                                          </td>
                                        </tr>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile cards with drag handle */}
                            <div className="md:hidden divide-y divide-border">
                              {group.reservations.map((r, idx) => (
                                <Draggable key={r.id} draggableId={`${r.id}-m`} index={idx}>
                                  {(dragProvided) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      className="p-3"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                                        <span
                                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground"
                                          {...dragProvided.dragHandleProps}
                                        >
                                          <GripVertical className="w-3 h-3 inline-block mr-1" />
                                          {r.person_count} pax
                                        </span>
                                      </div>
                                      <p className="text-sm font-semibold text-foreground">{r.customer_name}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Pickup: {r.pickup_location || '-'}
                                      </p>
                                      {r.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Not: {r.notes}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Ödeme: {r.has_payment ? 'Ödendi' : 'Ödeme Yok'}
                                      </p>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>

                  {/* Action bar */}
                  <GroupActionBar
                    group={group}
                    staff={staff}
                    vehicles={vehicles}
                    roles={roles}
                    onSave={handleAssignResources}
                    onPrint={handlePrintManifest}
                    saving={savingGroupId === key}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GroupActionBar = ({ group, staff, vehicles, roles, onSave, onPrint, saving }) => {
  const [driverId, setDriverId] = useState(group.assignedDriver?.id || '');
  const [guideId, setGuideId] = useState(group.assignedGuide?.id || '');
  const [vehicleId, setVehicleId] = useState(group.assignedVehicle?.id || '');
  const [note, setNote] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [guideSearch, setGuideSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  const reservationIds = (group.reservations || []).map(r => r.id);

  // Rol bazlı filtre: Şoför / Rehber
  const driverRoleIds = useMemo(
    () => roles.filter(r => /şoför/i.test(r.name || '')).map(r => r.id),
    [roles]
  );
  const guideRoleIds = useMemo(
    () => roles.filter(r => /rehber/i.test(r.name || '')).map(r => r.id),
    [roles]
  );

  const driverOptions = useMemo(
    () =>
      staff
        .filter((s) => s.is_active !== false)
        .filter((s) => !driverRoleIds.length || driverRoleIds.includes(s.role_id))
        .filter((s) =>
          (s.full_name || '').toLowerCase().includes(driverSearch.toLowerCase())
        ),
    [staff, driverRoleIds, driverSearch]
  );

  const guideOptions = useMemo(
    () =>
      staff
        .filter((s) => s.is_active !== false)
        .filter((s) => !guideRoleIds.length || guideRoleIds.includes(s.role_id))
        .filter((s) =>
          (s.full_name || '').toLowerCase().includes(guideSearch.toLowerCase())
        ),
    [staff, guideRoleIds, guideSearch]
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.filter((v) => {
        const label = `${v.plate_number || ''} ${v.brand || ''} ${v.model || ''}`
          .trim()
          .toLowerCase();
        return label.includes(vehicleSearch.toLowerCase());
      }),
    [vehicles, vehicleSearch]
  );

  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-end justify-between">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Şoför</label>
          <input
            type="text"
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            placeholder="İsim ile ara..."
            className="w-full mb-1 px-2 py-1 bg-input border border-border rounded-lg text-foreground text-xs focus:border-primary focus:outline-none"
          />
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Seçilmedi</option>
            {driverOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Rehber</label>
          <input
            type="text"
            value={guideSearch}
            onChange={(e) => setGuideSearch(e.target.value)}
            placeholder="İsim ile ara..."
            className="w-full mb-1 px-2 py-1 bg-input border border-border rounded-lg text-foreground text-xs focus:border-primary focus:outline-none"
          />
          <select
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Seçilmedi</option>
            {guideOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Araç</label>
          <input
            type="text"
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            placeholder="Plaka / marka ile ara..."
            className="w-full mb-1 px-2 py-1 bg-input border border-border rounded-lg text-foreground text-xs focus:border-primary focus:outline-none"
          />
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Seçilmedi</option>
            {vehicleOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} {v.brand ? `- ${v.brand}` : ''} {v.model ? ` ${v.model}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Operasyon notu (opsiyonel)"
          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none"
        />
        <div className="flex gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => onSave(group, driverId, guideId, vehicleId, note)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-semibold hover:from-orange-500 hover:to-orange-400 transition-colors"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet & Ata'}
          </button>
          <button
            type="button"
            onClick={() => onPrint(reservationIds)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Manifesto Yazdır
          </button>
        </div>
      </div>
    </div>
  );
};

export default Operations;

