package com.eventease.service;

import com.eventease.dto.auth.AuthResponseDto;
import com.eventease.dto.auth.LoginDto;
import com.eventease.dto.auth.RefreshTokenDto;
import com.eventease.dto.auth.RegisterDto;
import com.eventease.dto.auth.UserDto;

public interface AuthService {
    AuthResponseDto login(LoginDto loginDto);
    AuthResponseDto register(RegisterDto registerDto);
    AuthResponseDto refreshToken(RefreshTokenDto tokenDto);
    AuthResponseDto loginWithGoogle(String credential);
    UserDto getCurrentUser(String email);
}
