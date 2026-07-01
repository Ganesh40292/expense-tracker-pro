package com.expensetracker.dto.request;

public class EmailPreferenceRequest {
    private boolean monthlySummaryEnabled;
    private boolean budgetAlertsEnabled;
    private boolean recurringRemindersEnabled;

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
