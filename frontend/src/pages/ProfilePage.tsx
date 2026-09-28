import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mediaService } from '../services/mediaService';
import { UserFloatingDock } from '../components/UserFloatingDock';
import Swal from 'sweetalert2';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userBio, setUserBio] = useState(() => localStorage.getItem('user_bio') || 'Event Enthusiast & Music Lover');
  const [userCity, setUserCity] = useState(() => localStorage.getItem('user_city') || 'Jakarta, Indonesia');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Ukuran Terlalu Besar', text: 'Batas maksimal foto profil adalah 5 MB.' });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      Swal.fire({ title: 'Mengunggah...', text: 'Menyimpan ke Cloud Storage...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await mediaService.uploadImage(file, 'avatars');
      await updateProfile({ profilePicture: res.url });
      Swal.fire({ icon: 'success', title: 'Foto Diperbarui', timer: 1800, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditProfile = async () => {
    const { value: v } = await Swal.fire({
      title: 'Edit Profil', width: 560,
      html: `
        <div style="text-align:left;font-size:14px;margin-top:15px">
          <div style="margin-bottom:16px;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.15);border-radius:10px;display:flex;justify-content:space-between;align-items:center">
            <div><div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.5px">EMAIL</div><div style="color:#fff;font-weight:600;font-size:13px">${user?.email || '-'}</div></div>
            <span style="background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:3px 8px;border-radius:6px;font-size:11px"><i class="fas fa-shield-alt"></i> Terverifikasi</span>
          </div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-user me-2"></i>Nama Lengkap</label><input id="swal-input-name" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${user?.name || ''}" placeholder="Nama lengkap"></div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fab fa-whatsapp me-2"></i>WhatsApp</label><input id="swal-input-phone" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${user?.phone || ''}" placeholder="081234567890"></div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-map-marker-alt me-2"></i>Kota</label><input id="swal-input-city" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${userCity}" placeholder="Jakarta, Indonesia"></div>
          <div><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-quote-left me-2"></i>Bio Singkat</label><textarea id="swal-input-bio" class="swal2-textarea" style="width:100%;margin:0;box-sizing:border-box;height:75px;resize:none" placeholder="Minat acara Anda...">${userBio}</textarea></div>
        </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: '<i class="fas fa-save me-1"></i> Simpan',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Batal',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-input-phone') as HTMLInputElement).value;
        const city = (document.getElementById('swal-input-city') as HTMLInputElement).value;
        const bio = (document.getElementById('swal-input-bio') as HTMLTextAreaElement).value;
        if (!name.trim()) { Swal.showValidationMessage('Nama tidak boleh kosong'); return false; }
        return { name: name.trim(), phone: phone.trim(), city: city.trim(), bio: bio.trim() };
      },
    });
    if (v) {
      try {
        await updateProfile({ name: v.name, phone: v.phone });
        setUserCity(v.city); setUserBio(v.bio);
        localStorage.setItem('user_city', v.city); localStorage.setItem('user_bio', v.bio);
        Swal.fire({ icon: 'success', title: 'Profil Diperbarui', timer: 1800, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Terjadi kesalahan.' });
      }
    }
  };

  const handleOrganizerInquiry = () => {
    Swal.fire({
      title: 'Program Kemitraan Penyelenggara',
      html: `
        <div style="text-align:left;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6">
          <p>EventEase menerapkan sistem <strong>Curated &amp; Enterprise (Model B)</strong> untuk menjaga integritas seluruh acara dan perlindungan mutlak bagi pembeli tiket.</p>
          <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.25);border-radius:12px;padding:12px 14px;margin-bottom:12px">
            <div style="font-weight:600;color:#FFD700;margin-bottom:4px"><i class="fas fa-shield-alt me-1"></i> Syarat Verifikasi Penyelenggara:</div>
            <ul style="margin:0;padding-left:18px;color:rgba(255,255,255,0.75)">
              <li>KTP Penanggung Jawab / Legalitas Badan Usaha / Komunitas</li>
              <li>Rekening Bank Resmi atas nama Penyelenggara</li>
              <li>Persetujuan Super Admin melalui Panel Manajemen</li>
            </ul>
          </div>
          <p style="margin-bottom:0">Untuk mengajukan akun Organizer atau upgrade akun ini, silakan hubungi tim Administrator melalui WhatsApp atau email resmi: <strong>support@eventease.com</strong>.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Saya Mengerti',
      confirmButtonColor: '#FFD700',
      background: '#120a20',
      color: '#fff',
    });
  };

  return (
    <div className="position-relative min-vh-100" style={{ backgroundColor: '#0a0514', color: '#fff' }}>
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />

      {/* Hero strip */}
      <section className="position-relative overflow-hidden" style={{ height: '220px' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundImage: "url('/images/user_dashboard_bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.3) saturate(1.3)',
        }} />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'linear-gradient(180deg, rgba(10,5,20,0.4) 0%, rgba(10,5,20,0.95) 100%)',
        }} />
      </section>

      <div className="container position-relative" style={{ zIndex: 1, marginTop: '-100px', paddingBottom: '80px' }}>
        <div className="row g-4">
          {/* Left: Profile Card */}
          <div className="col-lg-4">
            <div style={{
              borderRadius: '28px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              textAlign: 'center', padding: '40px 32px 32px',
            }}>
              {/* Avatar */}
              <div
                className="position-relative mx-auto"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer', width: '120px', height: '120px', marginBottom: '20px' }}
                title="Ganti foto profil"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} style={{
                    width: '120px', height: '120px', objectFit: 'cover',
                    borderRadius: '28px', border: '3px solid rgba(255,215,0,0.4)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  }} />
                ) : (
                  <div style={{
                    width: '120px', height: '120px', borderRadius: '28px',
                    background: 'linear-gradient(135deg, #1a0a2e, #2d1b69)',
                    border: '3px solid rgba(255,215,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', fontWeight: 700, color: '#FFD700',
                    fontFamily: "'Playfair Display', serif",
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '34px', height: '34px', borderRadius: '12px',
                  background: '#FFD700', color: '#0a0514',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', boxShadow: '0 4px 12px rgba(255,215,0,0.4)',
                }}>
                  <i className={`fas ${isUploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`} />
                </div>
              </div>

              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px',
              }}>
                {user?.name}
              </h2>

              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                <i className="fas fa-map-pin me-1" style={{ color: 'rgba(255,215,0,0.5)' }} />
                {userCity}
              </div>

              <p style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                fontStyle: 'italic', lineHeight: 1.6,
                margin: '0 0 24px', padding: '0 8px',
              }}>
                <i className="fas fa-quote-left me-1" style={{ color: 'rgba(255,215,0,0.3)', fontSize: '10px' }} />
                {userBio}
              </p>

              <button onClick={handleEditProfile} className="btn-kikk w-100 py-2" style={{ borderRadius: '14px', fontSize: '13px' }}>
                <i className="fas fa-pen-to-square me-2" /> Edit Profil
              </button>
            </div>
          </div>

          {/* Right: Info Details */}
          <div className="col-lg-8">
            <div style={{
              borderRadius: '28px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              padding: 'clamp(28px, 3vw, 40px)',
            }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.4rem', fontWeight: 700, margin: 0,
                }}>
                  Informasi Akun
                </h3>
                <span style={{
                  background: 'rgba(34,197,94,0.1)', color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.2)',
                  padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                }}>
                  <i className="fas fa-shield-alt me-1" /> Terverifikasi
                </span>
              </div>

              {/* Info Grid */}
              <div className="row g-4">
                {[
                  { label: 'Nama Lengkap', value: user?.name || '-', icon: 'fa-user' },
                  { label: 'Alamat Email', value: user?.email || '-', icon: 'fa-envelope' },
                  { label: 'Nomor WhatsApp', value: user?.phone || 'Belum diatur', icon: 'fa-phone' },
                  { label: 'Kota Domisili', value: userCity, icon: 'fa-map-marker-alt' },
                  { label: 'Role Akun', value: user?.role || 'USER', icon: 'fa-id-badge' },
                  { label: 'Status', value: 'Aktif', icon: 'fa-circle-check' },
                ].map((item, i) => (
                  <div className="col-sm-6" key={i}>
                    <div style={{
                      padding: '16px 20px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', fontWeight: 600 }}>
                        <i className={`fas ${item.icon} me-1`} style={{ color: 'rgba(255,215,0,0.5)' }} />
                        {item.label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Curated Tier: Organizer Partnership Information */}
              {user?.role === 'USER' && (
                <div
                  className="mt-4 p-3 rounded-4"
                  style={{
                    background: 'rgba(255, 215, 0, 0.03)',
                    border: '1px dashed rgba(255, 215, 0, 0.25)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-warning"
                        style={{ width: '40px', height: '40px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                      >
                        <i className="fas fa-bullhorn" style={{ fontSize: '15px' }}></i>
                      </div>
                      <div>
                        <div className="fw-bold text-white" style={{ fontSize: '13px' }}>
                          Ingin Menjadi Penyelenggara Acara?
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                          EventEase menerapkan sistem kurasi terverifikasi oleh Super Admin untuk keamanan platform.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOrganizerInquiry}
                      className="btn-kikk-outline btn-sm py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '10px' }}
                    >
                      <i className="fas fa-info-circle me-1"></i> Info Kemitraan
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Navigation */}
              <div className="d-flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link to="/home-user" className="btn-kikk-outline py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px' }}>
                  <i className="fas fa-home me-2" /> Dashboard
                </Link>
                <Link to="/my-tickets" className="btn-kikk-outline py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px' }}>
                  <i className="fas fa-ticket-alt me-2" /> Tiket Saya
                </Link>
                <Link to="/events" className="btn-kikk-outline py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px' }}>
                  <i className="fas fa-compass me-2" /> Jelajahi Acara
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock />
    </div>
  );
};
