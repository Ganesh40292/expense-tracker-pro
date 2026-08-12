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

import com.expensetracker.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    private Long resolveUserId(String idStr, UserPrincipal userPrincipal) {
        if (idStr != null && !idStr.equalsIgnoreCase("me") && !idStr.equalsIgnoreCase("undefined")) {
            try {
                return Long.parseLong(idStr);
            } catch (NumberFormatException ignored) {}
        }
        if (userPrincipal != null) {
            return userPrincipal.getId();
        }
        throw new IllegalArgumentException("User ID could not be resolved");
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<UserResponse> getUserProfile(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long resolvedId = resolveUserId(id, userPrincipal);
        UserResponse response = userService.getUserProfile(resolvedId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<UserResponse> updateUserProfile(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {

        Long resolvedId = resolveUserId(id, userPrincipal);
        UserResponse response = userService.updateUserProfile(resolvedId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password/{id}")
    public ResponseEntity<ApiResponse> updatePassword(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdatePasswordRequest request) {

        Long resolvedId = resolveUserId(id, userPrincipal);
        ApiResponse response = userService.updatePassword(resolvedId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/{id}/avatar")
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {

        Long resolvedId = resolveUserId(id, userPrincipal);
        UserResponse response = userService.uploadAvatar(resolvedId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getAvatar(@PathVariable String filename) {
        try {
            java.nio.file.Path file = java.nio.file.Paths.get("uploads/avatars/").resolve(filename);
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = java.nio.file.Files.probeContentType(file);
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}