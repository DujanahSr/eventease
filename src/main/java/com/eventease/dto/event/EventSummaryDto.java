package com.eventease.dto.event;

import java.util.Comparator;

import com.eventease.model.Event;
import com.eventease.model.TicketCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSummaryDto {

    private String id;
    private String name;
    private String date;
    private String description;
    private String location;
    private String imageUrl;
    private String categoryId;
    private String categoryName;
    private double startingPrice;
    private String organizerName;

    public static EventSummaryDto fromEntity(Event event) {
        if (event == null) return null;

        double minPrice = 0;
        if (event.getTicketCategories() != null && !event.getTicketCategories().isEmpty()) {
            minPrice = event.getTicketCategories().stream()
                    .mapToDouble(TicketCategory::getPrice)
                    .min()
                    .orElse(0.0);
        }

        return EventSummaryDto.builder()
                .id(event.getId())
                .name(event.getName())
                .date(event.getDate())
                .description(event.getDescription())
                .location(event.getLocation())
                .imageUrl(event.getImageUrl())
                .categoryId(event.getCategory() != null ? event.getCategory().getId() : null)
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                .startingPrice(minPrice)
                .organizerName(event.getOrganizer() != null ? event.getOrganizer().getName() : "Eventease")
                .build();
    }
}
