package com.expensetracker.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.BudgetService;

@Service
public class BudgetServiceImpl implements BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    @Override
    public List<BudgetResponse> getUserBudgets() {
        User user = getCurrentUser();
        List<Budget> budgets = budgetRepository.findByUserId(user.getId());
        List<Transaction> transactions = transactionRepository.findByUserIdAndIsDeletedFalse(user.getId());

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<BudgetResponse> responseList = new ArrayList<>();

        for (Budget b : budgets) {
            BigDecimal spent = transactions.stream()
                    .filter(t -> t.getCategory().equalsIgnoreCase(b.getCategory()) &&
                            t.getType() == com.expensetracker.enums.TransactionType.EXPENSE &&
                            !t.getTransactionDate().isBefore(startOfMonth) &&
                            !t.getTransactionDate().isAfter(endOfMonth))
                    .map(t -> t.getBaseAmount() != null ? t.getBaseAmount() : t.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double pct = 0.0;
            if (b.getAmount() != null && b.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                pct = spent.multiply(new BigDecimal("100")).divide(b.getAmount(), 2, RoundingMode.HALF_UP).doubleValue();
            }

            BudgetResponse dto = new BudgetResponse();
            dto.setId(b.getId());
            dto.setCategory(b.getCategory());
            dto.setAmount(b.getAmount());
            dto.setSpentAmount(spent);
            dto.setPercentage(pct);

            responseList.add(dto);
        }

        return responseList;
    }

    @Override
    public BudgetResponse setBudget(BudgetRequest request) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByUserIdAndCategory(user.getId(), request.getCategory())
                .orElse(new Budget());

        budget.setUser(user);
        budget.setCategory(request.getCategory());
        budget.setAmount(request.getAmount());

        budgetRepository.save(budget);

        return getUserBudgets().stream()
                .filter(b -> b.getCategory().equalsIgnoreCase(request.getCategory()))
                .findFirst()
                .orElse(null);
    }

    @Override
    public void deleteBudget(Long id) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        budgetRepository.delete(budget);
    }
}
