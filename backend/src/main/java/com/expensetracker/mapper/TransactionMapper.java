package com.expensetracker.mapper;

import com.expensetracker.dto.request.TransactionRequest;
import com.expensetracker.dto.response.TransactionResponse;
import com.expensetracker.entity.Transaction;
import com.expensetracker.enums.TransactionStatus;
import com.expensetracker.enums.TransactionType;

public class TransactionMapper {

    // Entity -> Response DTO
    public static TransactionResponse mapToTransactionResponse(
            Transaction transaction) {

        TransactionResponse response = new TransactionResponse();

        response.setId(transaction.getId());
        response.setTitle(transaction.getTitle());
        response.setAmount(transaction.getAmount());
        response.setType(transaction.getType().name());
        response.setCategory(transaction.getCategory());
        response.setTransactionDate(transaction.getTransactionDate());
        response.setDescription(transaction.getDescription());
        response.setStatus(transaction.getStatus().name());

        return response;
    }

    // Request DTO -> Entity
    public static Transaction mapToTransactionEntity(
            TransactionRequest request) {

        Transaction transaction = new Transaction();

        transaction.setTitle(request.getTitle());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.valueOf(request.getType()));
        transaction.setCategory(request.getCategory());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());
        
        if (request.getStatus() != null) {
            transaction.setStatus(TransactionStatus.valueOf(request.getStatus()));
        }

        return transaction;
    }
}