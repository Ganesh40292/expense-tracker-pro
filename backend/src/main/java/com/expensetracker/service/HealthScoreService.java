package com.expensetracker.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;

import com.expensetracker.entity.Transaction;
import com.expensetracker.enums.TransactionType;

@Service
public class HealthScoreService {

    public int calculateFinancialHealthScore(BigDecimal monthlyIncome, List<Transaction> transactions) {
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return 50; // default baseline score
        }

        BigDecimal totalExpenses = transactions.stream()
                .filter(t -> TransactionType.EXPENSE.equals(t.getType()) && !t.getIsDeleted())
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal savingsRatio = monthlyIncome.subtract(totalExpenses)
                .divide(monthlyIncome, 4, RoundingMode.HALF_UP);

        int baseScore = 50;
        if (savingsRatio.compareTo(new BigDecimal("0.30")) >= 0) {
            baseScore += 40;
        } else if (savingsRatio.compareTo(new BigDecimal("0.20")) >= 0) {
            baseScore += 30;
        } else if (savingsRatio.compareTo(new BigDecimal("0.10")) >= 0) {
            baseScore += 15;
        } else if (savingsRatio.compareTo(BigDecimal.ZERO) < 0) {
            baseScore -= 25;
        }

        return Math.max(0, Math.min(100, baseScore));
    }
}
