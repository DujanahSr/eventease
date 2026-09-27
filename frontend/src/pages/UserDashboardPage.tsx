import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { mediaService } from '../services/mediaService';
import Swal from 'sweetalert2';

export const UserDashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [tickets, setTickets] = useState<BookingResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const data = await bookingService.getMyTickets();
        setTickets(data || []);
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Batas maksimal foto profil adalah 5 MB.',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      Swal.fire({
        title: 'Mengunggah Foto Profil...',
        text: 'Menyimpan ke Cloud Storage (Cloudinary CDN)...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const uploadResult = await mediaService.uploadImage(file, 'avatars');
      await updateProfile({ profilePicture: uploadResult.url });

      Swal.fire({
        icon: 'success',
        title: 'Foto Profil Diperbarui!',
        text: `Foto tersimpan via ${uploadResult.provider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah foto profil.',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditProfile = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Perbarui Data Profil',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom: 4px; font-weight: 600; color: #333;">Nama Lengkap</label>
            <input id="swal-input-name" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box;" value="${user?.name || ''}">
          </div>
          <div>
            <label style="display:block; margin-bottom: 4px; font-weight: 600; color: #333;">Nomor Telepon / WhatsApp</label>
            <input id="swal-input-phone" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box;" value="${user?.phone || ''}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-input-phone') as HTMLInputElement).value;
        if (!name.trim()) {
          Swal.showValidationMessage('Nama lengkap tidak boleh kosong');
          return false;
        }
        return { name: name.trim(), phone: phone.trim() };
      },
    });

    if (formValues) {
      try {
        await updateProfile(formValues);
        Swal.fire({
          icon: 'success',
          title: 'Profil Berhasil Diperbarui',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memperbarui Profil',
          text: err.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil.',
        });
      }
    }
  };

  return (
    <div className="section-padding container">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {/* Header Profile Greeting */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="d-flex align-items-center gap-4">
          {/* Avatar with Upload Trigger */}
          <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title="Klik untuk mengubah foto profil (Cloudinary)">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="rounded-circle shadow"
                style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid var(--kikk-yellow)' }}
              />
            ) : (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white shadow fw-bold"
                style={{ width: '80px', height: '80px', fontSize: '2rem', border: '3px solid var(--kikk-yellow)' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div
              className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1 d-flex align-items-center justify-content-center shadow"
              style={{ width: '26px', height: '26px', fontSize: '11px', border: '2px solid #000' }}
            >
              <i className={`fas ${isUploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '4px' }}>
              DASHBOARD PENGGUNA
            </div>
            <h2 className="kikk-title m-0" style={{ fontSize: '1.8rem' }}>{user?.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: '14px' }}>
              {user?.email} &bull; {user?.phone || 'Nomor HP belum diatur'}
            </p>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-4 mt-md-0">
          <button
            onClick={handleEditProfile}
            className="btn-kikk-outline btn-sm py-2 px-3"
            title="Ubah nama dan nomor telepon"
          >
            <i className="fas fa-user-edit me-2"></i> Edit Profil
          </button>
          <Link to="/events" className="btn-kikk btn-sm py-2 px-3">
            <i className="fas fa-ticket-alt me-2"></i> Cari Acara
          </Link>
        </div>
      </div>

      {/* Ticket List */}
      <div className="mb-4">
        <h3 className="kikk-title mb-4" style={{ fontSize: '1.8rem' }}>
          Tiket & Riwayat Pemesanan Saya
        </h3>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="row g-4">
            {tickets.map((t) => (
              <div className="col-lg-6" key={t.id}>
                <div className="kikk-card p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span
                        className={`badge mb-2 ${
                          t.status === 'PAID'
                            ? 'bg-success'
                            : t.status === 'PENDING'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                        style={{ padding: '6px 14px', borderRadius: '50px' }}
                      >
                        {t.status === 'PAID' ? 'LUNAS (AKTIF)' : t.status}
                      </span>
                      <h4 className="kikk-title m-0 fs-5">{t.eventName}</h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>KODE BOOKING</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--kikk-yellow)' }}>
                        {t.id?.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <p className="card-text mb-1" style={{ fontSize: '0.9rem' }}>
                    <i className="far fa-calendar-alt text-warning me-2"></i>
                    <span>{t.eventDate || '-'}</span>
                  </p>
                  <p className="card-text mb-3" style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-map-marker-alt text-warning me-2"></i>
                    <span>{t.eventLocation || '-'}</span>
                  </p>

                  <div className="p-3 rounded-3 my-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Tier Tiket:</span>
                      <span className="fw-bold">{t.ticketCategoryName || 'General'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Jumlah:</span>
                      <span>{t.quantity} Tiket</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'var(--kikk-yellow)', fontWeight: 600 }}>Total Bayar:</span>
                      <span style={{ color: 'var(--kikk-yellow)', fontWeight: 700, fontSize: '1.1rem' }}>
                        {formatRupiah(t.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-2">
                    <a
                      href={`/api/bookings/${t.id}/ticket-pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-kikk-outline btn-sm"
                      style={{ fontSize: '13px', padding: '8px 18px' }}
                    >
                      <i className="fas fa-download me-1"></i> Unduh E-Ticket (PDF)
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="kikk-card text-center py-5">
            <i className="fas fa-ticket-alt mb-3" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)' }}></i>
            <h4 className="kikk-title mb-2">Belum Ada Tiket yang Dibeli</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '450px', margin: '0 auto 20px' }}>
              Anda belum memiliki tiket aktif. Jelajahi katalog acara kami dan dapatkan tiket acara favorit Anda sekarang!
            </p>
            <Link to="/events" className="btn-kikk">
              Jelajahi Acara Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
