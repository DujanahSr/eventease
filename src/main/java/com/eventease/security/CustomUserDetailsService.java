package com.eventease.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.model.Akun;
import com.eventease.repository.AkunRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AkunRepository akunRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Akun akun = akunRepository.findByEmail(email);
        if (akun == null) {
            akun = akunRepository.findUserByEmail(email);
        }
        if (akun == null) {
            throw new UsernameNotFoundException("Pengguna tidak ditemukan dengan email: " + email);
        }
        return UserPrincipal.create(akun);
    }
}
