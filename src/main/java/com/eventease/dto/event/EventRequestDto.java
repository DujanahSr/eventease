package com.eventease.dto.event;

import java.util.List;

import com.eventease.dto.ticket.TicketCategoryRequestDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRequestDto {

    @NotBlank(message = "Nama acara tidak boleh kosong")
    @Size(min = 3, max = 150, message = "Nama acara harus antara 3 hingga 150 karakter")
    private String name;

    @NotBlank(message = "Jadwal acara tidak boleh kosong")
    private String date;

    @NotBlank(message = "Deskripsi acara tidak boleh kosong")
    private String description;

    @NotBlank(message = "Lokasi acara tidak boleh kosong")
    private String location;

    @NotBlank(message = "Kategori acara harus dipilih")
    private String categoryId;

    private String imageUrl;

    @NotEmpty(message = "Minimal harus menyertakan 1 kategori/tier tiket (misal: Regular)")
    @Valid
    private List<TicketCategoryRequestDto> ticketTiers;
}
