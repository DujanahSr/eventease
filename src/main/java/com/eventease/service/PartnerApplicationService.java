package com.eventease.service;

import com.eventease.common.PagedResponse;
import com.eventease.dto.partner.PartnerApplicationRequestDto;
import com.eventease.dto.partner.PartnerApplicationResponseDto;
import com.eventease.dto.partner.PartnerApplicationReviewDto;
import com.eventease.security.UserPrincipal;

public interface PartnerApplicationService {

    PartnerApplicationResponseDto submitApplication(UserPrincipal principal, PartnerApplicationRequestDto requestDto);

    PartnerApplicationResponseDto getMyApplication(UserPrincipal principal);

    PagedResponse<PartnerApplicationResponseDto> getAllApplications(String status, int page, int size);

    PartnerApplicationResponseDto reviewApplication(String applicationId, PartnerApplicationReviewDto reviewDto, UserPrincipal adminPrincipal);

    long countPendingApplications();
}
