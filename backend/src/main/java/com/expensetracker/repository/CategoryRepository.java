package com.expensetracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;

public interface CategoryRepository
        extends JpaRepository<Category, Long> {

    List<Category> findByUser(User user);

    List<Category> findByUserId(Long userId);

    boolean existsByCategoryName(String categoryName);

    boolean existsByCategoryNameAndUser(
            String categoryName, User user
    );
}