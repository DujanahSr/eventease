package com.eventease.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.common.PagedResponse;
import com.eventease.constant.RoleConstants;
import com.eventease.dto.partner.PartnerApplicationRequestDto;
import com.eventease.dto.partner.PartnerApplicationResponseDto;
import com.eventease.dto.partner.PartnerApplicationReviewDto;
import com.eventease.exception.BadRequestException;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.model.Akun;
import com.eventease.model.PartnerApplication;
import com.eventease.model.Role;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.PartnerApplicationRepository;
import com.eventease.repository.RoleRepositoy;
import com.eventease.security.UserPrincipal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerApplicationServiceImpl implements PartnerApplicationService {

    private final PartnerApplicationRepository partnerApplicationRepository;
    private final AkunRepository akunRepository;
    private final RoleRepositoy roleRepository;

    @Override
    @Transactional
    public PartnerApplicationResponseDto submitApplication(UserPrincipal principal, PartnerApplicationRequestDto requestDto) {
        log.info("Memproses pengajuan kemitraan penyelenggara oleh: {}", principal.getUsername());

        Akun akun = akunRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pengguna", "id", principal.getId()));

        if (akun.getRole() != null && RoleConstants.ROLE_ORGANIZER.equalsIgnoreCase(akun.getRole().getRoleName())) {
            throw new BadRequestException("Akun Anda sudah memiliki hak akses sebagai Penyelenggara Acara (Organizer).");
        }

        Optional<PartnerApplication> existingPending = partnerApplicationRepository.findFirstByAkunAndStatus(akun, "PENDING");
        if (existingPending.isPresent()) {
            throw new BadRequestException("Anda sudah memiliki pengajuan kemitraan yang sedang menunggu verifikasi Administrator.");
        }

        PartnerApplication application = PartnerApplication.builder()
                .akun(akun)
                .organizationName(requestDto.getOrganizationName().trim())
                .idCardNumber(requestDto.getIdCardNumber().trim())
                .idCardImage(requestDto.getIdCardImage().trim())
                .bankName(requestDto.getBankName().trim())
                .bankAccountNumber(requestDto.getBankAccountNumber().trim())
                .bankAccountHolder(requestDto.getBankAccountHolder().trim())
                .reason(requestDto.getReason() != null ? requestDto.getReason().trim() : "")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        PartnerApplication saved = partnerApplicationRepository.save(application);
        log.info("Pengajuan kemitraan berhasil dibuat dengan ID: {} untuk user: {}", saved.getId(), akun.getEmail());
        return PartnerApplicationResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerApplicationResponseDto getMyApplication(UserPrincipal principal) {
        Akun akun = akunRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pengguna", "id", principal.getId()));

        List<PartnerApplication> applications = partnerApplicationRepository.findByAkunOrderByCreatedAtDesc(akun);
        if (applications.isEmpty()) {
            return null;
        }

        return PartnerApplicationResponseDto.fromEntity(applications.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PartnerApplicationResponseDto> getAllApplications(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PartnerApplication> appPage;

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            appPage = partnerApplicationRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        } else {
            appPage = partnerApplicationRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<PartnerApplicationResponseDto> content = appPage.getContent().stream()
                .map(PartnerApplicationResponseDto::fromEntity)
                .collect(Collectors.toList());

        return PagedResponse.of(appPage, content);
    }

    @Override
    @Transactional
    public PartnerApplicationResponseDto reviewApplication(String applicationId, PartnerApplicationReviewDto reviewDto, UserPrincipal adminPrincipal) {
        log.info("Super Admin {} meninjau pengajuan ID: {} dengan keputusan: {}", 
                adminPrincipal.getUsername(), applicationId, reviewDto.getStatus());

        PartnerApplication application = partnerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Pengajuan Kemitraan", "id", applicationId));

        if (!"PENDING".equalsIgnoreCase(application.getStatus())) {
            throw new BadRequestException("Pengajuan ini sudah ditinjau sebelumnya dengan status: " + application.getStatus());
        }

        String targetStatus = reviewDto.getStatus().toUpperCase();
        application.setStatus(targetStatus);
        application.setAdminNotes(reviewDto.getAdminNotes() != null ? reviewDto.getAdminNotes().trim() : null);
        application.setReviewedAt(LocalDateTime.now());

        if ("APPROVED".equals(targetStatus)) {
            Akun user = application.getAkun();
            Role organizerRole = roleRepository.findRoleByRoleName(RoleConstants.ROLE_ORGANIZER);
            if (organizerRole == null) {
                organizerRole = new Role();
                organizerRole.setRoleName(RoleConstants.ROLE_ORGANIZER);
                organizerRole = roleRepository.save(organizerRole);
            }
            user.setRole(organizerRole);
            akunRepository.save(user);
            log.info("Pengguna {} resmi ditingkatkan ke peran ORGANIZER", user.getEmail());
        }

        PartnerApplication updated = partnerApplicationRepository.save(application);
        return PartnerApplicationResponseDto.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingApplications() {
        return partnerApplicationRepository.countByStatus("PENDING");
    }
}
