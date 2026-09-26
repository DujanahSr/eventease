package com.eventease.websocket.dto;

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
public class CheckInNotificationDto implements Serializable {

    private String bookingId;
    private String eventId;
    private String eventName;
    private String ticketTier;
    private int attendeeCount;
    private String attendeeName;
    private String attendeeEmail;
    private long totalCheckedIn;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
