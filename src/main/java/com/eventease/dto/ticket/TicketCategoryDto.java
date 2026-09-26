package com.eventease.dto.ticket;

import com.eventease.model.TicketCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCategoryDto implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String name;
    private double price;
    private int capacity;
    private int availableStock;

    public static TicketCategoryDto fromEntity(TicketCategory ticketCategory) {
        if (ticketCategory == null) return null;
        return TicketCategoryDto.builder()
                .id(ticketCategory.getId())
                .name(ticketCategory.getName())
                .price(ticketCategory.getPrice())
                .capacity(ticketCategory.getCapacity())
                .availableStock(ticketCategory.getAvailableStock())
                .build();
    }
}
