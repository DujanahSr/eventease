package com.eventease.dto.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDto {

    @NotBlank(message = "ID kategori tiket harus dipilih")
    private String ticketCategoryId;

    @Min(value = 1, message = "Jumlah tiket minimal 1")
    private int quantity;
}
