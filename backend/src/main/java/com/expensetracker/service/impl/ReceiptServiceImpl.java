package com.expensetracker.service.impl;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.expensetracker.dto.response.ReceiptResponse;
import com.expensetracker.entity.Receipt;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.ReceiptMapper;
import com.expensetracker.repository.ReceiptRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.ReceiptService;

@Service
public class ReceiptServiceImpl implements ReceiptService {

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private final Path fileStorageLocation = Paths.get("uploads/receipts").toAbsolutePath().normalize();

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("User not authenticated");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    @Override
    public ReceiptResponse uploadReceipt(MultipartFile file) {
        User currentUser = getCurrentUser();

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isEmpty()) {
            throw new BadRequestException("Invalid file name");
        }

        String cleanFileName = StringUtils.cleanPath(originalFileName);
        String extension = "";
        int dotIndex = cleanFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = cleanFileName.substring(dotIndex + 1).toLowerCase();
        }

        if (!Arrays.asList("jpg", "jpeg", "png", "webp", "pdf").contains(extension)) {
            throw new BadRequestException("Only JPG, JPEG, PNG, WEBP, and PDF files are allowed");
        }

        // Generate unique filename to prevent overwrites
        String fileName = UUID.randomUUID().toString() + "." + extension;
        Path targetLocation = this.fileStorageLocation.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }

        Receipt receipt = new Receipt();
        receipt.setFileName(fileName);
        receipt.setOriginalFileName(originalFileName);
        receipt.setFilePath(targetLocation.toString());
        receipt.setFileSize(file.getSize());
        receipt.setContentType(file.getContentType());
        receipt.setUser(currentUser);

        receipt = receiptRepository.save(receipt);

        return ReceiptMapper.mapToReceiptResponse(receipt);
    }

    @Override
    public List<ReceiptResponse> getAllReceipts() {
        User currentUser = getCurrentUser();
        return receiptRepository.findByUserId(currentUser.getId())
                .stream()
                .map(ReceiptMapper::mapToReceiptResponse)
                .toList();
    }

    @Override
    public ReceiptResponse getReceiptById(Long id) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        return ReceiptMapper.mapToReceiptResponse(receipt);
    }

    @Override
    public Resource getReceiptImage(Long id) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));

        try {
            Path filePath = Paths.get(receipt.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Receipt file not found on disk");
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Receipt file path is malformed");
        }
    }

    @Override
    public void deleteReceipt(Long id) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));

        // Unlink associated transaction
        Transaction transaction = transactionRepository.findByReceiptId(id).orElse(null);
        if (transaction != null) {
            transaction.setReceipt(null);
            transactionRepository.save(transaction);
        }

        // Delete file from disk
        try {
            Path filePath = Paths.get(receipt.getFilePath()).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            System.err.println("Could not delete physical file: " + receipt.getFilePath());
        }

        receiptRepository.delete(receipt);
    }

    @Override
    public ReceiptResponse linkReceipt(Long id, Long transactionId) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        // Link
        transaction.setReceipt(receipt);
        transactionRepository.save(transaction);

        return ReceiptMapper.mapToReceiptResponse(receipt);
    }

    @Override
    public ReceiptResponse unlinkReceipt(Long id) {
        User currentUser = getCurrentUser();
        Receipt receipt = receiptRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));

        Transaction transaction = transactionRepository.findByReceiptId(id).orElse(null);
        if (transaction != null) {
            transaction.setReceipt(null);
            transactionRepository.save(transaction);
        }

        return ReceiptMapper.mapToReceiptResponse(receipt);
    }
}
