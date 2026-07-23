package com.expensetracker.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.enums.TransactionType;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.GeminiAiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiAiServiceImpl implements GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiServiceImpl.class);

    @Value("${gemini.api.key:YOUR_GEMINI_API_KEY_HERE}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String modelName;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("User not authenticated");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    @Override
    public String askGemini(String prompt) {
        try {
            User user = getCurrentUser();
            List<Transaction> transactions = transactionRepository.findByUserIdAndIsDeletedFalse(user.getId());

            BigDecimal totalIncome = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(t -> t.getBaseAmount() != null ? t.getBaseAmount() : t.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpense = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(t -> t.getBaseAmount() != null ? t.getBaseAmount() : t.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, BigDecimal> categoryExpenses = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .collect(Collectors.groupingBy(
                            Transaction::getCategory,
                            Collectors.reducing(BigDecimal.ZERO, t -> t.getBaseAmount() != null ? t.getBaseAmount() : t.getAmount(), BigDecimal::add)
                    ));

            String contextPrompt = String.format(
                "You are ExpenseBot AI, an intelligent, friendly financial advisor inside ExpenseTracker Pro.\n" +
                "User Info: Name=%s, Currency=%s, Monthly Income=%s.\n" +
                "Financial Context: Total Inflow=%s %s, Total Outflow=%s %s, Category Breakdown=%s.\n\n" +
                "User Question: %s\n\n" +
                "Provide a concise, helpful, friendly answer in 2-4 sentences with clear bullet points if appropriate.",
                user.getName(), user.getDefaultCurrency(), user.getMonthlyIncome(),
                user.getDefaultCurrency(), totalIncome, user.getDefaultCurrency(), totalExpense, categoryExpenses,
                prompt
            );

            return callGeminiApi(contextPrompt);
        } catch (Exception e) {
            log.error("Failed to process Gemini request: {}", e.getMessage());
            return "I'm having trouble connecting to Gemini AI right now. Based on your current balance, keep monitoring your top spending categories!";
        }
    }

    @Override
    public String getFinancialAdvisoryForUser() {
        return askGemini("Give me a comprehensive 3-bullet financial wellness summary and advice for my budget this month.");
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> scanReceiptVision(org.springframework.web.multipart.MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            String base64Image = java.util.Base64.getEncoder().encodeToString(fileBytes);
            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt = "Extract details from this receipt into strict JSON format with keys: " +
                    "\"merchantName\" (string), \"totalAmount\" (number), \"currency\" (string), " +
                    "\"transactionDate\" (string YYYY-MM-DD), \"category\" (Food/Shopping/Bills/Health/Travel/Entertainment/Education/Other). " +
                    "Output valid JSON object only with no code fence formatting.";

            String jsonPayload = String.format(
                "{\"contents\": [{\"parts\": [{\"inline_data\": {\"mime_type\": \"%s\", \"data\": \"%s\"}}, {\"text\": %s}]}]}",
                contentType, base64Image, objectMapper.writeValueAsString(prompt)
            );

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidates = rootNode.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        String rawText = textNode.asText().trim();
                        if (rawText.startsWith("```json")) {
                            rawText = rawText.substring(7);
                        }
                        if (rawText.startsWith("```")) {
                            rawText = rawText.substring(3);
                        }
                        if (rawText.endsWith("```")) {
                            rawText = rawText.substring(0, rawText.length() - 3);
                        }
                        rawText = rawText.trim();
                        return objectMapper.readValue(rawText, Map.class);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Gemini Vision Receipt OCR failed: {}", e.getMessage());
        }

        return Map.of("error", "Could not parse receipt using Gemini Vision.");
    }

    private String callGeminiApi(String fullPrompt) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonPayload = String.format(
                "{\"contents\": [{\"parts\": [{\"text\": %s}]}]}",
                objectMapper.writeValueAsString(fullPrompt)
            );

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidates = rootNode.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        return textNode.asText().trim();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Gemini API call failed: {}", e.getMessage());
        }

        return "Gemini AI response unavailable. Ensure your API key is valid in application.properties.";
    }
}
