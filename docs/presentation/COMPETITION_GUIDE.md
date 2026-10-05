# 🏆 PhysioVision - Competition & Judging Presentation Guide

## 1. The Core Problem
- **Rehabilitation Bottlenecks**: Patients performing physical therapy at home often struggle with incorrect postures, overextension, or under-movement without constant supervision from a physiotherapist.
- **Privacy & Connectivity Constraints**: Clinics and competition environments frequently require zero cloud dependency, strict HIPAA/PDPA privacy, and guaranteed offline reliability.

## 2. Our Solution: PhysioVision
1. **Edge AI Vision**: Runs Google MediaPipe 33-point Pose Landmarker 100% locally in browser memory.
2. **Deterministic State Machine**: Replaces naive thresholds with a 5-step finite state machine (START → READY → MOVE → HOLD → COMPLETE), eradicating duplicate counts and jitter.
3. **Medical-Grade Metrics**:
   - Live Joint Angle Gauge (0°–180°)
   - Range of Motion (ROM) assessment
   - Posture Stability & Spine Alignment score
   - Real-time clinical feedback alerts
4. **Offline Stack**:
   - Frontend: React + TypeScript + Vite + Tailwind CSS + Recharts
   - Backend: PHP 8.x REST API + PDO (MySQL / MariaDB via XAMPP with automatic SQLite fallback)
   - Zero external CDN dependencies.

## 3. Recommended 3-Minute Live Demo Script

| Minute | Step | Screen | What to Say / Demonstrate |
|---|---|---|---|
| **0:00 - 0:30** | Introduction | **Home** | Show the PhysioVision dashboard, explain the clinical need and offline edge-AI capability. |
| **0:30 - 1:00** | Patient & Program | **Patients & Exercises** | Select patient **สมชาย วิจิตรศิลป์ (Somchai V.)** and choose **Shoulder Lateral Raise (90°)**. |
| **1:00 - 2:00** | Live Training | **Training** | Open camera or click **Simulate** for automatic demonstration. Show the **Skeleton overlay**, **Angle Gauge**, and **State Machine step pills** moving from READY → MOVE → HOLD → COMPLETE as reps increment. |
| **2:00 - 2:40** | Clinical Report | **Result Report** | Click **จบเซสชัน (Finish & Save)**. Show the **Medical Physiotherapy Report**, the **Angle Progression Area Chart**, and the rep-by-rep log table saved via PHP REST API. |
| **2:40 - 3:00** | Q&A & Technical Proof | **History & Code** | Show the patient history trend and explain the 100% offline architecture with zero CDN calls. |

---

## 4. XAMPP Deployment for Judges (Zero Node.js Required)

1. Build production assets:
   ```bash
   cd frontend
   npm run build
   ```
2. Copy `dist/` and `backend/` into your XAMPP web root:
   ```
   C:\xampp\htdocs\physiovision\
   ├── dist\          <-- Frontend HTML/JS/CSS
   ├── backend\       <-- PHP REST API
   └── database\      <-- schema.sql
   ```
3. Open browser:
   `http://localhost/physiovision/dist/`
   The system runs completely offline without any internet connection!
