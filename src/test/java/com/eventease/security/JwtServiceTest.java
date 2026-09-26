package com.eventease.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Set test secret (256-bit secure key)
        ReflectionTestUtils.setField(jwtService, "secretKey", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 900000L); // 15 mins
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpiration", 604800000L); // 7 days

        userDetails = new User(
                "testuser@gmail.com",
                "encodedPassword",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    void testGenerateAccessToken_Success() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "USER");
        extraClaims.put("name", "Test User");

        String token = jwtService.generateAccessToken(userDetails, extraClaims);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertEquals("testuser@gmail.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void testGenerateRefreshToken_Success() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        assertNotNull(refreshToken);
        assertEquals("testuser@gmail.com", jwtService.extractUsername(refreshToken));
        assertTrue(jwtService.isTokenValid(refreshToken, userDetails));
    }

    @Test
    void testIsTokenValid_WrongUser_ReturnsFalse() {
        String token = jwtService.generateAccessToken(userDetails);

        UserDetails otherUser = new User(
                "otheruser@gmail.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }
}
