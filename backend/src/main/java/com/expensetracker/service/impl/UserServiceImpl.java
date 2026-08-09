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
import com.expensetracker.service.AuditService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

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
        if (request.getDefaultCurrency() != null) {
            user.setDefaultCurrency(request.getDefaultCurrency());
        }
        if (request.getMonthlyIncome() != null) {
            user.setMonthlyIncome(request.getMonthlyIncome());
        }

        userRepository.save(user);

        // Audit log
        auditService.log(user.getId(), "PROFILE_UPDATED", "Profile updated: name and/or email changed");

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

        // Audit log
        auditService.log(user.getId(), "PASSWORD_CHANGED", "Password changed via profile settings");

        return new ApiResponse(true, "Password updated successfully");
    }

    @Override
    public UserResponse uploadAvatar(Long id, org.springframework.web.multipart.MultipartFile file) {
        validateUserOwnership(id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload");
        }

        try {
            String uploadDir = "uploads/avatars/";
            java.io.File dir = new java.io.File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String filename = "avatar_" + id + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.nio.file.Path filepath = java.nio.file.Paths.get(uploadDir, filename);
            java.nio.file.Files.copy(file.getInputStream(), filepath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            user.setAvatarUrl("/api/users/avatar/" + filename);
            userRepository.save(user);

            auditService.log(user.getId(), "AVATAR_UPDATED", "Profile picture updated");

            return UserMapper.mapToUserResponse(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload avatar: " + e.getMessage(), e);
        }
    }
}