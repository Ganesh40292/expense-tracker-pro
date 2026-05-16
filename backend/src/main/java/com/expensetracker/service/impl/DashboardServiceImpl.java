package com.expensetracker.service.impl;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.response.DashboardResponse;
import com.expensetracker.repository.ReportRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.service.DashboardService;

import org.springframework.cache.annotation.Cacheable;

@Service
public class DashboardServiceImpl
        implements DashboardService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    @Cacheable(value = "dashboardCache", key = "#userId")
    public DashboardResponse getDashboardData(
            Long userId) {

        BigDecimal income =
                reportRepository.getTotalIncomeByUserId(userId);

        BigDecimal expense =
                reportRepository.getTotalExpenseByUserId(userId);

        long transactionCount =
                transactionRepository.findByUserId(userId).size();

        DashboardResponse response =
                new DashboardResponse();

        response.setTotalIncome(income);
        response.setTotalExpense(expense);
        response.setBalance(income.subtract(expense));
        response.setTransactionCount(transactionCount);

        return response;
    }
}