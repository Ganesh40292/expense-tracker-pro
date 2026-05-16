package com.expensetracker.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.request.RegisterRequest;
import com.expensetracker.dto.response.AuthResponse;
import com.expensetracker.entity.User;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.AuthMapper;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtil;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.EmailService;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Override
    public AuthResponse registerUser(RegisterRequest request) {

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

        // Send welcome email (async — won't block response)
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        String token =
                jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                "User registered successfully",
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }

    @Override
    public AuthResponse loginUser(LoginRequest request) {

        User user = userRepository.findByEmail(
                        request.getEmail()
                )
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "Invalid email or password"
                        )
                );

        boolean passwordMatch =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatch) {

            throw new UnauthorizedException(
                    "Invalid email or password"
            );
        }

        String token =
                jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                "Login successful",
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }
}