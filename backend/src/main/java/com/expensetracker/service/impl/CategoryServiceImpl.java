package com.expensetracker.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.CategoryMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.CategoryService;

@Service
public class CategoryServiceImpl
        implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        UserPrincipal principal =
                (UserPrincipal) auth.getPrincipal();

        return userRepository.findByEmail(
                        principal.getUsername()
                )
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "User not found"
                        ));
    }

    @Override
    public void addCategory(CategoryRequest request) {

        User currentUser = getCurrentUser();

        if (categoryRepository.existsByCategoryNameAndUser(
                request.getCategoryName(), currentUser)) {
            throw new DuplicateResourceException(
                    "Category already exists"
            );
        }

        Category category =
                CategoryMapper.mapToCategoryEntity(
                        request
                );

        category.setUser(currentUser);

        categoryRepository.save(category);
    }

    @Override
    public List<String> getAllCategories() {

        User currentUser = getCurrentUser();

        return categoryRepository
                .findByUser(currentUser)
                .stream()
                .map(Category::getCategoryName)
                .toList();
    }

    @Override
    public void deleteCategory(Long id) {

        User currentUser = getCurrentUser();

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found"
                        ));

        if (!category.getUser().getId()
                .equals(currentUser.getId())) {
            throw new UnauthorizedException(
                    "Access denied"
            );
        }

        categoryRepository.delete(category);
    }
}