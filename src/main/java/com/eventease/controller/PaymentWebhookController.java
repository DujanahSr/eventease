package com.eventease.controller;

import com.eventease.model.Booking;
import com.eventease.service.BookingService;
import com.eventease.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final BookingService bookingService;
    private final EmailService emailService;
    private final com.eventease.service.PdfService pdfService;

    @PostMapping("/notification")
    public ResponseEntity<String> handleNotification(@RequestBody Map<String, Object> payload) {
        String orderId = (String) payload.get("order_id");
        String transactionStatus = (String) payload.get("transaction_status");

        if (orderId != null && transactionStatus != null) {
            // Karena order_id dikirim dengan format bookingId-timestamp, kita harus memisahkannya
            String realBookingId = orderId.split("-")[0];
            Booking booking = bookingService.findById(realBookingId);
            if (booking != null) {
                if (transactionStatus.equals("settlement") || transactionStatus.equals("capture")) {
                    // Only send email if previously not paid
                    if (booking.getStatus() != Booking.Status.PAID) {
                        booking.setStatus(Booking.Status.PAID);
                        bookingService.save(booking);
                        try {
                            byte[] pdfBytes = pdfService.generateTicketPdf(booking);
                            emailService.sendETicketEmail(booking, pdfBytes);
                        } catch (Exception e) {
                            System.err.println("Gagal membuat tiket PDF: " + e.getMessage());
                            emailService.sendETicketEmail(booking, null); // fallback tanpa PDF
                        }
                    }
                } else if (transactionStatus.equals("cancel") || transactionStatus.equals("expire") || transactionStatus.equals("deny")) {
                    // CANCELED restores stock via bookingService.cancelBooking
                    bookingService.cancelBooking(realBookingId);
                }
            }
        }
        
        return ResponseEntity.ok("OK");
    }
}
