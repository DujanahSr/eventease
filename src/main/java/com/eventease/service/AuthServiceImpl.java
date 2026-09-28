package com.eventease.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.constant.RoleConstants;
import com.eventease.dto.auth.AuthResponseDto;
import com.eventease.dto.auth.LoginDto;
import com.eventease.dto.auth.RefreshTokenDto;
import com.eventease.dto.auth.RegisterDto;
import com.eventease.dto.auth.UserDto;
import com.eventease.exception.BadRequestException;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.exception.UnauthorizedException;
import com.eventease.model.Akun;
import com.eventease.model.Role;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.RoleRepositoy;
import com.eventease.security.CustomUserDetailsService;
import com.eventease.security.JwtService;
import com.eventease.security.UserPrincipal;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import java.util.Collections;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${google.client.id:146370175848-nv395oku7lv35171e8t26011sajhamvp.apps.googleusercontent.com}")
    private String googleClientId;

    private final AuthenticationManager authenticationManager;
    private final AkunRepository akunRepository;
    private final RoleRepositoy roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginDto loginDto) {
        log.info("Memproses login untuk email: {}", loginDto.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateAuthResponse(userPrincipal);
    }

    @Override
    @Transactional
    public AuthResponseDto register(RegisterDto registerDto) {
        log.info("Memproses registrasi pengguna baru: {}", registerDto.getEmail());

        if (!registerDto.getPassword().equals(registerDto.getConfirmPassword())) {
            throw new BadRequestException("Password dan Konfirmasi Password tidak cocok.");
        }

        Akun existingUser = akunRepository.findByEmail(registerDto.getEmail());
        if (existingUser != null) {
            throw new BadRequestException("Email sudah terdaftar. Silakan gunakan email lain atau lakukan login.");
        }

        // Model B (Curated / Enterprise Role Management):
        // Seluruh pendaftaran publik (form maupun Google OAuth) wajib menghasilkan akun role USER.
        // Role ORGANIZER hanya dapat diaktifkan secara terkurasi oleh Super Admin melalui panel manajemen pengguna.
        Role targetRole = roleRepository.findRoleByRoleName(RoleConstants.ROLE_USER);
        if (targetRole == null) {
            targetRole = new Role();
            targetRole.setRoleName(RoleConstants.ROLE_USER);
            targetRole = roleRepository.save(targetRole);
        }

        Akun newAkun = new Akun();
        newAkun.setName(registerDto.getName().trim());
        newAkun.setEmail(registerDto.getEmail().trim().toLowerCase());
        newAkun.setPhone(registerDto.getPhone().trim());
        newAkun.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        newAkun.setRole(targetRole);
        newAkun.setSaldo(0);

        Akun savedAkun = akunRepository.save(newAkun);
        UserPrincipal userPrincipal = UserPrincipal.create(savedAkun);

        return generateAuthResponse(userPrincipal);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponseDto refreshToken(RefreshTokenDto tokenDto) {
        String refreshToken = tokenDto.getRefreshToken();
        
        try {
            String username = jwtService.extractUsername(refreshToken);
            if (username == null) {
                throw new UnauthorizedException("Refresh token tidak valid");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                throw new UnauthorizedException("Refresh token sudah kedaluwarsa atau tidak valid");
            }

            UserPrincipal userPrincipal = (UserPrincipal) userDetails;
            return generateAuthResponse(userPrincipal);

        } catch (Exception ex) {
            throw new UnauthorizedException("Gagal memperbarui token: " + ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        Akun akun = akunRepository.findByEmail(email);
        if (akun == null) {
            akun = akunRepository.findUserByEmail(email);
        }
        if (akun == null) {
            throw new ResourceNotFoundException("Pengguna", "email", email);
        }
        return UserDto.fromEntity(akun);
    }

    @Override
    @Transactional
    public UserDto updateProfile(String email, com.eventease.dto.auth.UpdateProfileDto updateDto) {
        Akun akun = akunRepository.findByEmail(email);
        if (akun == null) {
            akun = akunRepository.findUserByEmail(email);
        }
        if (akun == null) {
            throw new ResourceNotFoundException("Pengguna", "email", email);
        }

        if (updateDto.getName() != null && !updateDto.getName().isBlank()) {
            akun.setName(updateDto.getName().trim());
        }
        if (updateDto.getPhone() != null) {
            akun.setPhone(updateDto.getPhone().trim());
        }
        if (updateDto.getProfilePicture() != null && !updateDto.getProfilePicture().isBlank()) {
            akun.setProfilePicture(updateDto.getProfilePicture().trim());
        }

        Akun saved = akunRepository.save(akun);
        log.info("Profil pengguna berhasil diperbarui: email={}, nama={}", email, saved.getName());
        return UserDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public AuthResponseDto loginWithGoogle(String credential) {
        log.info("Memproses autentikasi Google Identity Services");
        try {
            NetHttpTransport transport = new NetHttpTransport();
            GsonFactory jsonFactory = new GsonFactory();

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new UnauthorizedException("Kredensial Google ID Token tidak valid atau kedaluwarsa.");
            }

            Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            Akun user = akunRepository.findByEmail(email);
            if (user == null) {
                Role userRole = roleRepository.findRoleByRoleName(RoleConstants.ROLE_USER);
                if (userRole == null) {
                    userRole = new Role();
                    userRole.setRoleName("USER");
                    userRole = roleRepository.save(userRole);
                }

                user = new Akun();
                user.setEmail(email.trim().toLowerCase());
                user.setName(name != null ? name : "Pengguna Google");
                user.setPhone("");
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRole(userRole);
                user.setProfilePicture(picture);
                user.setSaldo(0);

                user = akunRepository.save(user);
                log.info("Pengguna baru via Google berhasil didaftarkan: {}", email);
            } else if (picture != null && (user.getProfilePicture() == null || user.getProfilePicture().isBlank())) {
                user.setProfilePicture(picture);
                akunRepository.save(user);
            }

            UserPrincipal userPrincipal = UserPrincipal.create(user);
            return generateAuthResponse(userPrincipal);
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.error("Gagal verifikasi Google ID Token: {}", e.getMessage());
            throw new UnauthorizedException("Verifikasi Google ID Token gagal: " + e.getMessage());
        }
    }

    private AuthResponseDto generateAuthResponse(UserPrincipal userPrincipal) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", userPrincipal.getRole());
        extraClaims.put("id", userPrincipal.getId());
        extraClaims.put("name", userPrincipal.getName());

        String accessToken = jwtService.generateAccessToken(userPrincipal, extraClaims);
        String refreshToken = jwtService.generateRefreshToken(userPrincipal);

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                .user(UserDto.fromEntity(userPrincipal.getAkun()))
                .build();
    }
}
