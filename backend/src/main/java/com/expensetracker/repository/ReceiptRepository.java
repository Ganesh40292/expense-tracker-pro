package com.expensetracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.expensetracker.entity.Receipt;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    List<Receipt> findByUserId(Long userId);
    Optional<Receipt> findByIdAndUserId(Long id, Long userId);
}
