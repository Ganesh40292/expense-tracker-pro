package com.expensetracker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {

        return new OpenAPI()
                .info(
                        new Info()
                                .title("Expense Tracker API")
                                .version("1.0")
                                .description(
                                        "REST API documentation for Expense Tracker Application"
                                )
                                .contact(
                                        new Contact()
                                                .name("Expense Tracker Team")
                                                .email("support@expensetracker.com")
                                )
                );
    }
}