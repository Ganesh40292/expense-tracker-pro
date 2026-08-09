package com.expensetracker.dto.request;

import jakarta.validation.constraints.NotBlank;

public class OcrAnalysisRequest {

    @NotBlank(message = "Raw text is required for OCR analysis")
    private String rawText;

    public OcrAnalysisRequest() {
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }
}
