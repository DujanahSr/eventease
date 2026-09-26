package com.eventease.dto.booking;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketValidationResponseDto {

    private boolean valid;
    private String message;
    private String bookingId;
    private String eventName;
    private String ticketTier;
    private int attendeeCount;
    private String buyerName;
    private String buyerEmail;
    
    @Builder.Default
    private LocalDateTime checkedInAt = LocalDateTime.now();
}
