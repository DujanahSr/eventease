package com.eventease.service.api;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.constant.RoleConstants;
import com.eventease.dto.booking.BookingRequestDto;
import com.eventease.dto.booking.BookingResponseDto;
import com.eventease.dto.booking.TicketValidationResponseDto;
import com.eventease.exception.BadRequestException;
import com.eventease.exception.ForbiddenException;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.exception.UnauthorizedException;
import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Event;
import com.eventease.model.Payment;
import com.eventease.model.TicketCategory;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.EventRepository;
import com.eventease.repository.PaymentRepository;
import com.eventease.repository.TicketCategoryRepository;
import com.eventease.security.UserPrincipal;
import com.eventease.service.EmailService;
import com.eventease.service.MidtransService;
import com.eventease.service.PdfService;
import com.eventease.service.export.ExcelExportService;
import com.eventease.util.MidtransSignatureVerifier;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingApiServiceImpl implements BookingApiService {

    private final BookingRepository bookingRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final EventRepository eventRepository;
    private final PaymentRepository paymentRepository;
    private final MidtransService midtransService;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final ExcelExportService excelExportService;
    private final com.eventease.messaging.producer.TicketFulfillmentProducer ticketFulfillmentProducer;
    private final com.eventease.websocket.service.WebSocketNotificationService webSocketNotificationService;

    @Value("${midtrans.server.key}")
    private String serverKey;

    @Override
    @Transactional
    public BookingResponseDto createBooking(BookingRequestDto requestDto, UserPrincipal userPrincipal) {
        log.info("Membuat pesanan tiket kategori ID: {} oleh user: {}", requestDto.getTicketCategoryId(), userPrincipal.getEmail());

        TicketCategory ticketCategory = ticketCategoryRepository.findById(requestDto.getTicketCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori Tiket", "id", requestDto.getTicketCategoryId()));

        if (requestDto.getQuantity() > ticketCategory.getAvailableStock()) {
            throw new BadRequestException("Jumlah tiket yang diminta (" + requestDto.getQuantity() + 
                    ") melebihi stok yang tersedia (" + ticketCategory.getAvailableStock() + ").");
        }

        // Kurangi stok sementara untuk pemesanan ini
        ticketCategory.setAvailableStock(ticketCategory.getAvailableStock() - requestDto.getQuantity());
        ticketCategoryRepository.save(ticketCategory);

        Booking booking = new Booking();
        booking.setUser(userPrincipal.getAkun());
        booking.setTicketCategory(ticketCategory);
        booking.setParticipants(requestDto.getQuantity());
        booking.setEventDate(LocalDate.now());
        booking.setStatus(Booking.Status.PENDING);

        Booking savedBooking = bookingRepository.save(booking);

        // Minta Snap Token dari Midtrans
        String snapToken = null;
        try {
            snapToken = midtransService.getSnapToken(savedBooking);
        } catch (Exception ex) {
            log.error("Gagal mendapatkan Snap Token dari Midtrans: {}", ex.getMessage());
        }

        return BookingResponseDto.fromEntity(savedBooking, snapToken);
    }

    @Override
    @Transactional
    public List<BookingResponseDto> getMyBookings(UserPrincipal userPrincipal) {
        log.info("Mengambil riwayat tiket untuk user: {}", userPrincipal.getEmail());
        List<Booking> bookings = bookingRepository.findByUser(userPrincipal.getAkun());
        for (Booking booking : bookings) {
            if (booking.getStatus() == Booking.Status.PENDING) {
                autoCheckPendingBooking(booking);
            }
        }
        return bookings.stream()
                .map(b -> BookingResponseDto.fromEntity(b, b.getSnapToken()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponseDto getBookingById(String bookingId, UserPrincipal userPrincipal) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        validateBookingAccess(booking, userPrincipal);
        if (booking.getStatus() == Booking.Status.PENDING) {
            autoCheckPendingBooking(booking);
        }
        return BookingResponseDto.fromEntity(booking, booking.getSnapToken());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getTicketPdf(String bookingId, UserPrincipal userPrincipal) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        validateBookingAccess(booking, userPrincipal);

        if (booking.getStatus() != Booking.Status.PAID && booking.getStatus() != Booking.Status.CHECKED_IN) {
            throw new BadRequestException("Tiket belum lunas atau tidak aktif. Status saat ini: " + booking.getStatus());
        }

        try {
            return pdfService.generateTicketPdf(booking);
        } catch (Exception e) {
            log.error("Gagal membuat file PDF tiket: ", e);
            throw new BadRequestException("Gagal mengunduh tiket PDF: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public TicketValidationResponseDto validateAndCheckInTicket(String bookingId, UserPrincipal userPrincipal) {
        log.info("Validasi QR Code tiket: {} oleh organizer: {}", bookingId, userPrincipal.getEmail());

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return TicketValidationResponseDto.builder()
                    .valid(false)
                    .message("Tiket tidak ditemukan dalam sistem.")
                    .bookingId(bookingId)
                    .build();
        }

        // Pastikan pemindai adalah penyelenggara acara tersebut atau platform ADMIN
        boolean isAdmin = userPrincipal.getRole().equalsIgnoreCase(RoleConstants.ROLE_ADMIN);
        Akun organizer = booking.getTicketCategory().getEvent().getOrganizer();
        boolean isOwner = organizer != null && organizer.getId().equals(userPrincipal.getId());

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("Akses ditolak: Tiket ini bukan untuk acara yang Anda selenggarakan.");
        }

        if (booking.getStatus() == Booking.Status.CHECKED_IN) {
            return TicketValidationResponseDto.builder()
                    .valid(false)
                    .message("Tiket sudah pernah digunakan sebelumnya (Sudah Check-In).")
                    .bookingId(booking.getId())
                    .eventName(booking.getTicketCategory().getEvent().getName())
                    .ticketTier(booking.getTicketCategory().getName())
                    .attendeeCount(booking.getParticipants())
                    .buyerName(booking.getUser().getName())
                    .buyerEmail(booking.getUser().getEmail())
                    .build();
        }

        if (booking.getStatus() != Booking.Status.PAID) {
            return TicketValidationResponseDto.builder()
                    .valid(false)
                    .message("Tiket belum lunas atau telah dibatalkan. Status: " + booking.getStatus())
                    .bookingId(booking.getId())
                    .build();
        }

        // Tiket valid -> tandai CHECKED_IN
        booking.setStatus(Booking.Status.CHECKED_IN);
        bookingRepository.save(booking);

        // Siarkan notifikasi kehadiran real-time ke Dashboard via WebSocket STOMP
        webSocketNotificationService.notifyCheckIn(booking);

        return TicketValidationResponseDto.builder()
                .valid(true)
                .message("Check-in Berhasil! Tiket valid.")
                .bookingId(booking.getId())
                .eventName(booking.getTicketCategory().getEvent().getName())
                .ticketTier(booking.getTicketCategory().getName())
                .attendeeCount(booking.getParticipants())
                .buyerName(booking.getUser().getName())
                .buyerEmail(booking.getUser().getEmail())
                .checkedInAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public boolean processPaymentWebhook(Map<String, Object> payload) {
        String orderId = (String) payload.get("order_id");
        String statusCode = (String) payload.get("status_code");
        String grossAmount = (String) payload.get("gross_amount");
        String signatureKey = (String) payload.get("signature_key");
        String transactionStatus = (String) payload.get("transaction_status");

        log.info("Menerima notifikasi Midtrans: orderId={}, status={}", orderId, transactionStatus);

        if (orderId == null || transactionStatus == null) {
            log.warn("Payload Webhook Midtrans tidak lengkap");
            return false;
        }

        // 1. Verifikasi Kriptografis Signature Key Midtrans (SHA-512)
        if (signatureKey != null && !MidtransSignatureVerifier.verify(orderId, statusCode, grossAmount, serverKey, signatureKey)) {
            log.error("Signature Key Midtrans TIDAK VALID! Potensi manipulasi request webhook.");
            return false;
        }

        // 2. Ekstrak real bookingId (mendukung format UUID 36-karakter atau bookingId_timestamp)
        String realBookingId = orderId;
        if (bookingRepository.findById(orderId).isPresent()) {
            realBookingId = orderId;
        } else if (orderId.contains("_")) {
            realBookingId = orderId.substring(0, orderId.indexOf('_'));
        } else if (orderId.length() >= 36 && bookingRepository.findById(orderId.substring(0, 36)).isPresent()) {
            realBookingId = orderId.substring(0, 36);
        }

        Booking booking = bookingRepository.findById(realBookingId).orElse(null);
        if (booking == null) {
            log.warn("Pesanan dengan ID: {} tidak ditemukan", realBookingId);
            return false;
        }

        // 3. Pengecekan IDEMPOTENSI (Mencegah double processing jika webhook dikirim berulang)
        if (booking.getStatus() == Booking.Status.PAID) {
            log.info("Idempotent Guard: Booking {} sudah berstatus PAID. Mengabaikan eksekusi ulang.", realBookingId);
            return true;
        }

        // 4. Proses status transaksi
        if ("settlement".equals(transactionStatus) || "capture".equals(transactionStatus)) {
            markBookingAsPaidAndFulfill(booking, Double.parseDouble(grossAmount));
            return true;

        } else if ("cancel".equals(transactionStatus) || "expire".equals(transactionStatus) || "deny".equals(transactionStatus)) {
            booking.setStatus(Booking.Status.CANCELED);
            bookingRepository.save(booking);

            // Kembalikan stok tiket yang sempat ditahan
            TicketCategory ticketCategory = booking.getTicketCategory();
            if (ticketCategory != null) {
                ticketCategory.setAvailableStock(ticketCategory.getAvailableStock() + booking.getParticipants());
                ticketCategoryRepository.save(ticketCategory);
            }

            log.info("Pesanan {} dibatalkan/kedaluwarsa. Stok tiket telah dikembalikan.", realBookingId);
            return true;
        }

        return true;
    }

    private void validateBookingAccess(Booking booking, UserPrincipal userPrincipal) {
        boolean isAdmin = userPrincipal.getRole().equalsIgnoreCase(RoleConstants.ROLE_ADMIN);
        boolean isBuyer = booking.getUser() != null && booking.getUser().getId().equals(userPrincipal.getId());
        
        Akun organizer = booking.getTicketCategory().getEvent().getOrganizer();
        boolean isOrganizer = organizer != null && organizer.getId().equals(userPrincipal.getId());

        if (!isAdmin && !isBuyer && !isOrganizer) {
            throw new ForbiddenException("Akses ditolak: Anda tidak memiliki izin untuk melihat pesanan tiket ini.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportBookingsExcel(String eventId, UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new UnauthorizedException("Autentikasi diperlukan untuk mengunduh laporan penjualan");
        }

        String role = userPrincipal.getRole() != null ? userPrincipal.getRole().toUpperCase() : "USER";
        if (!role.contains("ADMIN") && !role.contains("ORGANIZER")) {
            throw new ForbiddenException("Hanya Penyelenggara Acara atau Admin yang diizinkan mengunduh laporan penjualan.");
        }

        List<Booking> bookings;
        String reportTitle;

        if (role.contains("ORGANIZER")) {
            Akun organizer = userPrincipal.getAkun();
            if (eventId != null && !eventId.isBlank()) {
                Event event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
                bookings = bookingRepository.findByTicketCategoryEventIdAndTicketCategoryEventOrganizer(eventId, organizer);
                reportTitle = "Laporan Penjualan Tiket - " + event.getName();
            } else {
                bookings = bookingRepository.findByTicketCategoryEventOrganizerOrderByEventDateAsc(organizer);
                reportTitle = "Laporan Penjualan Tiket Seluruh Acara - " + organizer.getName();
            }
        } else {
            // Role ADMIN
            if (eventId != null && !eventId.isBlank()) {
                Event event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
                bookings = bookingRepository.findByTicketCategoryEventId(eventId);
                reportTitle = "Laporan Penjualan Tiket - " + event.getName();
            } else {
                bookings = bookingRepository.findAll();
                reportTitle = "Laporan Konsolidasi Penjualan Seluruh Acara - Eventease Platform";
            }
        }

        try {
            return excelExportService.exportBookingsReport(reportTitle, bookings);
        } catch (Exception ex) {
            log.error("Gagal menghasilkan file Excel laporan penjualan: ", ex);
            throw new RuntimeException("Gagal mengekspor laporan ke Excel: " + ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional
    public BookingResponseDto payBooking(String bookingId, UserPrincipal userPrincipal) {
        log.info("Meminta Snap Token untuk booking ID: {} oleh user: {}", bookingId, userPrincipal.getEmail());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        validateBookingAccess(booking, userPrincipal);

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new BadRequestException("Pesanan ini tidak dapat dibayar karena status saat ini: " + booking.getStatus());
        }

        String snapToken = null;
        try {
            snapToken = midtransService.getSnapToken(booking);
            if (snapToken != null && !snapToken.startsWith("Error")) {
                bookingRepository.save(booking);
            }
        } catch (Exception ex) {
            log.error("Gagal meminta Snap Token Midtrans untuk booking {}: {}", bookingId, ex.getMessage());
            throw new BadRequestException("Gagal menghubungkan ke gateway pembayaran Midtrans: " + ex.getMessage());
        }

        return BookingResponseDto.fromEntity(booking, snapToken);
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingId, UserPrincipal userPrincipal) {
        log.info("Membatalkan pesanan booking ID: {} oleh user: {}", bookingId, userPrincipal.getEmail());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        validateBookingAccess(booking, userPrincipal);

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new BadRequestException("Hanya pesanan berstatus MENUNGGU PEMBAYARAN yang dapat dibatalkan.");
        }

        booking.setStatus(Booking.Status.CANCELED);
        bookingRepository.save(booking);

        // Kembalikan kuota tiket ke kategori terkait
        TicketCategory tc = booking.getTicketCategory();
        if (tc != null) {
            tc.setAvailableStock(tc.getAvailableStock() + booking.getParticipants());
            ticketCategoryRepository.save(tc);
            log.info("Stok tiket kategori {} berhasil dipulihkan sebanyak {}", tc.getName(), booking.getParticipants());
        }
    }

    @Override
    @Transactional
    public BookingResponseDto verifyPayment(String bookingId, Map<String, Object> payload, UserPrincipal userPrincipal) {
        log.info("Verifikasi status pembayaran untuk booking ID: {} oleh user: {}", bookingId, userPrincipal.getEmail());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        validateBookingAccess(booking, userPrincipal);

        if (booking.getStatus() == Booking.Status.PAID) {
            log.info("Booking {} sudah berstatus PAID", bookingId);
            return BookingResponseDto.fromEntity(booking, null);
        }

        String orderId = payload != null && payload.get("orderId") != null ? (String) payload.get("orderId") : null;
        if (orderId == null && payload != null && payload.get("order_id") != null) {
            orderId = (String) payload.get("order_id");
        }

        boolean isPaidOnMidtrans = false;

        // 1. Cek langsung ke API Midtrans jika orderId tersedia
        if (orderId != null && !orderId.isBlank()) {
            Map<String, Object> midtransStatus = midtransService.getTransactionStatus(orderId);
            if (midtransStatus != null) {
                String txStatus = (String) midtransStatus.get("transaction_status");
                String fraudStatus = (String) midtransStatus.get("fraud_status");
                if ("settlement".equalsIgnoreCase(txStatus) ||
                    ("capture".equalsIgnoreCase(txStatus) && !"challenge".equalsIgnoreCase(fraudStatus))) {
                    isPaidOnMidtrans = true;
                }
            }
        }

        // 2. Jika result dari snap callback mengindikasikan status success
        String clientTxStatus = payload != null ? (String) payload.get("transactionStatus") : null;
        if (clientTxStatus == null && payload != null) {
            clientTxStatus = (String) payload.get("transaction_status");
        }
        if ("settlement".equalsIgnoreCase(clientTxStatus) || "capture".equalsIgnoreCase(clientTxStatus) || "success".equalsIgnoreCase(clientTxStatus)) {
            isPaidOnMidtrans = true;
        }

        // 3. Fallback: jika user di sandbox/dev mode memicu verifikasi
        if (payload != null && Boolean.TRUE.equals(payload.get("forceVerify"))) {
            isPaidOnMidtrans = true;
        }

        if (isPaidOnMidtrans) {
            double amount = booking.getTicketCategory().getPrice() * booking.getParticipants();
            markBookingAsPaidAndFulfill(booking, amount);
            log.info("Pembayaran berhasil diverifikasi secara instan untuk booking: {}", bookingId);
        }

        return BookingResponseDto.fromEntity(booking, null);
    }

    @Override
    @Transactional
    public List<BookingResponseDto> getAllBookings(UserPrincipal userPrincipal) {
        String role = userPrincipal.getRole() != null ? userPrincipal.getRole().toUpperCase() : "USER";
        List<Booking> bookings;

        if (role.contains("ADMIN")) {
            bookings = bookingRepository.findAll();
        } else if (role.contains("ORGANIZER")) {
            bookings = bookingRepository.findByTicketCategoryEventOrganizerOrderByEventDateAsc(userPrincipal.getAkun());
        } else {
            bookings = bookingRepository.findByUser(userPrincipal.getAkun());
        }

        for (Booking booking : bookings) {
            if (booking.getStatus() == Booking.Status.PENDING) {
                autoCheckPendingBooking(booking);
            }
        }

        return bookings.stream()
                .map(b -> BookingResponseDto.fromEntity(b, b.getSnapToken()))
                .collect(Collectors.toList());
    }

    private void autoCheckPendingBooking(Booking booking) {
        try {
            boolean isPaid = false;
            // 1. Cek status ke Midtrans API menggunakan midtransOrderId jika tersedia
            if (booking.getMidtransOrderId() != null && !booking.getMidtransOrderId().isBlank()) {
                Map<String, Object> status = midtransService.getTransactionStatus(booking.getMidtransOrderId());
                if (status != null) {
                    String txStatus = (String) status.get("transaction_status");
                    String fraudStatus = (String) status.get("fraud_status");
                    if ("settlement".equalsIgnoreCase(txStatus) || 
                        ("capture".equalsIgnoreCase(txStatus) && !"challenge".equalsIgnoreCase(fraudStatus))) {
                        isPaid = true;
                    }
                }
            }

            // 2. Cek status ke Midtrans API menggunakan booking.getId() jika order_id memakai format UUID asli
            if (!isPaid) {
                Map<String, Object> status = midtransService.getTransactionStatus(booking.getId());
                if (status != null) {
                    String txStatus = (String) status.get("transaction_status");
                    String fraudStatus = (String) status.get("fraud_status");
                    if ("settlement".equalsIgnoreCase(txStatus) || 
                        ("capture".equalsIgnoreCase(txStatus) && !"challenge".equalsIgnoreCase(fraudStatus))) {
                        isPaid = true;
                    }
                }
            }

            if (isPaid) {
                double amount = booking.getTicketCategory().getPrice() * booking.getParticipants();
                markBookingAsPaidAndFulfill(booking, amount);
                log.info("Auto-sync: Status booking {} berhasil diverifikasi dan otomatis diubah menjadi PAID", booking.getId());
            }
        } catch (Exception ex) {
            log.warn("Auto-check booking {} dilewati: {}", booking.getId(), ex.getMessage());
        }
    }

    @Override
    @Transactional
    public BookingResponseDto manualConfirmPayment(String bookingId, UserPrincipal userPrincipal) {
        String role = userPrincipal.getRole() != null ? userPrincipal.getRole().toUpperCase() : "USER";
        if (!role.contains("ADMIN") && !role.contains("ORGANIZER")) {
            throw new ForbiddenException("Hanya Admin atau Penyelenggara yang dapat mengonfirmasi pembayaran secara manual.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan Tiket", "id", bookingId));

        if (booking.getStatus() == Booking.Status.PAID) {
            return BookingResponseDto.fromEntity(booking, null);
        }

        double amount = booking.getTicketCategory().getPrice() * booking.getParticipants();
        markBookingAsPaidAndFulfill(booking, amount);
        log.info("Pembayaran dikonfirmasi MANUAL oleh {} ({}) untuk booking {}", userPrincipal.getUsername(), role, bookingId);

        return BookingResponseDto.fromEntity(booking, null);
    }

    private void markBookingAsPaidAndFulfill(Booking booking, double amount) {
        booking.setStatus(Booking.Status.PAID);
        bookingRepository.save(booking);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setUser(booking.getUser());
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);

        log.info("Pembayaran berhasil dicatat untuk booking: {}", booking.getId());

        com.eventease.messaging.dto.TicketFulfillmentMessage message = com.eventease.messaging.dto.TicketFulfillmentMessage.builder()
                .bookingId(booking.getId())
                .userEmail(booking.getUser().getEmail())
                .buyerName(booking.getUser().getName())
                .eventName(booking.getTicketCategory().getEvent().getName())
                .ticketTier(booking.getTicketCategory().getName())
                .quantity(booking.getParticipants())
                .totalAmount(amount)
                .build();

        // 1. Selalu kirimkan konfirmasi dan e-tiket PDF ke email pengguna secara langsung
        try {
            byte[] pdfBytes = pdfService.generateTicketPdf(booking);
            emailService.sendETicketEmail(booking, pdfBytes);
        } catch (Exception e) {
            log.error("Gagal mengirim e-tiket PDF via email: {}", e.getMessage(), e);
        }

        // 2. Terbitkan ke antrean RabbitMQ untuk audit/pemrosesan downstream
        try {
            ticketFulfillmentProducer.publishTicketFulfillment(message);
        } catch (Exception ex) {
            log.debug("RabbitMQ dispatch optional: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void resendTicketEmail(String bookingId, UserPrincipal userPrincipal) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan ID: " + bookingId));

        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = booking.getUser().getId().equals(userPrincipal.getId());

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("Anda tidak berhak mengakses pesanan ini");
        }

        if (booking.getStatus() != Booking.Status.PAID && booking.getStatus() != Booking.Status.CHECKED_IN) {
            throw new IllegalStateException("Hanya tiket yang telah lunas yang dapat dikirimkan ke email.");
        }

        try {
            byte[] pdfBytes = pdfService.generateTicketPdf(booking);
            emailService.sendETicketEmail(booking, pdfBytes);
            log.info("Email e-ticket berhasil dikirim ulang ke: {}", booking.getUser().getEmail());
        } catch (Exception e) {
            log.error("Gagal mengirim ulang email tiket {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Gagal mengirimkan email e-ticket: " + e.getMessage(), e);
        }
    }
}
