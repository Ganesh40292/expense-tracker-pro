package com.expensetracker.service.impl;

import com.expensetracker.entity.User;
import com.expensetracker.entity.AuditLog;
import com.expensetracker.enums.UserRole;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.AuditLogRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, Object> getOverviewStats() {
        long totalUsers = userRepository.count();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        // Fetch active users in last 30 days
        List<Long> loginUserIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id FROM audit_logs WHERE action = 'LOGIN_SUCCESS' AND timestamp >= ?",
                Long.class,
                thirtyDaysAgo
        );
        List<Long> transactingUserIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id FROM transactions WHERE created_at >= ?",
                Long.class,
                thirtyDaysAgo
        );

        Set<Long> activeUserIds = new HashSet<>();
        for (Long id : loginUserIds) {
            if (id != null) activeUserIds.add(id);
        }
        for (Long id : transactingUserIds) {
            if (id != null) activeUserIds.add(id);
        }
        long activeUsers = activeUserIds.size();

        long totalTransactions = transactionRepository.count();

        BigDecimal totalExpensesTracked = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(base_amount), 0) FROM transactions WHERE type = 'EXPENSE'",
                BigDecimal.class
        );
        if (totalExpensesTracked == null) totalExpensesTracked = BigDecimal.ZERO;

        // Growth Rates
        LocalDateTime startOfThisMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfLastMonth = LocalDate.now().minusMonths(1).withDayOfMonth(1).atStartOfDay();

        Long thisMonthUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE created_at >= ?",
                Long.class,
                startOfThisMonth
        );
        Long lastMonthUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?",
                Long.class,
                startOfLastMonth,
                startOfThisMonth
        );
        double userGrowthRate = lastMonthUsers == 0 ? (thisMonthUsers > 0 ? 100.0 : 0.0) :
                ((thisMonthUsers - lastMonthUsers) / (double) lastMonthUsers) * 100.0;

        Long thisMonthTx = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE created_at >= ?",
                Long.class,
                startOfThisMonth
        );
        Long lastMonthTx = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE created_at >= ? AND created_at < ?",
                Long.class,
                startOfLastMonth,
                startOfThisMonth
        );
        double transactionGrowthRate = lastMonthTx == 0 ? (thisMonthTx > 0 ? 100.0 : 0.0) :
                ((thisMonthTx - lastMonthTx) / (double) lastMonthTx) * 100.0;

        // Daily activity counts (last 30 days)
        Map<String, Long> dailyActivity = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> rawActivity = jdbcTemplate.queryForList(
                    "SELECT CAST(created_at AS DATE) as act_date, COUNT(*) as act_count FROM transactions " +
                    "WHERE created_at >= ? GROUP BY CAST(created_at AS DATE) ORDER BY act_date ASC",
                    thirtyDaysAgo
            );
            for (Map<String, Object> row : rawActivity) {
                Object dateObj = row.get("act_date");
                Object countObj = row.get("act_count");
                if (dateObj != null && countObj != null) {
                    dailyActivity.put(dateObj.toString(), ((Number) countObj).longValue());
                }
            }
        } catch (Exception e) {
            // Fallback in Java
            List<LocalDateTime> dates = jdbcTemplate.queryForList(
                    "SELECT created_at FROM transactions WHERE created_at >= ?",
                    LocalDateTime.class,
                    thirtyDaysAgo
            );
            Map<LocalDate, Long> grouped = new TreeMap<>();
            for (LocalDateTime dt : dates) {
                if (dt != null) {
                    LocalDate ld = dt.toLocalDate();
                    grouped.put(ld, grouped.getOrDefault(ld, 0L) + 1);
                }
            }
            for (Map.Entry<LocalDate, Long> entry : grouped.entrySet()) {
                dailyActivity.put(entry.getKey().toString(), entry.getValue());
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalTransactions", totalTransactions);
        stats.put("totalExpensesTracked", totalExpensesTracked);
        stats.put("userGrowthRate", Math.round(userGrowthRate * 10.0) / 10.0);
        stats.put("transactionGrowthRate", Math.round(transactionGrowthRate * 10.0) / 10.0);
        stats.put("dailyActivity", dailyActivity);

        return stats;
    }

    @Override
    public Map<String, Object> getPlatformAnalytics() {
        // 1. User growth by month
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT YEAR(created_at) as yr, MONTH(created_at) as mon, COUNT(*) as count FROM users " +
                    "GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY yr ASC, mon ASC"
            );
            for (Map<String, Object> row : rows) {
                Map<String, Object> item = new HashMap<>();
                item.put("period", row.get("yr") + "-" + String.format("%02d", ((Number) row.get("mon")).intValue()));
                item.put("count", row.get("count"));
                userGrowth.add(item);
            }
        } catch (Exception e) {
            List<LocalDateTime> dates = jdbcTemplate.queryForList("SELECT created_at FROM users", LocalDateTime.class);
            Map<String, Long> grouped = new TreeMap<>();
            for (LocalDateTime dt : dates) {
                if (dt != null) {
                    String period = dt.getYear() + "-" + String.format("%02d", dt.getMonthValue());
                    grouped.put(period, grouped.getOrDefault(period, 0L) + 1);
                }
            }
            for (Map.Entry<String, Long> entry : grouped.entrySet()) {
                Map<String, Object> item = new HashMap<>();
                item.put("period", entry.getKey());
                item.put("count", entry.getValue());
                userGrowth.add(item);
            }
        }

        // 2. Transaction volume growth by month
        List<Map<String, Object>> txVolumeGrowth = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT YEAR(created_at) as yr, MONTH(created_at) as mon, COUNT(*) as count, SUM(base_amount) as total FROM transactions " +
                    "GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY yr ASC, mon ASC"
            );
            for (Map<String, Object> row : rows) {
                Map<String, Object> item = new HashMap<>();
                item.put("period", row.get("yr") + "-" + String.format("%02d", ((Number) row.get("mon")).intValue()));
                item.put("count", row.get("count"));
                item.put("volume", row.get("total") != null ? row.get("total") : BigDecimal.ZERO);
                txVolumeGrowth.add(item);
            }
        } catch (Exception e) {
            List<Map<String, Object>> txs = jdbcTemplate.queryForList("SELECT created_at, base_amount FROM transactions");
            Map<String, Map<String, Object>> grouped = new TreeMap<>();
            for (Map<String, Object> tx : txs) {
                LocalDateTime dt = (LocalDateTime) tx.get("created_at");
                BigDecimal amount = (BigDecimal) tx.get("base_amount");
                if (dt != null) {
                    String period = dt.getYear() + "-" + String.format("%02d", dt.getMonthValue());
                    Map<String, Object> item = grouped.computeIfAbsent(period, k -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("count", 0L);
                        m.put("volume", BigDecimal.ZERO);
                        return m;
                    });
                    item.put("count", ((Long) item.get("count")) + 1);
                    item.put("volume", ((BigDecimal) item.get("volume")).add(amount != null ? amount : BigDecimal.ZERO));
                }
            }
            for (Map.Entry<String, Map<String, Object>> entry : grouped.entrySet()) {
                Map<String, Object> item = new HashMap<>();
                item.put("period", entry.getKey());
                item.put("count", entry.getValue().get("count"));
                item.put("volume", entry.getValue().get("volume"));
                txVolumeGrowth.add(item);
            }
        }

        // 3. Category distribution
        List<Map<String, Object>> categoryDistribution = jdbcTemplate.queryForList(
                "SELECT category, COUNT(*) as count, COALESCE(SUM(base_amount), 0) as total FROM transactions " +
                "GROUP BY category ORDER BY total DESC"
        );

        // 4. Currency default distribution
        List<Map<String, Object>> currencyDistribution = jdbcTemplate.queryForList(
                "SELECT default_currency as currency, COUNT(*) as count FROM users " +
                "GROUP BY default_currency ORDER BY count DESC"
        );

        // 5. Recurring expense adoption
        List<Map<String, Object>> recurringAdoption = jdbcTemplate.queryForList(
                "SELECT status, COUNT(*) as count, COALESCE(SUM(base_amount), 0) as total FROM recurring_expenses " +
                "GROUP BY status"
        );

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("userGrowth", userGrowth);
        analytics.put("transactionGrowth", txVolumeGrowth);
        analytics.put("categoryDistribution", categoryDistribution);
        analytics.put("currencyDistribution", currencyDistribution);
        analytics.put("recurringAdoption", recurringAdoption);

        return analytics;
    }

    @Override
    public Page<Map<String, Object>> getUsersList(String search, UserRole role, Boolean enabled, Pageable pageable) {
        Page<User> usersPage = userRepository.searchUsers(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                role,
                enabled,
                pageable
        );

        List<Map<String, Object>> usersList = new ArrayList<>();
        for (User user : usersPage.getContent()) {
            usersList.add(mapToUserResponse(user));
        }

        return new PageImpl<>(usersList, pageable, usersPage.getTotalElements());
    }

    private Map<String, Object> mapToUserResponse(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("defaultCurrency", user.getDefaultCurrency());
        map.put("enabled", user.isEnabled());
        map.put("createdAt", user.getCreatedAt());

        long txCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transactions WHERE user_id = ?",
                Long.class,
                user.getId()
        );
        map.put("transactionCount", txCount);

        List<LocalDateTime> lastLoginList = jdbcTemplate.queryForList(
                "SELECT timestamp FROM audit_logs WHERE user_id = ? AND action = 'LOGIN_SUCCESS' ORDER BY timestamp DESC LIMIT 1",
                LocalDateTime.class,
                user.getId()
        );
        map.put("lastLogin", lastLoginList.isEmpty() ? null : lastLoginList.get(0));

        return map;
    }

    @Override
    public Map<String, Object> getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> details = new HashMap<>();
        details.put("profile", mapToUserResponse(user));

        // Recent 20 transactions
        List<Map<String, Object>> transactions = jdbcTemplate.queryForList(
                "SELECT id, title, amount, currency, base_amount, type, category, transaction_date, description FROM transactions " +
                "WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 20",
                userId
        );
        details.put("transactions", transactions);

        // Active refresh tokens (sessions)
        List<Map<String, Object>> sessions = jdbcTemplate.queryForList(
                "SELECT id, device_info, ip_address, expiry_date, revoked, created_at FROM refresh_tokens " +
                "WHERE user_id = ? AND revoked = false ORDER BY created_at DESC",
                userId
        );
        details.put("sessions", sessions);

        // Recent 20 audit logs
        List<Map<String, Object>> auditLogs = jdbcTemplate.queryForList(
                "SELECT id, action, details, ip_address, user_agent, timestamp FROM audit_logs " +
                "WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20",
                userId
        );
        details.put("auditLogs", auditLogs);

        return details;
    }

    @Override
    @Transactional
    public void changeUserRole(Long userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role);
        userRepository.save(user);
        log.info("Changed role of user {} to {}", userId, role);
    }

    @Override
    @Transactional
    public void changeUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setEnabled(enabled);
        userRepository.save(user);
        log.info("Set enabled status of user {} to {}", userId, enabled);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Delete loose references
        jdbcTemplate.update("DELETE FROM audit_logs WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM refresh_tokens WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM email_preferences WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM email_logs WHERE recipient = ?", user.getEmail());

        // Delete core related records
        jdbcTemplate.update("DELETE FROM transactions WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM recurring_expenses WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM categories WHERE user_id = ?", userId);

        userRepository.delete(user);
        log.info("Successfully deleted user {} and all associated records.", userId);
    }

    @Override
    public Page<AuditLog> getAuditLogs(String search, String action, String startDate, String endDate, Pageable pageable) {
        LocalDateTime start = null;
        LocalDateTime end = null;
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        if (startDate != null && !startDate.trim().isEmpty()) {
            start = LocalDateTime.parse(startDate, formatter);
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            end = LocalDateTime.parse(endDate, formatter);
        }

        return auditLogRepository.searchAuditLogs(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                (action != null && !action.trim().isEmpty()) ? action.trim() : null,
                start,
                end,
                pageable
        );
    }

    @Override
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();

        // JVM Telemetry
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> jvm = new HashMap<>();
        jvm.put("freeMemory", runtime.freeMemory());
        jvm.put("totalMemory", runtime.totalMemory());
        jvm.put("maxMemory", runtime.maxMemory());
        jvm.put("activeThreads", Thread.activeCount());
        health.put("jvm", jvm);

        // Database status
        long start = System.currentTimeMillis();
        String dbStatus = "UP";
        long latency = 0;
        try {
            jdbcTemplate.execute("SELECT 1");
            latency = System.currentTimeMillis() - start;
        } catch (Exception e) {
            dbStatus = "DOWN";
        }
        Map<String, Object> db = new HashMap<>();
        db.put("status", dbStatus);
        db.put("latencyMs", latency);
        health.put("database", db);

        // Email Queue stats (last 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        Map<String, Object> emails = new HashMap<>();
        try {
            Long sentCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM email_logs WHERE status = 'SENT' AND sent_at >= ?",
                    Long.class,
                    sevenDaysAgo
            );
            Long failedCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM email_logs WHERE status = 'FAILED' AND sent_at >= ?",
                    Long.class,
                    sevenDaysAgo
            );
            emails.put("sent", sentCount != null ? sentCount : 0L);
            emails.put("failed", failedCount != null ? failedCount : 0L);
        } catch (Exception e) {
            emails.put("sent", 0L);
            emails.put("failed", 0L);
        }
        health.put("emailLogs", emails);

        // Job Status Info
        Long activeRecurringCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM recurring_expenses WHERE status = 'ACTIVE'",
                Long.class
        );
        Map<String, Object> jobs = new HashMap<>();
        jobs.put("schedulerStatus", "RUNNING");
        jobs.put("activeRecurringExpenses", activeRecurringCount != null ? activeRecurringCount : 0L);
        health.put("jobs", jobs);

        return health;
    }

    @Override
    public List<Map<String, Object>> getAdminAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);

        // Alert 1: Locked users (failed login attempt lockouts)
        List<Map<String, Object>> recentLockouts = jdbcTemplate.queryForList(
                "SELECT DISTINCT user_id, details, timestamp FROM audit_logs WHERE action = 'LOGIN_BLOCKED' AND timestamp >= ?",
                oneDayAgo
        );
        for (Map<String, Object> lockout : recentLockouts) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "SECURITY");
            alert.put("title", "Brute Force Lockout");
            alert.put("message", lockout.get("details"));
            alert.put("timestamp", lockout.get("timestamp"));
            alert.put("userId", lockout.get("user_id"));
            alerts.add(alert);
        }

        // Alert 2: Failed email deliveries
        List<Map<String, Object>> failedEmails = jdbcTemplate.queryForList(
                "SELECT id, recipient, subject, sent_at FROM email_logs WHERE status = 'FAILED' AND sent_at >= ?",
                oneDayAgo
        );
        for (Map<String, Object> email : failedEmails) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "SYSTEM");
            alert.put("title", "Email Dispatch Failure");
            alert.put("message", "Failed to send email to " + email.get("recipient") + " regarding: " + email.get("subject"));
            alert.put("timestamp", email.get("sent_at"));
            alerts.add(alert);
        }

        // Alert 3: Persistent failed logins (exceeding 3 failed attempts)
        List<Map<String, Object>> rapidFailures = jdbcTemplate.queryForList(
                "SELECT user_id, COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_FAILED' AND timestamp >= ? " +
                "GROUP BY user_id HAVING COUNT(*) >= 3",
                oneDayAgo
        );
        for (Map<String, Object> failure : rapidFailures) {
            Long uid = (Long) failure.get("user_id");
            if (uid != null) {
                User user = userRepository.findById(uid).orElse(null);
                if (user != null) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "SECURITY");
                    alert.put("title", "Suspicious Auth Activity");
                    alert.put("message", "User " + user.getEmail() + " has had " + failure.get("count") + " failed login attempts in the last 24h.");
                    alert.put("timestamp", LocalDateTime.now());
                    alert.put("userId", uid);
                    alerts.add(alert);
                }
            }
        }

        // Sort alerts by timestamp descending
        alerts.sort((a, b) -> ((LocalDateTime) b.get("timestamp")).compareTo((LocalDateTime) a.get("timestamp")));

        return alerts;
    }
}
