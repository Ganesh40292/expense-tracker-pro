package com.expensetracker.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.expensetracker.entity.AuditLog;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    List<AuditLog> findByAction(String action);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AuditLog a WHERE " +
           "(:search IS NULL OR LOWER(a.details) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR (a.userId IS NOT NULL AND a.userId IN (SELECT u.id FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))))) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "AND (:startDate IS NULL OR a.timestamp >= :startDate) " +
           "AND (:endDate IS NULL OR a.timestamp <= :endDate)")
    org.springframework.data.domain.Page<AuditLog> searchAuditLogs(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate,
            org.springframework.data.domain.Pageable pageable
    );
}
