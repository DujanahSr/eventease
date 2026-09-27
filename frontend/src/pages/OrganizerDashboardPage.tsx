import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { websocketService, CheckInNotification } from '../services/websocketService';
import { mediaService } from '../services/mediaService';
import { EventSummary, Category } from '../types';
import Swal from 'sweetalert2';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInNotification[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // State Buat Acara Baru (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    date: '',
    location: '',
    description: '',
    imageUrl: '',
    imageProvider: '',
  });

  const [ticketTiers, setTicketTiers] = useState<Array<{ name: string; price: number; capacity: number }>>([
    { name: 'Regular', price: 75000, capacity: 100 },
  ]);

  const fetchOrganizerEvents = async () => {
    setIsLoading(true);
    try {
      const [resEvents, resCats] = await Promise.all([
        eventService.getEvents('', '', 0, 10),
        eventService.getCategories(),
      ]);
      setEvents(resEvents.content || []);
      setCategories(resCats || []);
      if (resCats && resCats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: resCats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load organizer events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerEvents();

    // Inisialisasi koneksi WebSocket STOMP untuk real-time check-in
    websocketService.connect(() => {
      setIsWsConnected(true);
    });

    const unsubscribe = websocketService.subscribeToCheckIn((notification) => {
      setRecentCheckIns((prev) => [notification, ...prev.slice(0, 9)]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Batas maksimal ukuran poster adalah 5 MB.',
      });
      return;
    }

    setIsUploadingPoster(true);
    try {
      Swal.fire({
        title: 'Mengunggah Poster Acara...',
        text: 'Menyimpan berkas ke Cloud Storage (Cloudinary CDN)...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await mediaService.uploadImage(file, 'events');
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.url,
        imageProvider: res.provider,
      }));

      Swal.fire({
        icon: 'success',
        title: 'Poster Berhasil Diunggah!',
        text: `Tersimpan via ${res.provider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah Poster',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah poster acara.',
      });
    } finally {
      setIsUploadingPoster(false);
      if (posterInputRef.current) {
        posterInputRef.current.value = '';
      }
    }
  };

  const handleAddTier = () => {
    setTicketTiers((prev) => [...prev, { name: 'VIP', price: 150000, capacity: 50 }]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      Swal.fire({
        icon: 'info',
        title: 'Minimal 1 Kategori Tiket',
        text: 'Acara harus memiliki minimal 1 tier tiket.',
      });
      return;
    }
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: 'name' | 'price' | 'capacity', value: any) => {
    setTicketTiers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date.trim() || !formData.location.trim() || !formData.description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Harap isi semua kolom formulir acara.',
      });
      return;
    }

    if (!formData.categoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Kategori',
        text: 'Harap tentukan kategori acara.',
      });
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        imageUrl: formData.imageUrl || '/images/events/ai-cloud-summit.jpg',
        ticketTiers: ticketTiers.map((t) => ({
          name: t.name,
          price: Number(t.price),
          capacity: Number(t.capacity),
        })),
      };

      await eventService.createEvent(payload);

      Swal.fire({
        icon: 'success',
        title: 'Acara Berhasil Diterbitkan!',
        text: `Acara '${formData.name}' kini aktif dan tiket siap dipesan.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        date: '',
        location: '',
        description: '',
        imageUrl: '',
        imageProvider: '',
      });
      setTicketTiers([{ name: 'Regular', price: 75000, capacity: 100 }]);

      await fetchOrganizerEvents();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menerbitkan Acara',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem saat membuat acara.',
      });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengumpulkan data penjualan tiket dan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Penjualan_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Penjualan_Semua_Acara_${Date.now()}.xlsx`;

      triggerFileDownload(blob, filename);

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: `File ${filename} berhasil diunduh.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Gagal mengekspor laporan Excel:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Ekspor Excel',
        text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="section-padding container">
      {/* Header Greeting */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
            ORGANIZER PORTAL
          </div>
          <h2 className="kikk-title m-0">{user?.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0' }}>
            Penyelenggara Resmi Eventease | {user?.email}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-4 mt-md-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-kikk"
            title="Buat acara baru dan unggah poster ke Cloudinary CDN"
          >
            <i className="fas fa-plus-circle me-2"></i> Buat Acara Baru
          </button>
          <button
            onClick={() => handleExportExcel()}
            disabled={isExporting}
            className="btn-kikk-outline"
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
            title="Ekspor seluruh laporan penjualan tiket ke format Excel (.xlsx)"
          >
            <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} me-2`}></i>
            Ekspor Excel (.xlsx)
          </button>
          <Link to="/scan" className="btn-kikk-outline">
            <i className="fas fa-qrcode me-2"></i> Buka Scanner
          </Link>
          <Link to="/wallet" className="btn-kikk-outline">
            <i className="fas fa-wallet me-2"></i> Dompet
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>TOTAL ACARA AKTIF</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>{events.length}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>
              <i className="fas fa-calendar-check me-1"></i> Terpublikasi di platform
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>STATUS WEBSOCKET GATE</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2rem', color: isWsConnected ? '#22c55e' : '#eab308' }}>
              <i className={`fas fa-circle me-2 ${isWsConnected ? 'text-success' : 'text-warning'}`} style={{ fontSize: '1rem' }}></i>
              {isWsConnected ? 'LIVE AKTIF' : 'MENGHUBUNGKAN'}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              <i className="fas fa-broadcast-tower me-1"></i> STOMP Realtime Check-In Gate
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>SALDO PENDAPATAN (WALLET)</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.2rem' }}>{formatRupiah(user?.saldo || 0)}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>
              <i className="fas fa-coins me-1"></i> Siap dicairkan ke rekening
            </div>
          </div>
        </div>
      </div>

      {/* Live Gate Check-In Stream Widget */}
      <div className="kikk-card p-4 mb-5" style={{ borderLeft: '4px solid #22c55e' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success py-1 px-2" style={{ fontSize: '11px' }}>
              <i className="fas fa-satellite-dish me-1"></i> LIVE FEED
            </span>
            <h4 className="kikk-title m-0" style={{ fontSize: '1.25rem' }}>
              Aktivitas Check-In Gate Realtime (WebSocket STOMP)
            </h4>
          </div>
          <small style={{ color: 'rgba(255,255,255,0.5)' }}>
            Notifikasi pop-up otomatis muncul saat tiket discan di pintu masuk
          </small>
        </div>

        {recentCheckIns.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            <i className="fas fa-qrcode fa-2x mb-2 d-block text-secondary"></i>
            Belum ada aktivitas check-in di gate saat ini. Buka halaman <Link to="/scan" className="text-warning">Scanner QR</Link> untuk memvalidasi tiket masuk.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {recentCheckIns.map((ci) => (
              <div
                key={ci.bookingId + '-' + (ci.timestamp || Math.random())}
                className="d-flex justify-content-between align-items-center p-3 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2 bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-white">{ci.attendeeName} ({ci.attendeeEmail || 'Peserta'})</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Acara: <span className="text-warning">{ci.eventName}</span> &bull; Tier: <span className="badge bg-primary">{ci.ticketTier}</span> ({ci.attendeeCount} tiket)
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge bg-success mb-1">CHECKED-IN</span>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Total Hadir: {ci.totalCheckedIn}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events Managed Table */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="kikk-title m-0" style={{ fontSize: '1.8rem' }}>Daftar Acara Diselenggarakan</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="kikk-table table-responsive">
            <table className="table m-0">
              <thead>
                <tr>
                  <th>NAMA ACARA</th>
                  <th>KATEGORI</th>
                  <th>TANGGAL</th>
                  <th>LOKASI</th>
                  <th className="text-end">AKSI & LAPORAN</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="fw-bold text-white">{e.name}</td>
                    <td><span className="badge bg-secondary">{e.categoryName || 'General'}</span></td>
                    <td>{e.date}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{e.location}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => handleExportExcel(e.id, e.name)}
                          className="btn-kikk-outline btn-sm py-1 px-2"
                          style={{ fontSize: '11px', borderColor: '#22c55e', color: '#22c55e' }}
                          title="Unduh laporan penjualan acara ini (.xlsx)"
                        >
                          <i className="fas fa-file-excel me-1"></i> Excel
                        </button>
                        <Link to={`/events/${e.id}`} className="btn-kikk btn-sm py-1 px-3" style={{ fontSize: '12px' }}>
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat Acara Baru */}
      {showCreateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1055 }}
        >
          <div
            className="kikk-card p-4 p-md-5 w-100"
            style={{
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span className="badge bg-primary mb-1">ORGANIZER ACTION</span>
                <h3 className="kikk-title m-0" style={{ fontSize: '1.6rem' }}>
                  Buat Acara Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-close btn-close-white"
                aria-label="Tutup"
              ></button>
            </div>

            <form onSubmit={handleCreateEventSubmit}>
              {/* Nama Acara */}
              <div className="mb-3">
                <label className="form-label text-white small fw-bold">NAMA ACARA *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Jakarta Tech & Music Festival 2026"
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '8px', padding: '10px 14px' }}
                />
              </div>

              {/* Kategori & Tanggal */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-white small fw-bold">KATEGORI ACARA *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="form-select bg-dark text-white border-secondary"
                    style={{ borderRadius: '8px', padding: '10px 14px' }}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-white small fw-bold">TANGGAL & WAKTU *</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Contoh: 15 November 2026, 19:00 WIB"
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '8px', padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div className="mb-3">
                <label className="form-label text-white small fw-bold">LOKASI / VENUE *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Contoh: Jakarta International Expo (JIExpo), Kemayoran"
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '8px', padding: '10px 14px' }}
                />
              </div>

              {/* Deskripsi */}
              <div className="mb-3">
                <label className="form-label text-white small fw-bold">DESKRIPSI ACARA *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsikan acara secara menarik untuk calon penonton..."
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '8px', padding: '10px 14px' }}
                ></textarea>
              </div>

              {/* Poster Acara (Cloudinary CDN Upload) */}
              <div className="mb-4 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.2)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-white small fw-bold m-0">
                    <i className="fas fa-cloud-upload-alt text-warning me-2"></i>
                    POSTER ACARA (CLOUDINARY CDN / OBJECT STORAGE)
                  </label>
                  {formData.imageProvider && (
                    <span className={`badge ${formData.imageProvider === 'CLOUDINARY' ? 'bg-success' : 'bg-info text-dark'}`}>
                      {formData.imageProvider === 'CLOUDINARY' ? 'Cloudinary CDN Aktif' : 'Local Storage'}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={posterInputRef}
                  onChange={handlePosterUpload}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />

                <div className="d-flex flex-column flex-md-row gap-3 align-items-center">
                  {formData.imageUrl ? (
                    <div className="position-relative">
                      <img
                        src={formData.imageUrl}
                        alt="Poster Preview"
                        className="rounded shadow"
                        style={{ width: '120px', height: '80px', objectFit: 'cover', border: '2px solid var(--kikk-yellow)' }}
                      />
                    </div>
                  ) : (
                    <div
                      className="rounded d-flex flex-column align-items-center justify-content-center text-center p-3"
                      style={{ width: '120px', height: '80px', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)' }}
                    >
                      <i className="far fa-image text-secondary mb-1"></i>
                      <small style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>Tanpa Gambar</small>
                    </div>
                  )}

                  <div className="flex-grow-1">
                    <div className="d-flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        disabled={isUploadingPoster}
                        className="btn-kikk-outline btn-sm py-1 px-3"
                        style={{ fontSize: '12px' }}
                      >
                        <i className={`fas ${isUploadingPoster ? 'fa-spinner fa-spin' : 'fa-upload'} me-2`}></i>
                        {formData.imageUrl ? 'Ganti Poster' : 'Unggah Poster Gambar'}
                      </button>
                    </div>
                    <small style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Mendukung format JPG, PNG, atau WebP (maks. 5 MB). Gambar akan otomatis dioptimasi dan disimpan ke Cloudinary CDN.
                    </small>
                  </div>
                </div>
              </div>

              {/* Tier Tiket Dinamis */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-white small fw-bold m-0">KATEGORI & HARGA TIKET *</label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="btn btn-sm py-1 px-2 text-warning"
                    style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <i className="fas fa-plus me-1"></i> Tambah Tier
                  </button>
                </div>

                <div className="d-flex flex-column gap-2">
                  {ticketTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="d-flex flex-wrap gap-2 align-items-center p-2 rounded"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <div className="flex-grow-1" style={{ minWidth: '130px' }}>
                        <input
                          type="text"
                          required
                          value={tier.name}
                          onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                          placeholder="Nama Tier (Regular / VIP)"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                        />
                      </div>
                      <div style={{ width: '130px' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-secondary text-white border-secondary">Rp</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={tier.price}
                            onChange={(e) => handleTierChange(idx, 'price', Number(e.target.value))}
                            placeholder="Harga"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                          />
                        </div>
                      </div>
                      <div style={{ width: '110px' }}>
                        <input
                          type="number"
                          min="1"
                          required
                          value={tier.capacity}
                          onChange={(e) => handleTierChange(idx, 'capacity', Number(e.target.value))}
                          placeholder="Kuota"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          title="Kuota tiket"
                        />
                      </div>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="btn btn-outline-danger btn-sm py-1 px-2"
                          title="Hapus tier ini"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmittingEvent}
                  className="btn-kikk-outline btn-sm py-2 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent || isUploadingPoster}
                  className="btn-kikk btn-sm py-2 px-4"
                >
                  <i className={`fas ${isSubmittingEvent ? 'fa-spinner fa-spin' : 'fa-check-circle'} me-2`}></i>
                  {isSubmittingEvent ? 'Menerbitkan...' : 'Terbitkan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
