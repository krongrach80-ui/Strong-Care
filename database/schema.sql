-- PhysioVision Database Schema
-- Compatible with MySQL / MariaDB (XAMPP) & SQLite

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender ENUM('male', 'female', 'other') DEFAULT 'male',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) DEFAULT 'Upper Body',
    description TEXT NOT NULL,
    target_joint VARCHAR(100) NOT NULL,
    target_angle DECIMAL(5,2) NOT NULL,
    min_angle DECIMAL(5,2) NOT NULL,
    max_angle DECIMAL(5,2) NOT NULL,
    target_reps INT NOT NULL DEFAULT 10,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    exercise_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_reps INT NOT NULL DEFAULT 0,
    correct_reps INT NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    avg_duration_per_rep DECIMAL(6,2) DEFAULT 0.00,
    max_angle DECIMAL(5,2) DEFAULT 0.00,
    avg_angle DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'completed',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    rep_number INT NOT NULL,
    angle DECIMAL(5,2) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    duration DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    is_correct TINYINT(1) NOT NULL DEFAULT 1,
    feedback VARCHAR(255) DEFAULT 'Good form',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_exercise ON sessions(exercise_id);
CREATE INDEX idx_session_results_session ON session_results(session_id);
