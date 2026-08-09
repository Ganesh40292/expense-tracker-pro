package com.expensetracker.service;

import java.util.List;

import com.expensetracker.dto.request.CategoryRequest;

public interface CategoryService {

    void addCategory(CategoryRequest request);

    List<String> getAllCategories();

    void deleteCategory(Long id);
}