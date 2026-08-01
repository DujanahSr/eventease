package com.eventease.model;

import org.hibernate.annotations.UuidGenerator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCategory {

    @Id
    @UuidGenerator
    @Column(name = "ticket_category_id", length = 36, nullable = false, unique = true)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", referencedColumnName = "event_id", nullable = false)
    private Event event;

    private String name; // e.g. "Early Bird", "VIP", "Regular"
    private double price;
    private int capacity; // Total capacity for this tier
    private int availableStock; // Dynamic stock that decreases on booking
}
