package com.eventease.repository;

import com.eventease.model.Feedback;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    boolean existsByEventId(String eventId);

    List<Feedback> findAllByUserId(String userId);
    Page<Feedback> findAllByUserId(String userId, Pageable pageable);

    List<Feedback> findByEventOrganizerId(String organizerId);
    Page<Feedback> findByEventOrganizerId(String organizerId, Pageable pageable);

    java.util.Optional<Feedback> findByUserIdAndEventId(String userId, String eventId);
}
