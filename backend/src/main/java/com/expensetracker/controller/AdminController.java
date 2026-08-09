package com.expensetracker.controller;

import com.expensetracker.entity.AuditLog;
import com.expensetracker.entity.SystemSetting;
import com.expensetracker.enums.UserRole;
import com.expensetracker.service.AdminService;
import com.expensetracker.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private SystemSettingService systemSettingService;

    // 1. Dashboard Overview
    @GetMapping("/dashboard/overview")
    public ResponseEntity<Map<String, Object>> getOverviewStats() {
        return ResponseEntity.ok(adminService.getOverviewStats());
    }

    // 2. Platform Analytics
    @GetMapping("/dashboard/analytics")
    public ResponseEntity<Map<String, Object>> getPlatformAnalytics() {
        return ResponseEntity.ok(adminService.getPlatformAnalytics());
    }

    // 3. User Directory (Paginated, Searchable)
    @GetMapping("/users")
    public ResponseEntity<Page<Map<String, Object>>> getUsersList(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) UserRole role,
            @RequestParam(value = "enabled", required = false) Boolean enabled,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(adminService.getUsersList(search, role, enabled, pageable));
    }

    // 4. User Details
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminService.getUserDetails(id));
    }

    // 5. Change User Role
    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> changeUserRole(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        
        UserRole role = UserRole.valueOf(body.get("role").toUpperCase());
        adminService.changeUserRole(id, role);
        return ResponseEntity.ok(Map.of("message", "User role updated successfully"));
    }

    // 6. Change User Lock/Status
    @PutMapping("/users/{id}/status")
    public ResponseEntity<Map<String, String>> changeUserStatus(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Boolean> body) {
        
        boolean enabled = body.get("enabled");
        adminService.changeUserStatus(id, enabled);
        String action = enabled ? "activated" : "deactivated";
        return ResponseEntity.ok(Map.of("message", "User account successfully " + action));
    }

    // 7. Delete User
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User and all associated data deleted successfully"));
    }

    // 8. System-wide Audit Logs
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "timestamp") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(adminService.getAuditLogs(search, action, startDate, endDate, pageable));
    }

    // 9. System Telemetry / Health
    @GetMapping("/system/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }

    // 10. System settings retrieval
    @GetMapping("/system/settings")
    public ResponseEntity<List<SystemSetting>> getSystemSettings() {
        return ResponseEntity.ok(systemSettingService.getAllSettings());
    }

    // 11. System settings update
    @PutMapping("/system/settings")
    public ResponseEntity<Map<String, String>> updateSystemSettings(
            @RequestBody Map<String, String> settings) {
        systemSettingService.updateSettings(settings);
        return ResponseEntity.ok(Map.of("message", "System configurations updated successfully"));
    }

    // 12. Suspicious activities & notifications
    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> getAdminAlerts() {
        return ResponseEntity.ok(adminService.getAdminAlerts());
    }
}
