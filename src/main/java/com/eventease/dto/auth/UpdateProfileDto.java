package com.eventease.dto.auth;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileDto {

    @Size(min = 2, max = 100, message = "Nama pengguna minimal 2 dan maksimal 100 karakter")
    private String name;

    @Size(max = 20, message = "Nomor telepon maksimal 20 digit")
    private String phone;

    private String profilePicture;
}
