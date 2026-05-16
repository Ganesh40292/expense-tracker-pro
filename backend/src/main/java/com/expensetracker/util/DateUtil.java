package com.expensetracker.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtil {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public static String formatDate(LocalDate date) {

        return date.format(DATE_FORMATTER);
    }

    public static String formatDateTime(
            LocalDateTime dateTime) {

        return dateTime.format(
                DateTimeFormatter.ofPattern(
                        "dd-MM-yyyy HH:mm:ss"
                )
        );
    }

    public static LocalDate getCurrentDate() {

        return LocalDate.now();
    }
}