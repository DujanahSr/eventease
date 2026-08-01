package com.eventease.model;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @UuidGenerator
    @Column(name = "role_id", length = 36, nullable = false)
    private String id;
    private String roleName;
    private String roleDesc;
}
    
