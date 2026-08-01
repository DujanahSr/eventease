package com.eventease.repository;

import com.eventease.model.Akun;
import com.eventease.model.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, String> {
    List<Withdrawal> findByOrganizerOrderByRequestDateDesc(Akun organizer);
    Page<Withdrawal> findByOrganizerOrderByRequestDateDesc(Akun organizer, Pageable pageable);
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.organizer = :organizer AND (w.status = 'APPROVED' OR w.status = 'PENDING')")
    Double calculateTotalWithdrawnOrPendingByOrganizer(@Param("organizer") Akun organizer);
}
