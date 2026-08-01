package com.eventease.controller;

import com.eventease.model.Akun;
import com.eventease.service.WithdrawalService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Controller
@RequiredArgsConstructor
public class WalletController {

    private final WithdrawalService withdrawalService;

    private final com.eventease.service.DashboardStatisticsService dashboardStatisticsService;

    // --- ORGANIZER WALLET ---
    @GetMapping("/organizer/wallet")
    public String viewWallet(HttpSession session, Model model,
                             @RequestParam(defaultValue = "0") int page,
                             @RequestParam(defaultValue = "10") int size) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || "USER".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/login";
        }

        Double grossRevenue = dashboardStatisticsService.getTotalRevenueByOrganizer(loggedInUser);
        if (grossRevenue == null) grossRevenue = 0.0;
        Double platformFee = grossRevenue * 0.05;
        Double netRevenue = grossRevenue - platformFee;

        model.addAttribute("grossRevenue", grossRevenue);
        model.addAttribute("platformFee", platformFee);
        model.addAttribute("netRevenue", netRevenue);
        model.addAttribute("availableBalance", withdrawalService.getAvailableBalance(loggedInUser));
        
        Pageable pageable = PageRequest.of(page, size);
        Page<com.eventease.model.Withdrawal> withdrawalPage = withdrawalService.findByOrganizer(loggedInUser, pageable);
        
        model.addAttribute("withdrawals", withdrawalPage.getContent());
        model.addAttribute("withdrawalPage", withdrawalPage);
        
        return "wallet";
    }

    @PostMapping("/organizer/wallet/withdraw")
    public String requestWithdrawal(
            @RequestParam Double amount,
            @RequestParam String bankName,
            @RequestParam String accountNumber,
            @RequestParam String accountName,
            HttpSession session,
            RedirectAttributes redirectAttributes) {
        
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || "USER".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/login";
        }

        try {
            withdrawalService.requestWithdrawal(loggedInUser, amount, bankName, accountNumber, accountName);
            redirectAttributes.addFlashAttribute("message", "Permintaan penarikan dana berhasil diajukan dan sedang diproses.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }

        return "redirect:/organizer/wallet";
    }

    // --- SUPER ADMIN WITHDRAWAL MANAGEMENT ---
    @GetMapping("/admin/withdrawals")
    public String manageWithdrawals(HttpSession session, Model model,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !"ADMIN".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/login";
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<com.eventease.model.Withdrawal> withdrawalPage = withdrawalService.findAll(pageable);
        
        model.addAttribute("withdrawals", withdrawalPage.getContent());
        model.addAttribute("withdrawalPage", withdrawalPage);
        return "manage-withdrawals";
    }

    @GetMapping("/admin/withdrawals/approve/{id}")
    public String approveWithdrawal(@PathVariable String id, HttpSession session, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !"ADMIN".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/login";
        }

        withdrawalService.approveWithdrawal(id);
        redirectAttributes.addFlashAttribute("message", "Penarikan berhasil disetujui.");
        return "redirect:/admin/withdrawals";
    }

    @GetMapping("/admin/withdrawals/reject/{id}")
    public String rejectWithdrawal(@PathVariable String id, HttpSession session, RedirectAttributes redirectAttributes) {
        Akun loggedInUser = (Akun) session.getAttribute("loggedInUser");
        if (loggedInUser == null || !"ADMIN".equals(loggedInUser.getRole().getRoleName())) {
            return "redirect:/login";
        }

        withdrawalService.rejectWithdrawal(id);
        redirectAttributes.addFlashAttribute("message", "Penarikan berhasil ditolak.");
        return "redirect:/admin/withdrawals";
    }
}
