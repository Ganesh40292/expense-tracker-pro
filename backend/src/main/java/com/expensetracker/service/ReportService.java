package com.expensetracker.service;

public interface ReportService {

    Object getMonthlyReport(Long userId);

    Object getExpenseSummary(Long userId);
}