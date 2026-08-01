package com.eventease.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.eventease.model.TicketCategory;
import java.util.List;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, String> {
    List<TicketCategory> findByEventId(String eventId);
}
