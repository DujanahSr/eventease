package com.eventease.model;

// import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    @UuidGenerator
    @Column(name = "category_id", length = 36, nullable = false, unique = true)
    private String id;    

    @Column(nullable = false, unique = true)
    private String name;

    private String description;
}

