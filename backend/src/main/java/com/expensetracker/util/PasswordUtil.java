package com.expensetracker.util;

public class PasswordUtil {

    public static boolean isStrongPassword(
            String password) {

        return password.length() >= 6
                && password.matches(".*[A-Z].*")
                && password.matches(".*[a-z].*")
                && password.matches(".*\\d.*");
    }
}