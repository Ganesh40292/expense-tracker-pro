package com.expensetracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.expensetracker.dto.request.TransactionRequest;
import com.expensetracker.dto.response.TransactionResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.ReceiptRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.impl.TransactionServiceImpl;
import com.expensetracker.util.TestDataFactory;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReceiptRepository receiptRepository;

    @Mock
    private ExchangeRateService exchangeRateService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private User testUser;
    private Category testCategory;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createTestUser();
        testCategory = TestDataFactory.createTestCategory(testUser);
        testTransaction = TestDataFactory.createTestTransaction(testUser, testCategory);

        // Setup Security Context Mock
        UserPrincipal principal = new UserPrincipal(testUser);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockCurrentUser() {
        UserPrincipal principal = new UserPrincipal(testUser);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
    }

    @Test
    void addTransaction_Success() {
        mockCurrentUser();

        TransactionRequest request = new TransactionRequest();
        request.setAmount(new BigDecimal("500.00"));
        request.setCurrency("INR");
        request.setType("EXPENSE");
        request.setTitle("Groceries");
        request.setTransactionDate(LocalDate.now());

        when(exchangeRateService.getBaseAmount(any(BigDecimal.class), any(String.class)))
                .thenReturn(new BigDecimal("500.00"));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(testTransaction);

        TransactionResponse response = transactionService.addTransaction(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("500.00"), response.getAmount());
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void getAllTransactions_Success() {
        mockCurrentUser();

        when(transactionRepository.findByUserId(testUser.getId())).thenReturn(List.of(testTransaction));

        List<TransactionResponse> responses = transactionService.getAllTransactions();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(testTransaction.getId(), responses.get(0).getId());
    }

    @Test
    void getTransactionById_Success() {
        mockCurrentUser();

        when(transactionRepository.findById(1L)).thenReturn(Optional.of(testTransaction));

        TransactionResponse response = transactionService.getTransactionById(1L);

        assertNotNull(response);
        assertEquals(testTransaction.getId(), response.getId());
    }

    @Test
    void getTransactionById_NotFound() {
        mockCurrentUser();

        when(transactionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            transactionService.getTransactionById(99L);
        });
    }

    @Test
    void deleteTransaction_Success() {
        mockCurrentUser();

        when(transactionRepository.findById(1L)).thenReturn(Optional.of(testTransaction));

        transactionService.deleteTransaction(1L);

        verify(transactionRepository).delete(testTransaction);
    }
}
