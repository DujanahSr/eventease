package com.eventease.model;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @UuidGenerator
    @Column(name = "payment_id", length = 36, nullable = false)
    private String id;

    @ManyToOne
    @JoinColumn(name = "booking_id", referencedColumnName = "booking_id", nullable = false)
    private Booking booking; // Relasi ke Booking

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private Akun user; // Relasi ke Akun (User )


    private double amount; 
    private LocalDateTime paymentDate; 
}
