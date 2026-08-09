package com.expensetracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MigrationService {

    private static final Logger log = LoggerFactory.getLogger(MigrationService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void runMigrations() {
        log.info("Running database migrations...");

        try {
            // Update transactions that were created before multi-currency support
            int updatedTx = jdbcTemplate.update(
                "UPDATE transactions SET base_amount = amount, currency = 'INR' WHERE base_amount = 0.00"
            );
            
            // Update recurring expenses
            int updatedRx = jdbcTemplate.update(
                "UPDATE recurring_expenses SET base_amount = amount, currency = 'INR' WHERE base_amount = 0.00"
            );

            if (updatedTx > 0 || updatedRx > 0) {
                log.info("Migration successful. Updated {} transactions and {} recurring expenses.", updatedTx, updatedRx);
            } else {
                log.info("No migrations needed for existing transactions/recurring expenses.");
            }
        } catch (Exception e) {
            log.error("Failed to run migrations: {}", e.getMessage());
        }
    }
}
