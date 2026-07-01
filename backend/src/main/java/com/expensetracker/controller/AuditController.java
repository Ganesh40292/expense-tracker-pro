package com.expensetracker.controller;

import com.expensetracker.entity.AuditLog;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping("/activity")
    public ResponseEntity<List<AuditLog>> getRecentActivity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        List<AuditLog> activity = auditService.getRecentActivity(principal.getUserId());
        return ResponseEntity.ok(activity);
    }
}
