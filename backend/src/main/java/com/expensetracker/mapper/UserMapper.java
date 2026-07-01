package com.expensetracker.mapper;

import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.User;

public class UserMapper {

    public static UserResponse mapToUserResponse(User user) {

        UserResponse response = new UserResponse();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setDefaultCurrency(user.getDefaultCurrency());
        response.setMonthlyIncome(user.getMonthlyIncome());

        return response;
    }
}