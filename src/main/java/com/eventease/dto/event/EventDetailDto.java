package com.eventease.dto.event;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.eventease.dto.auth.UserDto;
import com.eventease.dto.category.CategoryDto;
import com.eventease.dto.ticket.TicketCategoryDto;
import com.eventease.model.Event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailDto {

    private String id;
    private String name;
    private String date;
    private String description;
    private String location;
    private String imageUrl;
    private CategoryDto category;
    private UserDto organizer;
    private List<TicketCategoryDto> ticketTiers;

    public static EventDetailDto fromEntity(Event event) {
        if (event == null) return null;

        List<TicketCategoryDto> tiers = Collections.emptyList();
        if (event.getTicketCategories() != null) {
            tiers = event.getTicketCategories().stream()
                    .map(TicketCategoryDto::fromEntity)
                    .collect(Collectors.toList());
        }

        return EventDetailDto.builder()
                .id(event.getId())
                .name(event.getName())
                .date(event.getDate())
                .description(event.getDescription())
                .location(event.getLocation())
                .imageUrl(event.getImageUrl())
                .category(CategoryDto.fromEntity(event.getCategory()))
                .organizer(UserDto.fromEntity(event.getOrganizer()))
                .ticketTiers(tiers)
                .build();
    }
}
