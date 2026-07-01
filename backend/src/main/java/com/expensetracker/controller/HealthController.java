package com.expensetracker.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for Render's service monitoring.
 * This endpoint is public (no JWT required).
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "expense-tracker-api",
                "timestamp", Instant.now().toString()
        ));
    }
}
