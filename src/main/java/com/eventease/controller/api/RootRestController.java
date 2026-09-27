package com.eventease.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@Tag(name = "System", description = "Endpoint informasi sistem dan dokumentasi")
@RestController
public class RootRestController {

    @Hidden
    @GetMapping("/")
    public RedirectView redirectToSwagger() {
        return new RedirectView("/swagger-ui/index.html");
    }

    @Operation(summary = "Status API & Metadata Sistem")
    @GetMapping("/api")
    public ResponseEntity<Map<String, Object>> getApiInfo() {
        return ResponseEntity.ok(Map.of(
                "service", "Eventease Backend REST API",
                "version", "1.0.0",
                "status", "UP",
                "documentation", "/swagger-ui/index.html",
                "frontendUrl", "http://localhost:5173",
                "openApiSpec", "/v3/api-docs"
        ));
    }
}
