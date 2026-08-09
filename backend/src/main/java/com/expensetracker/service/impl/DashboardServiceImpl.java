package com.expensetracker.service.impl;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.response.DashboardResponse;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ReportRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.DashboardService;
import com.expensetracker.service.ExchangeRateService;

import org.springframework.cache.annotation.Cacheable;

@Service
public class DashboardServiceImpl
        implements DashboardService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExchangeRateService exchangeRateService;

    @Override
    @Cacheable(value = "dashboardCache", key = "#userId")
    public DashboardResponse getDashboardData(
            Long userId) {

        // These are now based on baseAmount (USD)
        BigDecimal baseIncome =
                reportRepository.getTotalIncomeByUserId(userId);

        BigDecimal baseExpense =
                reportRepository.getTotalExpenseByUserId(userId);
                
        User user = userRepository.findById(userId).orElseThrow();
        String userCurrency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";

        // Convert base USD back to user's preferred currency
        BigDecimal income = exchangeRateService.convert(baseIncome, "USD", userCurrency);
        BigDecimal expense = exchangeRateService.convert(baseExpense, "USD", userCurrency);

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