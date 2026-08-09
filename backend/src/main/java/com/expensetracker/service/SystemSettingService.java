package com.expensetracker.service;

import com.expensetracker.entity.SystemSetting;
import java.util.List;
import java.util.Map;

public interface SystemSettingService {
    String getSetting(String key, String defaultValue);
    int getSettingAsInt(String key, int defaultValue);
    boolean getSettingAsBoolean(String key, boolean defaultValue);
    void updateSettings(Map<String, String> settings);
    List<SystemSetting> getAllSettings();
}
