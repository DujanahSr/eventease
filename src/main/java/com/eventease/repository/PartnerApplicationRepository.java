package com.eventease.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.eventease.model.Akun;
import com.eventease.model.PartnerApplication;

@Repository
public interface PartnerApplicationRepository extends JpaRepository<PartnerApplication, String> {

    List<PartnerApplication> findByAkunOrderByCreatedAtDesc(Akun akun);

    Optional<PartnerApplication> findFirstByAkunAndStatus(Akun akun, String status);

    Page<PartnerApplication> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<PartnerApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
