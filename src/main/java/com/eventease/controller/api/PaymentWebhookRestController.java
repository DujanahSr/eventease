package com.eventease.controller.api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventease.service.api.BookingApiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "6. Webhook Pembayaran", description = "Listener callback notifikasi status transaksi dari payment gateway Midtrans")
@RestController
@RequestMapping({"/api/payments/webhook", "/api/payment/notification"})
@RequiredArgsConstructor
public class PaymentWebhookRestController {

    private final BookingApiService bookingApiService;

    @Operation(summary = "Notifikasi Webhook Midtrans", description = "Menerima callback payload JSON dari Midtrans saat status transaksi berubah (settlement, pending, expire, deny).")
    @PostMapping
    public ResponseEntity<String> handleMidtransNotification(@RequestBody Map<String, Object> payload) {
        log.info("Menerima panggilan webhook pembayaran Midtrans");
        boolean processed = bookingApiService.processPaymentWebhook(payload);

        if (processed) {
            return ResponseEntity.ok("OK");
        } else {
            return ResponseEntity.badRequest().body("Gagal memproses webhook atau signature tidak valid");
        }
    }
}
