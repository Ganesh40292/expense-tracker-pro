package com.expensetracker.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.expensetracker.entity.RecurringExpense;
import com.expensetracker.entity.User;
import com.expensetracker.enums.RecurringStatus;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {
    
    List<RecurringExpense> findByUserOrderByNextRunDateAsc(User user);
    
    List<RecurringExpense> findByUserId(Long userId);
    
    List<RecurringExpense> findByStatusAndNextRunDateLessThanEqual(RecurringStatus status, LocalDate date);
}
