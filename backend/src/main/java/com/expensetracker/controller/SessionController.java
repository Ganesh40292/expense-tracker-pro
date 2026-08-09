package com.expensetracker.controller;

import com.expensetracker.dto.response.SessionResponse;
import com.expensetracker.entity.RefreshToken;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.repository.RefreshTokenRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtil;
import com.expensetracker.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<SessionResponse>> getActiveSessions(
            HttpServletRequest request) {

        User user = getAuthenticatedUser();

        String currentIp = extractIp(request);
        String currentUA = request.getHeader("User-Agent");

        List<RefreshToken> activeSessions = jwtUtil.getActiveSessionsForUser(user);

        List<SessionResponse> sessions = activeSessions.stream()
                .filter(rt -> !rt.isExpired())
                .map(rt -> {
                    boolean isCurrent = currentIp.equals(rt.getIpAddress())
                            && currentUA != null
                            && currentUA.equals(rt.getDeviceInfo());

                    return new SessionResponse(
                            rt.getId(),
                            rt.getDeviceInfo(),
                            rt.getIpAddress(),
                            rt.getCreatedAt(),
                            isCurrent
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/{tokenId}")
    @Transactional
    public ResponseEntity<Map<String, String>> revokeSession(
            @PathVariable Long tokenId) {

        User user = getAuthenticatedUser();

        RefreshToken token = refreshTokenRepository.findById(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // Ensure the user owns this session
        if (!token.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You cannot revoke another user's session");
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);

        return ResponseEntity.ok(Map.of("message", "Session revoked successfully"));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<Map<String, String>> revokeAllOtherSessions(
            HttpServletRequest request) {

        User user = getAuthenticatedUser();

        String currentIp = extractIp(request);
        String currentUA = request.getHeader("User-Agent");

        List<RefreshToken> sessions = jwtUtil.getActiveSessionsForUser(user);

        for (RefreshToken rt : sessions) {
            // Keep the current session active
            boolean isCurrent = currentIp.equals(rt.getIpAddress())
                    && currentUA != null
                    && currentUA.equals(rt.getDeviceInfo());

            if (!isCurrent) {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            }
        }

        return ResponseEntity.ok(Map.of("message", "All other sessions revoked"));
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String extractIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
