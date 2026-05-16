package com.expensetracker.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.expensetracker.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to " + appName + " 🎉");
            helper.setText(buildWelcomeHtml(userName), true);

            mailSender.send(message);

            log.info("✅ Welcome email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Builds a premium HTML welcome email.
     */
    private String buildWelcomeHtml(String userName) {

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin:0; padding:0; background-color:#0a0e1a; font-family:'Segoe UI',Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                     style="background-color:#0a0e1a; padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                           style="background-color:#111827; border:1px solid rgba(99,102,241,0.2);
                                  border-radius:16px; overflow:hidden;">

                      <!-- Gradient Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#4f46e5,#6366f1,#22d3ee);
                                   padding:40px 32px; text-align:center;">
                          <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800;
                                     letter-spacing:-0.5px;">
                            Welcome to %s
                          </h1>
                          <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                            Smart AI-Powered Expense Tracking
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:32px;">
                          <p style="margin:0 0 20px; color:#f0f4ff; font-size:16px; line-height:1.6;">
                            Hi <strong style="color:#818cf8;">%s</strong>,
                          </p>
                          <p style="margin:0 0 20px; color:#94a3b8; font-size:14px; line-height:1.7;">
                            Congratulations on creating your account! 🎉 You're now part of a
                            growing community that's taking control of their personal finances.
                          </p>

                          <!-- Feature Cards -->
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                                 style="margin-bottom:24px;">
                            <tr>
                              <td style="padding:14px 16px; background:rgba(99,102,241,0.08);
                                         border:1px solid rgba(99,102,241,0.15); border-radius:12px;
                                         margin-bottom:8px;">
                                <p style="margin:0; color:#818cf8; font-size:13px; font-weight:700;">
                                  📊 Dashboard Analytics
                                </p>
                                <p style="margin:4px 0 0; color:#7c8db5; font-size:12px;">
                                  Visual insights into your spending patterns
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height:8px;"></td></tr>
                            <tr>
                              <td style="padding:14px 16px; background:rgba(34,211,238,0.06);
                                         border:1px solid rgba(34,211,238,0.12); border-radius:12px;">
                                <p style="margin:0; color:#22d3ee; font-size:13px; font-weight:700;">
                                  💰 Income & Expense Tracking
                                </p>
                                <p style="margin:4px 0 0; color:#7c8db5; font-size:12px;">
                                  Track every transaction with smart categorization
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height:8px;"></td></tr>
                            <tr>
                              <td style="padding:14px 16px; background:rgba(52,211,153,0.06);
                                         border:1px solid rgba(52,211,153,0.12); border-radius:12px;">
                                <p style="margin:0; color:#34d399; font-size:13px; font-weight:700;">
                                  📈 Monthly Reports
                                </p>
                                <p style="margin:4px 0 0; color:#7c8db5; font-size:12px;">
                                  Detailed breakdowns by category and time period
                                </p>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0 0 24px; color:#94a3b8; font-size:14px; line-height:1.7;">
                            Get started by adding your first transaction. We're excited to have
                            you on board!
                          </p>

                          <!-- CTA Button -->
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <a href="%s/dashboard"
                                   style="display:inline-block; padding:14px 36px;
                                          background:linear-gradient(135deg,#4f46e5,#6366f1);
                                          color:#ffffff; font-size:14px; font-weight:700;
                                          text-decoration:none; border-radius:12px;
                                          box-shadow:0 4px 20px rgba(99,102,241,0.35);">
                                  Go to Dashboard →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:20px 32px; border-top:1px solid rgba(99,102,241,0.1);
                                   text-align:center;">
                          <p style="margin:0; color:#4b5a7a; font-size:11px;">
                            © 2026 %s • Built with ❤️
                          </p>
                          <p style="margin:6px 0 0; color:#4b5a7a; font-size:11px;">
                            You're receiving this because you signed up at %s.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(appName, userName, frontendUrl, appName, appName);
    }

    @Override
    @Async
    public void sendMonthlyReportEmail(String toEmail, String userName, String totalIncome, String totalExpense) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your Monthly Financial Report from " + appName + " 📊");
            helper.setText(buildMonthlyReportHtml(userName, totalIncome, totalExpense), true);

            mailSender.send(message);

            log.info("✅ Monthly report email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ Failed to send monthly report email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildMonthlyReportHtml(String userName, String totalIncome, String totalExpense) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin:0; padding:0; background-color:#0a0e1a; font-family:'Segoe UI',Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                     style="background-color:#0a0e1a; padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                           style="background-color:#111827; border:1px solid rgba(99,102,241,0.2);
                                  border-radius:16px; overflow:hidden;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#4f46e5,#6366f1,#22d3ee);
                                   padding:40px 32px; text-align:center;">
                          <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800;
                                     letter-spacing:-0.5px;">
                            Monthly Report
                          </h1>
                          <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                            Your financial summary is ready
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <p style="margin:0 0 20px; color:#f0f4ff; font-size:16px; line-height:1.6;">
                            Hi <strong style="color:#818cf8;">%s</strong>,
                          </p>
                          <p style="margin:0 0 20px; color:#94a3b8; font-size:14px; line-height:1.7;">
                            Here is a quick snapshot of your finances for the past month.
                          </p>
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                            <tr>
                              <td style="padding:14px 16px; background:rgba(52,211,153,0.06); border:1px solid rgba(52,211,153,0.12); border-radius:12px; margin-bottom:8px;">
                                <p style="margin:0; color:#34d399; font-size:13px; font-weight:700;">Total Income</p>
                                <p style="margin:4px 0 0; color:#f0f4ff; font-size:18px; font-weight:bold;">₹%s</p>
                              </td>
                            </tr>
                            <tr><td style="height:8px;"></td></tr>
                            <tr>
                              <td style="padding:14px 16px; background:rgba(251,113,133,0.06); border:1px solid rgba(251,113,133,0.12); border-radius:12px;">
                                <p style="margin:0; color:#fb7185; font-size:13px; font-weight:700;">Total Expense</p>
                                <p style="margin:4px 0 0; color:#f0f4ff; font-size:18px; font-weight:bold;">₹%s</p>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <a href="%s/reports" style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#4f46e5,#6366f1); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; border-radius:12px; box-shadow:0 4px 20px rgba(99,102,241,0.35);">
                                  View Full Report →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 32px; border-top:1px solid rgba(99,102,241,0.1); text-align:center;">
                          <p style="margin:0; color:#4b5a7a; font-size:11px;">© 2026 %s</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(userName, totalIncome, totalExpense, frontendUrl, appName);
    }
}
