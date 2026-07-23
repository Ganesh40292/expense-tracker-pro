package com.expensetracker.service;

import java.util.Map;
import org.springframework.web.multipart.MultipartFile;

public interface GeminiAiService {
    String askGemini(String prompt);
    String getFinancialAdvisoryForUser();
    Map<String, Object> scanReceiptVision(MultipartFile file);
}
