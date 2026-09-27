package com.eventease.controller.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.eventease.common.ApiResponse;
import com.eventease.common.PagedResponse;
import com.eventease.dto.feedback.FeedbackRequestDto;
import com.eventease.dto.feedback.FeedbackResponseDto;
import com.eventease.model.Akun;
import com.eventease.model.Event;
import com.eventease.model.Feedback;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.EventRepository;
import com.eventease.security.UserPrincipal;
import com.eventease.service.FeedbackService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackRestController {

    private final FeedbackService feedbackService;
    private final AkunRepository akunRepository;
    private final EventRepository eventRepository;

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<PagedResponse<FeedbackResponseDto>>> getEventFeedbacks(
            @PathVariable String eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Feedback> feedbackPage = feedbackService.findByEventId(eventId, pageable);

        List<FeedbackResponseDto> content = feedbackPage.getContent().stream()
                .map(FeedbackResponseDto::fromEntity)
                .collect(Collectors.toList());

        PagedResponse<FeedbackResponseDto> paged = PagedResponse.of(feedbackPage, content);

        return ResponseEntity.ok(ApiResponse.success("Ulasan acara berhasil diambil", paged));
    }

    @GetMapping("/my-feedbacks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FeedbackResponseDto>>> getMyFeedbacks(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<Feedback> feedbacks = feedbackService.findAllByUserId(userPrincipal.getId());
        List<FeedbackResponseDto> result = feedbacks.stream()
                .map(FeedbackResponseDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Daftar ulasan Anda berhasil diambil", result));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FeedbackResponseDto>> submitFeedback(
            @Valid @RequestBody FeedbackRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Akun user = akunRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Pengguna tidak ditemukan"));

        Event event = eventRepository.findById(requestDto.getEventId())
                .orElseThrow(() -> new RuntimeException("Acara tidak ditemukan"));

        feedbackService.findByUserIdAndEventId(user.getId(), event.getId()).ifPresent(existing -> {
            throw new IllegalArgumentException("Anda sudah memberikan ulasan untuk acara ini.");
        });

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setEvent(event);
        feedback.setRating(requestDto.getRating());
        feedback.setComment(requestDto.getComment());

        feedbackService.addFeedback(feedback);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ulasan berhasil dikirim", FeedbackResponseDto.fromEntity(feedback)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Feedback feedback = feedbackService.findById(id);
        if (feedback == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdmin = userPrincipal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = feedback.getUser() != null && feedback.getUser().getId().equals(userPrincipal.getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        feedbackService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Ulasan berhasil dihapus", null));
    }
}
