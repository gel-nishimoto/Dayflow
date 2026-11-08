-- Dayflow Complete Database Schema
-- Compatible with MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS dayflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dayflow_db;

-- 1. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NULL,
    deadline DATE NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('pending', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    reminder TINYINT(1) NOT NULL DEFAULT 0,
    reminder_minutes INT NOT NULL DEFAULT 15,
    reminder_ref ENUM('time', 'deadline') NOT NULL DEFAULT 'time',
    location_name VARCHAR(255) NULL,
    location_address TEXT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    photos JSON NULL,
    videos JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    group_name ENUM('Academic', 'Personal') NOT NULL DEFAULT 'Personal',
    icon VARCHAR(100) NOT NULL DEFAULT 'pricetag-outline',
    color VARCHAR(20) NOT NULL DEFAULT '#3979D8',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('upcoming', 'deadline', 'overdue') NOT NULL DEFAULT 'upcoming',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    time VARCHAR(100) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USERS & AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL DEFAULT 'Student User',
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL DEFAULT '',
    school VARCHAR(150) NOT NULL DEFAULT '',
    daily_reminder TINYINT(1) NOT NULL DEFAULT 1,
    sound_alerts TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. USER PROFILE TABLE (Backward Compatibility)
CREATE TABLE IF NOT EXISTS user_profile (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(150) NOT NULL DEFAULT 'User',
    email VARCHAR(150) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    school VARCHAR(150) NOT NULL DEFAULT '',
    daily_reminder TINYINT(1) NOT NULL DEFAULT 1,
    sound_alerts TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED: DEFAULT STUDENT USER ACCOUNT (password: password123)
INSERT INTO users (id, name, email, password, phone, school, daily_reminder, sound_alerts) VALUES
(1, 'Student User', 'student@dayflow.app', '$2y$10$e8w.b0n0hE20FGB0mPqjau.YvV8Y3vS0.q6nKzX4qO8hK4QyP.JSm', '+63 912 345 6789', 'Dayflow University', 1, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- SYSTEM DEFAULTS: CATEGORIES TAXONOMY
INSERT INTO categories (id, name, group_name, icon, color) VALUES
('cat-assignments', 'Assignments', 'Academic', 'document-text-outline', '#3979D8'),
('cat-projects', 'Projects', 'Academic', 'folder-open-outline', '#2B6CB0'),
('cat-examinations', 'Examinations', 'Academic', 'school-outline', '#D97706'),
('cat-research', 'Research', 'Academic', 'flask-outline', '#6D9EEB'),
('cat-readings', 'Readings', 'Academic', 'book-outline', '#2F8F55'),
('cat-school-act', 'School Activities', 'Academic', 'people-outline', '#4A78D0'),
('cat-personal', 'Personal', 'Personal', 'person-outline', '#3979D8'),
('cat-errands', 'Errands', 'Personal', 'cart-outline', '#5A7D9A'),
('cat-health', 'Health', 'Personal', 'fitness-outline', '#2F8F55'),
('cat-household', 'Household', 'Personal', 'home-outline', '#B7791F'),
('cat-meetings', 'Meetings', 'Personal', 'chatbubbles-outline', '#6D9EEB'),
('cat-others', 'Others', 'Personal', 'pricetag-outline', '#8995A7')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- INITIAL USER PROFILE
INSERT INTO user_profile (id, name, email, phone, school, daily_reminder, sound_alerts) VALUES
(1, 'User', '', '', '', 1, 0)
ON DUPLICATE KEY UPDATE id=1;
