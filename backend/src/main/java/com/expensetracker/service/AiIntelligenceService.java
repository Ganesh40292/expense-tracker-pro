package com.expensetracker.service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.request.GoalRequest;
import com.expensetracker.dto.response.AiIntelligenceResponse;
import com.expensetracker.dto.response.GoalProjectionResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Goal;
import java.util.List;

public interface AiIntelligenceService {
    AiIntelligenceResponse getAiIntelligence();
    GoalProjectionResponse getGoalProjection(Long goalId);
    String generateMonthlySummaryInsight(Long userId);
    
    // Budgets CRUD
    List<Budget> getBudgets();
    Budget saveBudget(BudgetRequest request);
    void deleteBudget(Long id);

    // Goals CRUD
    List<Goal> getGoals();
    Goal createGoal(GoalRequest request);
    Goal updateGoal(Long id, GoalRequest request);
    void deleteGoal(Long id);
}

