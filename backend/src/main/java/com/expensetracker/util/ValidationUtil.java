package com.expensetracker.util;

import java.math.BigDecimal;
import java.util.regex.Pattern;

public class ValidationUtil {

    private static final String EMAIL_REGEX =
            "^[A-Za-z0-9+_.-]+@(.+)$";

    public static boolean isValidEmail(
            String email) {

        return Pattern.matches(
                EMAIL_REGEX,
                email
        );
    }

    public static boolean isPositiveAmount(
            BigDecimal amount) {

        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    public static boolean isNullOrEmpty(
            String value) {

        return value == null ||
                value.trim().isEmpty();
    }
}