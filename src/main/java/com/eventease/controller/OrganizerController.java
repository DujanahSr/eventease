package com.eventease.controller;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Akun;
import com.eventease.model.Event;
import com.eventease.service.EventService;

import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/organizer")
@RequiredArgsConstructor
public class OrganizerController {

    private final EventService eventService;

    /**
     * Halaman Kelola Acara khusus Penyelenggara.
     * URL: GET /organizer/events
     */
    @GetMapping("/events")
    public String organizerEvents(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model,
            HttpSession session) {

        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !loggedInUser.getRole().getRoleName().equals("ORGANIZER")) {
            return "redirect:/login";
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Event> eventPage;

        if (search != null && !search.trim().isEmpty()) {
            eventPage = eventService.searchByEventNameAndOrganizer(search, loggedInUser, pageable);
        } else {
            eventPage = eventService.findByOrganizer(loggedInUser, pageable);
        }

        model.addAttribute("events", eventPage.getContent());
        model.addAttribute("eventPage", eventPage);
        model.addAttribute("search", search);
        model.addAttribute("loggedInUser", loggedInUser);

        return "organizer-events";
    }
}
