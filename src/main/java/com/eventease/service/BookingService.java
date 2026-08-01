package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.TicketCategory;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.TicketCategoryRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TicketCategoryRepository ticketCategoryRepository;

    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }
    
    public Page<Booking> findAll(Pageable pageable) {
        return bookingRepository.findAll(pageable);
    }

    public Booking findById(String id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public List<Booking> findByUserId(String id) {
        return bookingRepository.findByUserId(id);
    }

    @Transactional
    public Booking save(Booking booking) {
        TicketCategory ticket = ticketCategoryRepository.findById(booking.getTicketCategory().getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid ticket category"));
        
        // Cek kapasitas (Stok Tersedia)
        if (ticket.getAvailableStock() < booking.getParticipants()) {
            throw new IllegalStateException("Stok tiket tidak mencukupi. Sisa stok: " + ticket.getAvailableStock());
        }

        // Kurangi stok saat dipesan (Booking PENDING)
        ticket.setAvailableStock(ticket.getAvailableStock() - booking.getParticipants());
        ticketCategoryRepository.save(ticket);

        booking.setTicketCategory(ticket);
        
        // Set default status to PENDING if not set
        if (booking.getStatus() == null) {
            booking.setStatus(Booking.Status.PENDING);
        }
        
        return bookingRepository.save(booking);
    }

    public List<Booking> findBookingsByUser(Akun user) {
        return bookingRepository.findByUser(user);
    }

    public List<Booking> findBookingsByOrganizer(Akun organizer) {
        return bookingRepository.findByTicketCategoryEventOrganizerOrderByEventDateAsc(organizer);
    }
    
    public Page<Booking> findBookingsByOrganizer(Akun organizer, Pageable pageable) {
        return bookingRepository.findByTicketCategoryEventOrganizerOrderByEventDateAsc(organizer, pageable);
    }

    @Transactional
    public void deleteById(String id) {
        Booking booking = findById(id);
        if (booking != null) {
            // Restore capacity if the booking was not already canceled
            if (booking.getStatus() != Booking.Status.CANCELED) {
                TicketCategory ticket = booking.getTicketCategory();
                ticket.setAvailableStock(ticket.getAvailableStock() + booking.getParticipants());
                ticketCategoryRepository.save(ticket);
            }
            bookingRepository.deleteById(id);
        }
    }

    @Transactional
    public void cancelBooking(String id) {
        Booking booking = findById(id);
        if (booking != null && booking.getStatus() != Booking.Status.CANCELED) {
            booking.setStatus(Booking.Status.CANCELED);
            TicketCategory ticket = booking.getTicketCategory();
            ticket.setAvailableStock(ticket.getAvailableStock() + booking.getParticipants());
            ticketCategoryRepository.save(ticket);
            bookingRepository.save(booking);
        }
    }

    public boolean isDateAlreadyBooked(LocalDate eventDate, String userId) {
        List<Booking> bookings = bookingRepository.findByEventDateAndUserId(eventDate, userId);
        return !bookings.isEmpty();
    }

    public boolean isDateAlreadyBooked(LocalDate eventDate, String userId, String eventId) {
        List<Booking> bookings = bookingRepository.findByEventDateAndUserId(eventDate, userId);
        return bookings.stream().anyMatch(b -> b.getTicketCategory().getEvent().getId().equals(eventId));
    }

    public void validateBookingDate(LocalDate eventDate) {
        LocalDate today = LocalDate.now();
        if (eventDate.isBefore(today) || eventDate.isEqual(today)) {
            throw new IllegalArgumentException("Tanggal pemesanan tidak boleh hari ini atau sebelumnya.");
        }
    }

    public List<Booking> searchByEventName(String eventName) {
        return bookingRepository.findByTicketCategoryEventNameContainingIgnoreCase(eventName);
    }
    
    public Page<Booking> searchByEventName(String eventName, Pageable pageable) {
        return bookingRepository.findByTicketCategoryEventNameContainingIgnoreCase(eventName, pageable);
    }

    public List<Booking> findAllSortedByDateAsc() {
        return bookingRepository.findByOrderByEventDateAsc();
    }
    
    public Page<Booking> findAllSortedByDateAsc(Pageable pageable) {
        return bookingRepository.findByOrderByEventDateAsc(pageable);
    }

    public List<Booking> findAllSortedByParticipantsDesc() {
        return bookingRepository.findByOrderByParticipantsDesc();
    }
    
    public Page<Booking> findAllSortedByParticipantsDesc(Pageable pageable) {
        return bookingRepository.findByOrderByParticipantsDesc(pageable);
    }

    public boolean isBookingConfirmed(Booking booking) {
        return booking.getStatus() == Booking.Status.CONFIRMED;
    }

    public List<Booking> findConfirmedBookingsByUser(Akun user) {
        return bookingRepository.findByUserAndStatus(user, Booking.Status.CONFIRMED);
    }

    public List<Booking> findActiveBookingsByUser(Akun user) {
        return bookingRepository.findByUserAndStatusIn(user, List.of(Booking.Status.PENDING, 
Booking.Status.CONFIRMED, Booking.Status.CANCELED));
    }
    
    public Page<Booking> findActiveBookingsByUser(Akun user, Pageable pageable) {
        return bookingRepository.findByUserAndStatusIn(user, List.of(Booking.Status.PENDING, 
Booking.Status.CONFIRMED, Booking.Status.CANCELED), pageable);
    }

    public List<Booking> findPaidBookingsByUser(Akun user) {
        return bookingRepository.findByUserAndStatus(user, Booking.Status.PAID);
    }
    
    public Page<Booking> findPaidBookingsByUser(Akun user, Pageable pageable) {
        return bookingRepository.findByUserAndStatus(user, Booking.Status.PAID, pageable);
    }

    public void updateBookingStatusToPaid(Booking booking) {
        booking.setStatus(Booking.Status.PAID);
        bookingRepository.save(booking);
    }
}
