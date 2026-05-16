package com.expensetracker.service;

import com.expensetracker.dto.request.UpdateProfileRequest;
import com.expensetracker.dto.request.UpdatePasswordRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserResponse;

public interface UserService {

    UserResponse getUserProfile(Long id);

    UserResponse updateUserProfile(
            Long id,
            UpdateProfileRequest request
    );

    ApiResponse updatePassword(
            Long id,
            UpdatePasswordRequest request
    );
}