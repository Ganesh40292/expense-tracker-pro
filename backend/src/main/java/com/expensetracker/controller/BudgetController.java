package com.expensetracker.controller;

import java.util.List;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.service.BudgetService;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getUserBudgets() {
        return ResponseEntity.ok(budgetService.getUserBudgets());
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> setBudget(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.setBudget(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok("Budget deleted successfully");
    }
}
