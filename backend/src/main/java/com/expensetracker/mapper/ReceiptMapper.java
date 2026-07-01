package com.expensetracker.mapper;

import com.expensetracker.dto.response.ReceiptResponse;
import com.expensetracker.entity.Receipt;

public class ReceiptMapper {

    public static ReceiptResponse mapToReceiptResponse(Receipt receipt) {
        if (receipt == null) {
            return null;
        }

        ReceiptResponse response = new ReceiptResponse();
        response.setId(receipt.getId());
        response.setFileName(receipt.getFileName());
        response.setOriginalFileName(receipt.getOriginalFileName());
        response.setFileSize(receipt.getFileSize());
        response.setContentType(receipt.getContentType());
        response.setMerchantName(receipt.getMerchantName());
        response.setTransactionDate(receipt.getTransactionDate());
        response.setTotalAmount(receipt.getTotalAmount());
        response.setTaxAmount(receipt.getTaxAmount());
        response.setCurrency(receipt.getCurrency());
        response.setCategory(receipt.getCategory());
        response.setConfidenceMerchant(receipt.getConfidenceMerchant());
        response.setConfidenceAmount(receipt.getConfidenceAmount());
        response.setConfidenceDate(receipt.getConfidenceDate());
        response.setConfidenceCategory(receipt.getConfidenceCategory());
        response.setRawOcrText(receipt.getRawOcrText());
        response.setCreatedAt(receipt.getCreatedAt());
        
        boolean isLinked = receipt.getTransaction() != null;
        response.setLinked(isLinked);
        if (isLinked) {
            response.setTransactionId(receipt.getTransaction().getId());
        }

        return response;
    }
}
