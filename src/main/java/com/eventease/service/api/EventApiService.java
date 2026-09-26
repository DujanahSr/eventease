package com.eventease.service.api;

import com.eventease.common.PagedResponse;
import com.eventease.dto.event.EventDetailDto;
import com.eventease.dto.event.EventRequestDto;
import com.eventease.dto.event.EventSummaryDto;
import com.eventease.security.UserPrincipal;

public interface EventApiService {
    PagedResponse<EventSummaryDto> getAllEvents(String search, String categoryId, int page, int size, String sortBy, String sortDir);
    EventDetailDto getEventById(String id);
    EventDetailDto createEvent(EventRequestDto requestDto, UserPrincipal userPrincipal);
    EventDetailDto updateEvent(String id, EventRequestDto requestDto, UserPrincipal userPrincipal);
    void deleteEvent(String id, UserPrincipal userPrincipal);
    PagedResponse<EventSummaryDto> getMyEvents(UserPrincipal userPrincipal, int page, int size);
}
