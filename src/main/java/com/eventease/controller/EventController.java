package com.eventease.controller;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Category;
import com.eventease.model.Event;
import com.eventease.service.CategoryService;
import com.eventease.service.EventService;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Controller
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;
    private final CategoryService categoryService;
    private final com.eventease.service.CloudinaryService cloudinaryService;

    private final com.eventease.repository.TicketCategoryRepository ticketCategoryRepository;

    @GetMapping
    public String listEvents(@RequestParam(required = false) String search, 
                             @RequestParam(required = false) String category,
                             @RequestParam(defaultValue = "0") int page,
                             @RequestParam(defaultValue = "10") int size,
                             Model model, jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");

        Page<Event> eventPage;
        Pageable pageable = PageRequest.of(page, size);
        
        eventPage = eventService.searchAdvanced(search, category, pageable);
        
        model.addAttribute("events", eventPage.getContent());
        model.addAttribute("eventPage", eventPage);
        model.addAttribute("search", search);
        model.addAttribute("categories", categoryService.findAll());
        model.addAttribute("selectedCategory", category);
        model.addAttribute("loggedInUser", loggedInUser);
        
        return "events";
    }

    @GetMapping("/{id}")
    public String eventDetail(@PathVariable String id, Model model, jakarta.servlet.http.HttpSession session) {
        Event event = eventService.findById(id);
        if (event == null) {
            return "redirect:/events";
        }
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        java.util.List<com.eventease.model.TicketCategory> tickets = ticketCategoryRepository.findByEventId(id);
        
        model.addAttribute("event", event);
        model.addAttribute("tickets", tickets);
        model.addAttribute("loggedInUser", loggedInUser);
        
        return "event-detail";
    }


    @GetMapping("/add")
    public String showAddEventForm(Model model) {
        model.addAttribute("event", new Event());
        model.addAttribute("categories", categoryService.findAll());
        return "event-form";
    }

    @PostMapping("/add")
    public String addEvent(@ModelAttribute Event event, 
            @RequestParam("category.id") String categoryId, 
            @RequestParam(value = "file", required = false) MultipartFile file, 
            Model model,
            jakarta.servlet.http.HttpSession session) {
        
        if (event.getName() == null || event.getName().trim().length() < 5 || event.getName().trim().length() > 100) {
            model.addAttribute("error", "Nama acara tidak valid (minimal 5 karakter, maksimal 100 karakter).");
            model.addAttribute("event", event);
            model.addAttribute("categories", categoryService.findAll());
            return "event-form";
        }
        if (event.getDescription() == null || event.getDescription().trim().length() < 20) {
            model.addAttribute("error", "Deskripsi acara terlalu singkat (minimal 20 karakter).");
            model.addAttribute("event", event);
            model.addAttribute("categories", categoryService.findAll());
            return "event-form";
        }
        if (event.getDate() == null || !java.time.LocalDate.parse(event.getDate()).isAfter(java.time.LocalDate.now())) {
            model.addAttribute("error", "Tanggal acara tidak valid. Acara harus dijadwalkan minimal besok.");
            model.addAttribute("event", event);
            model.addAttribute("categories", categoryService.findAll());
            return "event-form";
        }
        Category category = categoryService.findById(categoryId);
        if (category == null) {
            model.addAttribute("error", "Invalid Category");
            model.addAttribute("event", event);
            model.addAttribute("categories", categoryService.findAll());
            return "event-form";
        }
        event.setCategory(category);

        try {
            com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null) return "redirect:/login";

            Event savedEvent;
            if (event.getId() != null && !event.getId().isEmpty()) {
                Event existingEvent = eventService.findById(event.getId());
                if (existingEvent != null) {
                    
                    // Keamanan: Cek kepemilikan saat update
                    boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
                    if (!isAdmin) {
                        if (existingEvent.getOrganizer() == null || !existingEvent.getOrganizer().getId().equals(loggedInUser.getId())) {
                            throw new Exception("Anda tidak memiliki izin untuk mengedit acara ini.");
                        }
                    }
                    
                    event.setOrganizer(existingEvent.getOrganizer()); // Pertahankan organizer lama

                    if (file != null && !file.isEmpty()) {
                        String imageUrl = cloudinaryService.uploadImage(file, "eventease/events");
                        event.setImageUrl(imageUrl);
                    } else {
                        event.setImageUrl(existingEvent.getImageUrl());
                    }
                    savedEvent = eventService.save(event);
                } else {
                    event.setOrganizer(loggedInUser); // Pembuat adalah organizer
                    if (file != null && !file.isEmpty()) {
                        String imageUrl = cloudinaryService.uploadImage(file, "eventease/events");
                        event.setImageUrl(imageUrl);
                    }
                    savedEvent = eventService.save(event);
                }
            } else {
                event.setOrganizer(loggedInUser); // Pembuat adalah organizer
                if (file != null && !file.isEmpty()) {
                    String imageUrl = cloudinaryService.uploadImage(file, "eventease/events");
                    event.setImageUrl(imageUrl);
                }
                savedEvent = eventService.save(event);
            }
            return "redirect:/tickets/manage/" + savedEvent.getId();
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("event", event);
            model.addAttribute("categories", categoryService.findAll());
            return "event-form";
        }

        // redirect handled in try block
    }

    @GetMapping("/edit/{id}")
    public String showEditEventForm(@PathVariable String id, Model model, jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        Event event = eventService.findById(id);
        if (event == null) {
            return "redirect:/events";
        }

        // Keamanan: Cek kepemilikan
        boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
        if (!isAdmin) {
            if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(loggedInUser.getId())) {
                return "redirect:/events"; // Ditolak
            }
        }
        model.addAttribute("event", event);
        model.addAttribute("categories", categoryService.findAll());
        return "event-form";
    }

    @GetMapping("/delete/{id}")
    public String deleteEvent(@PathVariable String id, jakarta.servlet.http.HttpSession session) {
        com.eventease.model.Akun loggedInUser = (com.eventease.model.Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";

        Event event = eventService.findById(id);
        if (event != null) {
            // Keamanan: Cek kepemilikan
            boolean isAdmin = loggedInUser.getRole().getRoleName().equals("ADMIN");
            if (!isAdmin) {
                if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(loggedInUser.getId())) {
                    return "redirect:/events"; // Ditolak
                }
            }
            eventService.deleteById(id);
        }
        return "redirect:/events";
    }
}
