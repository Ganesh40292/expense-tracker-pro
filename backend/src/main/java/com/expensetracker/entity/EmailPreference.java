package com.expensetracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "email_preferences")
public class EmailPreference extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "monthly_summary_enabled", nullable = false)
    private boolean monthlySummaryEnabled = true;

    @Column(name = "budget_alerts_enabled", nullable = false)
    private boolean budgetAlertsEnabled = true;

    @Column(name = "recurring_reminders_enabled", nullable = false)
    private boolean recurringRemindersEnabled = true;

    public EmailPreference() {
    }

    public EmailPreference(User user) {
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isMonthlySummaryEnabled() {
        return monthlySummaryEnabled;
    }

    public void setMonthlySummaryEnabled(boolean monthlySummaryEnabled) {
        this.monthlySummaryEnabled = monthlySummaryEnabled;
    }

    public boolean isBudgetAlertsEnabled() {
        return budgetAlertsEnabled;
    }

    public void setBudgetAlertsEnabled(boolean budgetAlertsEnabled) {
        this.budgetAlertsEnabled = budgetAlertsEnabled;
    }

    public boolean isRecurringRemindersEnabled() {
        return recurringRemindersEnabled;
    }

    public void setRecurringRemindersEnabled(boolean recurringRemindersEnabled) {
        this.recurringRemindersEnabled = recurringRemindersEnabled;
    }
}
