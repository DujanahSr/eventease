package com.eventease.service.api;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.common.PagedResponse;
import com.eventease.constant.RoleConstants;
import com.eventease.dto.event.EventDetailDto;
import com.eventease.dto.event.EventRequestDto;
import com.eventease.dto.event.EventSummaryDto;
import com.eventease.dto.ticket.TicketCategoryRequestDto;
import com.eventease.exception.ForbiddenException;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.model.Akun;
import com.eventease.model.Category;
import com.eventease.model.Event;
import com.eventease.model.TicketCategory;
import com.eventease.repository.CategoryRepository;
import com.eventease.repository.EventRepository;
import com.eventease.repository.TicketCategoryRepository;
import com.eventease.security.UserPrincipal;
import com.eventease.service.EventService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventApiServiceImpl implements EventApiService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final EventService eventService;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<EventSummaryDto> getAllEvents(String search, String categoryId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Event> eventPage = eventService.searchAdvanced(search, categoryId, pageable);

        List<EventSummaryDto> content = eventPage.getContent().stream()
                .map(EventSummaryDto::fromEntity)
                .collect(Collectors.toList());

        return PagedResponse.of(eventPage, content);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailDto getEventById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acara", "id", id));
        return EventDetailDto.fromEntity(event);
    }

    @Override
    @Transactional
    public EventDetailDto createEvent(EventRequestDto requestDto, UserPrincipal userPrincipal) {
        log.info("Membuat acara baru: {} oleh user: {}", requestDto.getName(), userPrincipal.getEmail());

        Category category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", requestDto.getCategoryId()));

        Event event = new Event();
        event.setName(requestDto.getName().trim());
        event.setDate(requestDto.getDate());
        event.setDescription(requestDto.getDescription());
        event.setLocation(requestDto.getLocation());
        event.setImageUrl(requestDto.getImageUrl());
        event.setCategory(category);
        event.setOrganizer(userPrincipal.getAkun());

        Event savedEvent = eventRepository.save(event);

        // Buat tier tiket
        List<TicketCategory> ticketList = new ArrayList<>();
        if (requestDto.getTicketTiers() != null) {
            for (TicketCategoryRequestDto tierDto : requestDto.getTicketTiers()) {
                TicketCategory tier = new TicketCategory();
                tier.setEvent(savedEvent);
                tier.setName(tierDto.getName().trim());
                tier.setPrice(tierDto.getPrice());
                tier.setCapacity(tierDto.getCapacity());
                tier.setAvailableStock(tierDto.getCapacity());
                ticketList.add(tier);
            }
            ticketCategoryRepository.saveAll(ticketList);
        }

        savedEvent.setTicketCategories(ticketList);
        return EventDetailDto.fromEntity(savedEvent);
    }

    @Override
    @Transactional
    public EventDetailDto updateEvent(String id, EventRequestDto requestDto, UserPrincipal userPrincipal) {
        log.info("Memperbarui acara ID: {} oleh user: {}", id, userPrincipal.getEmail());

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acara", "id", id));

        validateOwnership(event, userPrincipal);

        Category category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", requestDto.getCategoryId()));

        event.setName(requestDto.getName().trim());
        event.setDate(requestDto.getDate());
        event.setDescription(requestDto.getDescription());
        event.setLocation(requestDto.getLocation());
        event.setCategory(category);
        if (requestDto.getImageUrl() != null && !requestDto.getImageUrl().isBlank()) {
            event.setImageUrl(requestDto.getImageUrl());
        }

        Event updatedEvent = eventRepository.save(event);

        // Update atau tambah tier tiket
        if (requestDto.getTicketTiers() != null && !requestDto.getTicketTiers().isEmpty()) {
            List<TicketCategory> existingTiers = ticketCategoryRepository.findByEventId(id);
            for (TicketCategoryRequestDto tierDto : requestDto.getTicketTiers()) {
                if (tierDto.getId() != null) {
                    existingTiers.stream()
                            .filter(t -> t.getId().equals(tierDto.getId()))
                            .findFirst()
                            .ifPresent(tier -> {
                                tier.setName(tierDto.getName());
                                tier.setPrice(tierDto.getPrice());
                                tier.setCapacity(tierDto.getCapacity());
                                ticketCategoryRepository.save(tier);
                            });
                } else {
                    TicketCategory newTier = new TicketCategory();
                    newTier.setEvent(updatedEvent);
                    newTier.setName(tierDto.getName());
                    newTier.setPrice(tierDto.getPrice());
                    newTier.setCapacity(tierDto.getCapacity());
                    newTier.setAvailableStock(tierDto.getCapacity());
                    ticketCategoryRepository.save(newTier);
                }
            }
        }

        return EventDetailDto.fromEntity(eventRepository.findById(id).orElse(updatedEvent));
    }

    @Override
    @Transactional
    public void deleteEvent(String id, UserPrincipal userPrincipal) {
        log.info("Menghapus acara ID: {} oleh user: {}", id, userPrincipal.getEmail());

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acara", "id", id));

        validateOwnership(event, userPrincipal);
        eventService.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<EventSummaryDto> getMyEvents(UserPrincipal userPrincipal, int page, int size) {
        Akun organizer = userPrincipal.getAkun();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Page<Event> eventPage = eventService.findByOrganizer(organizer, pageable);

        List<EventSummaryDto> content = eventPage.getContent().stream()
                .map(EventSummaryDto::fromEntity)
                .collect(Collectors.toList());

        return PagedResponse.of(eventPage, content);
    }

    private void validateOwnership(Event event, UserPrincipal userPrincipal) {
        boolean isAdmin = userPrincipal.getRole().equalsIgnoreCase(RoleConstants.ROLE_ADMIN);
        boolean isOwner = event.getOrganizer() != null && event.getOrganizer().getId().equals(userPrincipal.getId());

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("Akses ditolak: Anda bukan pemilik acara ini dan tidak berhak memodifikasinya.");
        }
    }
}
