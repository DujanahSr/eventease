package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.repository.BookingRepository;
import com.eventease.repository.PaymentRepository;
import com.eventease.repository.AkunRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardStatisticsService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final AkunRepository akunRepository; // Ganti UserRepository dengan AkunRepository

    public long getTotalBookings() {
        return bookingRepository.count();
    }

    public long getTotalPayments() {
        return paymentRepository.count();
    }

    public long getTotalUsers() {
        return akunRepository.count(); 
    }

    public Double getTotalRevenue() {
        return bookingRepository.calculateTotalRevenue();
    }

    public List<Object[]> getTicketSalesByEvent() {
        return bookingRepository.getTicketSalesByEvent();
    }

    public List<Object[]> getRevenueByDate() {
        List<Object[]> raw = bookingRepository.getRevenueByDate();
        List<Object[]> formatted = new java.util.ArrayList<>();
        for (Object[] row : raw) {
            String dateStr = row[0] != null ? row[0].toString() : "Unknown";
            formatted.add(new Object[]{dateStr, row[1]});
        }
        return formatted;
    }

    // MULTITENANCY / ORGANIZER METHODS

    public long getTotalBookingsByOrganizer(com.eventease.model.Akun organizer) {
        return bookingRepository.countBookingsByOrganizer(organizer);
    }

    public long getTotalUsersByOrganizer(com.eventease.model.Akun organizer) {
        return bookingRepository.countDistinctUsersByOrganizer(organizer);
    }

    public Double getTotalRevenueByOrganizer(com.eventease.model.Akun organizer) {
        return bookingRepository.calculateTotalRevenueByOrganizer(organizer);
    }

    public List<Object[]> getTicketSalesByEventAndOrganizer(com.eventease.model.Akun organizer) {
        return bookingRepository.getTicketSalesByEventAndOrganizer(organizer);
    }

    public List<Object[]> getRevenueByDateAndOrganizer(com.eventease.model.Akun organizer) {
        List<Object[]> raw = bookingRepository.getRevenueByDateAndOrganizer(organizer);
        List<Object[]> formatted = new java.util.ArrayList<>();
        for (Object[] row : raw) {
            String dateStr = row[0] != null ? row[0].toString() : "Unknown";
            formatted.add(new Object[]{dateStr, row[1]});
        }
        return formatted;
    }
}
