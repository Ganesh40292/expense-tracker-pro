package com.expensetracker.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
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

import com.expensetracker.dto.response.AiIntelligenceResponse;
import com.expensetracker.entity.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.GoalRepository;
import com.expensetracker.repository.RecurringExpenseRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.impl.AiIntelligenceServiceImpl;
import com.expensetracker.util.TestDataFactory;

@ExtendWith(MockitoExtension.class)
class AiIntelligenceServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private RecurringExpenseRepository recurringExpenseRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AiIntelligenceServiceImpl aiIntelligenceService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createTestUser();

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
    void testGetAiIntelligence_EmptyData() {
        mockCurrentUser();

        when(transactionRepository.findByUserId(testUser.getId())).thenReturn(new ArrayList<>());
        when(budgetRepository.findByUserId(testUser.getId())).thenReturn(new ArrayList<>());
        when(recurringExpenseRepository.findByUserId(testUser.getId())).thenReturn(new ArrayList<>());

        AiIntelligenceResponse response = aiIntelligenceService.getAiIntelligence();

        assertNotNull(response);
        assertNotNull(response.getPredictions());
        assertNotNull(response.getAnomalies());
        assertNotNull(response.getHealthScore());
    }

    @Test
    void testGetAiIntelligence_WithData() {
        mockCurrentUser();

        // Testing the AI engine without crashing when data is present
        when(transactionRepository.findByUserId(testUser.getId())).thenReturn(
                List.of(TestDataFactory.createTestTransaction(testUser, TestDataFactory.createTestCategory(testUser)))
        );
        when(budgetRepository.findByUserId(testUser.getId())).thenReturn(new ArrayList<>());
        when(recurringExpenseRepository.findByUserId(testUser.getId())).thenReturn(new ArrayList<>());

        AiIntelligenceResponse response = aiIntelligenceService.getAiIntelligence();

        assertNotNull(response);
        assertNotNull(response.getHealthScore());
    }
}
