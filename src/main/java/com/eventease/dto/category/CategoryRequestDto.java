package com.eventease.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequestDto {

    @NotBlank(message = "Nama kategori tidak boleh kosong")
    @Size(min = 2, max = 50, message = "Nama kategori harus antara 2 hingga 50 karakter")
    private String name;

    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    private String description;
}
