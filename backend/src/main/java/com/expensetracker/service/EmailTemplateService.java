package com.expensetracker.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;

@Service
public class EmailTemplateService {

    private final TemplateEngine templateEngine;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Autowired
    public EmailTemplateService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String buildWelcomeEmail(String name) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("dashboardUrl", frontendUrl + "/dashboard");
        context.setVariable("year", Year.now().getValue());
        return templateEngine.process("email/welcome", context);
    }

    public String buildPasswordResetEmail(String name, String token) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("resetUrl", frontendUrl + "/reset-password?token=" + token);
        context.setVariable("year", Year.now().getValue());
        return templateEngine.process("email/password-reset", context);
    }

    public String buildMonthlySummaryEmail(String name, BigDecimal income, BigDecimal expense, BigDecimal savings, String insight) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("monthYear", LocalDate.now().minusMonths(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")));
        context.setVariable("totalIncome", "+₹" + income.toString());
        context.setVariable("totalExpense", "-₹" + expense.toString());
        context.setVariable("netSavings", "₹" + savings.toString());
        context.setVariable("insightText", insight);
        context.setVariable("dashboardUrl", frontendUrl + "/dashboard");
        context.setVariable("settingsUrl", frontendUrl + "/profile");
        context.setVariable("year", Year.now().getValue());
        return templateEngine.process("email/monthly-summary", context);
    }
}
