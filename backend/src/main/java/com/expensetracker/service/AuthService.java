package com.expensetracker.service;

import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.request.RegisterRequest;
import com.expensetracker.dto.response.AuthResponse;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    AuthResponse registerUser(RegisterRequest request, HttpServletRequest httpRequest);

    AuthResponse loginUser(LoginRequest request, HttpServletRequest httpRequest);

    AuthResponse refreshToken(String refreshToken);

    void logout(String refreshToken);

    void logoutAllDevices(String email);

    void requestPasswordReset(String email);

    void resetPassword(String token, String newPassword);
}