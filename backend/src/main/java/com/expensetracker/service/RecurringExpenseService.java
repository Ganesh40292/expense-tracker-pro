package com.expensetracker.service;

import java.util.List;

import com.expensetracker.dto.request.RecurringExpenseRequest;
import com.expensetracker.dto.response.RecurringExpenseResponse;
import com.expensetracker.entity.User;

public interface RecurringExpenseService {
    
    RecurringExpenseResponse createRecurringExpense(Long userId, RecurringExpenseRequest request);
    
    RecurringExpenseResponse updateRecurringExpense(Long id, Long userId, RecurringExpenseRequest request);
    
    void deleteRecurringExpense(Long id, Long userId);
    
    RecurringExpenseResponse toggleRecurringExpenseStatus(Long id, Long userId);
    
    List<RecurringExpenseResponse> getUserRecurringExpenses(Long userId);
    
    void processRecurringExpenses();
}
