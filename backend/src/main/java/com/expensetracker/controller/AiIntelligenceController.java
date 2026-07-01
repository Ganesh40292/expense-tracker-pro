package com.expensetracker.controller;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.request.GoalRequest;
import com.expensetracker.dto.response.AiIntelligenceResponse;
import com.expensetracker.dto.response.GoalProjectionResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Goal;
import com.expensetracker.service.AiIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AiIntelligenceController {

    @Autowired
    private AiIntelligenceService aiIntelligenceService;

    // ── AI Intelligence Dashboard ──
    @GetMapping("/ai/intelligence")
    public ResponseEntity<AiIntelligenceResponse> getAiIntelligence() {
        return ResponseEntity.ok(aiIntelligenceService.getAiIntelligence());
    }

    // ── Budgets API ──
    @GetMapping("/budgets")
    public ResponseEntity<List<Budget>> getBudgets() {
        return ResponseEntity.ok(aiIntelligenceService.getBudgets());
    }

    @PostMapping("/budgets")
    public ResponseEntity<Budget> saveBudget(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(aiIntelligenceService.saveBudget(request));
    }

    @DeleteMapping("/budgets/{id}")
    public ResponseEntity<String> deleteBudget(@PathVariable Long id) {
        aiIntelligenceService.deleteBudget(id);
        return ResponseEntity.ok("Budget deleted successfully");
    }

    // ── Goals API ──
    @GetMapping("/goals")
    public ResponseEntity<List<Goal>> getGoals() {
        return ResponseEntity.ok(aiIntelligenceService.getGoals());
    }

    @PostMapping("/goals")
    public ResponseEntity<Goal> createGoal(@Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(aiIntelligenceService.createGoal(request));
    }

    @PutMapping("/goals/{id}")
    public ResponseEntity<Goal> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(aiIntelligenceService.updateGoal(id, request));
    }

    @DeleteMapping("/goals/{id}")
    public ResponseEntity<String> deleteGoal(@PathVariable Long id) {
        aiIntelligenceService.deleteGoal(id);
        return ResponseEntity.ok("Goal deleted successfully");
    }

    @GetMapping("/goals/{id}/projection")
    public ResponseEntity<GoalProjectionResponse> getGoalProjection(@PathVariable Long id) {
        return ResponseEntity.ok(aiIntelligenceService.getGoalProjection(id));
    }
}
