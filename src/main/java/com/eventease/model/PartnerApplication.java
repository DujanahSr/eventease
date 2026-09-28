package com.eventease.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "partner_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerApplication {

    @Id
    @UuidGenerator
    @Column(name = "application_id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private Akun akun;

    @Column(name = "organization_name", nullable = false, length = 150)
    private String organizationName;

    @Column(name = "id_card_number", nullable = false, length = 30)
    private String idCardNumber;

    @Column(name = "id_card_image", length = 500)
    private String idCardImage;

    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;

    @Column(name = "bank_account_number", nullable = false, length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_account_holder", nullable = false, length = 100)
    private String bankAccountHolder;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_notes", length = 500)
    private String adminNotes;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
