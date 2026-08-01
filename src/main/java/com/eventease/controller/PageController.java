package com.eventease.controller;

import jakarta.servlet.http.HttpSession;

import lombok.RequiredArgsConstructor;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.eventease.dto.LoginRequest;
import com.eventease.dto.RegisterRequest;
import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Event;
import com.eventease.service.AkunService;
import com.eventease.service.BookingService;
import com.eventease.service.EventService;
import com.eventease.service.CategoryService;
import com.eventease.service.DashboardStatisticsService;

@Controller
@RequiredArgsConstructor
public class PageController {

    final BookingService bookingService;

    final EventService eventService;

    final AkunService akunService;
    
    final CategoryService categoryService;

    @GetMapping("/")
    public String homePage(@RequestParam(required = false) String search, 
                           @RequestParam(required = false) String category,
                           @RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "6") int size,
                           HttpSession session, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser != null) {
            model.addAttribute("loggedInUser", loggedInUser);
        }

        model.addAttribute("categories", categoryService.findAll());
        model.addAttribute("selectedCategory", category);

        Pageable pageable = PageRequest.of(page, size);
        Page<Event> eventPage = eventService.searchAdvanced(search, category, pageable);
        
        model.addAttribute("events", eventPage.getContent());
        model.addAttribute("eventPage", eventPage);
        model.addAttribute("searchQuery", search);
        return "index";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        if (!model.containsAttribute("request")) {
            model.addAttribute("request", new RegisterRequest());
        }
        return "register";
    }

    @GetMapping("/login")
    public String loginPage(Model model) {
        if (!model.containsAttribute("request")) {
            model.addAttribute("request", new LoginRequest());
        }
        return "login";
    }

    @GetMapping("/home-user")
    public String homeUser(HttpSession session, @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort, 
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser"); 
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Event> eventPage;
        
        if (search != null && !search.isEmpty()) {
            eventPage = eventService.searchByEventName(search, pageable);
        }
        else {
            eventPage = eventService.findAll(pageable);
        }
        model.addAttribute("loggedInUser", loggedInUser); 
        model.addAttribute("events", eventPage.getContent());
        model.addAttribute("eventPage", eventPage);
        model.addAttribute("search", search);
        model.addAttribute("sort", sort);
        return "home-user";
    }

    @GetMapping("/profile")
    public String profileUser(HttpSession session, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser"); 
        if (loggedInUser == null) {
            return "redirect:/login"; 
        }
        // Ambil data terbaru dari database agar perubahan profil langsung terlihat
        Akun freshUser = akunService.findAkunById(loggedInUser.getId());
        model.addAttribute("loggedInUser", freshUser); 
        return "profile-user"; 
    }

    final DashboardStatisticsService statisticsService;

    @GetMapping("/home-organizer")
    public String dhasboardPage(HttpSession session, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !loggedInUser.getRole().getRoleName().equals("ORGANIZER")) return "redirect:/login";
        model.addAttribute("totalBookings", statisticsService.getTotalBookingsByOrganizer(loggedInUser));
        model.addAttribute("totalUsers", statisticsService.getTotalUsersByOrganizer(loggedInUser));
        model.addAttribute("totalRevenue", statisticsService.getTotalRevenueByOrganizer(loggedInUser));
        model.addAttribute("totalEvents", eventService.findByOrganizer(loggedInUser).size());
        model.addAttribute("salesByEvent", statisticsService.getTicketSalesByEventAndOrganizer(loggedInUser));
        model.addAttribute("revenueByDate", statisticsService.getRevenueByDateAndOrganizer(loggedInUser));

        return "home-organizer";
    }

    @GetMapping("/home-admin")
    public String superAdminDashboard(HttpSession session, Model model,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !loggedInUser.getRole().getRoleName().equals("ADMIN")) {
            return "redirect:/login";
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Akun> userPage = akunService.findAllAkun(pageable);
        
        model.addAttribute("users", userPage.getContent());
        model.addAttribute("userPage", userPage);
        model.addAttribute("loggedInUser", loggedInUser);
        Double totalGrossRevenue = statisticsService.getTotalRevenue();
        if (totalGrossRevenue == null) totalGrossRevenue = 0.0;
        Double platformProfit = totalGrossRevenue * 0.05;

        model.addAttribute("totalBookings", statisticsService.getTotalBookings());
        model.addAttribute("totalUsers", statisticsService.getTotalUsers());
        model.addAttribute("totalRevenue", totalGrossRevenue);
        model.addAttribute("platformProfit", platformProfit);
        model.addAttribute("totalEvents", eventService.findAll().size());

        return "home-admin";
    }

    @GetMapping("/delete/{id}")
    public String deleteBooking(@PathVariable String id, HttpSession session, RedirectAttributes redirectAttributes, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        Booking booking = bookingService.findById(id);
        
        if (booking == null) return "redirect:/admin/bookings";
        
        // Keamanan: Cek kepemilikan acara jika bukan admin
        boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
        if (!isAdmin) {
            Akun organizer = booking.getTicketCategory().getEvent().getOrganizer();
            if (organizer == null || !organizer.getId().equals(loggedInUser.getId())) {
                return "redirect:/admin/bookings"; // Ditolak
            }
        }

        if (booking.getStatus() == Booking.Status.CONFIRMED) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan sudah dikonfirmasi dan tidak dapat dihapus.");
            return "redirect:/admin/bookings";
        }

        bookingService.deleteById(id);
        redirectAttributes.addFlashAttribute("message", "Pemesanan berhasil dihapus.");
        return "redirect:/admin/bookings"; 
    }

    @GetMapping("/admin/bookings")
    public String adminBookings(HttpSession session, Model model) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        List<Booking> bookings;
        if (loggedInUser.getRole().getRoleName().equals("ADMIN")) {
            bookings = bookingService.findAll();
        } else {
            bookings = bookingService.findBookingsByOrganizer(loggedInUser);
        }

        model.addAttribute("bookings", bookings);
        return "bookings"; 
    }

    @GetMapping("/terms")
    public String termsPage() {
        return "terms";
    }

    @GetMapping("/privacy")
    public String privacyPage() {
        return "privacy";
    }
}
