-- Lekha Database Schema

CREATE DATABASE IF NOT EXISTS lekha_db;
USE lekha_db;

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Project Groups Table
CREATE TABLE IF NOT EXISTS project_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    project_topic VARCHAR(255) NOT NULL,
    guide_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES users(user_id)
);

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id)
);

-- Meeting Logs Table
CREATE TABLE IF NOT EXISTS meeting_logs (
    meet_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    meet_date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    suggestions TEXT,
    comment_from_guide TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id)
);

-- Project Files Table
CREATE TABLE IF NOT EXISTS project_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    comment_from_guide TEXT,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    action_by INT NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_by) REFERENCES users(user_id)
);

-- Insert Default Roles
INSERT INTO roles (role_name) VALUES 
    ('Student'),
    ('Guide'),
    ('HOD'),
    ('Admin')
ON DUPLICATE KEY UPDATE role_name=role_name;
