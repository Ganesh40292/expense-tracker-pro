package com.expensetracker.util;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtil {

    public static ResponseEntity<Map<String, Object>>
    successResponse(String message, Object data) {

        Map<String, Object> response =
                new HashMap<>();

        response.put("timestamp",
                LocalDateTime.now());

        response.put("success", true);

        response.put("message", message);

        response.put("data", data);

        return new ResponseEntity<>(
                response,
                HttpStatus.OK
        );
    }

    public static ResponseEntity<Map<String, Object>>
    errorResponse(String message) {

        Map<String, Object> response =
                new HashMap<>();

        response.put("timestamp",
                LocalDateTime.now());

        response.put("success", false);

        response.put("message", message);

        return new ResponseEntity<>(
                response,
                HttpStatus.BAD_REQUEST
        );
    }
}