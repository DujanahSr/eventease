package com.eventease.service.api;

import java.util.List;
import java.util.Map;

import com.eventease.dto.booking.BookingRequestDto;
import com.eventease.dto.booking.BookingResponseDto;
import com.eventease.dto.booking.TicketValidationResponseDto;
import com.eventease.security.UserPrincipal;

public interface BookingApiService {
    BookingResponseDto createBooking(BookingRequestDto requestDto, UserPrincipal userPrincipal);
    List<BookingResponseDto> getMyBookings(UserPrincipal userPrincipal);
    BookingResponseDto getBookingById(String bookingId, UserPrincipal userPrincipal);
    byte[] getTicketPdf(String bookingId, UserPrincipal userPrincipal);
    TicketValidationResponseDto validateAndCheckInTicket(String bookingId, UserPrincipal userPrincipal);
    boolean processPaymentWebhook(Map<String, Object> payload);
    byte[] exportBookingsExcel(String eventId, UserPrincipal userPrincipal);
    BookingResponseDto payBooking(String bookingId, UserPrincipal userPrincipal);
    void cancelBooking(String bookingId, UserPrincipal userPrincipal);
    BookingResponseDto verifyPayment(String bookingId, Map<String, Object> payload, UserPrincipal userPrincipal);
    List<BookingResponseDto> getAllBookings(UserPrincipal userPrincipal);
    BookingResponseDto manualConfirmPayment(String bookingId, UserPrincipal userPrincipal);
    void resendTicketEmail(String bookingId, UserPrincipal userPrincipal);
}
