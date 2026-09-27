package com.eventease.repository;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Booking.Status;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {
    boolean existsByTicketCategoryEventId(String eventId);

    long countByTicketCategoryEventIdAndStatus(String eventId, Booking.Status status);

    List<Booking> findByUserId(String userId);

    List<Booking> findByUser(Akun user);

    List<Booking> findByEventDateAndUserId(LocalDate eventDate, String userId);

    List<Booking> findByTicketCategoryEventNameContainingIgnoreCase(String eventName);
    Page<Booking> findByTicketCategoryEventNameContainingIgnoreCase(String eventName, Pageable pageable);

    List<Booking> findByOrderByEventDateAsc();
    Page<Booking> findByOrderByEventDateAsc(Pageable pageable);

    List<Booking> findByOrderByParticipantsDesc();
    Page<Booking> findByOrderByParticipantsDesc(Pageable pageable);

    List<Booking> findByStatus(Booking.Status status);

    List<Booking> findByUserAndStatus(Akun user, Booking.Status status);

    Page<Booking> findByUserAndStatus(Akun user, Booking.Status status, Pageable pageable);

    List<Booking> findByUserAndStatusIn(Akun user, List<Status> of);

    Page<Booking> findByUserAndStatusIn(Akun user, List<Status> of, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.ticketCategory.price * b.participants), 0) FROM Booking b WHERE b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN")
    Double calculateTotalRevenue();

    @org.springframework.data.jpa.repository.Query("SELECT b.ticketCategory.event.name, SUM(b.participants) FROM Booking b WHERE b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN GROUP BY b.ticketCategory.event.name")
    List<Object[]> getTicketSalesByEvent();

    @org.springframework.data.jpa.repository.Query("SELECT b.ticketCategory.event.date, COALESCE(SUM(b.ticketCategory.price * b.participants), 0) FROM Booking b WHERE b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN GROUP BY b.ticketCategory.event.date ORDER BY b.ticketCategory.event.date ASC")
    List<Object[]> getRevenueByDate();

    // Multitenancy (Organizer Isolated) Queries
    boolean existsByTicketCategoryEventIdAndTicketCategoryEventOrganizer(String eventId, Akun organizer);
    List<Booking> findByTicketCategoryEventOrganizerOrderByEventDateAsc(Akun organizer);
    Page<Booking> findByTicketCategoryEventOrganizerOrderByEventDateAsc(Akun organizer, Pageable pageable);
    List<Booking> findByTicketCategoryEventId(String eventId);
    List<Booking> findByTicketCategoryEventIdAndTicketCategoryEventOrganizer(String eventId, Akun organizer);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT b.user.id) FROM Booking b WHERE b.ticketCategory.event.organizer = :organizer")
    Long countDistinctUsersByOrganizer(@org.springframework.data.repository.query.Param("organizer") Akun organizer);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM Booking b WHERE b.ticketCategory.event.organizer = :organizer")
    Long countBookingsByOrganizer(@org.springframework.data.repository.query.Param("organizer") Akun organizer);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.ticketCategory.price * b.participants), 0) FROM Booking b WHERE (b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN) AND b.ticketCategory.event.organizer = :organizer")
    Double calculateTotalRevenueByOrganizer(@org.springframework.data.repository.query.Param("organizer") Akun organizer);

    @org.springframework.data.jpa.repository.Query("SELECT b.ticketCategory.event.name, SUM(b.participants) FROM Booking b WHERE (b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN) AND b.ticketCategory.event.organizer = :organizer GROUP BY b.ticketCategory.event.name")
    List<Object[]> getTicketSalesByEventAndOrganizer(@org.springframework.data.repository.query.Param("organizer") Akun organizer);

    @org.springframework.data.jpa.repository.Query("SELECT b.ticketCategory.event.date, COALESCE(SUM(b.ticketCategory.price * b.participants), 0) FROM Booking b WHERE (b.status = com.eventease.model.Booking$Status.PAID OR b.status = com.eventease.model.Booking$Status.CHECKED_IN) AND b.ticketCategory.event.organizer = :organizer GROUP BY b.ticketCategory.event.date ORDER BY b.ticketCategory.event.date ASC")
    List<Object[]> getRevenueByDateAndOrganizer(@org.springframework.data.repository.query.Param("organizer") Akun organizer);
}
