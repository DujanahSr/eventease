package com.eventease.controller.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "1. Autentikasi & Akun", description = "Registrasi pengguna baru, login akun, refresh JWT token, dan profil")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {

    private final AuthService authService;
    private final com.eventease.cache.TokenBlacklistService tokenBlacklistService;
    private final com.eventease.security.JwtService jwtService;

    @Operation(summary = "Registrasi Akun Baru", description = "Mendaftarkan pengguna baru dengan role default USER dan mengembalikan token JWT.")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponseDto>> register(@Valid @RequestBody RegisterDto registerDto) {
        log.info("API Request: Register user {}", registerDto.getEmail());
        AuthResponseDto response = authService.register(registerDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registrasi akun berhasil", response));
    }

    @Operation(summary = "Login Pengguna", description = "Autentikasi kredensial email & password, mengembalikan access token (15 menit) dan refresh token (7 hari).")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginDto loginDto) {
        log.info("API Request: Login user {}", loginDto.getEmail());
        AuthResponseDto response = authService.login(loginDto);
        return ResponseEntity.ok(ApiResponse.success("Login berhasil", response));
    }

    @Operation(summary = "Login dengan Google OAuth2", description = "Autentikasi akun via Google Identity Services ID Token, auto register akun baru jika belum terdaftar.")
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponseDto>> googleLogin(@Valid @RequestBody com.eventease.dto.auth.GoogleLoginDto googleDto) {
        log.info("API Request: Google OAuth2 Login");
        AuthResponseDto response = authService.loginWithGoogle(googleDto.getCredential());
        return ResponseEntity.ok(ApiResponse.success("Login dengan Google berhasil", response));
    }

    @Operation(summary = "Perbarui Access Token", description = "Memperoleh access token JWT baru menggunakan refresh token yang masih valid.")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponseDto>> refreshToken(@Valid @RequestBody RefreshTokenDto tokenDto) {
        log.info("API Request: Refresh token");
        AuthResponseDto response = authService.refreshToken(tokenDto);
        return ResponseEntity.ok(ApiResponse.success("Token berhasil diperbarui", response));
    }

    @Operation(summary = "Profil Pengguna Saat Ini", description = "Mengambil detail profil akun yang sedang login berdasarkan Bearer JWT token.")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("API Request: Get profile for current authenticated user");
        UserDto userDto = authService.getCurrentUser(userPrincipal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Data profil berhasil diambil", userDto));
    }

    @Operation(summary = "Perbarui Profil Pengguna", description = "Memperbarui nama, nomor telepon, dan URL foto profil akun pengguna yang sedang login.")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody com.eventease.dto.auth.UpdateProfileDto updateDto) {
        log.info("API Request: Update profile for user {}", userPrincipal.getUsername());
        UserDto updatedUser = authService.updateProfile(userPrincipal.getUsername(), updateDto);
        return ResponseEntity.ok(ApiResponse.success("Profil berhasil diperbarui", updatedUser));
    }

    @Operation(summary = "Logout Pengguna", description = "Memasukkan JWT token ke Redis Blacklist sehingga tidak dapat digunakan kembali.")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenBlacklistService.blacklistToken(token, jwtService.getAccessTokenExpiration());
            log.info("User logout: token telah dimasukkan ke Redis blacklist.");
        }
        return ResponseEntity.ok(ApiResponse.success("Logout berhasil. Token telah dibatalkan dan dimasukkan ke blacklist.", null));
    }
}
