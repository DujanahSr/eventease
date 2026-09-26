package com.eventease.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDto {

    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(min = 3, max = 100, message = "Nama lengkap harus antara 3 hingga 100 karakter")
    private String name;

    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String email;

    @NotBlank(message = "Nomor telepon tidak boleh kosong")
    @Pattern(regexp = "^\\d{10,15}$", message = "Nomor telepon harus berupa angka antara 10 hingga 15 digit")
    private String phone;

    @NotBlank(message = "Password tidak boleh kosong")
    @Size(min = 6, max = 50, message = "Password minimal 6 karakter")
    private String password;

    @NotBlank(message = "Konfirmasi password tidak boleh kosong")
    private String confirmPassword;
}
