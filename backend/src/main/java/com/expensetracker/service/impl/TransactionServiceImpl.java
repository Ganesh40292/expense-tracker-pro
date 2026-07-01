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
                .findByUserId(currentUser.getId())
                .stream()
                .map(TransactionMapper::
                        mapToTransactionResponse)
                .toList();
    }

    @Override
    public TransactionResponse getTransactionById(
            Long id) {

        User currentUser = getCurrentUser();

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transaction not found"
                                ));

        if (!transaction.getUser().getId()
                .equals(currentUser.getId())) {
            throw new UnauthorizedException(
                    "Access denied"
            );
        }

        return TransactionMapper
                .mapToTransactionResponse(transaction);
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

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transaction not found"
                                ));

        if (!transaction.getUser().getId()
                .equals(currentUser.getId())) {
            throw new UnauthorizedException(
                    "Access denied"
            );
        }

        transaction.setTitle(request.getTitle());
        transaction.setAmount(request.getAmount());
        if (request.getCurrency() != null) {
            transaction.setCurrency(request.getCurrency());
        }
        
        // Recalculate base amount on update
        transaction.setBaseAmount(exchangeRateService.getBaseAmount(
                transaction.getAmount(), 
                transaction.getCurrency()
        ));

        transaction.setType(com.expensetracker.enums.TransactionType.valueOf(request.getType()));
        transaction.setCategory(request.getCategory());
        transaction.setTransactionDate(
                request.getTransactionDate()
        );
        transaction.setDescription(
                request.getDescription()
        );

        if (request.getReceiptId() != null) {
            Receipt receipt = receiptRepository.findByIdAndUserId(request.getReceiptId(), currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
            transaction.setReceipt(receipt);
        } else {
            transaction.setReceipt(null);
        }

        transactionRepository.save(transaction);

        return TransactionMapper
                .mapToTransactionResponse(transaction);
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

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transaction not found"
                                ));

        if (!transaction.getUser().getId()
                .equals(currentUser.getId())) {
            throw new UnauthorizedException(
                    "Access denied"
            );
        }

        transactionRepository.delete(transaction);
    }
}