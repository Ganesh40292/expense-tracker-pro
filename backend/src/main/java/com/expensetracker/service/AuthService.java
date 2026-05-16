package com.expensetracker.service;

import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.request.RegisterRequest;
import com.expensetracker.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse registerUser(RegisterRequest request);

    AuthResponse loginUser(LoginRequest request);
}