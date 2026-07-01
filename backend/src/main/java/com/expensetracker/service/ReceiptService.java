package com.expensetracker.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.expensetracker.dto.response.ReceiptResponse;

public interface ReceiptService {
    ReceiptResponse uploadReceipt(MultipartFile file);
    List<ReceiptResponse> getAllReceipts();
    ReceiptResponse getReceiptById(Long id);
    Resource getReceiptImage(Long id);
    void deleteReceipt(Long id);
    ReceiptResponse linkReceipt(Long id, Long transactionId);
    ReceiptResponse unlinkReceipt(Long id);
}
