export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePicture?: string;
  saldo: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  description: string;
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
  organizerName: string;
}

export interface EventDetail {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  imageUrl?: string;
  category: Category;
  organizer: User;
  ticketTiers: TicketTier[];
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
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

export interface BookingResponse {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl?: string;
  ticketCategoryName: string;
  quantity: number;
  pricePerTicket: number;
  totalAmount: number;
  status: string;
  snapToken?: string;
  buyerName: string;
  buyerEmail: string;
  bookingDate: string;
}

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
