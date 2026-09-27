package com.eventease.controller.api;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.eventease.common.ApiResponse;
import com.eventease.exception.BadRequestException;
import com.eventease.service.CloudinaryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "10. Media & Cloudinary Storage", description = "Upload file gambar, poster acara, dan foto profil ke CDN Cloudinary")
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaRestController {

    private final CloudinaryService cloudinaryService;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Operation(summary = "Upload Gambar ke Cloudinary CDN", description = "Mengunggah file gambar (JPEG, PNG, WebP) ke Cloudinary dan mengembalikan secure HTTPS URL.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "eventease/events") String folder) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File gambar tidak boleh kosong");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Ukuran gambar melebihi batas maksimal 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Format gambar tidak didukung. Harap gunakan format JPG, PNG, atau WebP.");
        }

        try {
            log.info("Mengunggah gambar: {} ({} bytes) ke folder: {}", file.getOriginalFilename(), file.getSize(), folder);
            String secureUrl = cloudinaryService.uploadImage(file, folder);

            Map<String, Object> result = Map.of(
                    "url", secureUrl,
                    "filename", file.getOriginalFilename() != null ? file.getOriginalFilename() : "image",
                    "size", file.getSize(),
                    "contentType", contentType
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Gambar berhasil diunggah ke Cloudinary", result));
        } catch (IOException e) {
            log.error("Gagal mengunggah gambar ke Cloudinary: {}", e.getMessage(), e);
            throw new BadRequestException("Gagal mengunggah file ke Cloudinary: " + e.getMessage());
        }
    }
}
