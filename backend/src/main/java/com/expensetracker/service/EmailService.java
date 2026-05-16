package com.expensetracker.service;

/**
 * Service for sending transactional emails.
 */
public interface EmailService {

    /**
     * Send a welcome email to a newly registered user.
     *
     * @param toEmail recipient email address
     * @param userName recipient's display name
     */
    void sendWelcomeEmail(String toEmail, String userName);

    /**
     * Send a monthly report email.
     *
     * @param toEmail recipient email address
     * @param userName recipient's display name
     * @param totalIncome total income for the month
     * @param totalExpense total expense for the month
     */
    void sendMonthlyReportEmail(String toEmail, String userName, String totalIncome, String totalExpense);
}
