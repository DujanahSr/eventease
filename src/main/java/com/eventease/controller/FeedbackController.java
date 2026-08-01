package com.eventease.controller;

import jakarta.servlet.http.HttpSession;
import com.eventease.model.Akun;
import com.eventease.model.Event;
import com.eventease.model.Feedback;
import com.eventease.service.FeedbackService;
import com.eventease.service.EventService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Controller
@RequestMapping("/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackService feedbackService;

    private final EventService eventService; // Service untuk mendapatkan data pengguna

    @GetMapping
    public String listFeedbacks(HttpSession session, Model model,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "10") int size) {
        // Mendapatkan pengguna yang sedang login dari UserLogin
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            return "redirect:/login"; // Redirect ke halaman login jika tidak ada pengguna yang login
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Feedback> feedbackPage = feedbackService.findAllByUserId(loggedInUser.getId(), pageable);
        
        model.addAttribute("feedbacks", feedbackPage.getContent());
        model.addAttribute("feedbackPage", feedbackPage);
        return "feedbacks";
    }

    @GetMapping("/add")
    public String showAddFeedbackForm(HttpSession session, @RequestParam(required = false) String eventId, Model model) {
        Feedback feedback = new Feedback();

        // Mendapatkan pengguna yang sedang login dari UserLogin
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login"; // Redirect ke halaman login jika tidak ada pengguna yang login
        }

        feedback.setUser(loggedInUser); // Set pengguna yang sedang login
        
        if (eventId != null) {
            Event event = eventService.findById(eventId);
            if (event != null) {
                feedback.setEvent(event);
            }
        }
        
        model.addAttribute("feedback", feedback);
        model.addAttribute("events", eventService.findAll());

        return "feedback-form";
    }

    @PostMapping
    public String saveFeedback(HttpSession session, @ModelAttribute Feedback feedback, RedirectAttributes redirectAttributes) {
        // Mendapatkan pengguna yang sedang login dari UserLogin
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            redirectAttributes.addFlashAttribute("error", "Anda harus login untuk memberikan feedback.");
            return "redirect:/login"; // Redirect ke halaman login jika tidak ada pengguna yang login
        }

        try {
            // Check if user already provided feedback for this event
            if (feedback.getEvent() != null) {
                java.util.Optional<Feedback> existing = feedbackService.findByUserIdAndEventId(loggedInUser.getId(), feedback.getEvent().getId());
                if (existing.isPresent()) {
                    redirectAttributes.addFlashAttribute("error", "Anda sudah memberikan ulasan untuk acara ini. Silakan edit ulasan yang sudah ada.");
                    return "redirect:/feedbacks";
                }
            }

            // Set pengguna yang sedang login ke dalam objek feedback
            feedback.setUser(loggedInUser);

            // Panggil metode untuk menambahkan feedback
            feedbackService.addFeedback(feedback);

            redirectAttributes.addFlashAttribute("message", "Feedback berhasil disimpan.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Terjadi kesalahan: " + e.getMessage());
        }

        return "redirect:/feedbacks";
    }

    @GetMapping("/edit/{id}")
    public String showEditFeedbackForm(HttpSession session, @PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }

        Feedback feedback = feedbackService.findById(id);

        if (feedback == null || !feedback.getUser().getId().equals(loggedInUser.getId())) {
            redirectAttributes.addFlashAttribute("error", "Feedback tidak ditemukan atau tidak milik Anda.");
            return "redirect:/feedbacks"; 
        }

        model.addAttribute("feedback", feedback); 
        model.addAttribute("events", eventService.findAll());
        return "feedback-form"; 
    }

    @PostMapping("/update")
    public String updateFeedback(@ModelAttribute Feedback feedback, RedirectAttributes redirectAttributes) {
        try {
            Feedback existingFeedback = feedbackService.findById(feedback.getId());
            if (existingFeedback == null) {
                redirectAttributes.addFlashAttribute("error", "Feedback tidak ditemukan.");
                return "redirect:/feedbacks";
            }
            existingFeedback.setComment(feedback.getComment());
            existingFeedback.setRating(feedback.getRating());

            if (feedback.getEvent() != null) {
                existingFeedback.setEvent(feedback.getEvent());
            }
            feedbackService.save(existingFeedback);
            redirectAttributes.addFlashAttribute("message", "Feedback berhasil diperbarui.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Terjadi kesalahan: " + e.getMessage());
        }
        return "redirect:/feedbacks";
    }

    @GetMapping("/delete/{id}")
    public String deleteFeedback(HttpSession session, @PathVariable String id, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login"; 
        }

        Feedback feedback = feedbackService.findById(id);

        if (feedback == null || !feedback.getUser().getId().equals(loggedInUser.getId())) {
            redirectAttributes.addFlashAttribute("error", "Feedback tidak ditemukan atau tidak milik Anda.");
            return "redirect:/feedbacks"; 
        }

        feedbackService.deleteById(id);
        return "redirect:/feedbacks";
    }

    @GetMapping("/all-user")
    public String listAllFeedbacks(HttpSession session, Model model,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Feedback> feedbackPage;
        List<Feedback> allFeedbacks;
        
        if ("ADMIN".equals(loggedInUser.getRole().getRoleName())) {
            feedbackPage = feedbackService.findAll(pageable);
            allFeedbacks = feedbackService.findAll(); // For statistics
        } else {
            feedbackPage = feedbackService.findByEventOrganizerId(loggedInUser.getId(), pageable);
            allFeedbacks = feedbackService.findByEventOrganizerId(loggedInUser.getId()); // For statistics
        }
        
        model.addAttribute("feedbacks", feedbackPage.getContent());
        model.addAttribute("feedbackPage", feedbackPage);
        
        // Calculate average rating and total counts
        double avgRating = 0;
        int[] starCounts = new int[5]; // index 0 for 1-star, ..., index 4 for 5-star
        
        if (!allFeedbacks.isEmpty()) {
            double totalStars = 0;
            for (Feedback f : allFeedbacks) {
                totalStars += f.getRating();
                int r = f.getRating();
                if (r >= 1 && r <= 5) {
                    starCounts[r - 1]++;
                }
            }
            avgRating = totalStars / allFeedbacks.size();
        }
        
        model.addAttribute("avgRating", avgRating);
        model.addAttribute("totalReviews", allFeedbacks.size());
        model.addAttribute("starCounts", starCounts);
        
        return "all-feedback"; 
    }
}
