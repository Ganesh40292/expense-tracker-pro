package com.expensetracker.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expensetracker.repository.ReportRepository;
import com.expensetracker.service.ReportService;

import org.springframework.cache.annotation.Cacheable;

@Service
public class ReportServiceImpl
        implements ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Override
    @Cacheable(value = "monthlyReportCache", key = "#userId")
    public Object getMonthlyReport(Long userId) {

        List<Object[]> rows =
                reportRepository.getMonthlyReportByUserId(userId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", row[0]);
            entry.put("income", row[1]);
            entry.put("expense", row[2]);
            result.add(entry);
        }

        return result;
    }

    @Override
    @Cacheable(value = "expenseSummaryCache", key = "#userId")
    public Object getExpenseSummary(Long userId) {

        List<Object[]> rows =
                reportRepository.getExpenseSummaryByUserId(userId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("category", row[0]);
            entry.put("total", row[1]);
            result.add(entry);
        }

        return result;
    }
}