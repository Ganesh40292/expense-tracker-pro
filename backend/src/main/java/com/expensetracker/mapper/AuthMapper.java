package com.expensetracker.mapper;

import com.expensetracker.dto.request.RegisterRequest;
import com.expensetracker.entity.User;

public class AuthMapper {

    public static User mapToUserEntity(
            RegisterRequest request) {

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());

        return user;
    }
}