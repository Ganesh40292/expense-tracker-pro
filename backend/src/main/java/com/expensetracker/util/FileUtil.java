package com.expensetracker.util;

import java.io.File;

public class FileUtil {

    public static boolean deleteFile(
            String filePath) {

        File file = new File(filePath);

        return file.exists() && file.delete();
    }

    public static boolean fileExists(
            String filePath) {

        File file = new File(filePath);

        return file.exists();
    }
}