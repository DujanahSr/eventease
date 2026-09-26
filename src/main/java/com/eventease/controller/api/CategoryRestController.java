package com.eventease.controller.api;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.dto.category.CategoryDto;
import com.eventease.dto.category.CategoryRequestDto;
import com.eventease.exception.ResourceNotFoundException;
import com.eventease.model.Category;
import com.eventease.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryRestController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        log.info("API Request: Ambil semua kategori event");
        List<CategoryDto> categories = categoryService.findAll().stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Berhasil mengambil data kategori", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable String id) {
        log.info("API Request: Ambil kategori dengan ID: {}", id);
        Category category = categoryService.findById(id);
        if (category == null) {
            throw new ResourceNotFoundException("Kategori", "id", id);
        }
        return ResponseEntity.ok(ApiResponse.success("Kategori ditemukan", CategoryDto.fromEntity(category)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CategoryRequestDto requestDto) {
        log.info("API Request: Buat kategori baru: {}", requestDto.getName());
        Category category = new Category();
        category.setName(requestDto.getName().trim());
        category.setDescription(requestDto.getDescription());
        
        Category saved = categoryService.save(category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kategori berhasil dibuat", CategoryDto.fromEntity(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable String id,
            @Valid @RequestBody CategoryRequestDto requestDto) {
        log.info("API Request: Perbarui kategori ID: {}", id);
        Category category = categoryService.findById(id);
        if (category == null) {
            throw new ResourceNotFoundException("Kategori", "id", id);
        }

        category.setName(requestDto.getName().trim());
        category.setDescription(requestDto.getDescription());

        Category updated = categoryService.save(category);
        return ResponseEntity.ok(ApiResponse.success("Kategori berhasil diperbarui", CategoryDto.fromEntity(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String id) {
        log.info("API Request: Hapus kategori ID: {}", id);
        Category category = categoryService.findById(id);
        if (category == null) {
            throw new ResourceNotFoundException("Kategori", "id", id);
        }

        categoryService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Kategori berhasil dihapus", null));
    }
}
