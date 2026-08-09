package com.expensetracker.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.expensetracker.entity.Transaction;
import com.expensetracker.enums.TransactionType;

@Service
public class AnomalyDetectionService {

    public List<Transaction> detectAnomalies(List<Transaction> transactions) {
        List<Transaction> anomalies = new ArrayList<>();
        List<Transaction> expenses = transactions.stream()
                .filter(t -> TransactionType.EXPENSE.equals(t.getType()) && !t.getIsDeleted())
                .collect(Collectors.toList());

        if (expenses.isEmpty()) {
            return anomalies;
        }

        Map<String, List<Transaction>> byCategory = expenses.stream()
                .collect(Collectors.groupingBy(Transaction::getCategory));

        for (Map.Entry<String, List<Transaction>> entry : byCategory.entrySet()) {
            List<Transaction> catTxs = entry.getValue();
            if (catTxs.size() < 3) continue;

            double mean = catTxs.stream()
                    .mapToDouble(t -> t.getAmount().doubleValue())
                    .average()
                    .orElse(0.0);

            double variance = catTxs.stream()
                    .mapToDouble(t -> Math.pow(t.getAmount().doubleValue() - mean, 2))
                    .average()
                    .orElse(0.0);

            double stdDev = Math.sqrt(variance);
            if (stdDev < 1.0) continue;

            for (Transaction tx : catTxs) {
                double zScore = (tx.getAmount().doubleValue() - mean) / stdDev;
                if (zScore > 2.2 && tx.getAmount().compareTo(new BigDecimal("1000")) > 0) {
                    anomalies.add(tx);
                }
            }
        }

        return anomalies;
    }
}
