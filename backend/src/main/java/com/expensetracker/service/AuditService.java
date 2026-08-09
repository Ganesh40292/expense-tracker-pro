package com.expensetracker.service;

import com.expensetracker.entity.AuditLog;
import com.expensetracker.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for recording and querying security audit events.
 * All log operations are async to prevent blocking the main request thread.
 */
@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an audit event asynchronously.
     */
    @Async
    public void log(Long userId, String action, String details, HttpServletRequest request) {
        String ipAddress = null;
        String userAgent = null;
        if (request != null) {
            try {
                ipAddress = extractIp(request);
                userAgent = request.getHeader("User-Agent");
            } catch (Exception ignored) {}
        }

        AuditLog auditLog = new AuditLog(userId, action, details, ipAddress, userAgent);
        auditLogRepository.save(auditLog);
    }

    /**
     * Log an event without an HTTP request context (for scheduled tasks, etc.)
     */
    @Async
    public void log(Long userId, String action, String details) {
        AuditLog auditLog = new AuditLog(userId, action, details, null, null);
        auditLogRepository.save(auditLog);
    }

    /**
     * Get the most recent activity for a user.
     */
    public List<AuditLog> getRecentActivity(Long userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(
                userId, PageRequest.of(0, 50)
        );
    }

    private String extractIp(HttpServletRequest request) {
        try {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "127.0.0.1";
        }
    }
}
