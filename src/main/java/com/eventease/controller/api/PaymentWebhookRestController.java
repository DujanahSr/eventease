package com.eventease.controller.api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventease.service.api.BookingApiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/payments/webhook", "/api/payment/notification"})
@RequiredArgsConstructor
public class PaymentWebhookRestController {

    private final BookingApiService bookingApiService;

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
