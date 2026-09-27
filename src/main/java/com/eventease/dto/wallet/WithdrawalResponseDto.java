package com.eventease.dto.wallet;

import java.time.LocalDateTime;

import com.eventease.model.Withdrawal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalResponseDto {
    private String id;
    private String organizerName;
    private String organizerEmail;
    private Double amount;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private LocalDateTime requestDate;
    private String status;

    public static WithdrawalResponseDto fromEntity(Withdrawal w) {
        return WithdrawalResponseDto.builder()
                .id(w.getId())
                .organizerName(w.getOrganizer() != null ? w.getOrganizer().getName() : "-")
                .organizerEmail(w.getOrganizer() != null ? w.getOrganizer().getEmail() : "-")
                .amount(w.getAmount())
                .bankName(w.getBankName())
                .accountNumber(w.getAccountNumber())
                .accountName(w.getAccountName())
                .requestDate(w.getRequestDate())
                .status(w.getStatus() != null ? w.getStatus().name() : "PENDING")
                .build();
    }
}
