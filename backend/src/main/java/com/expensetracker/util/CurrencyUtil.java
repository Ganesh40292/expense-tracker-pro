package com.expensetracker.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public class CurrencyUtil {

    public static String formatCurrency(
            BigDecimal amount) {

        if (amount == null) {
            amount = BigDecimal.ZERO;
        }

        NumberFormat formatter =
                NumberFormat.getCurrencyInstance(
                        new Locale("en", "IN")
                );

        return formatter.format(amount);
    }
}