package com.expensetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IP-based rate limiting filter using a sliding window token bucket approach.
 * No external dependencies — pure in-memory implementation.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // path pattern → max requests per minute
    private static final Map<String, Integer> RATE_LIMITS = Map.of(
            "/api/auth/login", 10,
            "/api/auth/register", 5,
            "/api/auth/forgot-password", 3,
            "/api/auth/refresh", 20,
            "/api/auth/reset-password", 5
    );

    private static final int DEFAULT_RATE_LIMIT = 60; // per minute for general endpoints

    // Key: "IP:path" → bucket
    private final ConcurrentHashMap<String, RateBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = extractIp(request);

        // Only rate-limit specific auth endpoints + general API calls
        Integer rateLimit = RATE_LIMITS.get(path);

        if (rateLimit == null && path.startsWith("/api/")) {
            rateLimit = DEFAULT_RATE_LIMIT;
        }

        if (rateLimit != null) {
            final int limit = rateLimit;
            String bucketKey = ip + ":" + path;
            RateBucket bucket = buckets.computeIfAbsent(
                    bucketKey, k -> new RateBucket(limit)
            );

            if (!bucket.tryConsume()) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", "60");
                response.getWriter().write(
                        "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Simple sliding-window rate bucket.
     * Resets the counter every 60 seconds.
     */
    private static class RateBucket {
        private final int maxRequests;
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStart;

        public RateBucket(int maxRequests) {
            this.maxRequests = maxRequests;
            this.windowStart = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();

            // Reset window every 60 seconds
            if (now - windowStart > 60_000) {
                count.set(0);
                windowStart = now;
            }

            return count.incrementAndGet() <= maxRequests;
        }
    }
}
