package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class AiIntelligenceResponse {

    private Predictions predictions;
    private List<String> insights;
    private List<BudgetRecommendation> budgets;
    private List<AnomalyDetails> anomalies;
    private List<SavingsOpportunity> savingsOpportunities;
    private HealthScore healthScore;
    private List<String> insightCards;

    public AiIntelligenceResponse() {
    }

    public Predictions getPredictions() {
        return predictions;
    }

    public void setPredictions(Predictions predictions) {
        this.predictions = predictions;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }

    public List<BudgetRecommendation> getBudgets() {
        return budgets;
    }

    public void setBudgets(List<BudgetRecommendation> budgets) {
        this.budgets = budgets;
    }

    public List<AnomalyDetails> getAnomalies() {
        return anomalies;
    }

    public void setAnomalies(List<AnomalyDetails> anomalies) {
        this.anomalies = anomalies;
    }

    public List<SavingsOpportunity> getSavingsOpportunities() {
        return savingsOpportunities;
    }

    public void setSavingsOpportunities(List<SavingsOpportunity> savingsOpportunities) {
        this.savingsOpportunities = savingsOpportunities;
    }

    public HealthScore getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(HealthScore healthScore) {
        this.healthScore = healthScore;
    }

    public List<String> getInsightCards() {
        return insightCards;
    }

    public void setInsightCards(List<String> insightCards) {
        this.insightCards = insightCards;
    }

    // ── Nested Classes for Structured Payload ──

    public static class Predictions {
        private BigDecimal nextMonthForecast;
        private Map<String, BigDecimal> categoryForecasts;
        private BigDecimal recurringProjected;
        private BigDecimal yearlyEstimate;
        private BigDecimal confidenceRangeMin;
        private BigDecimal confidenceRangeMax;
        private String trend; // UPWARD, DOWNWARD, STABLE

        public Predictions() {}

        public BigDecimal getNextMonthForecast() { return nextMonthForecast; }
        public void setNextMonthForecast(BigDecimal val) { this.nextMonthForecast = val; }

        public Map<String, BigDecimal> getCategoryForecasts() { return categoryForecasts; }
        public void setCategoryForecasts(Map<String, BigDecimal> val) { this.categoryForecasts = val; }

        public BigDecimal getRecurringProjected() { return recurringProjected; }
        public void setRecurringProjected(BigDecimal val) { this.recurringProjected = val; }

        public BigDecimal getYearlyEstimate() { return yearlyEstimate; }
        public void setYearlyEstimate(BigDecimal val) { this.yearlyEstimate = val; }

        public BigDecimal getConfidenceRangeMin() { return confidenceRangeMin; }
        public void setConfidenceRangeMin(BigDecimal val) { this.confidenceRangeMin = val; }

        public BigDecimal getConfidenceRangeMax() { return confidenceRangeMax; }
        public void setConfidenceRangeMax(BigDecimal val) { this.confidenceRangeMax = val; }

        public String getTrend() { return trend; }
        public void setTrend(String val) { this.trend = val; }
    }

    public static class BudgetRecommendation {
        private String category;
        private BigDecimal recommendedAmount;
        private BigDecimal currentSpending;
        private String reasoning;
        private String confidence; // High, Medium, Low

        public BudgetRecommendation() {}

        public String getCategory() { return category; }
        public void setCategory(String val) { this.category = val; }

        public BigDecimal getRecommendedAmount() { return recommendedAmount; }
        public void setRecommendedAmount(BigDecimal val) { this.recommendedAmount = val; }

        public BigDecimal getCurrentSpending() { return currentSpending; }
        public void setCurrentSpending(BigDecimal val) { this.currentSpending = val; }

        public String getReasoning() { return reasoning; }
        public void setReasoning(String val) { this.reasoning = val; }

        public String getConfidence() { return confidence; }
        public void setConfidence(String val) { this.confidence = val; }
    }

    public static class AnomalyDetails {
        private Long transactionId;
        private String title;
        private BigDecimal amount;
        private String category;
        private LocalDate transactionDate;
        private String severity; // CRITICAL, WARNING, INFO
        private String reason;
        private String suggestion;

        public AnomalyDetails() {}

        public Long getTransactionId() { return transactionId; }
        public void setTransactionId(Long val) { this.transactionId = val; }

        public String getTitle() { return title; }
        public void setTitle(String val) { this.title = val; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal val) { this.amount = val; }

        public String getCategory() { return category; }
        public void setCategory(String val) { this.category = val; }

        public LocalDate getTransactionDate() { return transactionDate; }
        public void setTransactionDate(LocalDate val) { this.transactionDate = val; }

        public String getSeverity() { return severity; }
        public void setSeverity(String val) { this.severity = val; }

        public String getReason() { return reason; }
        public void setReason(String val) { this.reason = val; }

        public String getSuggestion() { return suggestion; }
        public void setSuggestion(String val) { this.suggestion = val; }
    }

    public static class SavingsOpportunity {
        private String title;
        private String type; // SUBSCRIPTION, OVERSPENDING, COST_REDUCTION
        private BigDecimal potentialSavings;
        private String reasoning;
        private String confidence; // High, Medium, Low

        public SavingsOpportunity() {}

        public String getTitle() { return title; }
        public void setTitle(String val) { this.title = val; }

        public String getType() { return type; }
        public void setType(String val) { this.type = val; }

        public BigDecimal getPotentialSavings() { return potentialSavings; }
        public void setPotentialSavings(BigDecimal val) { this.potentialSavings = val; }

        public String getReasoning() { return reasoning; }
        public void setReasoning(String val) { this.reasoning = val; }

        public String getConfidence() { return confidence; }
        public void setConfidence(String val) { this.confidence = val; }
    }

    public static class HealthScore {
        private int score;
        private double savingsRate;
        private String discipline; // EXCELLENT, GOOD, NEEDS_IMPROVEMENT
        private List<String> explanations;
        private List<String> suggestions;

        public HealthScore() {}

        public int getScore() { return score; }
        public void setScore(int val) { this.score = val; }

        public double getSavingsRate() { return savingsRate; }
        public void setSavingsRate(double val) { this.savingsRate = val; }

        public String getDiscipline() { return discipline; }
        public void setDiscipline(String val) { this.discipline = val; }

        public List<String> getExplanations() { return explanations; }
        public void setExplanations(List<String> val) { this.explanations = val; }

        public List<String> getSuggestions() { return suggestions; }
        public void setSuggestions(List<String> val) { this.suggestions = val; }
    }
}
