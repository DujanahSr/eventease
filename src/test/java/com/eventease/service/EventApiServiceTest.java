package com.eventease.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.eventease.common.PagedResponse;
import com.eventease.dto.event.EventDetailDto;
import com.eventease.dto.event.EventSummaryDto;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.model.Akun;
import com.eventease.model.Category;
import com.eventease.model.Event;
import com.eventease.model.Role;
import com.eventease.repository.CategoryRepository;
import com.eventease.repository.EventRepository;
import com.eventease.repository.TicketCategoryRepository;
import com.eventease.service.api.EventApiServiceImpl;

@ExtendWith(MockitoExtension.class)
class EventApiServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TicketCategoryRepository ticketCategoryRepository;

    @Mock
    private EventService eventService;

    @InjectMocks
    private EventApiServiceImpl eventApiService;

    private Event dummyEvent;
    private Category dummyCategory;
    private Akun dummyOrganizer;

    @BeforeEach
    void setUp() {
        dummyCategory = new Category();
        dummyCategory.setId("cat-1");
        dummyCategory.setName("Teknologi");

        Role orgRole = new Role();
        orgRole.setId("role-org");
        orgRole.setRoleName("ORGANIZER");

        dummyOrganizer = new Akun();
        dummyOrganizer.setId("org-1");
        dummyOrganizer.setName("Tech Organizer");
        dummyOrganizer.setEmail("org@gmail.com");
        dummyOrganizer.setRole(orgRole);

        dummyEvent = new Event();
        dummyEvent.setId("event-1");
        dummyEvent.setName("Indonesia Cloud Summit 2026");
        dummyEvent.setDescription("Konferensi cloud dan DevOps");
        dummyEvent.setLocation("Jakarta Convention Center");
        dummyEvent.setDate("2026-11-20");
        dummyEvent.setCategory(dummyCategory);
        dummyEvent.setOrganizer(dummyOrganizer);
        dummyEvent.setTicketCategories(Collections.emptyList());
    }

    @Test
    @DisplayName("Ambil Semua Acara: Mengembalikan PagedResponse berisi EventSummaryDto")
    void testGetAllEvents_Success() {
        Page<Event> eventPage = new PageImpl<>(List.of(dummyEvent));
        when(eventService.searchAdvanced(any(), any(), any(Pageable.class))).thenReturn(eventPage);

        PagedResponse<EventSummaryDto> result = eventApiService.getAllEvents(null, null, 0, 10, "id", "desc");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Indonesia Cloud Summit 2026", result.getContent().get(0).getName());
        assertEquals("Teknologi", result.getContent().get(0).getCategoryName());
        verify(eventService, times(1)).searchAdvanced(any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("Ambil Detail Acara Berhasil: Mengembalikan EventDetailDto dengan data lengkap")
    void testGetEventById_Found_Success() {
        when(eventRepository.findById("event-1")).thenReturn(Optional.of(dummyEvent));

        EventDetailDto detail = eventApiService.getEventById("event-1");

        assertNotNull(detail);
        assertEquals("event-1", detail.getId());
        assertEquals("Indonesia Cloud Summit 2026", detail.getName());
        assertEquals("Tech Organizer", detail.getOrganizer().getName());
        verify(eventRepository, times(1)).findById("event-1");
    }

    @Test
    @DisplayName("Ambil Detail Acara Gagal: ID tidak ditemukan melempar ResourceNotFoundException")
    void testGetEventById_NotFound_ThrowsException() {
        when(eventRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventApiService.getEventById("non-existent-id"));
        verify(eventRepository, times(1)).findById("non-existent-id");
    }
}
