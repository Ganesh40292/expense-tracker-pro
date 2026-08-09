package com.expensetracker.controller;

import com.expensetracker.dto.response.DashboardResponse;
import com.expensetracker.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/{userId}")
    public ResponseEntity<DashboardResponse> getDashboardData(
            @PathVariable Long userId) {

        DashboardResponse response = dashboardService.getDashboardData(userId);
        return ResponseEntity.ok(response);
    }
}