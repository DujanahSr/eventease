package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Akun;
import com.eventease.model.Feedback;
import com.eventease.model.Event;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.FeedbackRepository;
import com.eventease.repository.EventRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor

public class FeedbackService {
    private final FeedbackRepository feedbackRepository;

    private final AkunRepository akunRepository; 

    final EventRepository eventRepository;

    public List<Feedback> findAllByUserId(String userId) {
        return feedbackRepository.findAllByUserId(userId);
    }
    
    public Page<Feedback> findAllByUserId(String userId, Pageable pageable) {
        return feedbackRepository.findAllByUserId(userId, pageable);
    }

    public List<Feedback> findByEventId(String eventId) {
        return feedbackRepository.findByEventId(eventId);
    }

    public Page<Feedback> findByEventId(String eventId, Pageable pageable) {
        return feedbackRepository.findByEventId(eventId, pageable);
    }

    public Feedback findById(String id) {
        return feedbackRepository.findById(id).orElse(null);
    }

    public void save(Feedback feedback) {
        feedbackRepository.save(feedback);
    }

    public void addFeedback(Feedback feedback) {
        if (feedback == null || feedback.getComment() == null || feedback.getComment().trim().isEmpty()) {
            throw new IllegalArgumentException("Komentar tidak boleh kosong.");
        }

        if (feedback.getRating() < 1 || feedback.getRating() > 5) {
            throw new IllegalArgumentException("Rating harus di antara 1 dan 5.");
        }

        Akun user = akunRepository.findById(feedback.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan."));

        feedback.setUser(user); 

        if (feedback.getEvent() == null || feedback.getEvent().getId() == null) {
            throw new RuntimeException("Layanan tidak valid.");
        }

        Event event = eventRepository.findById(feedback.getEvent().getId())
                .orElseThrow(() -> new RuntimeException("Layanan tidak ditemukan."));

        feedback.setEvent(event); 

        feedbackRepository.save(feedback);
    }

    public void deleteById(String id) {
        feedbackRepository.deleteById(id);
    }

    public List<Feedback> findAll() {
        return feedbackRepository.findAll();
    }

    public List<Feedback> findByEventOrganizerId(String organizerId) {
        return feedbackRepository.findByEventOrganizerId(organizerId);
    }
    
    public Page<Feedback> findByEventOrganizerId(String organizerId, Pageable pageable) {
        return feedbackRepository.findByEventOrganizerId(organizerId, pageable);
    }
    
    public Page<Feedback> findAll(Pageable pageable) {
        return feedbackRepository.findAll(pageable);
    }
    
    public java.util.Optional<Feedback> findByUserIdAndEventId(String userId, String eventId) {
        return feedbackRepository.findByUserIdAndEventId(userId, eventId);
    }
}
