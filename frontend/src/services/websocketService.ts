import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Swal from 'sweetalert2';

export interface CheckInNotification {
  bookingId: string;
  eventId: string;
  eventName: string;
  ticketTier: string;
  attendeeCount: number;
  attendeeName: string;
  attendeeEmail: string;
  totalCheckedIn: number;
  timestamp: string;
}

type CheckInCallback = (notification: CheckInNotification) => void;

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private subscribers: Set<CheckInCallback> = new Set();

  public connect(onConnected?: () => void) {
    if (this.client && this.isConnected) {
      if (onConnected) onConnected();
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || '/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // Hanya log saat dev
        if (import.meta.env.DEV) {
          console.debug('[STOMP WebSocket]:', str);
        }
      },
    });

    this.client.onConnect = () => {
      this.isConnected = true;
      if (import.meta.env.DEV) {
        console.log('[STOMP] WebSocket terhubung ke server EventEase');
      }

      // 1. Subscribe ke channel check-in umum
      this.client?.subscribe('/topic/check-in', (message: IMessage) => {
        this.handleIncomingCheckIn(message);
      });

      // 2. Subscribe ke channel check-in admin
      this.client?.subscribe('/topic/admin/check-in', (message: IMessage) => {
        this.handleIncomingCheckIn(message);
      });

      if (onConnected) onConnected();
    };

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.isConnected = false;
      console.warn('[STOMP] Koneksi WebSocket terputus, mencoba rekoneksi otomatis...');
    };

    this.client.activate();
  }

  public subscribeToCheckIn(callback: CheckInCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private handleIncomingCheckIn(message: IMessage) {
    try {
      const payload: CheckInNotification = JSON.parse(message.body);
      if (import.meta.env.DEV) {
        console.log('[STOMP] Check-In diterima:', payload);
      }

      // Tampilkan toast SweetAlert2 yang elegan dan profesional
      this.displayCheckInToast(payload);

      // Teruskan notifikasi ke semua listener/komponen terdaftar
      this.subscribers.forEach((cb) => cb(payload));
    } catch (err) {
      console.error('Gagal mem-parsing payload check-in:', err);
    }
  }

  public displayCheckInToast(notif: CheckInNotification) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4500,
      timerProgressBar: true,
      background: '#111827',
      color: '#ffffff',
      customClass: {
        popup: 'shadow-lg border border-warning',
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: 'success',
      title: `Gate Check-In: ${notif.attendeeName}`,
      html: `
        <div style="text-align: left; font-size: 13px; margin-top: 6px; line-height: 1.5;">
          <div><b style="color: #f59e0b;">Acara:</b> ${notif.eventName}</div>
          <div><b style="color: #38bdf8;">Kategori:</b> ${notif.ticketTier} (${notif.attendeeCount} tiket)</div>
          <div style="color: #34d399; margin-top: 4px; font-weight: 600;">
            <i class="fas fa-users me-1"></i> Total Hadir: ${notif.totalCheckedIn} orang
          </div>
        </div>
      `,
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
      this.client = null;
      if (import.meta.env.DEV) {
        console.log('Koneksi WebSocket ditutup.');
      }
    }
  }
}

export const websocketService = new WebSocketService();
