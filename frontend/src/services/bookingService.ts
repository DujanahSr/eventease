import api from './api';
import { ApiResponse } from '../types';

export interface BookingRequestPayload {
  ticketCategoryId: string;
  quantity: number;
}

export interface BookingResponseData {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl: string;
  ticketCategoryName: string;
  quantity: number;
  pricePerTicket: number;
  totalAmount: number;
  status: string;
  snapToken: string;
  buyerName: string;
  buyerEmail: string;
  bookingDate: string;
  bookingCode?: string;
}

export const bookingService = {
  async createBooking(payload: BookingRequestPayload): Promise<BookingResponseData> {
    const res = await api.post<ApiResponse<BookingResponseData>>('/bookings', payload);
    return res.data.data;
  },

  async getMyTickets(): Promise<BookingResponseData[]> {
    const res = await api.get<ApiResponse<BookingResponseData[]>>('/bookings/my-tickets');
    return res.data.data;
  },

  async getBookingById(id: string): Promise<BookingResponseData> {
    const res = await api.get<ApiResponse<BookingResponseData>>(`/bookings/${id}`);
    return res.data.data;
  },

  async exportBookingsExcel(eventId?: string): Promise<Blob> {
    const params = eventId ? { eventId } : {};
    const res = await api.get('/bookings/export/excel', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  async payBooking(id: string): Promise<BookingResponseData> {
    const res = await api.post<ApiResponse<BookingResponseData>>(`/bookings/${id}/pay`);
    return res.data.data;
  },

  async cancelBooking(id: string): Promise<void> {
    await api.post(`/bookings/${id}/cancel`);
  },

  async verifyPayment(id: string, payload?: any): Promise<BookingResponseData> {
    const res = await api.post<ApiResponse<BookingResponseData>>(`/bookings/${id}/verify-payment`, payload || {});
    return res.data.data;
  },

  async getAllBookings(): Promise<BookingResponseData[]> {
    const res = await api.get<ApiResponse<BookingResponseData[]>>('/bookings/all');
    return res.data.data;
  },

  async manualConfirmPayment(id: string): Promise<BookingResponseData> {
    const res = await api.post<ApiResponse<BookingResponseData>>(`/bookings/${id}/manual-confirm`);
    return res.data.data;
  },

  async downloadTicketPdf(id: string, eventName?: string): Promise<void> {
    const res = await api.get(`/bookings/${id}/ticket-pdf`, {
      responseType: 'blob',
    });
    const safeTitle = (eventName || 'Acara').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Eventease_ETicket_${safeTitle}_${id.substring(0, 8).toUpperCase()}.pdf`;
    triggerFileDownload(res.data, filename);
  },
};

export const triggerFileDownload = (blob: Blob, defaultFilename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

