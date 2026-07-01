package com.expensetracker.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.expensetracker.entity.Transaction;

public interface ReportRepository
        extends JpaRepository<Transaction, Long> {

    @Query("""
            SELECT COALESCE(SUM(t.baseAmount), 0)
            FROM Transaction t
            WHERE t.type = com.expensetracker.enums.TransactionType.INCOME
            AND t.user.id = :userId
            AND t.status = com.expensetracker.enums.TransactionStatus.COMPLETED
            """)
    BigDecimal getTotalIncomeByUserId(
            @Param("userId") Long userId
    );

    @Query("""
            SELECT COALESCE(SUM(t.baseAmount), 0)
            FROM Transaction t
            WHERE t.type = com.expensetracker.enums.TransactionType.EXPENSE
            AND t.user.id = :userId
            AND t.status = com.expensetracker.enums.TransactionStatus.COMPLETED
            """)
    BigDecimal getTotalExpenseByUserId(
            @Param("userId") Long userId
    );

    @Query("""
            SELECT t.category AS category,
                   SUM(t.baseAmount) AS total
            FROM Transaction t
            WHERE t.user.id = :userId
            AND t.type = com.expensetracker.enums.TransactionType.EXPENSE
            AND t.status = com.expensetracker.enums.TransactionStatus.COMPLETED
            GROUP BY t.category
            ORDER BY total DESC
            """)
    List<Object[]> getExpenseSummaryByUserId(
            @Param("userId") Long userId
    );

    @Query("""
            SELECT FUNCTION('MONTHNAME', t.transactionDate) AS month,
                   SUM(CASE WHEN t.type = com.expensetracker.enums.TransactionType.INCOME
                       THEN t.baseAmount ELSE 0 END) AS income,
                   SUM(CASE WHEN t.type = com.expensetracker.enums.TransactionType.EXPENSE
                       THEN t.baseAmount ELSE 0 END) AS expense
            FROM Transaction t
            WHERE t.user.id = :userId
            AND t.status = com.expensetracker.enums.TransactionStatus.COMPLETED
            GROUP BY FUNCTION('MONTHNAME', t.transactionDate),
                     FUNCTION('MONTH', t.transactionDate)
            ORDER BY FUNCTION('MONTH', t.transactionDate)
            """)
    List<Object[]> getMonthlyReportByUserId(
            @Param("userId") Long userId
    );
}