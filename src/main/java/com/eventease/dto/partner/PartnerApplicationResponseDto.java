package com.eventease.dto.partner;

import java.time.LocalDateTime;

import com.eventease.model.PartnerApplication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerApplicationResponseDto {

    private String id;
    private String userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String organizationName;
    private String idCardNumber;
    private String idCardImage;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String reason;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public static PartnerApplicationResponseDto fromEntity(PartnerApplication entity) {
        if (entity == null) return null;

        return PartnerApplicationResponseDto.builder()
                .id(entity.getId())
                .userId(entity.getAkun() != null ? entity.getAkun().getId() : null)
                .userName(entity.getAkun() != null ? entity.getAkun().getName() : null)
                .userEmail(entity.getAkun() != null ? entity.getAkun().getEmail() : null)
                .userPhone(entity.getAkun() != null ? entity.getAkun().getPhone() : null)
                .organizationName(entity.getOrganizationName())
                .idCardNumber(entity.getIdCardNumber())
                .idCardImage(entity.getIdCardImage())
                .bankName(entity.getBankName())
                .bankAccountNumber(entity.getBankAccountNumber())
                .bankAccountHolder(entity.getBankAccountHolder())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .adminNotes(entity.getAdminNotes())
                .createdAt(entity.getCreatedAt())
                .reviewedAt(entity.getReviewedAt())
                .build();
    }
}
