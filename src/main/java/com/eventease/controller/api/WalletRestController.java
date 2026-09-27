package com.eventease.controller.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.common.PagedResponse;
import com.eventease.dto.wallet.WalletSummaryDto;
import com.eventease.dto.wallet.WithdrawalRequestDto;
import com.eventease.dto.wallet.WithdrawalResponseDto;
import com.eventease.model.Akun;
import com.eventease.model.Withdrawal;
import com.eventease.repository.AkunRepository;
import com.eventease.security.UserPrincipal;
import com.eventease.service.DashboardStatisticsService;
import com.eventease.service.WithdrawalService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletRestController {

    private final WithdrawalService withdrawalService;
    private final DashboardStatisticsService dashboardStatisticsService;
    private final AkunRepository akunRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<WalletSummaryDto>> getWalletSummary(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Akun organizer = akunRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Organizer tidak ditemukan"));

        Double grossRevenue = dashboardStatisticsService.getTotalRevenueByOrganizer(organizer);
        if (grossRevenue == null) grossRevenue = 0.0;
        Double platformFee = grossRevenue * 0.05;
        Double netRevenue = grossRevenue - platformFee;
        Double availableBalance = withdrawalService.getAvailableBalance(organizer);

        WalletSummaryDto summary = WalletSummaryDto.builder()
                .grossRevenue(grossRevenue)
                .platformFee(platformFee)
                .netRevenue(netRevenue)
                .availableBalance(availableBalance)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Ringkasan saldo dompet berhasil diambil", summary));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<WithdrawalResponseDto>>> getWithdrawalHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Akun organizer = akunRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Organizer tidak ditemukan"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Withdrawal> withdrawalPage = withdrawalService.findByOrganizer(organizer, pageable);

        List<WithdrawalResponseDto> content = withdrawalPage.getContent().stream()
                .map(WithdrawalResponseDto::fromEntity)
                .collect(Collectors.toList());

        PagedResponse<WithdrawalResponseDto> paged = PagedResponse.of(withdrawalPage, content);

        return ResponseEntity.ok(ApiResponse.success("Riwayat penarikan berhasil diambil", paged));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> requestWithdrawal(
            @Valid @RequestBody WithdrawalRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Akun organizer = akunRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Organizer tidak ditemukan"));

        try {
            withdrawalService.requestWithdrawal(
                    organizer,
                    requestDto.getAmount(),
                    requestDto.getBankName(),
                    requestDto.getAccountNumber(),
                    requestDto.getAccountName()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Permintaan penarikan dana berhasil diajukan dan sedang diproses", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<WithdrawalResponseDto>>> getAllWithdrawalsAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Withdrawal> withdrawalPage = withdrawalService.findAll(pageable);

        List<WithdrawalResponseDto> content = withdrawalPage.getContent().stream()
                .map(WithdrawalResponseDto::fromEntity)
                .collect(Collectors.toList());

        PagedResponse<WithdrawalResponseDto> paged = PagedResponse.of(withdrawalPage, content);

        return ResponseEntity.ok(ApiResponse.success("Daftar semua penarikan dana platform berhasil diambil", paged));
    }

    @PostMapping("/admin/approve/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approveWithdrawal(@PathVariable String id) {
        log.info("Admin menyetujui penarikan dana ID: {}", id);
        withdrawalService.approveWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Penarikan dana berhasil disetujui", null));
    }

    @PostMapping("/admin/reject/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejectWithdrawal(@PathVariable String id) {
        log.info("Admin menolak penarikan dana ID: {}", id);
        withdrawalService.rejectWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Penarikan dana ditolak", null));
    }
}
