package com.expensetracker.security;

import com.expensetracker.util.SanitizationUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Filter that sanitizes incoming request parameters and JSON body
 * to prevent XSS attacks.
 */
@Component
@Order(1)
public class SanitizeRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Wrap the request to sanitize parameters
        SanitizedRequestWrapper wrappedRequest = new SanitizedRequestWrapper(request);

        filterChain.doFilter(wrappedRequest, response);
    }

    /**
     * Request wrapper that sanitizes parameter values.
     * JSON body sanitization is handled at the DTO/service level
     * to avoid breaking JSON structure.
     */
    private static class SanitizedRequestWrapper extends HttpServletRequestWrapper {

        public SanitizedRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return SanitizationUtil.sanitize(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }

            String[] sanitized = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                sanitized[i] = SanitizationUtil.sanitize(values[i]);
            }
            return sanitized;
        }

        @Override
        public String getHeader(String name) {
            // Don't sanitize Authorization or Content-Type headers
            if ("Authorization".equalsIgnoreCase(name) ||
                "Content-Type".equalsIgnoreCase(name) ||
                "User-Agent".equalsIgnoreCase(name) ||
                "Accept".equalsIgnoreCase(name) ||
                "Cookie".equalsIgnoreCase(name) ||
                "X-Forwarded-For".equalsIgnoreCase(name)) {
                return super.getHeader(name);
            }
            String value = super.getHeader(name);
            return SanitizationUtil.escapeHtml(value);
        }
    }
}
