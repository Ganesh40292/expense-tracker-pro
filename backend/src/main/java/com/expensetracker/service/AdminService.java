package com.expensetracker.service;

import com.expensetracker.entity.User;
import com.expensetracker.entity.AuditLog;
import com.expensetracker.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AdminService {

    // Dashboard Overview
    Map<String, Object> getOverviewStats();

    // Platform Analytics
    Map<String, Object> getPlatformAnalytics();

    // User Management
    Page<Map<String, Object>> getUsersList(String search, UserRole role, Boolean locked, Pageable pageable);
    
    Map<String, Object> getUserDetails(Long userId);
    
    void changeUserRole(Long userId, UserRole role);
    
    void changeUserStatus(Long userId, boolean locked);
    
    void deleteUser(Long userId);

    // Audit Logging
    Page<AuditLog> getAuditLogs(String search, String action, String startDate, String endDate, Pageable pageable);

    // Telemetry / Health
    Map<String, Object> getSystemHealth();

    // Notifications
    List<Map<String, Object>> getAdminAlerts();
}
