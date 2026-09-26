import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { CheckInNotification } from '../types';

export const createWebSocketClient = (
  topic: string,
  onMessageReceived: (notification: CheckInNotification) => void
): Client => {
  const socketUrl = import.meta.env.VITE_WS_URL || '/ws';

  const client = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => {
      if (import.meta.env.DEV) {
        console.log('[STOMP WebSocket]:', str);
      }
    },
    onConnect: () => {
      console.log('Terhubung ke WebSocket Server! Berlangganan ke:', topic);
      client.subscribe(topic, (message) => {
        try {
          const payload: CheckInNotification = JSON.parse(message.body);
          onMessageReceived(payload);
        } catch (e) {
          console.error('Gagal parse payload WebSocket:', e);
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP Broker error: ' + frame.headers['message']);
      console.error('Detail: ' + frame.body);
    },
  });

  return client;
};
