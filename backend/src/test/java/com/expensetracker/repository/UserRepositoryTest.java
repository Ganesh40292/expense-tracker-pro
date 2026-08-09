package com.expensetracker.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.expensetracker.entity.User;
import com.expensetracker.enums.UserRole;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveUser() {
        User user = new User();
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setPassword("password");
        user.setRole(UserRole.USER);

        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getId());
        assertEquals("john@example.com", savedUser.getEmail());
    }

    @Test
    void testFindByEmail_Success() {
        User user = new User();
        user.setName("Jane Doe");
        user.setEmail("jane@example.com");
        user.setPassword("password");
        user.setRole(UserRole.USER);
        userRepository.save(user);

        Optional<User> foundUser = userRepository.findByEmail("jane@example.com");

        assertTrue(foundUser.isPresent());
        assertEquals("Jane Doe", foundUser.get().getName());
    }

    @Test
    void testFindByEmail_NotFound() {
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");

        assertFalse(foundUser.isPresent());
    }

    @Test
    void testExistsByEmail() {
        User user = new User();
        user.setName("Alice");
        user.setEmail("alice@example.com");
        user.setPassword("password");
        user.setRole(UserRole.USER);
        userRepository.save(user);

        assertTrue(userRepository.existsByEmail("alice@example.com"));
        assertFalse(userRepository.existsByEmail("bob@example.com"));
    }
}
