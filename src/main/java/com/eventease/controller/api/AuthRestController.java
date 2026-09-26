package com.eventease.controller.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventease.common.ApiResponse;
import com.eventease.dto.auth.AuthResponseDto;
import com.eventease.dto.auth.LoginDto;
import com.eventease.dto.auth.RefreshTokenDto;
import com.eventease.dto.auth.RegisterDto;
import com.eventease.dto.auth.UserDto;
import com.eventease.security.UserPrincipal;
import com.eventease.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponseDto>> register(@Valid @RequestBody RegisterDto registerDto) {
        log.info("API Request: Register user {}", registerDto.getEmail());
        AuthResponseDto response = authService.register(registerDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registrasi akun berhasil", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginDto loginDto) {
        log.info("API Request: Login user {}", loginDto.getEmail());
        AuthResponseDto response = authService.login(loginDto);
        return ResponseEntity.ok(ApiResponse.success("Login berhasil", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponseDto>> refreshToken(@Valid @RequestBody RefreshTokenDto tokenDto) {
        log.info("API Request: Refresh token");
        AuthResponseDto response = authService.refreshToken(tokenDto);
        return ResponseEntity.ok(ApiResponse.success("Token berhasil diperbarui", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("API Request: Get profile for current authenticated user");
        UserDto userDto = authService.getCurrentUser(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Data profil berhasil diambil", userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Pada stateless JWT, logout di sisi client cukup menghapus token dari storage.
        // Di Tahap 2, kita dapat menyematkan token blacklist ke Redis.
        return ResponseEntity.ok(ApiResponse.success("Logout berhasil. Token telah dihapus.", null));
    }
}
