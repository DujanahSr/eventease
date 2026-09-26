package com.eventease.messaging.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import com.eventease.messaging.RabbitMQConfig;
import com.eventease.messaging.dto.TicketFulfillmentMessage;
import com.eventease.model.Booking;
import com.eventease.repository.BookingRepository;
import com.eventease.service.EmailService;
import com.eventease.service.PdfService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketFulfillmentConsumer {

    private final BookingRepository bookingRepository;
    private final PdfService pdfService;
    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_TICKET_FULFILLMENT)
    public void handleTicketFulfillment(TicketFulfillmentMessage message) {
        log.info("RabbitMQ Consumer: Menerima tugas penerbitan e-tiket untuk Booking ID: {}", message.getBookingId());

        try {
            Booking booking = bookingRepository.findById(message.getBookingId()).orElse(null);
            if (booking == null) {
                log.error("Pesanan tiket ID {} tidak ditemukan saat memproses antrean RabbitMQ", message.getBookingId());
                return;
            }

            // Generate PDF tiket
            byte[] pdfBytes = pdfService.generateTicketPdf(booking);

            // Kirim notifikasi email beserta lampiran e-tiket PDF
            emailService.sendETicketEmail(booking, pdfBytes);

            log.info("RabbitMQ Consumer: Berhasil memproses e-tiket dan mengirimkan email ke {}", message.getUserEmail());

        } catch (Exception ex) {
            log.error("RabbitMQ Consumer: Terjadi kesalahan saat memproses e-tiket untuk Booking ID {}: {}", 
                    message.getBookingId(), ex.getMessage(), ex);
        }
    }
}
