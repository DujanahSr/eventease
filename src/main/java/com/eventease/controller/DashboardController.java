package com.eventease.controller;

import com.eventease.model.Akun;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    @GetMapping("/dashboard")
    public String showDashboard(HttpSession session) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        String role = loggedInUser.getRole().getRoleName();
        if ("ADMIN".equals(role)) {
            return "redirect:/home-admin";
        } else if ("ORGANIZER".equals(role)) {
            return "redirect:/home-organizer";
        } else {
            return "redirect:/home-user";
        }
    }
}
