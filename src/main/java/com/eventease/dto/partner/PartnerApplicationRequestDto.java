package com.eventease.dto.partner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerApplicationRequestDto {

    @NotBlank(message = "Nama Organisasi / EO wajib diisi")
    @Size(min = 3, max = 150, message = "Nama Organisasi harus antara 3 - 150 karakter")
    private String organizationName;

    @NotBlank(message = "Nomor NIK / KTP wajib diisi")
    @Size(min = 10, max = 30, message = "Nomor NIK / KTP harus valid (10-30 karakter)")
    private String idCardNumber;

    @NotBlank(message = "Foto KTP / identitas wajib diunggah")
    private String idCardImage;

    @NotBlank(message = "Nama Bank wajib dipilih")
    private String bankName;

    @NotBlank(message = "Nomor Rekening Bank wajib diisi")
    @Size(min = 5, max = 30, message = "Nomor Rekening Bank tidak valid")
    private String bankAccountNumber;

    @NotBlank(message = "Nama Pemilik Rekening wajib diisi")
    @Size(min = 3, max = 100, message = "Nama Pemilik Rekening minimal 3 karakter")
    private String bankAccountHolder;

    private String reason;
}
