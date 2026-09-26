package com.eventease.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventease.common.ApiResponse;
import com.eventease.dto.booking.TicketValidationRequestDto;
import com.eventease.dto.booking.TicketValidationResponseDto;
import com.eventease.security.UserPrincipal;
import com.eventease.service.api.BookingApiService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/scanner")
@RequiredArgsConstructor
public class ScannerRestController {

    private final BookingApiService bookingApiService;

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TicketValidationResponseDto>> verifyAndCheckInTicket(
            @Valid @RequestBody TicketValidationRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Pindai & verifikasi QR code tiket: {} oleh organizer: {}", requestDto.getBookingId(), userPrincipal.getUsername());
        TicketValidationResponseDto result = bookingApiService.validateAndCheckInTicket(requestDto.getBookingId(), userPrincipal);

        if (result.isValid()) {
            return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
        } else {
            return ResponseEntity.ok(ApiResponse.error(result.getMessage()));
        }
    }
}
