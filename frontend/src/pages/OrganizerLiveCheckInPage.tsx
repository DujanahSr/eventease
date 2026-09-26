import React, { useState, useEffect } from 'react';
import { createWebSocketClient } from '../services/websocket';
import { CheckInNotification } from '../types';
import api from '../services/api';
import { Sparkles, Radio, CheckCircle2, User, Clock, QrCode, AlertCircle, Loader2 } from 'lucide-react';

export const OrganizerLiveCheckInPage: React.FC = () => {
  const [notifications, setNotifications] = useState<CheckInNotification[]>([]);
  const [totalCounter, setTotalCounter] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [scanBookingId, setScanBookingId] = useState<string>('');
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Hubungkan ke STOMP WebSocket topic
    const topic = '/topic/admin/check-in';
    const client = createWebSocketClient(topic, (notification) => {
      console.log('Real-Time Check-In Diterima:', notification);
      setNotifications((prev) => [notification, ...prev]);
      if (notification.totalCheckedIn !== undefined) {
        setTotalCounter(notification.totalCheckedIn);
      } else {
        setTotalCounter((prev) => prev + 1);
      }
    });

    client.onConnect = () => {
      setIsConnected(true);
    };

    client.onDisconnect = () => {
      setIsConnected(false);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanBookingId.trim()) return;

    setScanLoading(true);
    setScanFeedback(null);

    try {
      const res = await api.post('/scanner/verify', { bookingId: scanBookingId.trim() });
      if (res.data.success) {
        setScanFeedback({ success: true, message: res.data.message });
        setScanBookingId('');
      } else {
        setScanFeedback({ success: false, message: res.data.message });
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      const msg = err.response?.data?.message || 'Gagal memvalidasi tiket.';
      setScanFeedback({ success: false, message: msg });
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Fitur Real-Time WebSocket STOMP</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Live Check-In Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Pantau kehadiran peserta secara langsung tanpa reload halaman saat tiket QR discan di gate
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl glass-card border border-slate-700/60 self-start md:self-auto">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-bold text-slate-200">
            {isConnected ? 'WebSocket Terhubung (Live)' : 'Menghubungkan ke Broker...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Counter & Simulator */}
        <div className="space-y-6">
          {/* Live Counter Card */}
          <div className="glass-card rounded-3xl p-8 border border-slate-700/60 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <Radio className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Kehadiran Live
            </span>
            <div className="text-6xl font-black text-white my-3 tracking-tight font-mono">
              {totalCounter}
            </div>
            <p className="text-xs text-slate-400">
              Angka bertambah seketika melalui channel WebSocket <code className="text-indigo-400">/topic/admin/check-in</code>
            </p>
          </div>

          {/* Quick Scanner Simulation Input */}
          <div className="glass-card rounded-3xl p-6 border border-slate-700/60 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center">
              <QrCode className="w-5 h-5 text-indigo-400 mr-2" />
              Simulasi Pindai Tiket (Scanner)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan Booking ID untuk menguji broadcast WebSocket seolah-olah kamera scanner membaca QR code tiket.
            </p>

            {scanFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center ${
                  scanFeedback.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {scanFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-400" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleManualScan} className="space-y-3">
              <input
                type="text"
                value={scanBookingId}
                onChange={(e) => setScanBookingId(e.target.value)}
                placeholder="Tempel ID Booking (UUID)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={scanLoading || !scanBookingId.trim()}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center justify-center space-x-2"
              >
                {scanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verifikasi & Siarkan</span>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Event Stream Feed */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 min-h-[500px]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Aktivitas Kehadiran Masuk (Live Stream)</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {notifications.length} Aktivitas Baru
              </span>
            </h2>

            {notifications.length === 0 ? (
              <div className="py-24 text-center">
                <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                <h4 className="text-base font-bold text-slate-300 mb-1">Menunggu Check-In Pertama</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Saat ada tiket yang discan di gerbang acara, data peserta akan langsung muncul di sini secara otomatis melalui WebSocket STOMP.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div
                    key={`${notif.bookingId}-${index}`}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between animate-fade-in hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{notif.attendeeName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {notif.ticketTier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{notif.eventName}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(notif.timestamp).toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
