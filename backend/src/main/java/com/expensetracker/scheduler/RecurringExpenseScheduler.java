package com.expensetracker.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.expensetracker.service.RecurringExpenseService;

@Component
public class RecurringExpenseScheduler {

    private static final Logger logger = LoggerFactory.getLogger(RecurringExpenseScheduler.class);

    @Autowired
    private RecurringExpenseService recurringExpenseService;

    // Runs every day at midnight server time
    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduleRecurringTransactions() {
        logger.info("Starting scheduled recurring expenses processing...");
        try {
            recurringExpenseService.processRecurringExpenses();
            logger.info("Successfully processed recurring expenses.");
        } catch (Exception e) {
            logger.error("Error occurred while processing recurring expenses", e);
        }
    }
}
