package com.expensetracker.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.Authentication;
import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.request.GoalRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.response.AiIntelligenceResponse;
import com.expensetracker.dto.response.AiIntelligenceResponse.AnomalyDetails;
import com.expensetracker.dto.response.AiIntelligenceResponse.BudgetRecommendation;
import com.expensetracker.dto.response.AiIntelligenceResponse.HealthScore;
import com.expensetracker.dto.response.AiIntelligenceResponse.Predictions;
import com.expensetracker.dto.response.AiIntelligenceResponse.SavingsOpportunity;
import com.expensetracker.dto.response.GoalProjectionResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Goal;
import com.expensetracker.entity.RecurringExpense;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.enums.TransactionType;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.GoalRepository;
import com.expensetracker.repository.RecurringExpenseRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.AiIntelligenceService;

@Service
public class AiIntelligenceServiceImpl implements AiIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(AiIntelligenceServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("User not authenticated");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    @Override
    @Cacheable(value = "aiIntelligenceCache", key = "T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication().getPrincipal().getUserId()")
    public AiIntelligenceResponse getAiIntelligence() {
        User currentUser = getCurrentUser();
        log.info("📊 Generating Financial Intelligence for User: {}", currentUser.getEmail());

        List<Transaction> transactions = transactionRepository.findByUserId(currentUser.getId());
        List<Budget> budgets = budgetRepository.findByUserId(currentUser.getId());
        List<RecurringExpense> recurringExpenses = recurringExpenseRepository.findByUserId(currentUser.getId());

        AiIntelligenceResponse response = new AiIntelligenceResponse();

        // 1. Calculate Predictions
        Predictions predictions = calculatePredictions(transactions, recurringExpenses);
        response.setPredictions(predictions);

        // 2. Anomaly Detection
        List<AnomalyDetails> anomalies = detectAnomalies(transactions);
        response.setAnomalies(anomalies);

        // 3. Budgets Recommendations
        List<BudgetRecommendation> recommendedBudgets = generateBudgetRecommendations(currentUser, transactions, budgets);
        response.setBudgets(recommendedBudgets);

        // 4. Savings Opportunities
        List<SavingsOpportunity> savingsOpportunities = detectSavingsOpportunities(transactions);
        response.setSavingsOpportunities(savingsOpportunities);

        // 5. Health Score
        HealthScore healthScore = calculateHealthScore(currentUser, transactions, budgets, anomalies);
        response.setHealthScore(healthScore);

        // 6. Natural Language Insights & Cards
        List<String> insights = generateInsights(transactions, budgets, recommendedBudgets);
        response.setInsights(insights);

        List<String> insightCards = generateInsightCards(healthScore, predictions);
        response.setInsightCards(insightCards);

        return response;
    }

    @Override
    public GoalProjectionResponse getGoalProjection(Long goalId) {
        User currentUser = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));

        List<Transaction> transactions = transactionRepository.findByUserId(currentUser.getId());
        
        GoalProjectionResponse response = new GoalProjectionResponse();

        BigDecimal remainingAmount = goal.getTargetAmount().subtract(goal.getCurrentAmount());
        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            response.setEstimatedCompletionDate(LocalDate.now());
            response.setSuggestedMonthlySavings(BigDecimal.ZERO);
            response.setMonthsRemaining(0);
            response.setCurrentProgressPercent(100.0);
            response.setOnTrack(true);
            return response;
        }

        double progress = goal.getCurrentAmount().multiply(new BigDecimal("100"))
                .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP).doubleValue();
        response.setCurrentProgressPercent(progress);

        // Calculate Monthly Surplus (Average 3 months)
        BigDecimal monthlyIncome = currentUser.getMonthlyIncome();
        if (monthlyIncome == null || monthlyIncome.compareTo(BigDecimal.ZERO) == 0) {
            monthlyIncome = new BigDecimal("50000.00"); // fallback default
        }

        Map<YearMonth, BigDecimal> monthlyExpenses = new HashMap<>();
        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.EXPENSE) {
                YearMonth ym = YearMonth.from(t.getTransactionDate());
                monthlyExpenses.put(ym, monthlyExpenses.getOrDefault(ym, BigDecimal.ZERO).add(t.getAmount()));
            }
        }

        BigDecimal avgMonthlyExpenses = BigDecimal.ZERO;
        if (!monthlyExpenses.isEmpty()) {
            BigDecimal sum = monthlyExpenses.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            avgMonthlyExpenses = sum.divide(new BigDecimal(monthlyExpenses.size()), 2, RoundingMode.HALF_UP);
        }

        BigDecimal surplus = monthlyIncome.subtract(avgMonthlyExpenses);
        if (surplus.compareTo(BigDecimal.ZERO) <= 0) {
            surplus = monthlyIncome.multiply(new BigDecimal("0.10")); // default saving 10%
        }

        // Suggested Monthly Savings to hit targetDate
        long monthsToTarget = LocalDate.now().until(goal.getTargetDate(), ChronoUnit.MONTHS);
        if (monthsToTarget <= 0) monthsToTarget = 1;

        BigDecimal suggestedSavings = remainingAmount.divide(new BigDecimal(monthsToTarget), 2, RoundingMode.HALF_UP);
        response.setSuggestedMonthlySavings(suggestedSavings);

        // Completion Date under current surplus allocation
        BigDecimal monthlyContribution = surplus.min(suggestedSavings);
        if (monthlyContribution.compareTo(BigDecimal.ZERO) <= 0) {
            monthlyContribution = new BigDecimal("1000.00");
        }

        double monthsRemaining = remainingAmount.divide(monthlyContribution, 2, RoundingMode.HALF_UP).doubleValue();
        response.setMonthsRemaining(monthsRemaining);
        response.setEstimatedCompletionDate(LocalDate.now().plusMonths((long) Math.ceil(monthsRemaining)));

        response.setOnTrack(surplus.compareTo(suggestedSavings) >= 0);

        return response;
    }

    @Override
    public String generateMonthlySummaryInsight(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        if (transactions.isEmpty()) {
            return "No spending data available yet. Add transactions to see personalized AI insights!";
        }

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> categorySums = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        String topCategory = "None";
        BigDecimal topAmount = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : categorySums.entrySet()) {
            if (entry.getValue().compareTo(topAmount) > 0) {
                topAmount = entry.getValue();
                topCategory = entry.getKey();
            }
        }

        return String.format("You spent a total of %s this month. Your highest spending category was %s at %s. Try keeping wants below 30%% of your income.",
                totalExpense.toString(), topCategory, topAmount.toString());
    }

    // ── Algorithm: Linear Regression Forecasting ──
    private Predictions calculatePredictions(List<Transaction> transactions, List<RecurringExpense> recurring) {
        Predictions pred = new Predictions();
        pred.setNextMonthForecast(BigDecimal.ZERO);
        pred.setCategoryForecasts(new HashMap<>());
        pred.setRecurringProjected(BigDecimal.ZERO);
        pred.setYearlyEstimate(BigDecimal.ZERO);
        pred.setConfidenceRangeMin(BigDecimal.ZERO);
        pred.setConfidenceRangeMax(BigDecimal.ZERO);
        pred.setTrend("STABLE");

        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();

        if (expenses.isEmpty()) {
            return pred;
        }

        // Group by YearMonth
        Map<YearMonth, BigDecimal> monthlyTotals = new TreeMap<>();
        Map<String, Map<YearMonth, BigDecimal>> categoryMonthlyTotals = new HashMap<>();

        for (Transaction t : expenses) {
            YearMonth ym = YearMonth.from(t.getTransactionDate());
            monthlyTotals.put(ym, monthlyTotals.getOrDefault(ym, BigDecimal.ZERO).add(t.getAmount()));

            categoryMonthlyTotals.computeIfAbsent(t.getCategory(), k -> new TreeMap<>());
            Map<YearMonth, BigDecimal> catMap = categoryMonthlyTotals.get(t.getCategory());
            catMap.put(ym, catMap.getOrDefault(ym, BigDecimal.ZERO).add(t.getAmount()));
        }

        int N = monthlyTotals.size();
        BigDecimal nextMonthForecast = BigDecimal.ZERO;
        double slope = 0.0;
        BigDecimal stdError = BigDecimal.ZERO;

        if (N >= 2) {
            // Apply Least Squares Linear Regression
            double sumX = 0;
            double sumY = 0;
            double sumXX = 0;
            double sumXY = 0;

            List<BigDecimal> totals = new ArrayList<>(monthlyTotals.values());
            for (int i = 0; i < N; i++) {
                double x = i + 1;
                double y = totals.get(i).doubleValue();
                sumX += x;
                sumY += y;
                sumXX += x * x;
                sumXY += x * y;
            }

            double meanX = sumX / N;
            double meanY = sumY / N;

            double num = sumXY - (sumX * sumY) / N;
            double den = sumXX - (sumX * sumX) / N;

            double m = den != 0 ? num / den : 0.0;
            double c = meanY - m * meanX;

            slope = m;

            double nextX = N + 1;
            double forecastValue = Math.max(0.0, m * nextX + c);
            nextMonthForecast = BigDecimal.valueOf(forecastValue).setScale(2, RoundingMode.HALF_UP);

            // Compute Standard Error
            double sumSquaredErrors = 0.0;
            for (int i = 0; i < N; i++) {
                double x = i + 1;
                double y = totals.get(i).doubleValue();
                double err = y - (m * x + c);
                sumSquaredErrors += err * err;
            }
            double se = N > 2 ? Math.sqrt(sumSquaredErrors / (N - 2)) : forecastValue * 0.15;
            stdError = BigDecimal.valueOf(se);

        } else if (N == 1) {
            nextMonthForecast = monthlyTotals.values().iterator().next();
            stdError = nextMonthForecast.multiply(new BigDecimal("0.15"));
        }

        pred.setNextMonthForecast(nextMonthForecast);
        
        // Confidence Intervals (Z = 1.96)
        BigDecimal rangeWidth = stdError.multiply(new BigDecimal("1.96"));
        pred.setConfidenceRangeMin(nextMonthForecast.subtract(rangeWidth).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
        pred.setConfidenceRangeMax(nextMonthForecast.add(rangeWidth).setScale(2, RoundingMode.HALF_UP));

        // Trend
        double avg = monthlyTotals.values().stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0.0);
        if (slope > 0.05 * avg) {
            pred.setTrend("UPWARD");
        } else if (slope < -0.05 * avg) {
            pred.setTrend("DOWNWARD");
        } else {
            pred.setTrend("STABLE");
        }

        // Category forecasts
        Map<String, BigDecimal> catForecasts = new HashMap<>();
        for (Map.Entry<String, Map<YearMonth, BigDecimal>> entry : categoryMonthlyTotals.entrySet()) {
            String cat = entry.getKey();
            Map<YearMonth, BigDecimal> catMap = entry.getValue();
            int catN = catMap.size();
            if (catN >= 2) {
                double sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
                List<BigDecimal> catTotals = new ArrayList<>(catMap.values());
                for (int i = 0; i < catN; i++) {
                    double x = i + 1;
                    double y = catTotals.get(i).doubleValue();
                    sumX += x; sumY += y; sumXX += x*x; sumXY += x*y;
                }
                double num = sumXY - (sumX * sumY) / catN;
                double den = sumXX - (sumX * sumX) / catN;
                double m = den != 0 ? num / den : 0.0;
                double c = (sumY / catN) - m * (sumX / catN);
                double nextVal = Math.max(0.0, m * (catN + 1) + c);
                catForecasts.put(cat, BigDecimal.valueOf(nextVal).setScale(2, RoundingMode.HALF_UP));
            } else if (catN == 1) {
                catForecasts.put(cat, catMap.values().iterator().next());
            }
        }
        pred.setCategoryForecasts(catForecasts);

        // Recurring Expenses
        BigDecimal recurringSum = recurring.stream()
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        pred.setRecurringProjected(recurringSum);

        // Yearly Spending Estimate (YTD actual + forecast remaining)
        int currentMonth = LocalDate.now().getMonthValue();
        int remainingMonths = 12 - currentMonth;
        BigDecimal ytdActual = expenses.stream()
                .filter(t -> t.getTransactionDate().getYear() == LocalDate.now().getYear())
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal yearlyProjected = ytdActual.add(nextMonthForecast.multiply(new BigDecimal(remainingMonths)));
        pred.setYearlyEstimate(yearlyProjected.setScale(2, RoundingMode.HALF_UP));

        return pred;
    }

    // ── Algorithm: Z-Score Outlier Anomaly Detection ──
    private List<AnomalyDetails> detectAnomalies(List<Transaction> transactions) {
        List<AnomalyDetails> anomalies = new ArrayList<>();
        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();

        if (expenses.isEmpty()) {
            return anomalies;
        }

        // Group by category to find mean and standard deviation
        Map<String, List<BigDecimal>> categoryAmounts = expenses.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.mapping(Transaction::getAmount, Collectors.toList())
                ));

        Map<String, BigDecimal> categoryMeans = new HashMap<>();
        Map<String, Double> categoryStdDevs = new HashMap<>();

        for (Map.Entry<String, List<BigDecimal>> entry : categoryAmounts.entrySet()) {
            String cat = entry.getKey();
            List<BigDecimal> amts = entry.getValue();

            BigDecimal sum = amts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mean = sum.divide(new BigDecimal(amts.size()), 2, RoundingMode.HALF_UP);
            categoryMeans.put(cat, mean);

            double varianceSum = 0.0;
            for (BigDecimal amt : amts) {
                double diff = amt.subtract(mean).doubleValue();
                varianceSum += diff * diff;
            }
            double stdDev = Math.sqrt(varianceSum / amts.size());
            categoryStdDevs.put(cat, stdDev);
        }

        // Tag transaction anomalies
        for (Transaction t : expenses) {
            String cat = t.getCategory();
            BigDecimal mean = categoryMeans.get(cat);
            double stdDev = categoryStdDevs.get(cat);

            if (stdDev > 0.0) {
                double amount = t.getAmount().doubleValue();
                double meanVal = mean.doubleValue();
                double zScore = (amount - meanVal) / stdDev;

                // Threshold: Z-score > 2.5 and amount > ₹1,000 to filter small transactions
                if (zScore > 2.5 && t.getAmount().compareTo(new BigDecimal("1000.00")) > 0) {
                    AnomalyDetails anomaly = new AnomalyDetails();
                    anomaly.setTransactionId(t.getId());
                    anomaly.setTitle(t.getTitle());
                    anomaly.setAmount(t.getAmount());
                    anomaly.setCategory(cat);
                    anomaly.setTransactionDate(t.getTransactionDate());
                    anomaly.setReason(String.format("Exceeds historical category average by %d%%.", Math.round(zScore * 100)));
                    
                    if (zScore > 4.0) {
                        anomaly.setSeverity("CRITICAL");
                        anomaly.setSuggestion("Critical spike: Consider unlinking or validating with your bank statement if unrecognized.");
                    } else {
                        anomaly.setSeverity("WARNING");
                        anomaly.setSuggestion("Spike detected: Set a category budget to curb overspending next month.");
                    }

                    anomalies.add(anomaly);
                }
            }
        }

        // Sort anomalies newest first
        anomalies.sort((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()));
        return anomalies;
    }

    // ── Algorithm: 50/30/20 Budget Allocations Recommendations ──
    private List<BudgetRecommendation> generateBudgetRecommendations(User user, List<Transaction> transactions, List<Budget> budgets) {
        List<BudgetRecommendation> recs = new ArrayList<>();

        BigDecimal income = user.getMonthlyIncome();
        if (income == null || income.compareTo(BigDecimal.ZERO) == 0) {
            income = new BigDecimal("50000.00");
        }

        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();

        // Historical averages by category
        Map<String, List<BigDecimal>> categoryMonthlyExpenses = new HashMap<>();
        for (Transaction t : expenses) {
            categoryMonthlyExpenses.computeIfAbsent(t.getCategory(), k -> new ArrayList<>());
            categoryMonthlyExpenses.get(t.getCategory()).add(t.getAmount());
        }

        // 50/30/20 rules categorization mapping
        List<String> needsCategories = Arrays.asList("Food", "Bills", "Health", "Education", "Travel");
        List<String> wantsCategories = Arrays.asList("Shopping", "Entertainment", "Other");

        BigDecimal needsLimit = income.multiply(new BigDecimal("0.50"));
        BigDecimal wantsLimit = income.multiply(new BigDecimal("0.30"));

        for (Map.Entry<String, List<BigDecimal>> entry : categoryMonthlyExpenses.entrySet()) {
            String cat = entry.getKey();
            List<BigDecimal> amts = entry.getValue();

            BigDecimal sum = amts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = sum.divide(new BigDecimal(amts.size()), 2, RoundingMode.HALF_UP);

            BudgetRecommendation rec = new BudgetRecommendation();
            rec.setCategory(cat);
            rec.setCurrentSpending(avg);

            // Recommends 90% of average to support 10% saving discipline
            BigDecimal recommended = avg.multiply(new BigDecimal("0.90"));

            // Enforce caps based on 50/30/20 rules
            if (needsCategories.contains(cat)) {
                // Single category should not exceed 30% of total Needs allowance
                BigDecimal cap = needsLimit.multiply(new BigDecimal("0.35"));
                recommended = recommended.min(cap);
                rec.setReasoning(String.format("Recommended Needs limit capped at 35%% of Needs allowance to support the 50/30/20 rule.", cat));
            } else if (wantsCategories.contains(cat)) {
                // Wants category cap
                BigDecimal cap = wantsLimit.multiply(new BigDecimal("0.35"));
                recommended = recommended.min(cap);
                rec.setReasoning(String.format("Recommended Wants budget capped to fit wants limits of the 50/30/20 rule.", cat));
            } else {
                rec.setReasoning("Recommended budget adjusted based on historical spending averages.");
            }

            rec.setRecommendedAmount(recommended.setScale(2, RoundingMode.HALF_UP));
            rec.setConfidence("Medium");
            recs.add(rec);
        }

        return recs;
    }

    // ── Algorithm: Subscription cost optimizer ──
    private List<SavingsOpportunity> detectSavingsOpportunities(List<Transaction> transactions) {
        List<SavingsOpportunity> opps = new ArrayList<>();

        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();

        // 1. Subscription detector (exact same title + amount in different months)
        Map<String, List<Transaction>> titleGroups = expenses.stream()
                .collect(Collectors.groupingBy(Transaction::getTitle));

        for (Map.Entry<String, List<Transaction>> entry : titleGroups.entrySet()) {
            String title = entry.getKey();
            List<Transaction> list = entry.getValue();

            if (list.size() >= 2) {
                // Verify monthly consistency
                boolean identicalAmount = true;
                BigDecimal firstAmt = list.get(0).getAmount();
                for (Transaction t : list) {
                    if (t.getAmount().compareTo(firstAmt) != 0) {
                        identicalAmount = false;
                        break;
                    }
                }

                if (identicalAmount) {
                    // Check date intervals (roughly 25-35 days apart)
                    list.sort((a, b) -> a.getTransactionDate().compareTo(b.getTransactionDate()));
                    boolean regularInterval = true;
                    for (int i = 0; i < list.size() - 1; i++) {
                        long daysBetween = ChronoUnit.DAYS.between(list.get(i).getTransactionDate(), list.get(i+1).getTransactionDate());
                        if (daysBetween < 25 || daysBetween > 35) {
                            regularInterval = false;
                            break;
                        }
                    }

                    if (regularInterval) {
                        SavingsOpportunity opp = new SavingsOpportunity();
                        opp.setTitle(title);
                        opp.setType("SUBSCRIPTION");
                        opp.setPotentialSavings(firstAmt);
                        opp.setReasoning(String.format("Detected recurring subscription of %s. Canceling unused services could save you money.", firstAmt.toString()));
                        opp.setConfidence("High");
                        opps.add(opp);
                    }
                }
            }
        }

        // 2. Overspending category checker (20% higher than average)
        Map<String, List<BigDecimal>> categoryMonthlyExpenses = new HashMap<>();
        Map<String, Map<YearMonth, BigDecimal>> categoryMonths = new HashMap<>();

        for (Transaction t : expenses) {
            categoryMonthlyExpenses.computeIfAbsent(t.getCategory(), k -> new ArrayList<>()).add(t.getAmount());
            
            YearMonth ym = YearMonth.from(t.getTransactionDate());
            categoryMonths.computeIfAbsent(t.getCategory(), k -> new HashMap<>());
            Map<YearMonth, BigDecimal> m = categoryMonths.get(t.getCategory());
            m.put(ym, m.getOrDefault(ym, BigDecimal.ZERO).add(t.getAmount()));
        }

        YearMonth currentMonth = YearMonth.from(LocalDate.now());

        for (Map.Entry<String, Map<YearMonth, BigDecimal>> entry : categoryMonths.entrySet()) {
            String cat = entry.getKey();
            Map<YearMonth, BigDecimal> monthsMap = entry.getValue();

            BigDecimal currentSpend = monthsMap.getOrDefault(currentMonth, BigDecimal.ZERO);
            
            // Average of past months (excluding current)
            List<BigDecimal> pastTotals = monthsMap.entrySet().stream()
                    .filter(e -> !e.getKey().equals(currentMonth))
                    .map(Map.Entry::getValue)
                    .toList();

            if (!pastTotals.isEmpty() && currentSpend.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal sum = pastTotals.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal avg = sum.divide(new BigDecimal(pastTotals.size()), 2, RoundingMode.HALF_UP);

                BigDecimal threshold = avg.multiply(new BigDecimal("1.20"));
                if (currentSpend.compareTo(threshold) > 0) {
                    SavingsOpportunity opp = new SavingsOpportunity();
                    opp.setTitle(cat + " Overspending");
                    opp.setType("OVERSPENDING");
                    opp.setPotentialSavings(currentSpend.subtract(avg).setScale(2, RoundingMode.HALF_UP));
                    opp.setReasoning(String.format("Current spending on %s exceeds your historical monthly average by %d%%.", cat, Math.round((currentSpend.doubleValue() - avg.doubleValue()) / avg.doubleValue() * 100)));
                    opp.setConfidence("Medium");
                    opps.add(opp);
                }
            }
        }

        return opps;
    }

    // ── Algorithm: Financial Health Score ──
    private HealthScore calculateHealthScore(User user, List<Transaction> transactions, List<Budget> budgets, List<AnomalyDetails> anomalies) {
        HealthScore score = new HealthScore();
        score.setScore(70); // default
        score.setSavingsRate(0.0);
        score.setDiscipline("GOOD");
        List<String> explanations = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        BigDecimal income = user.getMonthlyIncome();
        if (income == null || income.compareTo(BigDecimal.ZERO) == 0) {
            income = new BigDecimal("50000.00");
        }

        YearMonth currentMonth = YearMonth.from(LocalDate.now());
        BigDecimal currentMonthExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && YearMonth.from(t.getTransactionDate()).equals(currentMonth))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double savingsRate = 0.0;
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal saved = income.subtract(currentMonthExpenses);
            savingsRate = saved.multiply(new BigDecimal("100"))
                    .divide(income, 2, RoundingMode.HALF_UP).doubleValue();
        }
        score.setSavingsRate(savingsRate);

        int savingsPoints = 0;
        if (savingsRate >= 30.0) {
            savingsPoints = 40;
            explanations.add("Excellent Savings Rate: You saved over 30% of your monthly income.");
        } else if (savingsRate >= 10.0) {
            savingsPoints = (int) (40 * (savingsRate / 30.0));
            explanations.add(String.format("Healthy Savings Rate: You saved %.1f%% of your monthly income.", savingsRate));
            suggestions.add("Aim to save at least 20% of your income using the 50/30/20 budget formula.");
        } else {
            explanations.add(String.format("Low Savings Rate: You saved only %.1f%% of your monthly income.", savingsRate));
            suggestions.add("Automate savings: Deduct 20% of your income at the start of the month before spending.");
        }

        // Budget Adherence
        int budgetPoints = 30;
        int exceededBudgetsCount = 0;
        if (!budgets.isEmpty()) {
            Map<String, BigDecimal> actualSpending = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE && YearMonth.from(t.getTransactionDate()).equals(currentMonth))
                    .collect(Collectors.groupingBy(
                            Transaction::getCategory,
                            Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                    ));

            for (Budget b : budgets) {
                BigDecimal spend = actualSpending.getOrDefault(b.getCategory(), BigDecimal.ZERO);
                if (spend.compareTo(b.getAmount()) > 0) {
                    exceededBudgetsCount++;
                }
            }

            int adherencePercent = 100 - (exceededBudgetsCount * 100 / budgets.size());
            budgetPoints = (adherencePercent * 30) / 100;
            if (exceededBudgetsCount > 0) {
                explanations.add(String.format("Budget Violations: You exceeded budgets in %d out of %d categories.", exceededBudgetsCount, budgets.size()));
                suggestions.add("Set alerts or curb wants categories (Shopping/Entertainment) if they near budget limits.");
            } else {
                explanations.add("100% Budget Adherence: You stayed within all category limits this month!");
            }
        } else {
            explanations.add("No category budgets configured. Setting budgets helps improve financial health score.");
            suggestions.add("Generate and save recommended budgets to build discipline.");
        }

        // Discipline (Anomalies impact)
        int disciplinePoints = 30;
        long activeAnomalies = anomalies.stream()
                .filter(a -> YearMonth.from(a.getTransactionDate()).equals(currentMonth))
                .count();

        disciplinePoints = Math.max(0, 30 - (int) (activeAnomalies * 10));
        if (activeAnomalies > 0) {
            explanations.add(String.format("Spending Volatility: We detected %d unusual transaction spikes this month.", activeAnomalies));
            score.setDiscipline("NEEDS_IMPROVEMENT");
        } else {
            explanations.add("Stable spending: No anomalous transaction spikes detected this month.");
            score.setDiscipline("EXCELLENT");
        }

        score.setScore(savingsPoints + budgetPoints + disciplinePoints);
        score.setExplanations(explanations);
        score.setSuggestions(suggestions);

        return score;
    }

    private List<String> generateInsights(List<Transaction> transactions, List<Budget> budgets, List<BudgetRecommendation> recommended) {
        List<String> insights = new ArrayList<>();
        YearMonth currentMonth = YearMonth.from(LocalDate.now());
        
        List<Transaction> currentExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && YearMonth.from(t.getTransactionDate()).equals(currentMonth))
                .toList();

        if (currentExpenses.isEmpty()) {
            return insights;
        }

        // Top Category
        Map<String, BigDecimal> categorySums = currentExpenses.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        String topCat = "None";
        BigDecimal topAmt = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : categorySums.entrySet()) {
            if (entry.getValue().compareTo(topAmt) > 0) {
                topAmt = entry.getValue();
                topCat = entry.getKey();
            }
        }
        insights.add(String.format("Food remains your highest expense category at %s.", topAmt.toString()));

        // Check budget violations
        for (Budget b : budgets) {
            BigDecimal spend = categorySums.getOrDefault(b.getCategory(), BigDecimal.ZERO);
            if (spend.compareTo(b.getAmount()) > 0) {
                BigDecimal diff = spend.subtract(b.getAmount());
                insights.add(String.format("You are exceeding your %s budget of %s by %s.", b.getCategory(), b.getAmount().toString(), diff.toString()));
            }
        }

        return insights;
    }

    private List<String> generateInsightCards(HealthScore score, Predictions pred) {
        List<String> cards = new ArrayList<>();
        if (score.getScore() >= 80) {
            cards.add("Great job! Savings and budget adherence are excellent this month.");
        } else {
            cards.add("Focus on savings: Try cutting wants categories by 10% to improve health score.");
        }

        if (pred.getTrend().equals("UPWARD")) {
            cards.add(String.format("AI predicts a potential spending spike of %s next month.", pred.getNextMonthForecast().toString()));
        } else {
            cards.add("Your spending trend looks stable and projected to decrease.");
        }

        return cards;
    }

    // ── Budgets CRUD ──
    @Override
    public List<Budget> getBudgets() {
        User currentUser = getCurrentUser();
        return budgetRepository.findByUserId(currentUser.getId());
    }

    @Override
    @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    public Budget saveBudget(BudgetRequest request) {
        User currentUser = getCurrentUser();
        Budget budget = budgetRepository.findByUserIdAndCategory(currentUser.getId(), request.getCategory())
                .orElse(new Budget());
        
        budget.setUser(currentUser);
        budget.setCategory(request.getCategory());
        budget.setAmount(request.getAmount());
        
        return budgetRepository.save(budget);
    }

    @Override
    @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    public void deleteBudget(Long id) {
        User currentUser = getCurrentUser();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        if (!budget.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }
        budgetRepository.delete(budget);
    }

    // ── Goals CRUD ──
    @Override
    public List<Goal> getGoals() {
        User currentUser = getCurrentUser();
        return goalRepository.findByUserId(currentUser.getId());
    }

    @Override
    @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    public Goal createGoal(GoalRequest request) {
        User currentUser = getCurrentUser();
        Goal goal = new Goal();
        goal.setUser(currentUser);
        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setCurrentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : BigDecimal.ZERO);
        goal.setTargetDate(request.getTargetDate());
        goal.setCategory(request.getCategory());
        return goalRepository.save(goal);
    }

    @Override
    @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    public Goal updateGoal(Long id, GoalRequest request) {
        User currentUser = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        
        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        if (request.getCurrentAmount() != null) {
            goal.setCurrentAmount(request.getCurrentAmount());
        }
        goal.setTargetDate(request.getTargetDate());
        goal.setCategory(request.getCategory());
        return goalRepository.save(goal);
    }

    @Override
    @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    public void deleteGoal(Long id) {
        User currentUser = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        goalRepository.delete(goal);
    }
}

