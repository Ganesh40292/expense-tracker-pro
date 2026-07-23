package com.expensetracker.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AskAiRequest {
    @NotBlank(message = "Prompt cannot be blank")
    private String prompt;

    public AskAiRequest() {}

    public AskAiRequest(String prompt) {
        this.prompt = prompt;
    }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
}
