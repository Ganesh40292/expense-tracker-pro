package com.expensetracker.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;

import com.expensetracker.entity.Transaction;
import com.expensetracker.enums.TransactionType;

@Service
public class ForecastingService {

    public BigDecimal predictNextMonthSpending(List<Transaction> transactions) {
        List<Transaction> expenses = transactions.stream()
                .filter(t -> TransactionType.EXPENSE.equals(t.getType()) && !t.getIsDeleted())
                .collect(java.util.stream.Collectors.toList());

        if (expenses.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = expenses.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Simple moving average projection baseline
        return total.multiply(new BigDecimal("1.05"))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
