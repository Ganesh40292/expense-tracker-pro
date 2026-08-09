package com.expensetracker.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.expensetracker.entity.User;
import com.expensetracker.repository.ReportRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.EmailService;
import com.expensetracker.service.AiIntelligenceService;

@Service
public class ReportSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReportSchedulerService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AiIntelligenceService aiIntelligenceService;

    // Run at 10:00 AM on the 1st day of every month
    @Scheduled(cron = "0 0 10 1 * ?")
    public void sendMonthlyReportsToAllUsers() {
        log.info("🚀 Starting automated monthly report generation for all users...");

        List<User> users = userRepository.findAll();

        int emailsSent = 0;

        for (User user : users) {
            try {
                BigDecimal income = reportRepository.getTotalIncomeByUserId(user.getId());
                if (income == null) income = BigDecimal.ZERO;
                BigDecimal expense = reportRepository.getTotalExpenseByUserId(user.getId());
                if (expense == null) expense = BigDecimal.ZERO;

                BigDecimal savings = income.subtract(expense);
                if (savings.compareTo(BigDecimal.ZERO) < 0) {
                    savings = BigDecimal.ZERO;
                }

                String aiSummary = aiIntelligenceService.generateMonthlySummaryInsight(user.getId());

                emailService.sendMonthlySummaryEmail(
                    user.getEmail(),
                    user.getName(),
                    income,
                    expense,
                    savings,
                    aiSummary
                );

                emailsSent++;
            } catch (Exception e) {
                log.error("Failed to send monthly report to user: " + user.getEmail(), e);
            }
        }

        log.info("✅ Finished automated monthly reports. Sent {} emails.", emailsSent);
    }
}
