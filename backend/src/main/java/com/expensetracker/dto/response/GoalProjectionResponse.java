package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public class GoalProjectionResponse {

    private LocalDate estimatedCompletionDate;
    private BigDecimal suggestedMonthlySavings;
    private double currentProgressPercent;
    private double monthsRemaining;
    private boolean onTrack;

    public GoalProjectionResponse() {
    }

    public LocalDate getEstimatedCompletionDate() {
        return estimatedCompletionDate;
    }

    public void setEstimatedCompletionDate(LocalDate estimatedCompletionDate) {
        this.estimatedCompletionDate = estimatedCompletionDate;
    }

    public BigDecimal getSuggestedMonthlySavings() {
        return suggestedMonthlySavings;
    }

    public void setSuggestedMonthlySavings(BigDecimal suggestedMonthlySavings) {
        this.suggestedMonthlySavings = suggestedMonthlySavings;
    }

    public double getCurrentProgressPercent() {
        return currentProgressPercent;
    }

    public void setCurrentProgressPercent(double currentProgressPercent) {
        this.currentProgressPercent = currentProgressPercent;
    }

    public double getMonthsRemaining() {
        return monthsRemaining;
    }

    public void setMonthsRemaining(double monthsRemaining) {
        this.monthsRemaining = monthsRemaining;
    }

    public boolean isOnTrack() {
        return onTrack;
    }

    public void setOnTrack(boolean onTrack) {
        this.onTrack = onTrack;
    }
}
