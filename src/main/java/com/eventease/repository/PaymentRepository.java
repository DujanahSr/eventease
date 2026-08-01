package com.eventease.repository;

import com.eventease.model.Akun;
import com.eventease.model.Payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByUser(Akun user);
}
