package com.expensetracker.service.impl;

import com.expensetracker.entity.SystemSetting;
import com.expensetracker.repository.SystemSettingRepository;
import com.expensetracker.service.SystemSettingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    private static final Logger log = LoggerFactory.getLogger(SystemSettingServiceImpl.class);

    @Autowired
    private SystemSettingRepository repository;

    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initDefaultSettings() {
        log.info("Initializing default system settings...");

        Map<String, String[]> defaults = new HashMap<>();
        defaults.put("security.login.max-attempts", new String[]{"5", "Maximum failed login attempts before lockout"});
        defaults.put("security.login.lockout-duration-minutes", new String[]{"15", "Duration in minutes for account lockout"});
        defaults.put("app.maintenance-mode", new String[]{"false", "Flag to set the system in read-only maintenance mode"});
        defaults.put("jwt.access-expiration", new String[]{"900000", "Access token expiration duration in milliseconds (15 min)"});
        defaults.put("jwt.refresh-expiration", new String[]{"604800000", "Refresh token expiration duration in milliseconds (7 days)"});

        for (Map.Entry<String, String[]> entry : defaults.entrySet()) {
            if (!repository.existsById(entry.getKey())) {
                repository.save(new SystemSetting(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
                log.info("Created system setting: {} = {}", entry.getKey(), entry.getValue()[0]);
            }
        }

        // Load all settings into memory cache
        loadCache();
    }

    private void loadCache() {
        cache.clear();
        repository.findAll().forEach(setting -> {
            if (setting.getValue() != null) {
                cache.put(setting.getKey(), setting.getValue());
            }
        });
    }

    @Override
    public String getSetting(String key, String defaultValue) {
        return cache.getOrDefault(key, defaultValue);
    }

    @Override
    public int getSettingAsInt(String key, int defaultValue) {
        String val = getSetting(key, null);
        if (val == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Override
    public boolean getSettingAsBoolean(String key, boolean defaultValue) {
        String val = getSetting(key, null);
        if (val == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(val);
    }

    @Override
    @Transactional
    public void updateSettings(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SystemSetting setting = repository.findById(entry.getKey())
                    .orElse(new SystemSetting(entry.getKey(), entry.getValue(), "Custom Setting"));
            setting.setValue(entry.getValue());
            repository.save(setting);
        }
        loadCache();
        log.info("System settings updated successfully.");
    }

    @Override
    public List<SystemSetting> getAllSettings() {
        return repository.findAll();
    }
}
