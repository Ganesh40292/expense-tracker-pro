package com.expensetracker.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.enums.TransactionType;
import com.expensetracker.enums.UserRole;

public class TestDataFactory {

    public static User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setRole(UserRole.USER);
        user.setDefaultCurrency("INR");
        user.setMonthlyIncome(new BigDecimal("50000.00"));
        user.setEnabled(true);
        return user;
    }

    public static User createAdminUser() {
        User user = createTestUser();
        user.setId(2L);
        user.setEmail("admin@example.com");
        user.setRole(UserRole.ADMIN);
        return user;
    }

    public static Category createTestCategory(User user) {
        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Groceries");
        category.setIcon("shopping-cart");
        category.setColor("#FF0000");
        category.setUser(user);
        return category;
    }

    public static Transaction createTestTransaction(User user, Category category) {
        Transaction transaction = new Transaction();
        transaction.setId(1L);
        transaction.setTitle("Groceries Purchase");
        transaction.setUser(user);
        transaction.setCategory(category.getCategoryName());
        transaction.setAmount(new BigDecimal("500.00"));
        transaction.setType(TransactionType.EXPENSE);
        transaction.setTransactionDate(LocalDate.now());
        transaction.setDescription("Monthly groceries");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());
        return transaction;
    }
}
