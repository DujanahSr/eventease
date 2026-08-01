package com.eventease.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.eventease.model.Event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventRepository extends JpaRepository<Event, String> {

    List<Event> findByNameContainingIgnoreCase(String name);
    Page<Event> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Event> findByOrganizer(com.eventease.model.Akun organizer);
    Page<Event> findByOrganizer(com.eventease.model.Akun organizer, Pageable pageable);

    List<Event> findByNameContainingIgnoreCaseAndOrganizer(String name, com.eventease.model.Akun organizer);
    Page<Event> findByNameContainingIgnoreCaseAndOrganizer(String name, com.eventease.model.Akun organizer, Pageable pageable);

    // Filter Kategori
    Page<Event> findByCategoryId(String categoryId, Pageable pageable);
    Page<Event> findByNameContainingIgnoreCaseAndCategoryId(String name, String categoryId, Pageable pageable);

}
