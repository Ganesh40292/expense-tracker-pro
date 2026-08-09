package com.expensetracker.controller;

import com.expensetracker.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/monthly/{userId}")
    public ResponseEntity<?> getMonthlyReport(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                reportService.getMonthlyReport(userId)
        );
    }

    @GetMapping("/summary/{userId}")
    public ResponseEntity<?> getExpenseSummary(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                reportService.getExpenseSummary(userId)
        );
    }
}