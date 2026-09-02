package com.example.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "System Health API", description = "Endpoints for verifying API service and database connectivity status")
public class HealthController {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @Operation(summary = "Check API and Database Health", description = "Returns system status, current timestamp, service version, and database connectivity check.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Spring Boot REST API");
        health.put("version", "1.0.0");
        health.put("timestamp", LocalDateTime.now());

        boolean dbUp = false;
        String dbVendor = "Unknown";
        try {
            if (jdbcTemplate != null) {
                Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                dbUp = (result != null && result == 1);
                
                String dbProduct = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
                dbVendor = dbProduct != null ? dbProduct : "Connected";
            }
        } catch (Exception e) {
            dbUp = false;
            dbVendor = "Error: " + e.getMessage();
        }

        Map<String, Object> dbHealth = new HashMap<>();
        dbHealth.put("status", dbUp ? "UP" : "DOWN");
        dbHealth.put("database", dbVendor);

        health.put("components", Map.of(
                "database", dbHealth,
                "corsPolicy", "ACTIVE",
                "swaggerUI", "ACTIVE"
        ));

        return ResponseEntity.ok(health);
    }
}
