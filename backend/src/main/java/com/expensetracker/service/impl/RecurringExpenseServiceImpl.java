package com.expensetracker.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expensetracker.dto.request.RecurringExpenseRequest;
import com.expensetracker.dto.response.RecurringExpenseResponse;
import com.expensetracker.entity.RecurringExpense;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.enums.RecurringInterval;
import com.expensetracker.enums.RecurringStatus;
import com.expensetracker.enums.TransactionStatus;
import com.expensetracker.enums.TransactionType;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.RecurringExpenseRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.ExchangeRateService;
import com.expensetracker.service.RecurringExpenseService;

@Service
public class RecurringExpenseServiceImpl implements RecurringExpenseService {

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExchangeRateService exchangeRateService;

    @Override
    @Transactional
    public RecurringExpenseResponse createRecurringExpense(Long userId, RecurringExpenseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        RecurringExpense expense = new RecurringExpense();
        expense.setUser(user);
        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        
        if (request.getCurrency() != null) {
            expense.setCurrency(request.getCurrency());
        }
        
        expense.setBaseAmount(exchangeRateService.getBaseAmount(
            expense.getAmount(), 
            expense.getCurrency()
        ));

        expense.setType(TransactionType.valueOf(request.getType().toUpperCase()));
        expense.setCategory(request.getCategory());
        expense.setInterval(RecurringInterval.valueOf(request.getInterval().toUpperCase()));
        expense.setStartDate(request.getStartDate());
        expense.setEndDate(request.getEndDate());
        expense.setDescription(request.getDescription());
        expense.setStatus(RecurringStatus.ACTIVE);

        // Calculate next run date. If start date is in the past or today, next run date is today.
        LocalDate nextRun = request.getStartDate();
        if (nextRun.isBefore(LocalDate.now())) {
            nextRun = LocalDate.now();
        }
        expense.setNextRunDate(nextRun);

        RecurringExpense saved = recurringExpenseRepository.save(expense);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public RecurringExpenseResponse updateRecurringExpense(Long id, Long userId, RecurringExpenseRequest request) {
        RecurringExpense expense = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        if (!expense.getUser().getId().equals(userId)) {
            throw new RuntimeException("You do not have permission to modify this recurring expense");
        }

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        
        if (request.getCurrency() != null) {
            expense.setCurrency(request.getCurrency());
        }

        expense.setBaseAmount(exchangeRateService.getBaseAmount(
            expense.getAmount(), 
            expense.getCurrency()
        ));

        expense.setType(TransactionType.valueOf(request.getType().toUpperCase()));
        expense.setCategory(request.getCategory());
        
        RecurringInterval newInterval = RecurringInterval.valueOf(request.getInterval().toUpperCase());
        if (expense.getInterval() != newInterval) {
            expense.setInterval(newInterval);
            // Optionally recalculate nextRunDate based on new interval if you want more complex logic
        }
        
        expense.setStartDate(request.getStartDate());
        expense.setEndDate(request.getEndDate());
        expense.setDescription(request.getDescription());

        RecurringExpense saved = recurringExpenseRepository.save(expense);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteRecurringExpense(Long id, Long userId) {
        RecurringExpense expense = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        if (!expense.getUser().getId().equals(userId)) {
            throw new RuntimeException("You do not have permission to delete this recurring expense");
        }

        recurringExpenseRepository.delete(expense);
    }

    @Override
    @Transactional
    public RecurringExpenseResponse toggleRecurringExpenseStatus(Long id, Long userId) {
        RecurringExpense expense = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        if (!expense.getUser().getId().equals(userId)) {
            throw new RuntimeException("You do not have permission to modify this recurring expense");
        }

        if (expense.getStatus() == RecurringStatus.ACTIVE) {
            expense.setStatus(RecurringStatus.PAUSED);
        } else {
            expense.setStatus(RecurringStatus.ACTIVE);
            // If resuming and nextRunDate is past, move it to today
            if (expense.getNextRunDate().isBefore(LocalDate.now())) {
                expense.setNextRunDate(LocalDate.now());
            }
        }

        RecurringExpense saved = recurringExpenseRepository.save(expense);
        return mapToResponse(saved);
    }

    @Override
    public List<RecurringExpenseResponse> getUserRecurringExpenses(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<RecurringExpense> expenses = recurringExpenseRepository.findByUserOrderByNextRunDateAsc(user);
        return expenses.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void processRecurringExpenses() {
        LocalDate today = LocalDate.now();
        List<RecurringExpense> dueExpenses = recurringExpenseRepository
                .findByStatusAndNextRunDateLessThanEqual(RecurringStatus.ACTIVE, today);

        for (RecurringExpense expense : dueExpenses) {
            // Check end date
            if (expense.getEndDate() != null && today.isAfter(expense.getEndDate())) {
                expense.setStatus(RecurringStatus.CANCELLED);
                recurringExpenseRepository.save(expense);
                continue;
            }

            Transaction transaction = new Transaction();
            transaction.setUser(expense.getUser());
            transaction.setTitle(expense.getTitle() + " (Auto)");
            transaction.setAmount(expense.getAmount());
            transaction.setCurrency(expense.getCurrency());
            transaction.setBaseAmount(expense.getBaseAmount());
            transaction.setType(expense.getType());
            transaction.setCategory(expense.getCategory());
            transaction.setTransactionDate(today);
            transaction.setDescription(expense.getDescription());
            transaction.setStatus(TransactionStatus.COMPLETED);
            
            transactionRepository.save(transaction);

            // Calculate next run date
            LocalDate nextRun = expense.getNextRunDate();
            switch (expense.getInterval()) {
                case DAILY:
                    nextRun = nextRun.plusDays(1);
                    break;
                case WEEKLY:
                    nextRun = nextRun.plusWeeks(1);
                    break;
                case MONTHLY:
                    nextRun = nextRun.plusMonths(1);
                    break;
                case YEARLY:
                    nextRun = nextRun.plusYears(1);
                    break;
            }

            // If we generated one but it's still behind (e.g. system was offline for days),
            // just jump it to the next valid future date, or we can just loop generation.
            // For MVP, we just jump it to next valid date from today to prevent spamming transactions.
            while (nextRun.isBefore(today) || nextRun.isEqual(today)) {
                switch (expense.getInterval()) {
                    case DAILY: nextRun = nextRun.plusDays(1); break;
                    case WEEKLY: nextRun = nextRun.plusWeeks(1); break;
                    case MONTHLY: nextRun = nextRun.plusMonths(1); break;
                    case YEARLY: nextRun = nextRun.plusYears(1); break;
                }
            }

            expense.setNextRunDate(nextRun);
            recurringExpenseRepository.save(expense);
        }
    }

    private RecurringExpenseResponse mapToResponse(RecurringExpense expense) {
        RecurringExpenseResponse response = new RecurringExpenseResponse();
        response.setId(expense.getId());
        response.setTitle(expense.getTitle());
        response.setAmount(expense.getAmount());
        response.setCurrency(expense.getCurrency());
        response.setBaseAmount(expense.getBaseAmount());
        response.setType(expense.getType().name());
        response.setCategory(expense.getCategory());
        response.setInterval(expense.getInterval().name());
        response.setStartDate(expense.getStartDate());
        response.setEndDate(expense.getEndDate());
        response.setNextRunDate(expense.getNextRunDate());
        response.setStatus(expense.getStatus().name());
        response.setDescription(expense.getDescription());
        return response;
    }
}
