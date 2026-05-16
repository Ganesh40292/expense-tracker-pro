package com.expensetracker.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.UpdatePasswordRequest;
import com.expensetracker.dto.request.UpdateProfileRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.expensetracker.mapper.UserMapper;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private void validateUserOwnership(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        if (!principal.getUserId().equals(id)) {
            throw new UnauthorizedException("You are not authorized to access this profile");
        }
    }

    @Override
    public UserResponse getUserProfile(Long id) {
        validateUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        ));

        return UserMapper.mapToUserResponse(user);
    }

    @Override
    public UserResponse updateUserProfile(
            Long id,
            UpdateProfileRequest request) {
        validateUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        ));

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        userRepository.save(user);

        return UserMapper.mapToUserResponse(user);
    }

    @Override
    public ApiResponse updatePassword(Long id, UpdatePasswordRequest request) {
        validateUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new ApiResponse(true, "Password updated successfully");
    }
}