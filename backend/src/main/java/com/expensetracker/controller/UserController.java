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

    @PostMapping("/profile/{id}/avatar")
    public ResponseEntity<UserResponse> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {

        UserResponse response = userService.uploadAvatar(id, file);
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