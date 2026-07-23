package com.expensetracker.controller;

import com.expensetracker.dto.request.TransactionRequest;
import com.expensetracker.dto.response.TransactionResponse;
import com.expensetracker.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> addTransaction(
            @Valid @RequestBody TransactionRequest request) {

        TransactionResponse response = transactionService.addTransaction(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {

        List<TransactionResponse> response = transactionService.getAllTransactions();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransactionById(
            @PathVariable Long id) {

        TransactionResponse response = transactionService.getTransactionById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {

        TransactionResponse response = transactionService.updateTransaction(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok("Transaction moved to trash");
    }

    @GetMapping("/trash")
    public ResponseEntity<List<TransactionResponse>> getTrashTransactions() {
        List<TransactionResponse> response = transactionService.getTrashTransactions();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<TransactionResponse> restoreTransaction(@PathVariable Long id) {
        TransactionResponse response = transactionService.restoreTransaction(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<String> permanentDeleteTransaction(@PathVariable Long id) {
        transactionService.permanentDeleteTransaction(id);
        return ResponseEntity.ok("Transaction permanently deleted");
    }

    @PostMapping("/import")
    public ResponseEntity<List<TransactionResponse>> importTransactions(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        List<TransactionResponse> response = transactionService.importTransactionsFromCsv(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportTransactionsCsv() {
        byte[] csvData = transactionService.exportTransactionsToCsv();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment().filename("transactions.csv").build());
        return new ResponseEntity<>(csvData, headers, org.springframework.http.HttpStatus.OK);
    }
}