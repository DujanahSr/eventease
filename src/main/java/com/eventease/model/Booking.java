package com.eventease.model;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @UuidGenerator
    @Column(name = "booking_id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private Akun user; // Relasi ke Akun

    @ManyToOne
    @JoinColumn(name = "ticket_category_id", referencedColumnName = "ticket_category_id", nullable = false)
    private TicketCategory ticketCategory; // Relasi ke Tiket spesifik yang dibeli

    private LocalDate eventDate; 
    private int participants; 

    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING) 
    private Status status;

    public enum Status {
        PENDING,
        CONFIRMED,
        PAID,
        CANCELED,
        CHECKED_IN
    }
    

}
