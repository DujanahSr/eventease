package com.eventease.dto.booking;

import java.time.LocalDate;

import com.eventease.model.Booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDto {

    private String id;
    private String eventId;
    private String eventName;
    private String eventDate;
    private String eventLocation;
    private String eventImageUrl;
    private String ticketCategoryName;
    private int quantity;
    private double pricePerTicket;
    private double totalAmount;
    private String status;
    private String snapToken;
    private String buyerName;
    private String buyerEmail;
    private LocalDate bookingDate;

    public static BookingResponseDto fromEntity(Booking booking, String snapToken) {
        if (booking == null) return null;

        double unitPrice = booking.getTicketCategory() != null ? booking.getTicketCategory().getPrice() : 0.0;
        double total = unitPrice * booking.getParticipants();

        return BookingResponseDto.builder()
                .id(booking.getId())
                .eventId(booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null 
                        ? booking.getTicketCategory().getEvent().getId() : null)
                .eventName(booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null 
                        ? booking.getTicketCategory().getEvent().getName() : null)
                .eventDate(booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null 
                        ? booking.getTicketCategory().getEvent().getDate() : null)
                .eventLocation(booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null 
                        ? booking.getTicketCategory().getEvent().getLocation() : null)
                .eventImageUrl(booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null 
                        ? booking.getTicketCategory().getEvent().getImageUrl() : null)
                .ticketCategoryName(booking.getTicketCategory() != null ? booking.getTicketCategory().getName() : null)
                .quantity(booking.getParticipants())
                .pricePerTicket(unitPrice)
                .totalAmount(total)
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .snapToken(snapToken)
                .buyerName(booking.getUser() != null ? booking.getUser().getName() : null)
                .buyerEmail(booking.getUser() != null ? booking.getUser().getEmail() : null)
                .bookingDate(booking.getEventDate())
                .build();
    }
}
