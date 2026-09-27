package com.eventease.controller.api;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.dto.booking.BookingRequestDto;
import com.eventease.dto.booking.BookingResponseDto;
import com.eventease.security.UserPrincipal;
import com.eventease.service.api.BookingApiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "4. Pemesanan & Tiket", description = "Reservasi tiket, integrasi Snap Midtrans, tiket saya, dan unduh PDF")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingRestController {

    private final BookingApiService bookingApiService;

    @Operation(summary = "Pesan Tiket Acara", description = "Membuat pesanan tiket baru dan mengembalikan token Snap Midtrans untuk pembayaran.")
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponseDto>> createBooking(
            @Valid @RequestBody BookingRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Pesan tiket oleh: {}", userPrincipal.getUsername());
        BookingResponseDto response = bookingApiService.createBooking(requestDto, userPrincipal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pesanan tiket berhasil dibuat", response));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getMyTickets(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Ambil tiket milik: {}", userPrincipal.getUsername());
        List<BookingResponseDto> tickets = bookingApiService.getMyBookings(userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Daftar tiket Anda berhasil diambil", tickets));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponseDto>> getBookingById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Ambil detail booking ID: {}", id);
        BookingResponseDto booking = bookingApiService.getBookingById(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Detail pesanan ditemukan", booking));
    }

    @GetMapping("/{id}/ticket-pdf")
    public ResponseEntity<byte[]> downloadTicketPdf(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Unduh tiket PDF ID: {}", id);
        byte[] pdfBytes = bookingApiService.getTicketPdf(id, userPrincipal);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Eventease_Ticket_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
