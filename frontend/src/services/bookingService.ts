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
};
