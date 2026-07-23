package com.expensetracker.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.expensetracker.dto.request.TransactionRequest;
import com.expensetracker.dto.response.TransactionResponse;
import com.expensetracker.entity.Receipt;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.TransactionMapper;
import com.expensetracker.repository.ReceiptRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.ExchangeRateService;
import com.expensetracker.service.TransactionService;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

@Service
public class TransactionServiceImpl
        implements TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private ExchangeRateService exchangeRateService;

    private User getCurrentUser() {
        Authentication auth =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        UserPrincipal principal =
                (UserPrincipal) auth.getPrincipal();

        return userRepository.findByEmail(
                        principal.getUsername()
                )
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "User not found"
                        ));
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public TransactionResponse addTransaction(
            TransactionRequest request) {

        User currentUser = getCurrentUser();

        Transaction transaction =
                TransactionMapper.mapToTransactionEntity(
                        request
                );

        transaction.setUser(currentUser);
        
        if (request.getReceiptId() != null) {
            Receipt receipt = receiptRepository.findByIdAndUserId(request.getReceiptId(), currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
            transaction.setReceipt(receipt);
        }

        // Calculate base amount for unified aggregations
        transaction.setBaseAmount(exchangeRateService.getBaseAmount(
                transaction.getAmount(), 
                transaction.getCurrency()
        ));

        transactionRepository.save(transaction);

        return TransactionMapper
                .mapToTransactionResponse(transaction);
    }

    @Override
    public List<TransactionResponse> getAllTransactions() {

        User currentUser = getCurrentUser();

        return transactionRepository
                .findByUserIdAndIsDeletedFalse(currentUser.getId())
                .stream()
                .map(TransactionMapper::mapToTransactionResponse)
                .toList();
    }

    @Override
    public List<TransactionResponse> getTrashTransactions() {

        User currentUser = getCurrentUser();

        return transactionRepository
                .findByUserIdAndIsDeletedTrue(currentUser.getId())
                .stream()
                .map(TransactionMapper::mapToTransactionResponse)
                .toList();
    }

    @Override
    public TransactionResponse getTransactionById(Long id) {

        User currentUser = getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        return TransactionMapper.mapToTransactionResponse(transaction);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public TransactionResponse updateTransaction(
            Long id,
            TransactionRequest request) {

        User currentUser = getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        transaction.setTitle(request.getTitle());
        transaction.setAmount(request.getAmount());
        if (request.getCurrency() != null) {
            transaction.setCurrency(request.getCurrency());
        }
        
        transaction.setBaseAmount(exchangeRateService.getBaseAmount(
                transaction.getAmount(), 
                transaction.getCurrency()
        ));

        transaction.setType(com.expensetracker.enums.TransactionType.valueOf(request.getType()));
        transaction.setCategory(request.getCategory());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());

        if (request.getReceiptId() != null) {
            Receipt receipt = receiptRepository.findByIdAndUserId(request.getReceiptId(), currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
            transaction.setReceipt(receipt);
        } else {
            transaction.setReceipt(null);
        }

        transactionRepository.save(transaction);

        return TransactionMapper.mapToTransactionResponse(transaction);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public void deleteTransaction(Long id) {

        User currentUser = getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        // Soft delete
        transaction.setIsDeleted(true);
        transaction.setDeletedAt(java.time.LocalDateTime.now());
        transactionRepository.save(transaction);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public TransactionResponse restoreTransaction(Long id) {

        User currentUser = getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        transaction.setIsDeleted(false);
        transaction.setDeletedAt(null);
        transactionRepository.save(transaction);

        return TransactionMapper.mapToTransactionResponse(transaction);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public void permanentDeleteTransaction(Long id) {

        User currentUser = getCurrentUser();

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        transactionRepository.delete(transaction);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "dashboardCache", allEntries = true),
        @CacheEvict(value = "monthlyReportCache", allEntries = true),
        @CacheEvict(value = "expenseSummaryCache", allEntries = true),
        @CacheEvict(value = "aiIntelligenceCache", allEntries = true)
    })
    public List<TransactionResponse> importTransactionsFromCsv(org.springframework.web.multipart.MultipartFile file) {
        User currentUser = getCurrentUser();
        List<Transaction> importedList = new java.util.ArrayList<>();

        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                if (firstLine && (line.toLowerCase().contains("title") || line.toLowerCase().contains("amount"))) {
                    firstLine = false;
                    continue;
                }
                firstLine = false;

                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                if (columns.length < 3) continue;

                String title = columns[0].replace("\"", "").trim();
                java.math.BigDecimal amount = new java.math.BigDecimal(columns[1].replace("\"", "").replace("$", "").trim());
                String typeStr = columns[2].replace("\"", "").trim().toUpperCase();
                com.expensetracker.enums.TransactionType type = typeStr.startsWith("INC") ? 
                        com.expensetracker.enums.TransactionType.INCOME : com.expensetracker.enums.TransactionType.EXPENSE;
                
                String category = columns.length > 3 ? columns[3].replace("\"", "").trim() : "General";
                java.time.LocalDate date = java.time.LocalDate.now();
                if (columns.length > 4) {
                    try {
                        date = java.time.LocalDate.parse(columns[4].replace("\"", "").trim());
                    } catch (Exception e) {
                        date = java.time.LocalDate.now();
                    }
                }
                String desc = columns.length > 5 ? columns[5].replace("\"", "").trim() : "";

                Transaction transaction = new Transaction();
                transaction.setTitle(title);
                transaction.setAmount(amount);
                transaction.setType(type);
                transaction.setCategory(category);
                transaction.setTransactionDate(date);
                transaction.setDescription(desc);
                transaction.setCurrency(currentUser.getDefaultCurrency() != null ? currentUser.getDefaultCurrency() : "INR");
                transaction.setBaseAmount(exchangeRateService.getBaseAmount(amount, transaction.getCurrency()));
                transaction.setUser(currentUser);

                importedList.add(transaction);
            }
            if (!importedList.isEmpty()) {
                transactionRepository.saveAll(importedList);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage(), e);
        }

        return importedList.stream().map(TransactionMapper::mapToTransactionResponse).toList();
    }

    @Override
    public byte[] exportTransactionsToCsv() {
        User currentUser = getCurrentUser();
        List<Transaction> list = transactionRepository.findByUserIdAndIsDeletedFalse(currentUser.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("ID,Title,Amount,Currency,Type,Category,Transaction Date,Description,Status\n");

        for (Transaction t : list) {
            sb.append(t.getId()).append(",")
              .append("\"").append(t.getTitle().replace("\"", "\"\"")).append("\",")
              .append(t.getAmount()).append(",")
              .append(t.getCurrency()).append(",")
              .append(t.getType()).append(",")
              .append("\"").append(t.getCategory().replace("\"", "\"\"")).append("\",")
              .append(t.getTransactionDate()).append(",")
              .append("\"").append(t.getDescription() != null ? t.getDescription().replace("\"", "\"\"") : "").append("\",")
              .append(t.getStatus()).append("\n");
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}