-- Student Attendance Management System - Database Schema
-- This file contains the complete MySQL database schema for the project.
-- Note: The Flask application uses SQLite for simplicity, but this SQL
-- can be adapted for MySQL deployment.

-- Create database
CREATE DATABASE IF NOT EXISTS attendance_management;
USE attendance_management;

-- Teachers table (for authentication)
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Store hashed passwords only
    is_admin TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    year ENUM('FY', 'SY', 'TY', 'BE') NOT NULL,
    division CHAR(1) NOT NULL,
    parent_phone VARCHAR(15),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_date (student_id, date)
);

-- Notifications log table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert sample departments
INSERT INTO departments (name, code) VALUES
('Information Technology', 'IT'),
('Computer Science', 'CS'),
('Electronics', 'EC'),
('Mechanical', 'ME');

-- Insert sample admin and teacher
-- Passwords are: admin123 and teacher123 (use werkzeug.security.generate_password_hash to hash)
INSERT INTO teachers (name, email, password, is_admin) VALUES
('Admin User', 'admin@college.edu', 'scrypt:32768:8:1$...', 1),
('John Teacher', 'teacher@college.edu', 'scrypt:32768:8:1$...', 0);

-- Insert sample students
INSERT INTO students (roll_number, name, department_id, year, division, parent_phone) VALUES
-- IT Department
('IT001', 'Rahul Sharma', 1, 'FY', 'A', '+919876543210'),
('IT002', 'Priya Patel', 1, 'FY', 'A', '+919876543211'),
('IT003', 'Amit Kumar', 1, 'FY', 'A', '+919876543212'),
('IT004', 'Sneha Gupta', 1, 'FY', 'A', '+919876543213'),
('IT005', 'Vikram Singh', 1, 'FY', 'A', '+919876543214'),
('IT006', 'Ananya Reddy', 1, 'FY', 'B', '+919876543215'),
('IT007', 'Karan Mehta', 1, 'FY', 'B', '+919876543216'),
('IT008', 'Pooja Verma', 1, 'FY', 'B', '+919876543217'),
('IT009', 'Rohan Das', 1, 'SY', 'A', '+919876543218'),
('IT010', 'Neha Joshi', 1, 'SY', 'A', '+919876543219'),
('IT011', 'Arjun Nair', 1, 'SY', 'B', '+919876543220'),
('IT012', 'Kavya Iyer', 1, 'TY', 'A', '+919876543221'),
('IT013', 'Sanjay Rao', 1, 'TY', 'A', '+919876543222'),
('IT014', 'Meera Shah', 1, 'BE', 'A', '+919876543223'),
('IT015', 'Aditya Kulkarni', 1, 'BE', 'A', '+919876543224'),
-- CS Department
('CS001', 'Rajesh Kumar', 2, 'FY', 'A', '+919876543225'),
('CS002', 'Swati Sharma', 2, 'FY', 'A', '+919876543226'),
('CS003', 'Deepak Patel', 2, 'FY', 'B', '+919876543227'),
('CS004', 'Anjali Gupta', 2, 'SY', 'A', '+919876543228'),
('CS005', 'Manish Singh', 2, 'SY', 'A', '+919876543229'),
('CS006', 'Ritu Agarwal', 2, 'TY', 'A', '+919876543230'),
('CS007', 'Vivek Mishra', 2, 'BE', 'A', '+919876543231');

-- Create indexes for better performance
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_year_division ON students(year, division);

-- View for calculating attendance percentage
CREATE VIEW student_attendance_summary AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    s.roll_number,
    d.name AS department_name,
    s.year,
    s.division,
    s.parent_phone,
    COUNT(a.id) AS total_days,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_days,
    SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_days,
    ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS attendance_percentage
FROM students s
JOIN departments d ON s.department_id = d.id
LEFT JOIN attendance a ON s.id = a.student_id
GROUP BY s.id, s.name, s.roll_number, d.name, s.year, s.division, s.parent_phone;

-- View for students below 75% attendance
CREATE VIEW low_attendance_students AS
SELECT * FROM student_attendance_summary
WHERE attendance_percentage < 75 AND total_days > 0;
