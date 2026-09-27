export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'ORGANIZER' | 'USER';
  profilePicture?: string;
  saldo?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  eventCount?: number;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  availableStock: number;
}

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  startingPrice: number;
  organizerName?: string;
}

export interface EventDetail {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  imageUrl?: string;
  category?: Category;
  organizer?: User;
  ticketTiers?: TicketTier[];
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface BookingRequestItem {
  ticketCategoryId: string;
  quantity: number;
}

export interface BookingRequest {
  eventId: string;
  items: BookingRequestItem[];
}

export interface BookingResponse {
  bookingId: string;
  bookingCode: string;
  eventName: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  snapToken?: string;
  redirectUrl?: string;
  qrCodeUrl?: string;
}

export interface BookingDetail {
  id: string;
  bookingCode: string;
  event: EventDetail;
  user: User;
  bookingDate: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  qrCodeUrl?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  snapToken?: string;
}
