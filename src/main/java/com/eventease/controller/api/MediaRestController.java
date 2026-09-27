package com.eventease.controller.api;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.eventease.common.ApiResponse;
import com.eventease.dto.media.UploadResultDto;
import com.eventease.service.media.CloudinaryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "10. Media & Cloudinary Storage", description = "Upload file gambar, poster acara, dan foto profil ke CDN Cloudinary dengan fallback Local Storage")
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaRestController {

    private final CloudinaryService cloudinaryService;

    @Operation(
            summary = "Upload Gambar ke Cloudinary CDN / Local Storage",
            description = "Mengunggah file gambar (JPEG, PNG, WebP) ke Cloudinary jika terkonfigurasi, atau secara otomatis fallback ke Local Storage. Maksimal ukuran 5MB."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Gambar berhasil diunggah"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Format gambar tidak didukung atau ukuran melebihi batas"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Akses ditolak")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UploadResultDto>> uploadImage(
            @Parameter(description = "Berkas gambar (JPG, PNG, WebP)", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Folder tujuan (misal: 'events', 'avatars', 'banners')")
            @RequestParam(value = "folder", defaultValue = "events") String folder) {

        log.info("API Request: Mengunggah gambar ke folder '{}', ukuran: {} bytes", folder, file.getSize());
        UploadResultDto result = cloudinaryService.uploadImage(file, folder);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gambar berhasil diunggah", result));
    }

    @Operation(summary = "Hapus Berkas Gambar", description = "Menghapus gambar dari Cloudinary CDN atau Local Storage berdasarkan public_id.")
    @DeleteMapping
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @Parameter(description = "Public ID gambar", required = true)
            @RequestParam("publicId") String publicId) {

        log.info("API Request: Hapus gambar publicId={}", publicId);
        cloudinaryService.deleteImage(publicId);

        return ResponseEntity.ok(ApiResponse.success("Gambar berhasil dihapus", null));
    }

    @Operation(summary = "Status Layanan Penyimpanan Media", description = "Mengecek apakah penyimpanan menggunakan Cloudinary CDN atau fallback Local Storage.")
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStorageStatus() {
        boolean isCloudinary = cloudinaryService.isCloudinaryConfigured();
        Map<String, Object> status = Map.of(
                "provider", isCloudinary ? "CLOUDINARY" : "LOCAL_STORAGE",
                "isCloudinaryActive", isCloudinary,
                "maxFileSize", "5MB",
                "allowedFormats", "JPG, PNG, WebP, GIF"
        );
        return ResponseEntity.ok(ApiResponse.success("Status penyimpanan media", status));
    }
}
