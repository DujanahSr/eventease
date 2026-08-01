package com.eventease.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import java.io.IOException;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.TicketCategory;
import com.eventease.service.BookingService;
import com.eventease.repository.TicketCategoryRepository;

import com.eventease.model.Event;
import com.eventease.service.EmailService;
import com.eventease.service.EventService;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Controller
@RequiredArgsConstructor

public class BookingController {
    private final BookingService bookingService;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final EventService eventService;
    private final EmailService emailService;
    private final com.eventease.service.PdfService pdfService;

    @GetMapping("/bookings")
    public String listBookings(@RequestParam(required = false) String search,
            @RequestParam(required = false) String sort, 
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookingPage;
        
        if (search != null && !search.isEmpty()) {
            bookingPage = bookingService.searchByEventName(search, pageable);
        } else if ("date".equals(sort)) {
            bookingPage = bookingService.findAllSortedByDateAsc(pageable);
        } else if ("participants".equals(sort)) {
            bookingPage = bookingService.findAllSortedByParticipantsDesc(pageable);
        } else {
            bookingPage = bookingService.findAll(pageable);
        }
        
        model.addAttribute("bookings", bookingPage.getContent());
        model.addAttribute("bookingPage", bookingPage);
        model.addAttribute("search", search);
        model.addAttribute("search", search);
        return "bookings";
    }

    @GetMapping("/bookings/export")
    public void exportBookingsExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"Data_Penjualan_Eventease.xlsx\"");

        List<Booking> bookings = bookingService.findAll(); // In future, filter by Organizer
        
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Data Penjualan");

            // Header Style
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.TEAL.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            // Create Header Row
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = {"ID Pesanan", "Nama Pembeli", "Email Pembeli", "Nama Acara", "Kategori Tiket", "Tanggal", "Jumlah Tiket", "Status"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate Data
            int rowNum = 1;
            for (Booking b : bookings) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(b.getId() != null ? b.getId() : "");
                row.createCell(1).setCellValue(b.getUser() != null && b.getUser().getName() != null ? b.getUser().getName() : "");
                row.createCell(2).setCellValue(b.getUser() != null && b.getUser().getEmail() != null ? b.getUser().getEmail() : "");
                row.createCell(3).setCellValue(b.getTicketCategory() != null && b.getTicketCategory().getEvent() != null ? b.getTicketCategory().getEvent().getName() : "");
                row.createCell(4).setCellValue(b.getTicketCategory() != null ? b.getTicketCategory().getName() : "");
                row.createCell(5).setCellValue(b.getEventDate() != null ? b.getEventDate().toString() : "");
                row.createCell(6).setCellValue(b.getParticipants());
                row.createCell(7).setCellValue(b.getStatus() != null ? b.getStatus().name() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to response output stream
            try (java.io.OutputStream outputStream = response.getOutputStream()) {
                workbook.write(outputStream);
            }
        }
    }

    @GetMapping("/bookings/checkout/{eventId}")
    public String showAddBookingForm(HttpSession session, @PathVariable String eventId, Model model, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            redirectAttributes.addFlashAttribute("message", "Silakan login terlebih dahulu untuk memesan tiket.");
            return "redirect:/login";
        }

        Event event = eventService.findById(eventId);
        if (event == null) {
            redirectAttributes.addFlashAttribute("error", "Acara tidak ditemukan.");
            return "redirect:/events";
        }

        if (!model.containsAttribute("booking")) {
            Booking booking = new Booking();
            booking.setUser(loggedInUser);
            model.addAttribute("booking", booking); 
        }

        model.addAttribute("event", event);
        model.addAttribute("tickets", ticketCategoryRepository.findByEventId(eventId)); 
        model.addAttribute("loggedInUser", loggedInUser);

        return "booking-form";
    }

    @PostMapping("/bookings/add")
    public String addBooking(HttpSession session, @ModelAttribute Booking booking, RedirectAttributes redirectAttributes) {
        try {
            Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null) {
                return "redirect:/login";
            }
            
            // 1. Ambil data tiket secara penuh dari Database berdasarkan ID yang dikirim form
            TicketCategory ticketCategory = ticketCategoryRepository.findById(booking.getTicketCategory().getId()).orElse(null);
            if (ticketCategory == null) {
                throw new Exception("Kategori tiket tidak ditemukan.");
            }
            
            // 2. Set user dan tiket ke dalam booking
            booking.setUser(loggedInUser);
            booking.setTicketCategory(ticketCategory);
            
            // Hapus setEventDate karena kita tidak lagi menggunakan field ini untuk Event.
            // booking.setEventDate(ticketCategory.getEvent().getDate());
            
            if (booking.getParticipants() < 1) {
                throw new Exception("Jumlah tiket minimal adalah 1.");
            }
            if (booking.getParticipants() > ticketCategory.getAvailableStock()) {
                throw new Exception("Jumlah tiket melebihi stok yang tersedia (" + ticketCategory.getAvailableStock() + ").");
            }
            
            booking.setStatus(Booking.Status.PENDING);
            bookingService.save(booking);
            return "redirect:/payments/" + booking.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            redirectAttributes.addFlashAttribute("booking", booking);
            
            // Get the event ID from the submitted ticket category if possible
            String redirectUrl = "redirect:/events";
            try {
                if (booking.getTicketCategory() != null && booking.getTicketCategory().getId() != null) {
                    TicketCategory tc = ticketCategoryRepository.findById(booking.getTicketCategory().getId()).orElse(null);
                    if (tc != null && tc.getEvent() != null) {
                        redirectUrl = "redirect:/bookings/checkout/" + tc.getEvent().getId();
                    }
                }
            } catch (Exception ex) {
                // fallback
            }
            return redirectUrl;
        }
    }

    @GetMapping("/bookings/edit/{id}")
    public String showEditBookingForm(HttpSession session, @PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            redirectAttributes.addFlashAttribute("message", "Silakan login terlebih dahulu.");
            return "redirect:/login";
        }
        Booking booking = bookingService.findById(id);

        if (booking == null || !booking.getUser().getId().equals(loggedInUser.getId())) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan tidak ditemukan atau tidak milik Anda.");
            return "redirect:/bookings/booking-list"; 
        }
        if (booking.getStatus() == Booking.Status.CONFIRMED || booking.getStatus() == Booking.Status.PAID) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan sudah dikonfirmasi dan tidak dapat diedit.");
            return "redirect:/bookings/booking-list"; 
        }

        if (!model.containsAttribute("booking")) {
            model.addAttribute("booking", booking);
        }
        model.addAttribute("tickets", ticketCategoryRepository.findAll()); 
        model.addAttribute("loggedInUser", loggedInUser);
        return "booking-form"; 
    }

    @PostMapping("/bookings/update")
    public String updateBooking(HttpSession session, @ModelAttribute Booking booking, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            redirectAttributes.addFlashAttribute("message", "Silakan login terlebih dahulu.");
            return "redirect:/login";
        }
        Booking existingBooking = bookingService.findById(booking.getId());
        
        if (existingBooking == null || !existingBooking.getUser().getId().equals(loggedInUser.getId())) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan tidak ditemukan atau tidak milik Anda.");
            return "redirect:/bookings/booking-list"; 
        }

        if (existingBooking.getStatus() == Booking.Status.CONFIRMED || existingBooking.getStatus() == Booking.Status.PAID) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan sudah dikonfirmasi dan tidak dapat diedit.");
            return "redirect:/bookings/booking-list";
        }
        
        TicketCategory ticketCategory = ticketCategoryRepository.findById(booking.getTicketCategory().getId()).orElse(null);
        if (ticketCategory == null) {
            redirectAttributes.addFlashAttribute("error", "Kategori tiket tidak ditemukan.");
            return "redirect:/bookings/edit/" + booking.getId();
        }

        try {
            // Validasi tanggal sudah tidak relevan untuk tiket acara, jadi dihapus.
            
            // Restore previous capacity
            TicketCategory oldTicket = existingBooking.getTicketCategory();
            oldTicket.setAvailableStock(oldTicket.getAvailableStock() + existingBooking.getParticipants());
            ticketCategoryRepository.save(oldTicket);

            // Deduct new capacity
            if (ticketCategory.getAvailableStock() < booking.getParticipants()) {
                throw new IllegalStateException("Stok tiket baru tidak mencukupi.");
            }
            ticketCategory.setAvailableStock(ticketCategory.getAvailableStock() - booking.getParticipants());
            ticketCategoryRepository.save(ticketCategory);

            existingBooking.setParticipants(booking.getParticipants());
            existingBooking.setTicketCategory(ticketCategory); 
            bookingService.save(existingBooking); 

            redirectAttributes.addFlashAttribute("message", "Pemesanan berhasil diperbarui.");
            return "redirect:/bookings/booking-list";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            redirectAttributes.addFlashAttribute("booking", booking);
            return "redirect:/bookings/edit/" + booking.getId(); 
        }
    }

    @GetMapping("/bookings/delete/{id}")
    public String deleteBooking(@PathVariable String id, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        Booking booking = bookingService.findById(id);
        
        String referer = request.getHeader("Referer");
        String redirectUrl = (referer != null) ? "redirect:" + referer : "redirect:/bookings/booking-list";

        if (booking == null) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan tidak ditemukan.");
            return redirectUrl; 
        }
        if (booking.getStatus() == Booking.Status.CONFIRMED) {
            redirectAttributes.addFlashAttribute("error", "Pemesanan sudah dikonfirmasi dan tidak dapat dihapus.");
            return redirectUrl; 
        }

        bookingService.deleteById(id);
        redirectAttributes.addFlashAttribute("message", "Pemesanan berhasil dibatalkan dan dihapus.");
        return redirectUrl; 
    }

    @PostMapping("/bookings/update-status")
    public String updateBookingStatus(@RequestParam String id, @RequestParam String status, RedirectAttributes redirectAttributes) {
        Booking booking = bookingService.findById(id);
        if (booking != null) {
            try {
                Booking.Status newStatus = Booking.Status.valueOf(status);
                if (newStatus == Booking.Status.CANCELED) {
                    bookingService.cancelBooking(id);
                } else {
                    boolean sendEmail = (newStatus == Booking.Status.PAID && booking.getStatus() != Booking.Status.PAID);
                    booking.setStatus(newStatus);
                    bookingService.save(booking);
                    if (sendEmail) {
                        try {
                            byte[] pdfBytes = pdfService.generateTicketPdf(booking);
                            emailService.sendETicketEmail(booking, pdfBytes);
                        } catch (Exception e) {
                            emailService.sendETicketEmail(booking, null);
                        }
                    }
                }
                redirectAttributes.addFlashAttribute("message", "Status pemesanan berhasil diperbarui.");
            } catch (IllegalArgumentException e) {
                redirectAttributes.addFlashAttribute("error", "Status yang diberikan tidak valid.");
            }
        } else {
            redirectAttributes.addFlashAttribute("error", "Pemesanan tidak ditemukan.");
        }
        return "redirect:/bookings";
    }

    @GetMapping("/bookings/booking-list")
    public String viewBookings(HttpSession session, Model model, RedirectAttributes redirectAttributes,
            @RequestParam(defaultValue = "0") int activePage,
            @RequestParam(defaultValue = "0") int paidPage,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "pills-paid") String activeTab) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            redirectAttributes.addFlashAttribute("message", "Silakan login terlebih dahulu.");
            return "redirect:/login";
        }
        
        Pageable activePageable = PageRequest.of(activePage, size);
        Pageable paidPageable = PageRequest.of(paidPage, size);
        
        Page<Booking> activeBookingsPage = bookingService.findActiveBookingsByUser(loggedInUser, activePageable);
        Page<Booking> paidBookingsPage = bookingService.findPaidBookingsByUser(loggedInUser, paidPageable);
        
        model.addAttribute("activeBookings", activeBookingsPage.getContent());
        model.addAttribute("paidBookings", paidBookingsPage.getContent());
        model.addAttribute("activeBookingsPage", activeBookingsPage);
        model.addAttribute("paidBookingsPage", paidBookingsPage);
        model.addAttribute("activeTab", activeTab);
        model.addAttribute("loggedInUser", loggedInUser);
        
        return "bookings-list"; 
    }

    @GetMapping("/bookings/invoice/{id}")
    public String viewInvoice(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Booking booking = bookingService.findById(id);
        if (booking == null || booking.getStatus() != Booking.Status.PAID) {
            redirectAttributes.addFlashAttribute("error", "Invoice tidak ditemukan atau booking belum dibayar.");
            return "redirect:/bookings/booking-list";
        }
        
        String qrCode = com.eventease.util.QrCodeUtil.generateQrCodeBase64(booking.getId());
        model.addAttribute("qrCode", qrCode);
        model.addAttribute("booking", booking);
        return "invoice"; 
    }
}
