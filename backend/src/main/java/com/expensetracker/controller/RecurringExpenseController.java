package com.expensetracker.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expensetracker.dto.request.RecurringExpenseRequest;
import com.expensetracker.dto.response.RecurringExpenseResponse;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.RecurringExpenseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/recurring")
public class RecurringExpenseController {

    @Autowired
    private RecurringExpenseService recurringExpenseService;

    @PostMapping
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(
            @Valid @RequestBody RecurringExpenseRequest request,
            Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        RecurringExpenseResponse response = recurringExpenseService.createRecurringExpense(userPrincipal.getUserId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RecurringExpenseResponse>> getUserRecurringExpenses(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<RecurringExpenseResponse> responses = recurringExpenseService.getUserRecurringExpenses(userPrincipal.getUserId());
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> updateRecurringExpense(
            @PathVariable Long id,
            @Valid @RequestBody RecurringExpenseRequest request,
            Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        RecurringExpenseResponse response = recurringExpenseService.updateRecurringExpense(id, userPrincipal.getUserId(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(
            @PathVariable Long id,
            Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        recurringExpenseService.deleteRecurringExpense(id, userPrincipal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<RecurringExpenseResponse> toggleRecurringExpenseStatus(
            @PathVariable Long id,
            Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        RecurringExpenseResponse response = recurringExpenseService.toggleRecurringExpenseStatus(id, userPrincipal.getUserId());
        return ResponseEntity.ok(response);
    }
}
