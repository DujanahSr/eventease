package com.eventease.messaging.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketFulfillmentMessage implements Serializable {

    private String bookingId;
    private String userEmail;
    private String buyerName;
    private String eventName;
    private String ticketTier;
    private int quantity;
    private double totalAmount;

    @Builder.Default
    private LocalDateTime publishedAt = LocalDateTime.now();
}
