import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export const OrganizerWalletPage: React.FC = () => {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount < 50000) {
      Swal.fire({
        icon: 'warning',
        title: 'Nominal Tidak Valid',
        text: 'Minimal penarikan dana adalah Rp50.000.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    if (withdrawAmount > (user?.saldo || 0)) {
      Swal.fire({
        icon: 'error',
        title: 'Saldo Tidak Cukup',
        text: 'Nominal penarikan melebihi saldo dompet Anda saat ini.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      Swal.fire({
        icon: 'success',
        title: 'Pengajuan Terkirim!',
        text: `Pengajuan penarikan ${formatRupiah(withdrawAmount)} ke rekening ${bankName} (${accountNumber}) sedang diproses oleh tim Admin.`,
        confirmButtonColor: '#FFD700',
      });
      setAmount('');
      setAccountNumber('');
      setAccountHolder('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-padding container">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
            ORGANIZER DOMPET & PENDAPATAN
          </div>
          <h2 className="kikk-title m-0">Dompet Pendapatan Acara</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0' }}>
            Pantau saldo dan ajukan pencairan dana tiket ke rekening bank Anda
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Balance Card */}
        <div className="col-lg-5">
          <div className="kikk-card p-5 text-center">
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'rgba(255,215,0,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'var(--kikk-yellow)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <i className="fas fa-wallet"></i>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '1px' }}>
              SALDO BERSIH ANDA
            </div>
            <h1 className="kikk-title my-3" style={{ fontSize: '3rem' }}>
              {formatRupiah(user?.saldo || 0)}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Dana otomatis bertambah saat penonton menyelesaikan pembayaran tiket di platform.
            </p>
          </div>
        </div>

        {/* Right Column: Withdrawal Form */}
        <div className="col-lg-7">
          <div className="kikk-card p-4">
            <h4 className="kikk-title mb-4" style={{ fontSize: '1.5rem' }}>
              Ajukan Penarikan Dana (Withdrawal)
            </h4>
            <form onSubmit={handleWithdrawal}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="kikk-form-label">Nama Bank</label>
                  <select
                    className="kikk-form-control"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="BCA" style={{ background: '#0b0616', color: '#fff' }}>Bank Central Asia (BCA)</option>
                    <option value="Mandiri" style={{ background: '#0b0616', color: '#fff' }}>Bank Mandiri</option>
                    <option value="BNI" style={{ background: '#0b0616', color: '#fff' }}>Bank Negara Indonesia (BNI)</option>
                    <option value="BRI" style={{ background: '#0b0616', color: '#fff' }}>Bank Rakyat Indonesia (BRI)</option>
                    <option value="BSI" style={{ background: '#0b0616', color: '#fff' }}>Bank Syariah Indonesia (BSI)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="kikk-form-label">Nomor Rekening</label>
                  <input
                    type="text"
                    className="kikk-form-control"
                    placeholder="Contoh: 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="kikk-form-label">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  className="kikk-form-control"
                  placeholder="Sesuai buku tabungan"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="kikk-form-label">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  className="kikk-form-control"
                  placeholder="Minimal Rp50.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="50000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-kikk w-100 justify-content-center py-3"
              >
                {isSubmitting ? 'MENGAJUKAN...' : 'AJUKAN PENARIKAN SEKARANG'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
