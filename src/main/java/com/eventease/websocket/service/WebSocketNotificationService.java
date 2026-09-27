package com.eventease.websocket.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.eventease.model.Booking;
import com.eventease.repository.BookingRepository;
import com.eventease.websocket.dto.CheckInNotificationDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final BookingRepository bookingRepository;

    /**
     * Mengirim notifikasi real-time via WebSocket STOMP saat peserta berhasil check-in.
     * Dashboard Penyelenggara & Admin akan menerima pembaruan seketika tanpa refresh.
     */
    public void notifyCheckIn(Booking booking) {
        if (booking == null || booking.getTicketCategory() == null || booking.getTicketCategory().getEvent() == null) {
            return;
        }

        try {
            String eventId = booking.getTicketCategory().getEvent().getId();
            String eventName = booking.getTicketCategory().getEvent().getName();

            // Hitung total peserta yang sudah check-in pada acara ini
            long totalCheckedIn = bookingRepository.countByTicketCategoryEventIdAndStatus(eventId, Booking.Status.CHECKED_IN);

            CheckInNotificationDto payload = CheckInNotificationDto.builder()
                    .bookingId(booking.getId())
                    .eventId(eventId)
                    .eventName(eventName)
                    .ticketTier(booking.getTicketCategory().getName())
                    .attendeeCount(booking.getParticipants())
                    .attendeeName(booking.getUser() != null ? booking.getUser().getName() : "Guest")
                    .attendeeEmail(booking.getUser() != null ? booking.getUser().getEmail() : "")
                    .totalCheckedIn(totalCheckedIn)
                    .build();

            // 1. Broadcast ke channel spesifik acara ini (didengarkan oleh dashboard organizer acara)
            String eventTopic = "/topic/events/" + eventId + "/check-in";
            messagingTemplate.convertAndSend(eventTopic, payload);
            log.info("WebSocket Broadcast ke [{}]: Peserta {} check-in di {}", eventTopic, payload.getAttendeeName(), eventName);

            // 2. Broadcast ke channel command center Admin
            String adminTopic = "/topic/admin/check-in";
            messagingTemplate.convertAndSend(adminTopic, payload);

            // 3. Broadcast ke channel umum /topic/check-in
            messagingTemplate.convertAndSend("/topic/check-in", payload);

        } catch (Exception ex) {
            log.warn("Gagal menyiarkan notifikasi WebSocket: {}", ex.getMessage());
        }
    }
}
