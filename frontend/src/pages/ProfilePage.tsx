import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mediaService } from '../services/mediaService';
import { partnerApplicationService, PartnerApplication } from '../services/partnerApplicationService';
import { UserFloatingDock } from '../components/UserFloatingDock';
import Swal from 'sweetalert2';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  const [userBio, setUserBio] = useState(() => localStorage.getItem('user_bio') || 'Event Enthusiast & Music Lover');
  const [userCity, setUserCity] = useState(() => localStorage.getItem('user_city') || 'Jakarta, Indonesia');

  // KYC Partner Application States
  const [partnerApp, setPartnerApp] = useState<PartnerApplication | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  const [formData, setFormData] = useState({
    organizationName: '',
    idCardNumber: '',
    idCardImage: '',
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    reason: '',
  });

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

  useEffect(() => {
    if (user?.role === 'USER') {
      loadPartnerApplication();
    }
  }, [user?.role]);

  const loadPartnerApplication = async () => {
    setIsLoadingApp(true);
    try {
      const app = await partnerApplicationService.getMyApplication();
      setPartnerApp(app);
      if (app) {
        setFormData({
          organizationName: app.organizationName || '',
          idCardNumber: app.idCardNumber || '',
          idCardImage: app.idCardImage || '',
          bankName: app.bankName || 'BCA',
          bankAccountNumber: app.bankAccountNumber || '',
          bankAccountHolder: app.bankAccountHolder || '',
          reason: app.reason || '',
        });
      }
    } catch (err) {
      console.error('Gagal memuat status pengajuan kemitraan', err);
    } finally {
      setIsLoadingApp(false);
    }
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Batas maksimal berkas identitas adalah 5 MB.',
        background: '#120a20',
        color: '#fff',
      });
      return;
    }

    setIsUploadingKtp(true);
    try {
      const res = await mediaService.uploadImage(file, 'kyc');
      setFormData((prev) => ({ ...prev, idCardImage: res.url }));
      Swal.fire({
        icon: 'success',
        title: 'Dokumen Terunggah',
        text: 'Foto identitas berhasil disimpan.',
        timer: 1500,
        showConfirmButton: false,
        background: '#120a20',
        color: '#fff',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Unggah',
        text: err.response?.data?.message || 'Gagal mengunggah foto identitas.',
        background: '#120a20',
        color: '#fff',
      });
    } finally {
      setIsUploadingKtp(false);
      if (ktpInputRef.current) ktpInputRef.current.value = '';
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organizationName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Nama Organisasi / EO wajib diisi.', background: '#120a20', color: '#fff' });
      return;
    }
    if (!formData.idCardNumber.trim() || formData.idCardNumber.length < 10) {
      Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Nomor NIK / KTP minimal 10 digit angka.', background: '#120a20', color: '#fff' });
      return;
    }
    if (!formData.idCardImage) {
      Swal.fire({ icon: 'warning', title: 'Dokumen Belum Diunggah', text: 'Silakan unggah foto KTP atau identitas penanggung jawab.', background: '#120a20', color: '#fff' });
      return;
    }
    if (!formData.bankAccountNumber.trim() || !formData.bankAccountHolder.trim()) {
      Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Nomor rekening dan nama pemilik rekening pencairan dana wajib diisi.', background: '#120a20', color: '#fff' });
      return;
    }

    setIsSubmittingApp(true);
    try {
      const submitted = await partnerApplicationService.submit(formData);
      setPartnerApp(submitted);
      setShowApplyModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Pengajuan Berhasil Dikirim',
        text: 'Berkas verifikasi kemitraan Anda telah diterima dan sedang ditinjau oleh Super Administrator.',
        background: '#120a20',
        color: '#fff',
        confirmButtonColor: '#FFD700',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Pengajuan',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
        background: '#120a20',
        color: '#fff',
      });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleViewApplicationDetail = (app: PartnerApplication) => {
    Swal.fire({
      title: 'Berkas Pengajuan Kemitraan',
      html: `
        <div style="text-align:left;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6">
          <div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.2);border-radius:10px;margin-bottom:12px">
            <div><strong style="color:#FFD700">Organisasi:</strong> ${app.organizationName}</div>
            <div><strong style="color:#FFD700">No. NIK/KTP:</strong> ${app.idCardNumber}</div>
            <div><strong style="color:#FFD700">Rekening:</strong> ${app.bankName} - ${app.bankAccountNumber} (a.n ${app.bankAccountHolder})</div>
            ${app.reason ? `<div><strong style="color:#FFD700">Rencana Acara:</strong> ${app.reason}</div>` : ''}
          </div>
          <div style="text-align:center;margin-top:10px">
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:6px">FOTO IDENTITAS TERUNGGAH:</div>
            <img src="${app.idCardImage}" alt="KTP" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);object-fit:contain" />
          </div>
        </div>
      `,
      confirmButtonText: 'Tutup',
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

              {/* Curated Tier: Organizer Partnership KYC Section */}
              {user?.role === 'ORGANIZER' && (
                <div
                  className="mt-4 p-3 rounded-4"
                  style={{
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-success"
                        style={{ width: '42px', height: '42px', background: 'rgba(34, 197, 94, 0.15)', flexShrink: 0 }}
                      >
                        <i className="fas fa-certificate" style={{ fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <div className="fw-bold text-white d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                          <span>Penyelenggara Resmi Terverifikasi</span>
                          <span className="badge bg-success" style={{ fontSize: '10px' }}>VERIFIED</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)' }}>
                          Akun Anda memiliki izin resmi untuk menerbitkan tiket dan menyelenggarakan acara di EventEase.
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="btn-kikk btn-sm py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '10px' }}
                    >
                      <i className="fas fa-tachometer-alt me-1"></i> Buka Konsol Organizer
                    </Link>
                  </div>
                </div>
              )}

              {user?.role === 'USER' && (
                <>
                  {partnerApp?.status === 'PENDING' ? (
                    <div
                      className="mt-4 p-3 rounded-4"
                      style={{
                        background: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-warning"
                            style={{ width: '42px', height: '42px', background: 'rgba(234, 179, 8, 0.15)', flexShrink: 0 }}
                          >
                            <i className="fas fa-clock" style={{ fontSize: '18px' }}></i>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                Pengajuan Kemitraan Penyelenggara
                              </span>
                              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '10px' }}>
                                MENUNGGU VERIFIKASI
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
                              Organisasi: <strong>{partnerApp.organizationName}</strong> | Rekening: {partnerApp.bankName} ({partnerApp.bankAccountNumber})
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewApplicationDetail(partnerApp)}
                          className="btn-kikk-outline btn-sm py-1 px-3"
                          style={{ fontSize: '11px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-eye me-1"></i> Rincian Berkas
                        </button>
                      </div>
                    </div>
                  ) : partnerApp?.status === 'REJECTED' ? (
                    <div
                      className="mt-4 p-3 rounded-4"
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-danger"
                            style={{ width: '42px', height: '42px', background: 'rgba(239, 68, 68, 0.15)', flexShrink: 0 }}
                          >
                            <i className="fas fa-exclamation-circle" style={{ fontSize: '18px' }}></i>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                Pengajuan Kemitraan Belum Disetujui
                              </span>
                              <span className="badge bg-danger" style={{ fontSize: '10px' }}>
                                PERLU REVISI
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                              Catatan Admin: {partnerApp.adminNotes || 'Dokumen belum memenuhi kualifikasi.'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowApplyModal(true)}
                          className="btn-kikk btn-sm py-1 px-3"
                          style={{ fontSize: '11px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-redo me-1"></i> Ajukan Ulang
                        </button>
                      </div>
                    </div>
                  ) : (
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
                              Daftarkan organisasi Anda untuk menyelenggarakan acara resmi dengan verifikasi aman Super Admin.
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowApplyModal(true)}
                          className="btn-kikk btn-sm py-1 px-3"
                          style={{ fontSize: '11px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-id-card me-1"></i> Ajukan Kemitraan (KYC)
                        </button>
                      </div>
                    </div>
                  )}
                </>
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

      {/* Hidden File Input for KTP Upload */}
      <input
        type="file"
        ref={ktpInputRef}
        onChange={handleKtpUpload}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {/* Modal Formulir Pengajuan Kemitraan (KYC) */}
      {showApplyModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 1050,
            background: 'rgba(6, 3, 12, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="luxury-glass-card anim-fade-in w-100"
            style={{
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#FFD700', fontWeight: 700 }}>
                  VERIFIKASI IDENTITAS &amp; LEGALITAS (KYC)
                </span>
                <h4 className="fw-bold text-white mb-0 mt-1">Formulir Kemitraan Penyelenggara</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="btn btn-sm btn-link text-white text-opacity-50 text-decoration-none fs-5 p-0"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
              Sesuai kebijakan keamanan EventEase (Model B), seluruh Penyelenggara Acara wajib melengkapi verifikasi identitas resmi sebelum dapat menerbitkan tiket.
            </p>

            <form onSubmit={handleSubmitApplication}>
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold mb-1">
                  <i className="fas fa-building me-1"></i> Nama Badan Usaha / Organisasi / Komunitas *
                </label>
                <input
                  type="text"
                  className="kikk-form-control"
                  placeholder="Contoh: Nada Nusantara Entertainment"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-warning small fw-bold mb-1">
                  <i className="fas fa-id-card me-1"></i> Nomor NIK / KTP Penanggung Jawab *
                </label>
                <input
                  type="text"
                  className="kikk-form-control"
                  placeholder="16 digit nomor NIK KTP resmi"
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value.replace(/[^0-9]/g, '') })}
                  maxLength={16}
                  required
                />
              </div>

              {/* Unggah Berkas KTP */}
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold mb-1">
                  <i className="fas fa-upload me-1"></i> Foto KTP / Identitas Asli *
                </label>
                <div
                  className="p-3 rounded-3 text-center position-relative"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1.5px dashed rgba(255, 215, 0, 0.3)',
                  }}
                >
                  {formData.idCardImage ? (
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={formData.idCardImage}
                          alt="Preview KTP"
                          className="rounded"
                          style={{ width: '80px', height: '52px', objectFit: 'cover', border: '1px solid rgba(255, 215, 0, 0.4)' }}
                        />
                        <div className="text-start">
                          <div className="text-success small fw-bold">
                            <i className="fas fa-check-circle me-1"></i> Foto KTP Terunggah
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Siap diverifikasi</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => ktpInputRef.current?.click()}
                        className="btn-kikk-outline btn-sm py-1 px-3"
                        style={{ fontSize: '11px', borderRadius: '8px' }}
                      >
                        Ganti Foto
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-camera fs-3 text-warning opacity-50 mb-2"></i>
                      <div className="text-white small fw-bold">Unggah Foto KTP Jelas &amp; Terbaca</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '10px' }}>
                        Format JPG, PNG, atau WebP (Maks. 5 MB)
                      </div>
                      <button
                        type="button"
                        onClick={() => ktpInputRef.current?.click()}
                        disabled={isUploadingKtp}
                        className="btn-kikk btn-sm py-1 px-3"
                        style={{ fontSize: '11px', borderRadius: '8px' }}
                      >
                        {isUploadingKtp ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-1"></i> Mengunggah...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-folder-open me-1"></i> Pilih Berkas Foto
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rekening Bank */}
              <div className="row g-2 mb-3">
                <div className="col-md-4">
                  <label className="form-label text-warning small fw-bold mb-1">
                    <i className="fas fa-university me-1"></i> Bank *
                  </label>
                  <select
                    className="kikk-form-control"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="Permata">Permata Bank</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="BSI">Bank Syariah Indonesia</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-warning small fw-bold mb-1">
                    <i className="fas fa-credit-card me-1"></i> No. Rekening *
                  </label>
                  <input
                    type="text"
                    className="kikk-form-control"
                    placeholder="Nomor rekening"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-warning small fw-bold mb-1">
                    <i className="fas fa-user-check me-1"></i> Nama Pemilik *
                  </label>
                  <input
                    type="text"
                    className="kikk-form-control"
                    placeholder="Sesuai buku tabungan"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Rencana Acara */}
              <div className="mb-4">
                <label className="form-label text-warning small fw-bold mb-1">
                  <i className="fas fa-bullhorn me-1"></i> Rencana Acara &amp; Keterangan Tambahan
                </label>
                <textarea
                  className="kikk-form-control"
                  rows={2}
                  placeholder="Contoh: Kami berencana mengadakan konser musik indie regional dan pameran seni..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top border-white border-opacity-10">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-sm btn-outline-secondary py-2 px-3"
                  style={{ borderRadius: '10px', fontSize: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApp || isUploadingKtp}
                  className="btn-kikk btn-sm py-2 px-4"
                  style={{ borderRadius: '10px', fontSize: '12px' }}
                >
                  {isSubmittingApp ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-1"></i> Mengirim Pengajuan...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-1"></i> Kirim Berkas Pengajuan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock />
    </div>
  );
};
