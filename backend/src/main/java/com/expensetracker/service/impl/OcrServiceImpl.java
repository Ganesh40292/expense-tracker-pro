package com.expensetracker.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.response.ReceiptResponse;
import com.expensetracker.entity.Receipt;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.ReceiptMapper;
import com.expensetracker.repository.ReceiptRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.OcrService;

@Service
public class OcrServiceImpl implements OcrService {

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private UserRepository userRepository;

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
    public ReceiptResponse analyzeText(Long receiptId, String rawText) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(receiptId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));

        if (rawText == null || rawText.trim().isEmpty()) {
            receipt.setConfidenceMerchant("Low");
            receipt.setConfidenceAmount("Low");
            receipt.setConfidenceDate("Low");
            receipt.setConfidenceCategory("Low");
            receipt.setMerchantName("Unknown Merchant");
            receipt.setTotalAmount(BigDecimal.ZERO);
            receipt.setTaxAmount(BigDecimal.ZERO);
            receipt.setCurrency("INR");
            receipt.setCategory("Other");
            receipt.setTransactionDate(LocalDate.now());
            receipt.setRawOcrText("");
            receipt = receiptRepository.save(receipt);
            return ReceiptMapper.mapToReceiptResponse(receipt);
        }

        receipt.setRawOcrText(rawText);

        // 1. Currency Detection
        String currency = detectCurrency(rawText);
        receipt.setCurrency(currency);

        // 2. Parse amounts (total and tax)
        ParsedAmounts parsedAmounts = parseAmounts(rawText);
        receipt.setTotalAmount(parsedAmounts.total);
        receipt.setTaxAmount(parsedAmounts.tax);
        receipt.setConfidenceAmount(parsedAmounts.confidenceTotal);

        // 3. Date Detection
        ParsedDate parsedDate = parseDate(rawText);
        receipt.setTransactionDate(parsedDate.date);
        receipt.setConfidenceDate(parsedDate.confidence);

        // 4. Merchant Name Detection
        ParsedMerchant parsedMerchant = parseMerchant(rawText);
        receipt.setMerchantName(parsedMerchant.name);
        receipt.setConfidenceMerchant(parsedMerchant.confidence);

        // 5. Category Suggestion
        ParsedCategory parsedCategory = suggestCategory(rawText, parsedMerchant.name);
        receipt.setCategory(parsedCategory.category);
        receipt.setConfidenceCategory(parsedCategory.confidence);

        receipt = receiptRepository.save(receipt);
        return ReceiptMapper.mapToReceiptResponse(receipt);
    }

    private String detectCurrency(String text) {
        String lowerText = text.toLowerCase();
        if (lowerText.contains("₹") || lowerText.contains("rs") || lowerText.contains("rupee") || lowerText.contains("inr")) {
            return "INR";
        }
        if (lowerText.contains("$") || lowerText.contains("usd") || lowerText.contains("dollar")) {
            return "USD";
        }
        if (lowerText.contains("€") || lowerText.contains("eur") || lowerText.contains("euro")) {
            return "EUR";
        }
        if (lowerText.contains("£") || lowerText.contains("gbp") || lowerText.contains("pound")) {
            return "GBP";
        }
        if (lowerText.contains("aed") || lowerText.contains("dirham") || lowerText.contains("dhs")) {
            return "AED";
        }
        if (lowerText.contains("¥") || lowerText.contains("jpy") || lowerText.contains("yen")) {
            return "JPY";
        }
        return "INR"; // Default
    }

    private ParsedAmounts parseAmounts(String text) {
        ParsedAmounts result = new ParsedAmounts();
        result.total = BigDecimal.ZERO;
        result.tax = BigDecimal.ZERO;
        result.confidenceTotal = "Low";

        // Find all decimals (e.g. 10.45 or 1,250.00)
        List<BigDecimal> allAmounts = new ArrayList<>();
        Pattern amountPattern = Pattern.compile("\\b\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{2})\\b");
        Matcher amountMatcher = amountPattern.matcher(text);
        while (amountMatcher.find()) {
            try {
                String match = amountMatcher.group().replace(",", ""); // clean commas
                BigDecimal val = new BigDecimal(match);
                if (val.compareTo(BigDecimal.ZERO) > 0 && val.toString().length() < 9) { // ignore overly large numbers (phone/card numbers)
                    allAmounts.add(val);
                }
            } catch (Exception ignored) {
            }
        }

        // Look for lines containing "total" or similar
        String[] lines = text.split("\\r?\\n");
        BigDecimal totalCandidate = null;
        BigDecimal taxCandidate = null;

        // Keywords
        Pattern totalLinePattern = Pattern.compile("(?i)\\b(total|net total|grand total|to pay|due|amount paid|payment|total amount|netto)\\b");
        Pattern taxLinePattern = Pattern.compile("(?i)\\b(tax|vat|gst|cgst|sgst|service tax|sales tax|mwst|iva)\\b");

        for (String line : lines) {
            Matcher totalLineMatcher = totalLinePattern.matcher(line);
            if (totalLineMatcher.find()) {
                // Find decimals in this line
                Matcher decimalMatcher = amountPattern.matcher(line);
                BigDecimal lastDecimalInLine = null;
                while (decimalMatcher.find()) {
                    try {
                        String match = decimalMatcher.group().replace(",", "");
                        lastDecimalInLine = new BigDecimal(match);
                    } catch (Exception ignored) {}
                }
                if (lastDecimalInLine != null) {
                    totalCandidate = lastDecimalInLine;
                    result.confidenceTotal = "High";
                }
            }

            Matcher taxLineMatcher = taxLinePattern.matcher(line);
            if (taxLineMatcher.find()) {
                Matcher decimalMatcher = amountPattern.matcher(line);
                BigDecimal firstDecimalInLine = null;
                if (decimalMatcher.find()) {
                    try {
                        String match = decimalMatcher.group().replace(",", "");
                        firstDecimalInLine = new BigDecimal(match);
                    } catch (Exception ignored) {}
                }
                if (firstDecimalInLine != null) {
                    taxCandidate = firstDecimalInLine;
                }
            }
        }

        // Fallbacks
        if (totalCandidate == null && !allAmounts.isEmpty()) {
            // Take the maximum amount found as total candidate
            totalCandidate = Collections.max(allAmounts);
            result.confidenceTotal = "Medium";
        }

        if (totalCandidate != null) {
            result.total = totalCandidate;
        }

        if (taxCandidate != null) {
            result.tax = taxCandidate;
        } else if (totalCandidate != null && !allAmounts.isEmpty()) {
            // Find a value smaller than total, which could be tax
            BigDecimal taxVal = BigDecimal.ZERO;
            for (BigDecimal amt : allAmounts) {
                if (amt.compareTo(totalCandidate) < 0 && amt.compareTo(taxVal) > 0) {
                    // tax is typically small, let's say less than 30% of total
                    BigDecimal thirtyPercent = totalCandidate.multiply(new BigDecimal("0.30"));
                    if (amt.compareTo(thirtyPercent) <= 0) {
                        taxVal = amt;
                    }
                }
            }
            result.tax = taxVal;
        }

        return result;
    }

    private ParsedDate parseDate(String text) {
        ParsedDate result = new ParsedDate();
        result.date = LocalDate.now();
        result.confidence = "Low";

        // Regex patterns
        Pattern yyyymmdd = Pattern.compile("\\b(\\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\\d|3[01])\\b");
        Pattern ddmmyyyyOrMmddyyyy = Pattern.compile("\\b(0?[1-9]|[12]\\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\\d{2}|\\d{2})\\b");
        Pattern verbalDate = Pattern.compile("(?i)\\b(0?[1-9]|[12]\\d|3[01])[-/\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\\s](20\\d{2}|\\d{2})\\b");

        Matcher m;

        // 1. Try verbal date first (e.g. 12 Jan 2026)
        m = verbalDate.matcher(text);
        if (m.find()) {
            try {
                String day = String.format("%02d", Integer.parseInt(m.group(1)));
                String monthStr = m.group(2).substring(0, 3);
                String yearStr = m.group(3);
                if (yearStr.length() == 2) yearStr = "20" + yearStr;

                String dateStr = day + "-" + monthStr + "-" + yearStr;
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
                result.date = LocalDate.parse(dateStr, formatter);
                result.confidence = "High";
                return result;
            } catch (Exception ignored) {}
        }

        // 2. Try YYYY-MM-DD
        m = yyyymmdd.matcher(text);
        if (m.find()) {
            try {
                int year = Integer.parseInt(m.group(1));
                int month = Integer.parseInt(m.group(2));
                int day = Integer.parseInt(m.group(3));
                result.date = LocalDate.of(year, month, day);
                result.confidence = "High";
                return result;
            } catch (Exception ignored) {}
        }

        // 3. Try DD/MM/YYYY or MM/DD/YYYY
        m = ddmmyyyyOrMmddyyyy.matcher(text);
        if (m.find()) {
            try {
                int part1 = Integer.parseInt(m.group(1));
                int part2 = Integer.parseInt(m.group(2));
                String yearStr = m.group(3);
                int year = Integer.parseInt(yearStr.length() == 2 ? "20" + yearStr : yearStr);

                // Disambiguate parts (defaulting to DD/MM/YYYY)
                if (part2 > 12) {
                    // MM/DD/YYYY format
                    result.date = LocalDate.of(year, part1, part2);
                } else {
                    // Assume DD/MM/YYYY
                    result.date = LocalDate.of(year, part2, part1);
                }
                result.confidence = "High";
                return result;
            } catch (Exception ignored) {}
        }

        return result;
    }

    private ParsedMerchant parseMerchant(String text) {
        ParsedMerchant result = new ParsedMerchant();
        result.name = "Unknown Merchant";
        result.confidence = "Low";

        String[] lines = text.split("\\r?\\n");
        List<String> cleanLines = new ArrayList<>();
        for (String line : lines) {
            String clean = line.trim().replaceAll("\\s+", " ");
            // Skip empty, numbers-only, emails, URLs, or long address-like lines
            if (!clean.isEmpty() 
                    && !clean.matches("^[\\d\\W\\s]+$") 
                    && !clean.contains("@") 
                    && !clean.toLowerCase().contains("http")
                    && !clean.toLowerCase().contains("www.")
                    && clean.length() < 50) {
                cleanLines.add(clean);
            }
        }

        if (cleanLines.isEmpty()) {
            return result;
        }

        // Heuristic: Examine top few lines for merchant keywords
        int linesToExamine = Math.min(cleanLines.size(), 4);
        Pattern merchantPattern = Pattern.compile("(?i)\\b(mart|store|shop|cafe|restaurant|bistro|piazza|market|ltd|inc|corp|co|station|pharmacy|medical|grocery|supermarket|gas|petrol)\\b");
        
        for (int i = 0; i < linesToExamine; i++) {
            String line = cleanLines.get(i);
            if (merchantPattern.matcher(line).find()) {
                result.name = line;
                result.confidence = "High";
                return result;
            }
        }

        // Fallback to the very first valid cleaned text line
        result.name = cleanLines.get(0);
        result.confidence = "Medium";
        return result;
    }

    private ParsedCategory suggestCategory(String text, String merchantName) {
        ParsedCategory result = new ParsedCategory();
        result.category = "Other";
        result.confidence = "Low";

        Map<String, List<String>> categoryKeywords = new HashMap<>();
        categoryKeywords.put("Food", Arrays.asList("restaurant", "cafe", "mcdonald", "starbucks", "pizza", "burger", "food", "dining", "eats", "grill", "bakery", "canteen", "kitchen", "diner", "kfc", "subway", "coffee", "snack", "bites", "nando", "pub", "bar"));
        categoryKeywords.put("Travel", Arrays.asList("petrol", "gas", "fuel", "diesel", "pump", "uber", "olacabs", "cab", "taxi", "transport", "subway", "metro", "train", "bus", "flight", "airline", "toll", "parking", "rent-a-car", "station", "railway", "commute", "ticket"));
        categoryKeywords.put("Shopping", Arrays.asList("amazon", "clothing", "apparel", "shoes", "fashion", "mall", "boutique", "electronic", "gift", "online", "walmart", "target", "costco", "ebay", "superstore", "myntra", "flipkart", "grocery", "supermarket"));
        categoryKeywords.put("Bills", Arrays.asList("electric", "water", "power", "gas company", "internet", "wifi", "broadband", "mobile", "telecom", "phone bill", "utility", "insurance", "rent", "bill", "invoice", "telephony"));
        categoryKeywords.put("Entertainment", Arrays.asList("netflix", "spotify", "movie", "cinema", "theater", "game", "ticket", "concert", "show", "club", "playstation", "xbox", "steam", "arcade"));
        categoryKeywords.put("Health", Arrays.asList("pharmacy", "medical", "health", "clinic", "hospital", "drug", "chemist", "doctor", "medicine", "prescription", "dental", "vision", "care", "apotheke"));
        categoryKeywords.put("Education", Arrays.asList("tuition", "course", "book", "school", "college", "university", "training", "class", "udemy", "coursera", "stationery", "exam", "fees"));
        categoryKeywords.put("Investment", Arrays.asList("stock", "mutual fund", "crypto", "investment", "gold", "shares", "equity", "bonds"));
        categoryKeywords.put("Salary", Arrays.asList("salary", "payroll", "wage", "income"));
        categoryKeywords.put("Freelancing", Arrays.asList("freelance", "upwork", "fiverr", "contract", "project"));

        String textToSearch = (merchantName + " " + text).toLowerCase();
        
        String bestCategory = "Other";
        int maxMatches = 0;

        for (Map.Entry<String, List<String>> entry : categoryKeywords.entrySet()) {
            int matches = 0;
            for (String keyword : entry.getValue()) {
                if (textToSearch.contains(keyword)) {
                    matches++;
                }
            }
            if (matches > maxMatches) {
                maxMatches = matches;
                bestCategory = entry.getKey();
            }
        }

        result.category = bestCategory;
        if (maxMatches > 1) {
            result.confidence = "High";
        } else if (maxMatches == 1) {
            result.confidence = "Medium";
        } else {
            result.confidence = "Low";
        }

        return result;
    }

    private static class ParsedAmounts {
        BigDecimal total;
        BigDecimal tax;
        String confidenceTotal;
    }

    private static class ParsedDate {
        LocalDate date;
        String confidence;
    }

    private static class ParsedMerchant {
        String name;
        String confidence;
    }

    private static class ParsedCategory {
        String category;
        String confidence;
    }
}
