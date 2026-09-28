package com.eventease.controller.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eventease.common.ApiResponse;
import com.eventease.common.PagedResponse;
import com.eventease.dto.partner.PartnerApplicationRequestDto;
import com.eventease.dto.partner.PartnerApplicationResponseDto;
import com.eventease.dto.partner.PartnerApplicationReviewDto;
import com.eventease.security.UserPrincipal;
import com.eventease.service.PartnerApplicationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@Tag(name = "11. Verifikasi Kemitraan Penyelenggara (KYC)", description = "Alur pengajuan pendaftaran penyelenggara acara resmi dan kurasi Super Administrator")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PartnerApplicationRestController {

    private final PartnerApplicationService partnerApplicationService;

    @Operation(summary = "Kirim Pengajuan Kemitraan Penyelenggara", description = "Pengguna mengajukan diri sebagai Penyelenggara dengan melampirkan berkas identitas dan rekening bank.")
    @PostMapping("/partner-applications")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PartnerApplicationResponseDto>> submitApplication(
            @Valid @RequestBody PartnerApplicationRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Pengajuan kemitraan dari {}", userPrincipal.getUsername());
        PartnerApplicationResponseDto result = partnerApplicationService.submitApplication(userPrincipal, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pengajuan kemitraan berhasil dikirim dan menunggu verifikasi Admin", result));
    }

    @Operation(summary = "Cek Status Pengajuan Saya", description = "Mengambil status pengajuan kemitraan terkini dari pengguna yang sedang login.")
    @GetMapping("/partner-applications/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PartnerApplicationResponseDto>> getMyApplication(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PartnerApplicationResponseDto result = partnerApplicationService.getMyApplication(userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Data status pengajuan kemitraan", result));
    }

    @Operation(summary = "Daftar Pengajuan Kemitraan (Admin)", description = "Super Administrator meninjau antrean pengajuan kemitraan dengan filter status.")
    @GetMapping("/admin/partner-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<PartnerApplicationResponseDto>>> getAllApplications(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResponse<PartnerApplicationResponseDto> result = partnerApplicationService.getAllApplications(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Daftar pengajuan kemitraan berhasil dimuat", result));
    }

    @Operation(summary = "Hitung Pengajuan Pending (Admin)", description = "Mengambil jumlah pengajuan yang belum ditinjau untuk keperluan indikator badge di dashboard admin.")
    @GetMapping("/admin/partner-applications/count-pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countPendingApplications() {
        long count = partnerApplicationService.countPendingApplications();
        return ResponseEntity.ok(ApiResponse.success("Jumlah antrean verifikasi", Map.of("pendingCount", count)));
    }

    @Operation(summary = "Tinjau & Putuskan Pengajuan Kemitraan (Admin)", description = "Super Administrator menyetujui (Approve) atau menolak (Reject) pengajuan kemitraan.")
    @PutMapping("/admin/partner-applications/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PartnerApplicationResponseDto>> reviewApplication(
            @PathVariable String id,
            @Valid @RequestBody PartnerApplicationReviewDto reviewDto,
            @AuthenticationPrincipal UserPrincipal adminPrincipal) {

        log.info("API Request: Tinjau pengajuan ID: {} oleh Admin {}", id, adminPrincipal.getUsername());
        PartnerApplicationResponseDto result = partnerApplicationService.reviewApplication(id, reviewDto, adminPrincipal);
        String message = "APPROVED".equalsIgnoreCase(result.getStatus())
                ? "Pengajuan berhasil disetujui. Akun pengguna telah ditingkatkan menjadi Organizer."
                : "Pengajuan kemitraan telah ditolak.";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }
}
