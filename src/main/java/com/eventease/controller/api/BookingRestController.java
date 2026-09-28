package com.eventease.controller.api;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.dto.booking.BookingRequestDto;
import com.eventease.dto.booking.BookingResponseDto;
import com.eventease.ratelimit.RateLimited;
import com.eventease.security.UserPrincipal;
import com.eventease.service.api.BookingApiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "4. Pemesanan & Tiket", description = "Reservasi tiket, integrasi Snap Midtrans, tiket saya, unduh PDF, dan ekspor laporan Excel")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingRestController {

    private final BookingApiService bookingApiService;

    @Operation(summary = "Pesan Tiket Acara (Anti-Bot Rate Limited)", description = "Membuat pesanan tiket baru. Dilindungi rate limit 5 req/menit per IP untuk mencegah bot/calo tiket.")
    @RateLimited(key = "booking", limit = 5, duration = 60, message = "Batas transaksi tercapai. Anda hanya dapat melakukan 5 permintaan pemesanan tiket per menit untuk mencegah calo/bot.")
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

    @Operation(summary = "Ekspor Laporan Penjualan Tiket ke Excel (.xlsx)", description = "Menghasilkan dan mengunduh laporan penjualan tiket format Microsoft Excel (Apache POI). Khusus Penyelenggara & Admin.")
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportBookingsExcel(
            @RequestParam(required = false) String eventId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Unduh laporan penjualan Excel oleh: {}, eventId: {}", userPrincipal.getUsername(), eventId);
        byte[] excelBytes = bookingApiService.exportBookingsExcel(eventId, userPrincipal);

        String filename = "Laporan_Penjualan_Eventease_" + System.currentTimeMillis() + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
    }

    @Operation(summary = "Selesaikan Pembayaran Pesanan", description = "Mendapatkan Snap Token Midtrans untuk menyelesaikan pembayaran tiket yang berstatus PENDING")
    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<BookingResponseDto>> payBooking(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Selesaikan pembayaran booking ID: {} oleh user: {}", id, userPrincipal.getUsername());
        BookingResponseDto booking = bookingApiService.payBooking(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Sesi pembayaran berhasil dibuat", booking));
    }

    @Operation(summary = "Batalkan Pesanan Tiket", description = "Membatalkan tiket yang berstatus PENDING dan mengembalikan kuota kursi")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Batalkan pesanan booking ID: {} oleh user: {}", id, userPrincipal.getUsername());
        bookingApiService.cancelBooking(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Pesanan tiket berhasil dibatalkan", null));
    }

    @Operation(summary = "Verifikasi / Sinkronisasi Pembayaran Tiket", description = "Memverifikasi hasil callback Snap dan mengecek status transaksi ke cloud Midtrans secara instan")
    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<ApiResponse<BookingResponseDto>> verifyPayment(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Verifikasi pembayaran booking ID: {} oleh user: {}", id, userPrincipal.getUsername());
        BookingResponseDto booking = bookingApiService.verifyPayment(id, payload, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Status pembayaran berhasil diverifikasi", booking));
    }

    @Operation(summary = "Daftar Seluruh Transaksi Tiket (Admin & Organizer)", description = "Menampilkan semua transaksi booking tiket sesuai hak akses")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getAllBookings(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Ambil semua transaksi tiket oleh: {}", userPrincipal.getUsername());
        List<BookingResponseDto> bookings = bookingApiService.getAllBookings(userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Seluruh data transaksi berhasil dimuat", bookings));
    }

    @Operation(summary = "Konfirmasi Manual Pembayaran (Admin & Organizer)", description = "Menandai tiket menjadi LUNAS (PAID) secara manual untuk transaksi offline/transfer")
    @PostMapping("/{id}/manual-confirm")
    public ResponseEntity<ApiResponse<BookingResponseDto>> manualConfirmPayment(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Konfirmasi manual pembayaran booking ID: {} oleh: {}", id, userPrincipal.getUsername());
        BookingResponseDto booking = bookingApiService.manualConfirmPayment(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Tiket berhasil dikonfirmasi LUNAS", booking));
    }
}
