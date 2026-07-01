package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReceiptResponse {
    private Long id;
    private String fileName;
    private String originalFileName;
    private Long fileSize;
    private String contentType;
    private String merchantName;
    private LocalDate transactionDate;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private String currency;
    private String category;
    private String confidenceMerchant;
    private String confidenceAmount;
    private String confidenceDate;
    private String confidenceCategory;
    private String rawOcrText;
    private LocalDateTime createdAt;
    private boolean linked;
    private Long transactionId;

    public ReceiptResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getConfidenceMerchant() {
        return confidenceMerchant;
    }

    public void setConfidenceMerchant(String confidenceMerchant) {
        this.confidenceMerchant = confidenceMerchant;
    }

    public String getConfidenceAmount() {
        return confidenceAmount;
    }

    public void setConfidenceAmount(String confidenceAmount) {
        this.confidenceAmount = confidenceAmount;
    }

    public String getConfidenceDate() {
        return confidenceDate;
    }

    public void setConfidenceDate(String confidenceDate) {
        this.confidenceDate = confidenceDate;
    }

    public String getConfidenceCategory() {
        return confidenceCategory;
    }

    public void setConfidenceCategory(String confidenceCategory) {
        this.confidenceCategory = confidenceCategory;
    }

    public String getRawOcrText() {
        return rawOcrText;
    }

    public void setRawOcrText(String rawOcrText) {
        this.rawOcrText = rawOcrText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isLinked() {
        return linked;
    }

    public void setLinked(boolean linked) {
        this.linked = linked;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }
}
