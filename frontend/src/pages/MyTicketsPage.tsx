import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookingResponse, ApiResponse } from '../types';
import { Ticket, Calendar, MapPin, Download, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    setLoading(true);
    api.get<ApiResponse<BookingResponse[]>>('/bookings/my-tickets')
      .then((res) => setTickets(res.data.data))
      .catch((err) => console.error('Gagal mengambil tiket:', err))
      .finally(() => setLoading(false));
  };

  const handleDownloadPdf = async (bookingId: string) => {
    setDownloadingId(bookingId);
    try {
      const response = await api.get(`/bookings/${bookingId}/ticket-pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Eventease_Ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengunduh tiket PDF:', err);
      alert('Gagal mengunduh tiket PDF. Pastikan status tiket sudah lunas.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Lunas (Siap Digunakan)
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Sudah Check-In
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Menunggu Pembayaran
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center">
          <Ticket className="w-8 h-8 text-indigo-400 mr-3" />
          Tiket Saya
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Daftar seluruh e-tiket yang telah Anda pesan di Eventease
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Memuat tiket Anda...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Belum Ada Tiket</h3>
          <p className="text-slate-400 text-sm mb-6">Anda belum memiliki riwayat pemesanan tiket acara.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-white">{ticket.eventName}</h3>
                  {getStatusBadge(ticket.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                    {ticket.eventDate}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 mr-1.5" />
                    {ticket.eventLocation}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Tier: <strong className="text-slate-200">{ticket.ticketCategoryName}</strong> &bull; Jumlah: <strong className="text-slate-200">{ticket.quantity} tiket</strong> &bull; Total: <strong className="text-indigo-300">{formatCurrency(ticket.totalAmount)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 shrink-0">
                {(ticket.status === 'PAID' || ticket.status === 'CHECKED_IN') && (
                  <button
                    onClick={() => handleDownloadPdf(ticket.id)}
                    disabled={downloadingId === ticket.id}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
                  >
                    {downloadingId === ticket.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Unduh PDF E-Tiket</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
