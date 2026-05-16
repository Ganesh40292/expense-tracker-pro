package com.expensetracker.mapper;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.entity.Category;

public class CategoryMapper {

    public static Category mapToCategoryEntity(
            CategoryRequest request) {

        Category category = new Category();

        category.setCategoryName(request.getCategoryName());

        return category;
    }
}