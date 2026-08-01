package com.eventease.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.eventease.model.Akun;

public interface AkunRepository extends JpaRepository<Akun, String>{
    Akun findUserByEmail(String email);

    @Query("SELECT a FROM Akun a WHERE a.email = :email")
    Akun findByEmail(@Param("email") String email);
    
    java.util.Optional<Akun> findByResetToken(String resetToken);
}
