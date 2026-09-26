package com.eventease.security;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.eventease.model.Akun;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final String id;
    private final String name;
    private final String email;
    private final String password;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;
    private final Akun akun;

    public static UserPrincipal create(Akun akun) {
        String roleName = (akun.getRole() != null && akun.getRole().getRoleName() != null)
                ? akun.getRole().getRoleName().toUpperCase()
                : "USER";

        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        GrantedAuthority authority = new SimpleGrantedAuthority(roleName);

        return new UserPrincipal(
                akun.getId(),
                akun.getName(),
                akun.getEmail(),
                akun.getPassword(),
                akun.getRole() != null ? akun.getRole().getRoleName() : "USER",
                Collections.singletonList(authority),
                akun
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
