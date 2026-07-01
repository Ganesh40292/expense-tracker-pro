package com.expensetracker.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.expensetracker.entity.EmailPreference;
import com.expensetracker.entity.User;
import java.util.Optional;

@Repository
public interface EmailPreferenceRepository extends JpaRepository<EmailPreference, Long> {
    Optional<EmailPreference> findByUser(User user);
}
