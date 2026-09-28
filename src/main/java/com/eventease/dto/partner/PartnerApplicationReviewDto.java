package com.eventease.dto.partner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerApplicationReviewDto {

    @NotBlank(message = "Status keputusan wajib diisi (APPROVED atau REJECTED)")
    @Pattern(regexp = "^(APPROVED|REJECTED)$", message = "Status harus bernilai APPROVED atau REJECTED")
    private String status;

    private String adminNotes;
}
