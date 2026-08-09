package com.expensetracker.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.expensetracker.dto.request.EmailPreferenceRequest;
import com.expensetracker.entity.EmailPreference;
import com.expensetracker.entity.User;
import com.expensetracker.repository.EmailPreferenceRepository;
import com.expensetracker.security.UserPrincipal;
import java.util.Optional;

@RestController
@RequestMapping("/api/email-preferences")
public class EmailPreferenceController {

    @Autowired
    private EmailPreferenceRepository emailPreferenceRepository;

    @GetMapping
    public ResponseEntity<EmailPreferenceRequest> getPreferences(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();

        Optional<EmailPreference> prefOpt = emailPreferenceRepository.findByUser(user);
        EmailPreferenceRequest response = new EmailPreferenceRequest();

        if (prefOpt.isPresent()) {
            EmailPreference pref = prefOpt.get();
            response.setMonthlySummaryEnabled(pref.isMonthlySummaryEnabled());
            response.setBudgetAlertsEnabled(pref.isBudgetAlertsEnabled());
            response.setRecurringRemindersEnabled(pref.isRecurringRemindersEnabled());
        } else {
            // Defaults if not found
            response.setMonthlySummaryEnabled(true);
            response.setBudgetAlertsEnabled(true);
            response.setRecurringRemindersEnabled(true);
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<EmailPreferenceRequest> updatePreferences(
            @RequestBody EmailPreferenceRequest request,
            Authentication authentication) {
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();

        EmailPreference pref = emailPreferenceRepository.findByUser(user)
                .orElse(new EmailPreference(user));

        pref.setMonthlySummaryEnabled(request.isMonthlySummaryEnabled());
        pref.setBudgetAlertsEnabled(request.isBudgetAlertsEnabled());
        pref.setRecurringRemindersEnabled(request.isRecurringRemindersEnabled());

        emailPreferenceRepository.save(pref);

        return ResponseEntity.ok(request);
    }
}
