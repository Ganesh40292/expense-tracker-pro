package com.expensetracker.service;

import java.util.List;
import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;

public interface BudgetService {
    List<BudgetResponse> getUserBudgets();
    BudgetResponse setBudget(BudgetRequest request);
    void deleteBudget(Long id);
}
