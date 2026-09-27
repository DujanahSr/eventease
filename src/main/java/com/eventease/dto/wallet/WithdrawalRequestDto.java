package com.eventease.dto.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestDto {

    @NotNull(message = "Nominal penarikan wajib diisi")
    @DecimalMin(value = "50000.0", message = "Minimal penarikan dana adalah Rp50.000")
    private Double amount;

    @NotBlank(message = "Nama bank wajib diisi")
    private String bankName;

    @NotBlank(message = "Nomor rekening wajib diisi")
    private String accountNumber;

    @NotBlank(message = "Nama pemilik rekening wajib diisi")
    private String accountName;
}
