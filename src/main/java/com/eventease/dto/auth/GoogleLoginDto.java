package com.eventease.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginDto {

    @NotBlank(message = "Token kredensial Google wajib diisi")
    private String credential;
}
