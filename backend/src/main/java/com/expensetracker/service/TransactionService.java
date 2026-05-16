package com.expensetracker.service;

import java.util.List;

import com.expensetracker.dto.request.TransactionRequest;
import com.expensetracker.dto.response.TransactionResponse;

public interface TransactionService {

    TransactionResponse addTransaction(
            TransactionRequest request
    );

    List<TransactionResponse> getAllTransactions();

    TransactionResponse getTransactionById(Long id);

    TransactionResponse updateTransaction(
            Long id,
            TransactionRequest request
    );

    void deleteTransaction(Long id);
}