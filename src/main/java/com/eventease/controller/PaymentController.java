package com.eventease.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.service.BookingService;
import com.eventease.service.MidtransService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
@Controller
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final BookingService bookingService;
    private final MidtransService midtransService;

    @GetMapping
    public String listPayments(HttpSession session, Model model) {
        // Halaman tabel /payments yang lama sudah usang.
        // Kita arahkan pengguna ke Dashboard (Daftar Tiket)
        return "redirect:/bookings/booking-list";
    }

    @GetMapping("/{bookingId}")
    public String showPaymentPage(HttpSession session, @PathVariable String bookingId, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        Booking booking = bookingService.findById(bookingId);
        if (booking == null || !booking.getUser().getId().equals(loggedInUser.getId())) {
            return "redirect:/payments";
        }
        
        if (booking.getStatus() == Booking.Status.PAID) {
            return "redirect:/bookings/invoice/" + booking.getId();
        }

        model.addAttribute("booking", booking);
        return "payment-snap";
    }

    @PostMapping("/pay")
    @ResponseBody
    public String getPaymentToken(HttpSession session, @RequestParam String bookingId) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "Unauthorized";

        Booking booking = bookingService.findById(bookingId);
        if (booking == null || !booking.getUser().getId().equals(loggedInUser.getId())) {
            return "Booking not found";
        }
        
        if (booking.getStatus() == Booking.Status.PAID) {
            return "Already Paid";
        }

        // Dapatkan token dari Midtrans API
        String token = midtransService.getSnapToken(booking);
        if (token != null) {
            return token;
        } else {
            return "Error getting token";
        }
    }
}
