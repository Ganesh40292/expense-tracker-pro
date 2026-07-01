package com.expensetracker.service;

import com.expensetracker.dto.response.ReceiptResponse;

public interface OcrService {
    ReceiptResponse analyzeText(Long receiptId, String rawText);
}
