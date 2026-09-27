package com.eventease.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.eventease.constant.RoleConstants;
import com.eventease.dto.auth.AuthResponseDto;
import com.eventease.dto.auth.LoginDto;
import com.eventease.dto.auth.RegisterDto;
import com.eventease.exception.BadRequestException;
import com.eventease.model.Akun;
import com.eventease.model.Role;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.RoleRepositoy;
import com.eventease.security.CustomUserDetailsService;
import com.eventease.security.JwtService;
import com.eventease.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AkunRepository akunRepository;

    @Mock
    private RoleRepositoy roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private AuthServiceImpl authService;

    private Akun dummyAkun;
    private Role dummyRole;

    @BeforeEach
    void setUp() {
        dummyRole = new Role();
        dummyRole.setId("role-1");
        dummyRole.setRoleName("USER");

        dummyAkun = new Akun();
        dummyAkun.setId("user-1");
        dummyAkun.setName("Test User");
        dummyAkun.setEmail("test@gmail.com");
        dummyAkun.setPassword("encodedPassword");
        dummyAkun.setPhone("08123456789");
        dummyAkun.setRole(dummyRole);
        dummyAkun.setSaldo(0);
    }

    @Test
    @DisplayName("Login Berhasil: Mengembalikan token JWT dan data user")
    void testLogin_Success() {
        LoginDto loginDto = new LoginDto("test@gmail.com", "password123");
        UserPrincipal userPrincipal = UserPrincipal.create(dummyAkun);

        Authentication authResult = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authResult);
        when(jwtService.generateAccessToken(eq(userPrincipal), anyMap())).thenReturn("dummy.access.token");
        when(jwtService.generateRefreshToken(eq(userPrincipal))).thenReturn("dummy.refresh.token");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);

        AuthResponseDto response = authService.login(loginDto);

        assertNotNull(response);
        assertEquals("dummy.access.token", response.getAccessToken());
        assertEquals("dummy.refresh.token", response.getRefreshToken());
        assertEquals("test@gmail.com", response.getUser().getEmail());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Login Gagal: Password salah melempar BadCredentialsException")
    void testLogin_InvalidCredentials_ThrowsException() {
        LoginDto loginDto = new LoginDto("test@gmail.com", "wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Email atau kata sandi tidak valid"));

        assertThrows(BadCredentialsException.class, () -> authService.login(loginDto));
    }

    @Test
    @DisplayName("Registrasi Berhasil: Menyimpan akun baru dan mengembalikan token")
    void testRegister_Success() {
        RegisterDto registerDto = new RegisterDto(
                "New User",
                "newuser@gmail.com",
                "081234567890",
                "password123",
                "password123"
        );

        when(akunRepository.findByEmail("newuser@gmail.com")).thenReturn(null);
        when(roleRepository.findRoleByRoleName(RoleConstants.ROLE_USER)).thenReturn(dummyRole);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword123");
        when(akunRepository.save(any(Akun.class))).thenAnswer(invocation -> {
            Akun a = invocation.getArgument(0);
            a.setId("generated-uuid");
            return a;
        });
        when(jwtService.generateAccessToken(any(UserPrincipal.class), anyMap())).thenReturn("token123");
        when(jwtService.generateRefreshToken(any(UserPrincipal.class))).thenReturn("refreshtoken123");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);

        AuthResponseDto response = authService.register(registerDto);

        assertNotNull(response);
        assertEquals("token123", response.getAccessToken());
        assertEquals("newuser@gmail.com", response.getUser().getEmail());
        verify(akunRepository, times(1)).save(any(Akun.class));
    }

    @Test
    @DisplayName("Registrasi Gagal: Konfirmasi password tidak cocok")
    void testRegister_PasswordMismatch_ThrowsBadRequestException() {
        RegisterDto registerDto = new RegisterDto(
                "New User",
                "newuser@gmail.com",
                "081234567890",
                "password123",
                "differentpassword"
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(registerDto));
        assertTrue(ex.getMessage().contains("Password dan Konfirmasi Password"));
        verify(akunRepository, never()).save(any(Akun.class));
    }

    @Test
    @DisplayName("Registrasi Gagal: Email sudah terdaftar")
    void testRegister_EmailAlreadyExists_ThrowsBadRequestException() {
        RegisterDto registerDto = new RegisterDto(
                "Existing User",
                "test@gmail.com",
                "081234567890",
                "password123",
                "password123"
        );

        when(akunRepository.findByEmail("test@gmail.com")).thenReturn(dummyAkun);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(registerDto));
        assertTrue(ex.getMessage().contains("Email sudah terdaftar"));
        verify(akunRepository, never()).save(any(Akun.class));
    }
}
