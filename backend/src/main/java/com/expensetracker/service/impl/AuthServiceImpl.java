package com.expensetracker.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.request.RegisterRequest;
import com.expensetracker.dto.response.AuthResponse;
import com.expensetracker.entity.User;
import com.expensetracker.entity.EmailPreference;
import com.expensetracker.entity.PasswordResetToken;
import com.expensetracker.entity.RefreshToken;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.AuthMapper;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.repository.EmailPreferenceRepository;
import com.expensetracker.repository.PasswordResetTokenRepository;
import com.expensetracker.security.JwtUtil;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.EmailService;
import com.expensetracker.service.LoginAttemptService;
import com.expensetracker.service.AuditService;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailPreferenceRepository emailPreferenceRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private AuditService auditService;

    private String extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "Unknown Device";
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    public AuthResponse registerUser(RegisterRequest request, HttpServletRequest httpRequest) {

        if (userRepository.existsByEmail(request.getEmail())) {

            throw new DuplicateResourceException(
                    "Email already exists"
            );
        }

        User user = AuthMapper.mapToUserEntity(request);

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        userRepository.save(user);

        // Create default email preferences
        emailPreferenceRepository.save(new EmailPreference(user));

        // Send welcome email (async — won't block response)
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = jwtUtil.createRefreshToken(
                user,
                extractDeviceInfo(httpRequest),
                extractIpAddress(httpRequest)
        );

        // Audit log
        auditService.log(user.getId(), "REGISTER", "New user registered", httpRequest);

        AuthResponse response = new AuthResponse(
                accessToken,
                refreshToken,
                "User registered successfully",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getDefaultCurrency(),
                user.getRole().name()
        );
        response.setMonthlyIncome(user.getMonthlyIncome());
        return response;
    }

    @Override
    public AuthResponse loginUser(LoginRequest request, HttpServletRequest httpRequest) {

        String email = request.getEmail();

        // Check if account is locked due to brute force
        if (loginAttemptService.isBlocked(email)) {
            auditService.log(null, "LOGIN_BLOCKED", "Login attempt on locked account: " + email, httpRequest);
            throw new UnauthorizedException(
                    "Account is temporarily locked due to too many failed login attempts. Please try again later."
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    loginAttemptService.loginFailed(email);
                    auditService.log(null, "LOGIN_FAILED", "Invalid email: " + email, httpRequest);
                    return new UnauthorizedException(
                            "Invalid email or password"
                    );
                });

        if (!user.isEnabled()) {
            auditService.log(user.getId(), "LOGIN_BLOCKED", "Login attempt on deactivated account: " + email, httpRequest);
            throw new UnauthorizedException(
                    "Your account has been deactivated. Please contact support."
            );
        }

        boolean passwordMatch =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatch) {
            loginAttemptService.loginFailed(email);
            auditService.log(user.getId(), "LOGIN_FAILED", "Invalid password", httpRequest);
            throw new UnauthorizedException(
                    "Invalid email or password"
            );
        }

        // Successful login — reset attempt counter
        loginAttemptService.loginSucceeded(email);

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = jwtUtil.createRefreshToken(
                user,
                extractDeviceInfo(httpRequest),
                extractIpAddress(httpRequest)
        );

        // Audit log
        auditService.log(user.getId(), "LOGIN_SUCCESS", "User logged in", httpRequest);

        AuthResponse response = new AuthResponse(
                accessToken,
                refreshToken,
                "Login successful",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getDefaultCurrency(),
                user.getRole().name()
        );
        response.setMonthlyIncome(user.getMonthlyIncome());
        return response;
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {

        RefreshToken refreshToken = jwtUtil.validateRefreshToken(refreshTokenValue);

        User user = refreshToken.getUser();

        // Generate new access token
        String newAccessToken = jwtUtil.generateToken(user.getEmail());

        // Rotate refresh token (invalidate old, create new)
        String newRefreshToken = jwtUtil.rotateRefreshToken(refreshToken);

        AuthResponse response = new AuthResponse(
                newAccessToken,
                newRefreshToken,
                "Token refreshed successfully",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getDefaultCurrency(),
                user.getRole().name()
        );
        response.setMonthlyIncome(user.getMonthlyIncome());
        return response;
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        jwtUtil.revokeRefreshToken(refreshToken);
        // Note: audit logging for logout is limited without HttpServletRequest
        // Frontend should provide context for detailed audit trails
    }

    @Override
    @Transactional
    public void logoutAllDevices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        jwtUtil.revokeAllUserTokens(user);
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Silently return to prevent email enumeration attacks
            return;
        }

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate token and expiry
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, LocalDateTime.now().plusHours(24));
        passwordResetTokenRepository.save(resetToken);

        // Send Email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid password reset token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new UnauthorizedException("Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Consume the token so it cannot be used again
        passwordResetTokenRepository.delete(resetToken);

        // Revoke all refresh tokens (force re-login on all devices after password reset)
        jwtUtil.revokeAllUserTokens(user);

        // Audit log
        auditService.log(user.getId(), "PASSWORD_RESET", "Password reset completed");
    }
}