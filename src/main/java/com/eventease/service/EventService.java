package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Event;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.FeedbackRepository;
import com.eventease.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;



@Service
@RequiredArgsConstructor

public class EventService {
    private final EventRepository eventRepository;

    private final BookingRepository bookingRepository;

    private final FeedbackRepository feedbackRepository;

    public List<Event> findAll() {
        return eventRepository.findAll();
    }

    public Event findById(String id) {
        return eventRepository.findById(id).orElse(null);
    }

    public Event save(Event event) {
        return eventRepository.save(event);
    }

    public void deleteById(String id) {
        if (bookingRepository.existsByTicketCategoryEventId(id)) {
            throw new IllegalStateException("Cannot delete service with active bookings.");
        }

        if (feedbackRepository.existsByEventId(id)) {
            throw new IllegalStateException("Cannot delete service with feedback records.");
        }

        eventRepository.deleteById(id);
    }

    // Removed Blob methods

    public List<Event> searchByEventName(String name) {
        return eventRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Page<Event> searchByEventName(String name, Pageable pageable) {
        return eventRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    public List<Event> findByOrganizer(com.eventease.model.Akun organizer) {
        return eventRepository.findByOrganizer(organizer);
    }
    
    public Page<Event> findByOrganizer(com.eventease.model.Akun organizer, Pageable pageable) {
        return eventRepository.findByOrganizer(organizer, pageable);
    }

    public List<Event> searchByEventNameAndOrganizer(String name, com.eventease.model.Akun organizer) {
        return eventRepository.findByNameContainingIgnoreCaseAndOrganizer(name, organizer);
    }
    
    public Page<Event> searchByEventNameAndOrganizer(String name, com.eventease.model.Akun organizer, Pageable pageable) {
        return eventRepository.findByNameContainingIgnoreCaseAndOrganizer(name, organizer, pageable);
    }
    
    public Page<Event> searchAdvanced(String name, String categoryId, Pageable pageable) {
        if (categoryId != null && !categoryId.trim().isEmpty()) {
            if (name != null && !name.trim().isEmpty()) {
                return eventRepository.findByNameContainingIgnoreCaseAndCategoryId(name.trim(), categoryId.trim(), pageable);
            } else {
                return eventRepository.findByCategoryId(categoryId.trim(), pageable);
            }
        } else {
            if (name != null && !name.trim().isEmpty()) {
                return eventRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
            } else {
                return eventRepository.findAll(pageable);
            }
        }
    }

    public Page<Event> findAll(Pageable pageable) {
        return eventRepository.findAll(pageable);
    }

}

