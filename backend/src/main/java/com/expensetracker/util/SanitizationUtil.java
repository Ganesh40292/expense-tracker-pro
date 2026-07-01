package com.expensetracker.util;

import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

/**
 * Utility for sanitizing user input to prevent XSS and injection attacks.
 */
public final class SanitizationUtil {

    private SanitizationUtil() {
        // Utility class — no instantiation
    }

    // Patterns for common XSS vectors
    private static final Pattern SCRIPT_TAG = Pattern.compile(
            "<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Pattern EVENT_HANDLERS = Pattern.compile(
            "\\bon\\w+\\s*=", Pattern.CASE_INSENSITIVE
    );

    private static final Pattern JAVASCRIPT_PROTOCOL = Pattern.compile(
            "javascript\\s*:", Pattern.CASE_INSENSITIVE
    );

    private static final Pattern HTML_TAGS = Pattern.compile(
            "<[^>]+>", Pattern.CASE_INSENSITIVE
    );

    /**
     * Sanitize a string input by stripping dangerous HTML/JS content
     * and then HTML-escaping the remainder.
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String result = input;

        // 1. Remove <script> blocks entirely
        result = SCRIPT_TAG.matcher(result).replaceAll("");

        // 2. Remove event handlers (onclick=, onerror=, etc.)
        result = EVENT_HANDLERS.matcher(result).replaceAll("");

        // 3. Remove javascript: protocol
        result = JAVASCRIPT_PROTOCOL.matcher(result).replaceAll("");

        // 4. Strip remaining HTML tags
        result = HTML_TAGS.matcher(result).replaceAll("");

        // 5. HTML-escape any remaining special characters
        result = HtmlUtils.htmlEscape(result);

        // 6. Trim whitespace
        result = result.trim();

        return result;
    }

    /**
     * Light sanitization — only escapes HTML entities without stripping.
     * Useful for fields where some formatting is acceptable.
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(input);
    }
}
