package com.expensetracker.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class ExchangeRateService {

    // Mocked exchange rates relative to USD base
    private final Map<String, BigDecimal> ratesToUsd = Map.of(
        "USD", new BigDecimal("1.00"),
        "INR", new BigDecimal("83.50"),
        "EUR", new BigDecimal("0.92"),
        "GBP", new BigDecimal("0.79"),
        "JPY", new BigDecimal("155.20"),
        "AED", new BigDecimal("3.67")
    );

    /**
     * Converts an amount from one currency to another.
     * Math: (Amount / FromRate) * ToRate
     */
    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        BigDecimal fromRate = ratesToUsd.getOrDefault(fromCurrency.toUpperCase(), new BigDecimal("1.00"));
        BigDecimal toRate = ratesToUsd.getOrDefault(toCurrency.toUpperCase(), new BigDecimal("1.00"));

        // First convert to base USD
        BigDecimal amountInUsd = amount.divide(fromRate, 6, RoundingMode.HALF_UP);

        // Convert from USD to target currency
        return amountInUsd.multiply(toRate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Helper to get the base USD amount for a given transaction amount/currency.
     */
    public BigDecimal getBaseAmount(BigDecimal amount, String currency) {
        return convert(amount, currency, "USD");
    }
}
