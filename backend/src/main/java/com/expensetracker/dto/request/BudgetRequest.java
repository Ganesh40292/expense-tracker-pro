package com.expensetracker.dto.request;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BudgetRequest {
    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Budget amount is required")
    private BigDecimal amount;

    public BudgetRequest() {}

    public BudgetRequest(String category, BigDecimal amount) {
        this.category = category;
        this.amount = amount;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
