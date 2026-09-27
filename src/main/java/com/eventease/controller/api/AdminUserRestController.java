package com.eventease.controller.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.common.PagedResponse;
import com.eventease.dto.auth.UserDto;
import com.eventease.model.Akun;
import com.eventease.repository.AkunRepository;
import com.eventease.service.AkunService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Tag(name = "9. Manajemen Pengguna", description = "Super Administrator console untuk kelola user dan perubahan role")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserRestController {

    private final AkunService akunService;
    private final AkunRepository akunRepository;

    @Operation(summary = "Daftar Seluruh Pengguna", description = "Mengambil data seluruh akun pengguna platform (Admin, Organizer, User) dengan pagination.")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Akun> akunPage = akunService.findAllAkun(pageable);

        List<UserDto> content = akunPage.getContent().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());

        PagedResponse<UserDto> paged = PagedResponse.of(akunPage, content);

        return ResponseEntity.ok(ApiResponse.success("Daftar akun pengguna berhasil diambil", paged));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String targetRole = request.get("role");
        if (targetRole == null || targetRole.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Role target tidak boleh kosong"));
        }

        try {
            akunService.updateUserRole(id, targetRole);
            Akun updated = akunService.findAkunById(id);
            return ResponseEntity.ok(ApiResponse.success("Role pengguna berhasil diperbarui", UserDto.fromEntity(updated)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        log.info("Admin menghapus pengguna ID: {}", id);
        akunRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Pengguna berhasil dihapus", null));
    }
}
