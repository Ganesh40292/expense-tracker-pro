package com.expensetracker.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.expensetracker.entity.EmailLog;
import com.expensetracker.repository.EmailLogRepository;
import com.expensetracker.service.EmailService;
import com.expensetracker.service.EmailTemplateService;
import jakarta.mail.internet.MimeMessage;

import java.math.BigDecimal;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;
    private final EmailTemplateService templateService;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender, EmailLogRepository emailLogRepository, EmailTemplateService templateService) {
        this.mailSender = mailSender;
        this.emailLogRepository = emailLogRepository;
        this.templateService = templateService;
    }

    @Override
    @Async
    public void sendWelcomeEmail(String to, String name) {
        String htmlContent = templateService.buildWelcomeEmail(name);
        sendHtmlEmail(to, "Welcome to " + appName + "!", htmlContent);
    }

    @Override
    @Async
    public void sendMonthlyReportEmail(String to, String name, String income, String expense) {
        // Fallback for old interface method
        sendMonthlySummaryEmail(to, name, new BigDecimal(income), new BigDecimal(expense), BigDecimal.ZERO, "Your monthly summary is ready.");
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String htmlContent = templateService.buildPasswordResetEmail(name, token);
        sendHtmlEmail(to, "Password Reset Request - " + appName, htmlContent);
    }

    @Async
    public void sendMonthlySummaryEmail(String to, String name, BigDecimal income, BigDecimal expense, BigDecimal savings, String insight) {
        String htmlContent = templateService.buildMonthlySummaryEmail(name, income, expense, savings, insight);
        sendHtmlEmail(to, "Your Monthly Financial Summary 📊", htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            if (fromEmail == null || fromEmail.trim().isEmpty() || fromEmail.equals("your-email@gmail.com") || fromEmail.contains("example.com")) {
                log.warn("⚠️ SMTP is not configured (using placeholder '{}'). Saving generated HTML email locally.", fromEmail);
                saveEmailLocally(to, subject, htmlContent);
                emailLogRepository.save(new EmailLog(to, subject, "SIMULATED", "SMTP not configured. Email saved locally."));
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, appName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            
            emailLogRepository.save(new EmailLog(to, subject, "SENT", null));
            log.info("✅ Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            emailLogRepository.save(new EmailLog(to, subject, "FAILED", e.getMessage()));
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private void saveEmailLocally(String to, String subject, String htmlContent) {
        try {
            java.io.File emailFolder = new java.io.File("sent-emails");
            if (!emailFolder.exists()) {
                emailFolder.mkdirs();
            }
            String fileName = String.format("%s_%s_%d.html", 
                to.replaceAll("[^a-zA-Z0-9.-]", "_"), 
                subject.replaceAll("[^a-zA-Z0-9.-]", "_"), 
                System.currentTimeMillis());
            java.io.File emailFile = new java.io.File(emailFolder, fileName);
            try (java.io.FileWriter writer = new java.io.FileWriter(emailFile)) {
                writer.write(htmlContent);
            }
            log.info("📧 Email saved locally at: {}", emailFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("❌ Failed to save email locally: {}", e.getMessage());
        }
    }
}
