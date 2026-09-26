package com.eventease.dto.booking;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketValidationRequestDto {

    @NotBlank(message = "ID Tiket / Booking ID dari QR Code tidak boleh kosong")
    private String bookingId;
}
