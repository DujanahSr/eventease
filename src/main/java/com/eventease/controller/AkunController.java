package com.eventease.controller;

import lombok.RequiredArgsConstructor;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.eventease.dto.LoginRequest;
import com.eventease.dto.RegisterRequest;
import com.eventease.model.Akun;
import com.eventease.service.AkunService;

@Controller
@RequiredArgsConstructor
public class AkunController {
    final AkunService userService;
    final org.springframework.mail.javamail.JavaMailSender mailSender;
    final com.eventease.service.CloudinaryService cloudinaryService;

    @PostMapping("/register-user")
    public String registerUser(RegisterRequest request, RedirectAttributes redirectAttributes) throws Exception {
        try {
            userService.register(request);
            redirectAttributes.addFlashAttribute("message", "Registrasi Berhasil");
            return "redirect:/login";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", e.getMessage());
            redirectAttributes.addFlashAttribute("request", request);
            return "redirect:/register";
        }
    }

    @PostMapping("/login-user")
    public String loginUser(LoginRequest request, RedirectAttributes redirectAttributes, HttpSession session) {
        try {
            Akun user = userService.login(request);
            session.setAttribute("loggedInUser", user);
            if (user.getRole().getRoleName().equalsIgnoreCase("ADMIN")) {
                return "redirect:/home-admin";
            } else if (user.getRole().getRoleName().equalsIgnoreCase("ORGANIZER")) {
                return "redirect:/home-organizer"; 
            } else {
                return "redirect:/home-user"; 
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("message", e.getMessage());
            redirectAttributes.addFlashAttribute("request", request);
            return "redirect:/login";
        }
    }
    
    @GetMapping("/logout-user")
    public String logoutUser(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    @PostMapping("/update-profile")
    public String updateProfile(String name, String phone, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null) return "redirect:/login";
            
            userService.updateProfile(loggedInUser.getId(), name, phone);
            redirectAttributes.addFlashAttribute("successMessage", "Profil berhasil diperbarui!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("failedName", name);
            redirectAttributes.addFlashAttribute("failedPhone", phone);
        }
        return "redirect:/profile";
    }

    @PostMapping("/update-password")
    public String updatePassword(String oldPassword, String newPassword, String confirmPassword, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null) return "redirect:/login";

            if (!newPassword.equals(confirmPassword)) {
                throw new Exception("Password baru dan konfirmasi password tidak cocok!");
            }

            userService.updatePassword(loggedInUser.getId(), oldPassword, newPassword);
            redirectAttributes.addFlashAttribute("successMessage", "Password berhasil diubah!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            // Intentionally not saving passwords back to the form for security
        }
        return "redirect:/profile";
    }

    @PostMapping("/admin/toggle-role")
    public String toggleRole(String userId, String targetRole, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null || !loggedInUser.getRole().getRoleName().equals("ADMIN")) {
                return "redirect:/login";
            }
            
            userService.updateUserRole(userId, targetRole);
            redirectAttributes.addFlashAttribute("successMessage", "Role berhasil diubah menjadi " + targetRole);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/home-admin";
    }

    @GetMapping("/forgot-password")
    public String forgotPasswordForm() {
        return "forgot-password";
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(String email, RedirectAttributes redirectAttributes, jakarta.servlet.http.HttpServletRequest request) {
        Akun user = userService.findAkunByEmail(email);
        if (user == null) {
            redirectAttributes.addFlashAttribute("error", "Email tidak terdaftar.");
            return "redirect:/forgot-password";
        }

        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        userService.saveAkun(user);

        String resetUrl = request.getRequestURL().toString().replace(request.getRequestURI(), request.getContextPath()) + "/reset-password?token=" + token;

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Reset Password - Eventease");
            message.setText("Untuk mengatur ulang kata sandi Anda, klik tautan berikut (berlaku 15 menit):\n\n" + resetUrl);
            mailSender.send(message);
            redirectAttributes.addFlashAttribute("message", "Tautan pemulihan telah dikirim ke email Anda.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Gagal mengirim email: " + e.getMessage());
        }

        return "redirect:/forgot-password";
    }

    @GetMapping("/reset-password")
    public String resetPasswordForm(String token, org.springframework.ui.Model model) {
        java.util.Optional<Akun> userOpt = userService.findByResetToken(token);
        if (!userOpt.isPresent() || userOpt.get().getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            model.addAttribute("error", "Token tidak valid atau sudah kedaluwarsa.");
            return "reset-password";
        }
        model.addAttribute("token", token);
        return "reset-password";
    }

    @PostMapping("/reset-password")
    public String processResetPassword(String token, String password, String confirmPassword, RedirectAttributes redirectAttributes) {
        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Kata sandi tidak cocok.");
            return "redirect:/reset-password?token=" + token;
        }

        java.util.Optional<Akun> userOpt = userService.findByResetToken(token);
        if (!userOpt.isPresent() || userOpt.get().getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            redirectAttributes.addFlashAttribute("error", "Token tidak valid atau sudah kedaluwarsa.");
            return "redirect:/reset-password?token=" + token;
        }

        Akun user = userOpt.get();
        user.setPassword(password);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userService.saveAkun(user);

        redirectAttributes.addFlashAttribute("message", "Kata sandi berhasil diubah! Silakan masuk.");
        return "redirect:/login";
    }

    @PostMapping("/upload-profile-picture")
    public String uploadProfilePicture(@org.springframework.web.bind.annotation.RequestParam("image") org.springframework.web.multipart.MultipartFile multipartFile, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
            if (loggedInUser == null) return "redirect:/login";

            if (!multipartFile.isEmpty()) {
                String imageUrl = cloudinaryService.uploadImage(multipartFile, "eventease/profiles");
                
                userService.updateProfilePicture(loggedInUser.getId(), imageUrl);
                loggedInUser.setProfilePicture(imageUrl);
                session.setAttribute("loggedInUser", loggedInUser);
                redirectAttributes.addFlashAttribute("successMessage", "Foto profil berhasil diperbarui!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Gagal mengunggah foto: " + e.getMessage());
        }
        return "redirect:/profile";
    }
}
