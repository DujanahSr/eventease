package com.eventease.controller;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.service.BookingService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/organizer")
@RequiredArgsConstructor
public class ScanController {

    private final BookingService bookingService;
    private final com.eventease.websocket.service.WebSocketNotificationService webSocketNotificationService;

    @GetMapping("/scan")
    public String showScanner(HttpSession session, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        // Pastikan hanya ADMIN atau ORGANIZER yang bisa akses
        if ("USER".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/home-user";
        }
        return "scan";
    }

    @PostMapping("/api/scan")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> scanTicket(@RequestBody Map<String, String> payload, HttpSession session) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        Map<String, Object> response = new HashMap<>();

        if (loggedInUser == null || "USER".equals(loggedInUser.getRole().getRoleName())) {
            response.put("success", false);
            response.put("message", "Unauthorized access.");
            return ResponseEntity.status(401).body(response);
        }

        String bookingId = payload.get("bookingId");
        if (bookingId == null || bookingId.isEmpty()) {
            response.put("success", false);
            response.put("message", "QR Code tidak terbaca.");
            return ResponseEntity.badRequest().body(response);
        }

        Booking booking = bookingService.findById(bookingId);
        if (booking == null) {
            response.put("success", false);
            response.put("message", "Tiket tidak ditemukan di sistem.");
            return ResponseEntity.ok(response);
        }

        // Keamanan: Pastikan admin yang memindai adalah pemilik acara tiket ini
        boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
        if (!isAdmin) {
            Akun organizer = booking.getTicketCategory().getEvent().getOrganizer();
            if (organizer == null || !organizer.getId().equals(loggedInUser.getId())) {
                response.put("success", false);
                response.put("message", "Akses Ditolak: Tiket ini bukan untuk acara Anda.");
                return ResponseEntity.status(403).body(response);
            }
        }

        if (booking.getStatus() == Booking.Status.CHECKED_IN) {
            response.put("success", false);
            response.put("message", "Tiket sudah digunakan sebelumnya (Sudah Check-In).");
            return ResponseEntity.ok(response);
        }

        if (booking.getStatus() != Booking.Status.PAID) {
            response.put("success", false);
            response.put("message", "Tiket belum dibayar atau dibatalkan. Status: " + booking.getStatus());
            return ResponseEntity.ok(response);
        }

        // Tiket valid, tandai CHECKED_IN
        booking.setStatus(Booking.Status.CHECKED_IN);
        bookingService.save(booking);

        // Siarkan notifikasi kehadiran real-time ke Dashboard via WebSocket
        webSocketNotificationService.notifyCheckIn(booking);

        response.put("success", true);
        response.put("message", "Check-in Berhasil!");
        response.put("eventName", booking.getTicketCategory().getEvent().getName());
        response.put("ticketType", booking.getTicketCategory().getName());
        response.put("participants", booking.getParticipants());
        response.put("buyerName", booking.getUser().getName());

        return ResponseEntity.ok(response);
    }
}
