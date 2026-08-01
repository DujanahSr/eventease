package com.eventease.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.eventease.model.Event;
import com.eventease.model.TicketCategory;
import com.eventease.service.EventService;
import com.eventease.repository.TicketCategoryRepository;

import java.util.List;

@Controller
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketCategoryController {
    
    private final TicketCategoryRepository ticketCategoryRepository;
    private final EventService eventService;

    @GetMapping("/manage/{eventId}")
    public String manageTickets(@PathVariable String eventId, Model model, RedirectAttributes redirectAttributes, jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";
        Event event = eventService.findById(eventId);
        if (event == null) {
            redirectAttributes.addFlashAttribute("error", "Event tidak ditemukan.");
            return "redirect:/events";
        }
        
        // Cek Kepemilikan Event
        boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
        if (!isAdmin) {
            if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(loggedInUser.getId())) {
                return "redirect:/events"; // Ditolak
            }
        }
        
        List<TicketCategory> tickets = ticketCategoryRepository.findByEventId(event.getId());
        model.addAttribute("event", event);
        model.addAttribute("tickets", tickets);
        return "tickets-manage";
    }

    @PostMapping("/add")
    public String addTickets(@RequestParam("eventId") String eventId,
                             @RequestParam(value = "names", required = false) List<String> names,
                             @RequestParam(value = "prices", required = false) List<Double> prices,
                             @RequestParam(value = "capacities", required = false) List<Integer> capacities,
                             RedirectAttributes redirectAttributes,
                             jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";
        
        Event event = eventService.findById(eventId);
        if (event == null) {
            redirectAttributes.addFlashAttribute("error", "Event tidak ditemukan.");
            return "redirect:/events";
        }

        // Cek Kepemilikan
        boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
        if (!isAdmin) {
            if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(loggedInUser.getId())) {
                return "redirect:/events"; // Ditolak
            }
        }

        if (names != null && !names.isEmpty()) {
            for (int i = 0; i < names.size(); i++) {
                String name = names.get(i);
                if (name == null || name.trim().isEmpty()) continue;
                
                double price = (prices != null && prices.size() > i && prices.get(i) != null) ? prices.get(i) : 0.0;
                int capacity = (capacities != null && capacities.size() > i && capacities.get(i) != null) ? capacities.get(i) : 0;
                
                if (price < 0) {
                    redirectAttributes.addFlashAttribute("error", "Harga tiket tidak boleh minus.");
                    return "redirect:/tickets/manage/" + eventId;
                }
                if (capacity < 1) {
                    redirectAttributes.addFlashAttribute("error", "Kapasitas tiket harus minimal 1.");
                    return "redirect:/tickets/manage/" + eventId;
                }
                
                TicketCategory ticket = new TicketCategory();
                ticket.setEvent(event);
                ticket.setName(name);
                ticket.setPrice(price);
                ticket.setCapacity(capacity);
                ticket.setAvailableStock(capacity);
                
                ticketCategoryRepository.save(ticket);
            }
            redirectAttributes.addFlashAttribute("message", "Tiket berhasil ditambahkan!");
        }

        return "redirect:/tickets/manage/" + eventId;
    }

    @GetMapping("/delete/{id}")
    public String deleteTicket(@PathVariable String id, @RequestParam("eventId") String eventId, RedirectAttributes redirectAttributes, jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        TicketCategory ticket = (id != null) ? ticketCategoryRepository.findById(id).orElse(null) : null;
        if (ticket != null) {
            // Cek Kepemilikan
            boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
            if (!isAdmin) {
                if (ticket.getEvent().getOrganizer() == null || !ticket.getEvent().getOrganizer().getId().equals(loggedInUser.getId())) {
                    return "redirect:/tickets/manage/" + eventId; // Ditolak
                }
            }

            ticketCategoryRepository.delete(ticket);
            redirectAttributes.addFlashAttribute("message", "Tiket berhasil dihapus.");
        }
        return "redirect:/tickets/manage/" + eventId;
    }
}
