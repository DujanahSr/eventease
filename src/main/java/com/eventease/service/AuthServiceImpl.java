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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

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

        Role userRole = roleRepository.findRoleByRoleName(RoleConstants.ROLE_USER);
        if (userRole == null) {
            throw new ResourceNotFoundException("Role pengguna 'USER' belum diinisialisasi dalam database.");
        }

        Akun newAkun = new Akun();
        newAkun.setName(registerDto.getName().trim());
        newAkun.setEmail(registerDto.getEmail().trim().toLowerCase());
        newAkun.setPhone(registerDto.getPhone().trim());
        newAkun.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        newAkun.setRole(userRole);
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
