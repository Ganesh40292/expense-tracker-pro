package com.expensetracker.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ReportRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.ExchangeRateService;
import com.expensetracker.service.ReportService;

import org.springframework.cache.annotation.Cacheable;

@Service
public class ReportServiceImpl
        implements ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExchangeRateService exchangeRateService;

    @Override
    @Cacheable(value = "monthlyReportCache", key = "#userId")
    public Object getMonthlyReport(Long userId) {

        List<Object[]> rows =
                reportRepository.getMonthlyReportByUserId(userId);

        User user = userRepository.findById(userId).orElseThrow();
        String userCurrency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            BigDecimal baseIncome = (BigDecimal) row[1];
            BigDecimal baseExpense = (BigDecimal) row[2];
            
            BigDecimal income = exchangeRateService.convert(baseIncome, "USD", userCurrency);
            BigDecimal expense = exchangeRateService.convert(baseExpense, "USD", userCurrency);

            Map<String, Object> entry = new HashMap<>();
            entry.put("month", row[0]);
            entry.put("income", income);
            entry.put("expense", expense);
            result.add(entry);
        }

        return result;
    }

    @Override
    @Cacheable(value = "expenseSummaryCache", key = "#userId")
    public Object getExpenseSummary(Long userId) {

        List<Object[]> rows =
                reportRepository.getExpenseSummaryByUserId(userId);

        User user = userRepository.findById(userId).orElseThrow();
        String userCurrency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            BigDecimal baseTotal = (BigDecimal) row[1];
            BigDecimal total = exchangeRateService.convert(baseTotal, "USD", userCurrency);
            
            Map<String, Object> entry = new HashMap<>();
            entry.put("category", row[0]);
            entry.put("total", total);
            result.add(entry);
        }

        return result;
    }
}