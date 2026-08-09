package com.expensetracker.service;

import com.expensetracker.dto.response.DashboardResponse;

public interface DashboardService {

    DashboardResponse getDashboardData(Long userId);
}