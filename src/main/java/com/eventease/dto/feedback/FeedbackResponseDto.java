package com.eventease.dto.feedback;

import java.time.LocalDateTime;

import com.eventease.model.Feedback;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponseDto {
    private String id;
    private String eventId;
    private String eventName;
    private String userName;
    private String userEmail;
    private Integer rating;
    private String comment;

    public static FeedbackResponseDto fromEntity(Feedback f) {
        return FeedbackResponseDto.builder()
                .id(f.getId())
                .eventId(f.getEvent() != null ? f.getEvent().getId() : null)
                .eventName(f.getEvent() != null ? f.getEvent().getName() : "-")
                .userName(f.getUser() != null ? f.getUser().getName() : "Anonim")
                .userEmail(f.getUser() != null ? f.getUser().getEmail() : "-")
                .rating(f.getRating())
                .comment(f.getComment())
                .build();
    }
}
