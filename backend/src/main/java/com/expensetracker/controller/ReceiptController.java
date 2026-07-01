package com.expensetracker.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.expensetracker.dto.request.OcrAnalysisRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.ReceiptResponse;
import com.expensetracker.service.OcrService;
import com.expensetracker.service.ReceiptService;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    @Autowired
    private ReceiptService receiptService;

    @Autowired
    private OcrService ocrService;

    @PostMapping("/upload")
    public ResponseEntity<ReceiptResponse> uploadReceipt(
            @RequestParam("file") MultipartFile file) {
        ReceiptResponse response = receiptService.uploadReceipt(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<ReceiptResponse> analyzeReceipt(
            @PathVariable Long id,
            @Valid @RequestBody OcrAnalysisRequest request) {
        ReceiptResponse response = ocrService.analyzeText(id, request.getRawText());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ReceiptResponse>> getAllReceipts() {
        List<ReceiptResponse> response = receiptService.getAllReceipts();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptResponse> getReceiptById(@PathVariable Long id) {
        ReceiptResponse response = receiptService.getReceiptById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> getReceiptImage(@PathVariable Long id) {
        Resource resource = receiptService.getReceiptImage(id);

        String contentType = "image/jpeg";
        try {
            String filename = resource.getFilename();
            if (filename != null) {
                if (filename.endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.endsWith(".webp")) {
                    contentType = "image/webp";
                } else if (filename.endsWith(".pdf")) {
                    contentType = "application/pdf";
                }
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteReceipt(@PathVariable Long id) {
        receiptService.deleteReceipt(id);
        return ResponseEntity.ok(new ApiResponse(true, "Receipt deleted successfully"));
    }

    @PostMapping("/{id}/link/{transactionId}")
    public ResponseEntity<ReceiptResponse> linkReceipt(
            @PathVariable Long id,
            @PathVariable Long transactionId) {
        ReceiptResponse response = receiptService.linkReceipt(id, transactionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/unlink")
    public ResponseEntity<ReceiptResponse> unlinkReceipt(@PathVariable Long id) {
        ReceiptResponse response = receiptService.unlinkReceipt(id);
        return ResponseEntity.ok(response);
    }
}
