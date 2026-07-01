package com.expensetracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute force protection service.
 * Tracks failed login attempts per email and applies progressive lockouts.
 */
@Service
public class LoginAttemptService {

    @Value("${security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${security.login.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    private final ConcurrentHashMap<String, AttemptRecord> attemptsCache =
            new ConcurrentHashMap<>();

    public void loginSucceeded(String email) {
        attemptsCache.remove(email);
    }

    public void loginFailed(String email) {
        AttemptRecord record = attemptsCache.computeIfAbsent(
                email, k -> new AttemptRecord()
        );

        record.incrementAttempts();

        if (record.getAttempts() >= maxAttempts) {
            // Progressive lockout: doubles on consecutive lockouts
            int multiplier = record.getLockoutCount() + 1;
            int lockoutMinutes = lockoutDurationMinutes * multiplier;

            record.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
            record.incrementLockoutCount();
        }
    }

    public boolean isBlocked(String email) {
        AttemptRecord record = attemptsCache.get(email);

        if (record == null) {
            return false;
        }

        if (record.getLockedUntil() == null) {
            return false;
        }

        if (record.getLockedUntil().isAfter(LocalDateTime.now())) {
            return true;
        }

        // Lockout expired — reset attempts but keep lockout count
        // (for progressive delays on repeat offenders)
        record.setAttempts(0);
        record.setLockedUntil(null);
        return false;
    }

    /**
     * Internal record for tracking login attempts.
     */
    private static class AttemptRecord {
        private int attempts;
        private LocalDateTime lockedUntil;
        private int lockoutCount;

        public int getAttempts() {
            return attempts;
        }

        public void setAttempts(int attempts) {
            this.attempts = attempts;
        }

        public void incrementAttempts() {
            this.attempts++;
        }

        public LocalDateTime getLockedUntil() {
            return lockedUntil;
        }

        public void setLockedUntil(LocalDateTime lockedUntil) {
            this.lockedUntil = lockedUntil;
        }

        public int getLockoutCount() {
            return lockoutCount;
        }

        public void incrementLockoutCount() {
            this.lockoutCount++;
        }
    }
}
