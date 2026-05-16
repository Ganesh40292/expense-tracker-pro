package com.expensetracker.controller;

import com.expensetracker.dto.request.UpdatePasswordRequest;
import com.expensetracker.dto.request.UpdateProfileRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile/{id}")
    public ResponseEntity<UserResponse> getUserProfile(
            @PathVariable Long id) {

        UserResponse response = userService.getUserProfile(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<UserResponse> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {

        UserResponse response = userService.updateUserProfile(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password/{id}")
    public ResponseEntity<ApiResponse> updatePassword(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePasswordRequest request) {

        ApiResponse response = userService.updatePassword(id, request);
        return ResponseEntity.ok(response);
    }
}