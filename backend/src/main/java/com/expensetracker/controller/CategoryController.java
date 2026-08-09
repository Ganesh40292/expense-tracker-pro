package com.expensetracker.controller;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<String> addCategory(
            @Valid @RequestBody CategoryRequest request) {

        categoryService.addCategory(request);
        return ResponseEntity.ok("Category added successfully");
    }

    @GetMapping
    public ResponseEntity<List<String>> getAllCategories() {

        List<String> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCategory(
            @PathVariable Long id) {

        categoryService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully");
    }
}