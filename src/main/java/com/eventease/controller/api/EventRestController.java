package com.eventease.controller.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.common.PagedResponse;
import com.eventease.dto.event.EventDetailDto;
import com.eventease.dto.event.EventRequestDto;
import com.eventease.dto.event.EventSummaryDto;
import com.eventease.security.UserPrincipal;
import com.eventease.service.api.EventApiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name = "2. Manajemen Acara", description = "Katalog acara publik, filter kategori, detail acara, dan CRUD penyelenggara")
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventRestController {

    private final EventApiService eventApiService;

    @Operation(summary = "Katalog Acara Publik", description = "Mengambil daftar acara dengan pagination, filter pencarian teks, kategori, dan pengurutan.")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<EventSummaryDto>>> getAllEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("API Request: Ambil katalog acara (search={}, categoryId={}, page={}, size={})", search, categoryId, page, size);
        PagedResponse<EventSummaryDto> response = eventApiService.getAllEvents(search, categoryId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Berhasil mengambil data katalog acara", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDetailDto>> getEventById(@PathVariable String id) {
        log.info("API Request: Ambil detail acara ID: {}", id);
        EventDetailDto eventDetail = eventApiService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success("Detail acara ditemukan", eventDetail));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventDetailDto>> createEvent(
            @Valid @RequestBody EventRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Buat acara baru oleh: {}", userPrincipal.getUsername());
        EventDetailDto created = eventApiService.createEvent(requestDto, userPrincipal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Acara berhasil dibuat", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EventDetailDto>> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody EventRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Perbarui acara ID: {} oleh: {}", id, userPrincipal.getUsername());
        EventDetailDto updated = eventApiService.updateEvent(id, requestDto, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Acara berhasil diperbarui", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("API Request: Hapus acara ID: {} oleh: {}", id, userPrincipal.getUsername());
        eventApiService.deleteEvent(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Acara berhasil dihapus", null));
    }

    @GetMapping("/my-events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<EventSummaryDto>>> getMyEvents(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("API Request: Ambil daftar acara milik penyelenggara: {}", userPrincipal.getUsername());
        PagedResponse<EventSummaryDto> response = eventApiService.getMyEvents(userPrincipal, page, size);
        return ResponseEntity.ok(ApiResponse.success("Daftar acara Anda berhasil diambil", response));
    }
}
