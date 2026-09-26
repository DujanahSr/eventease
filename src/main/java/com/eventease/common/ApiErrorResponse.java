package com.eventease.common;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;
    private int status;
    private String message;
    private Map<String, String> errors;

    @Builder.Default
    private Instant timestamp = Instant.now();

    public static ApiErrorResponse of(int status, String message) {
        return ApiErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }

    public static ApiErrorResponse of(int status, String message, Map<String, String> errors) {
        return ApiErrorResponse.builder()
                .success(false)
                .status(status)
                .message(message)
                .errors(errors)
                .timestamp(Instant.now())
                .build();
    }
}
