package com.expensetracker.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUser(User user);

    List<Transaction> findByUserId(Long userId);

    List<Transaction> findByType(String type);

    List<Transaction> findByCategory(String category);

    List<Transaction> findByTransactionDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    List<Transaction> findByUserIdAndType(
            Long userId,
            String type
    );

    java.util.Optional<Transaction> findByReceiptId(Long receiptId);
}