package com.eventease.model;

import java.util.List;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Akun {
    @Id
    @UuidGenerator
    @Column(name = "user_id", length = 36, nullable = false)
    private String id;
    private String name;
    private String email;
    private String phone;
    private String password;
    
    private String confirmPassword;

    @Column(nullable = false)
    private double saldo = 0.0;

    @Column(name = "reset_token", length = 100)
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private java.time.LocalDateTime resetTokenExpiry;

    @Column(name = "profile_picture")
    private String profilePicture;

    @ManyToOne
    @JoinColumn(name = "role_id", referencedColumnName = "role_id", nullable = false)
    private Role role;

    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER)
    private List<Payment> payments; 
}
