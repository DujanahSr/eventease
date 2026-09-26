package com.eventease.dto.ticket;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCategoryRequestDto {

    private String id; // Optional, present when updating existing ticket tier

    @NotBlank(message = "Nama tier tiket tidak boleh kosong (misal: Regular, VIP)")
    private String name;

    @PositiveOrZero(message = "Harga tiket tidak boleh bernilai negatif")
    private double price;

    @Min(value = 1, message = "Kapasitas tiket minimal 1")
    private int capacity;
}
