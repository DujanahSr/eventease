package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Payment;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.PaymentRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor

public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final AkunRepository userRepository;

    private final BookingRepository bookingRepository;

    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    public List<Payment> findAllByUser(Akun user) {
        return paymentRepository.findByUser(user);
    }

    public Payment findById(String id) {
        return paymentRepository.findById(id).orElse(null);
    }

    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    public void deleteById(String id) {
        paymentRepository.deleteById(id);
    }

    public void makePayment(Akun user, double amount, Booking booking) throws Exception {
        Payment payment = new Payment();
        payment.setAmount(amount);
        payment.setBooking(booking);
        payment.setUser(user);
        payment.setPaymentDate(LocalDateTime.now());

        paymentRepository.save(payment);

        booking.setStatus(Booking.Status.PAID);  
        bookingRepository.save(booking);

        userRepository.save(user);
    }
}
