package com.eventease.dto.auth;

import com.eventease.model.Akun;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String profilePicture;
    private double saldo;

    public static UserDto fromEntity(Akun akun) {
        if (akun == null) return null;
        return UserDto.builder()
                .id(akun.getId())
                .name(akun.getName())
                .email(akun.getEmail())
                .phone(akun.getPhone())
                .role(akun.getRole() != null ? akun.getRole().getRoleName() : "USER")
                .profilePicture(akun.getProfilePicture())
                .saldo(akun.getSaldo())
                .build();
    }
}
