# 🏗️ PhysioVision - System Architecture Specification

## 1. Baseline Architectural Blueprint

PhysioVision employs a **Layered Biomechanics Architecture (สถาปัตยกรรมชีวกลศาสตร์แบบแยกชั้น)** designed specifically for clinical physical therapy and rehabilitation. 

Unlike generic fitness web apps that rely on naive skeleton drawing and erratic threshold counters (`if (wrist.y < shoulder.y) rep++`), PhysioVision strictly decouples **Visual Perception (Pose Engine)** from **Kinematic Intelligence (Biomechanics Engine)**.

```
React (TypeScript + Vite)
 │
 ├── 📷 Camera
 │     └── Shared video stream, device selection, mirror mode
 │
 ├── 👁️ AI Pipeline 1: Face Recognition & Liveness (Authentication only)
 │     ├── Face Detection & Centroid Alignment
 │     ├── Liveness Anti-Spoofing (Eye Aspect Ratio EAR Blink + Head Yaw Movement)
 │     ├── 128-d Face Embedding Generator (Zero photo storage!)
 │     └── Cosine Similarity Matching (Elderly zero-typing login)
 │
 ├── 🏋️ AI Pipeline 2: Pose Engine & Biomechanics (Rehabilitation only)
 │     ├── MediaPipe Pose (33 3D-landmarks, confidence scoring)
 │     └── Biomechanics Engine:
 │           ├── 📐 Angle             (Vector trigonometry, 3D joint centers, EMA)
 │           ├── 📏 ROM               (Active Range of Motion, target deficit, AAOS)
 │           ├── 🧍 Posture           (Kinetic chain alignment, trunk lean, hiking)
 │           ├── 🔄 Repetition         (5-State Hysteresis Automaton, peak hold)
 │           └── ⚡ Movement Quality  (Jerk/tremor index, cadence ratio, form score)
 │
 └── 💻 UI HUD & Telemetry
       ├── Elderly Face Login Portal & Multi-Angle Enrollment Modal
       └── Skeleton Canvas, Circular Angle Arc, Real-time Warnings, Audio Synthesizer
       │
       ▼
     🐘 PHP 8 API (RESTful PDO Backend on XAMPP)
       ├── /api/face/enroll (Multi-angle vectors)
       ├── /api/face/verify (Cosine Similarity >= 0.82)
       ├── /api/patients, /api/exercises, /api/sessions
       │
       ▼
     🐬 MySQL / MariaDB / SQLite
       ├── patients
       ├── face_embeddings (128-d vectors only - No photos stored!)
       ├── exercises
       ├── sessions
       └── session_results
```

---

## 2. Core Philosophy: Why No Python, C#, Node.js or Docker in v1?

| Component Considered | Verdict in Baseline v1 | Architectural Rationale |
|---|---|---|
| **Python Backend** (FastAPI / Flask) | ❌ **Excluded** | Browser-based MediaPipe (WASM/WebGL) runs inference at 30-60 FPS locally on client GPU. Sending 60 raw video frames/sec to Python over HTTP/WebSocket adds 80-150ms latency, massive network bandwidth bottlenecks, and deployment friction (PyTorch, CUDA, virtual environments). |
| **C# Desktop Wrapper** (.NET / WPF) | ❌ **Excluded** | Restricts cross-platform execution (Windows only) and requires complex MSI installers. Web standards (WebAssembly + WebGL + WebRTC) provide native performance with zero install. |
| **Node.js Backend Daemon** | ❌ **Excluded** | Redundant. The PHP 8 REST API on XAMPP handles relational persistence, patient profiles, and medical reports without needing an always-on Node server process. |
| **Docker Engine** | ❌ **Excluded** | Docker introduces camera pass-through driver complications on hospital/clinic Windows machines, high memory footprint, and requires virtualization permissions often blocked by corporate/hospital IT policies. |
| **React + Vite + MediaPipe + PHP 8 + MySQL (XAMPP)** | ✅ **Selected Baseline** | **Pragmatic, lightweight, and 100% offline.** Boots in seconds on standard hospital Windows laptops without internet, cloud bills, or complicated devops dependencies. |

---

## 3. Deep Dive: The 5 Pillars of the Biomechanics Engine

The **Biomechanics Engine** is what transforms PhysioVision from a basic pose demo into a clinical-grade medical rehabilitation tool:

```
                            Raw 33 Landmarks (x, y, z, vis)
                                         │
                                         ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                            BIOMECHANICS ENGINE                            │
   │                                                                           │
   │   ┌────────────────┐   ┌────────────────┐   ┌─────────────────────────┐   │
   │   │  Angle Engine  │   │   ROM Engine   │   │     Posture Engine      │   │
   │   │ ────────────── │   │ ────────────── │   │ ─────────────────────── │   │
   │   │ • Vector math  │   │ • Active ROM   │   │ • Spine verticality     │   │
   │   │ • Dot product  │   │ • Target reach │   │ • Shoulder hiking cheat │   │
   │   │ • EMA filter   │   │ • ROM Deficit  │   │ • Pelvic tilt balance   │   │
   │   │ • deg/s speed  │   │ • AAOS norms   │   │ • Knee valgus collapse  │   │
   │   └───────┬────────┘   └───────┬────────┘   └────────────┬────────────┘   │
   │           │                    │                         │                │
   │           └──────────────┬─────┴─────────────────────────┘                │
   │                          ▼                                                │
   │   ┌─────────────────────────────────────┐   ┌─────────────────────────┐   │
   │   │          Repetition Engine          │   │ Movement Quality Engine │   │
   │   │ ─────────────────────────────────── │   │ ─────────────────────── │   │
   │   │ • 5-State Hysteresis Automaton      │   │ • Angular Jerk / Tremor │   │
   │   │ • START ➔ READY ➔ MOVE ➔ HOLD ➔ END │   │ • Cadence & Tempo ratio │   │
   │   │ • Anti-bounce deadband (±8°)        │   │ • Eccentric control     │   │
   │   │ • Isometric Hold Validation         │   │ • Composite Form Score  │   │
   │   └──────────────────┬──────────────────┘   └────────────┬────────────┘   │
   └──────────────────────┼───────────────────────────────────┼────────────────┘
                          │                                   │
                          ▼                                   ▼
             Live Biomechanical Telemetry          Repetition Kinematics Log
             (HUD, Arc Gauge, Alerts)              (Stored to PHP API / MySQL)
```

### Pillar 1: Angle Engine (การคำนวณองศาข้อต่อ)
- **Vector Dot Product**: Computes true anatomical angles formed by joint vertex $B$ between proximal point $A$ and distal point $C$:
  $$\vec{u} = \vec{A} - \vec{B}, \quad \vec{v} = \vec{C} - \vec{B}$$
  $$\cos(\theta) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}, \quad \theta = \arccos(\text{clamp}(\cos(\theta), -1, 1))$$
- **Exponential Moving Average (EMA)**: Eliminates high-frequency camera sensor noise without introducing phase lag:
  $$\hat{\theta}_t = \alpha \cdot \theta_t + (1 - \alpha) \cdot \hat{\theta}_{t-1}, \quad (\alpha = 0.65)$$
- **Angular Velocity**: Evaluates speed of motion $\omega = \frac{\Delta \theta}{\Delta t}$ in degrees per second.

### Pillar 2: ROM Engine (ช่วงการเคลื่อนไหวข้อต่อ)
- **Active Range of Motion (AROM)**:
  $$\text{AROM} = \theta_{\max} - \theta_{\min}$$
- **Therapeutic ROM Deficit**: Evaluates exactly how many degrees the patient falls short of their rehabilitation target:
  $$\text{ROM Deficit} = \max(0, |\theta_{\text{target}} - \theta_{\text{peak}}|)$$
- **Normative Anatomical Benchmark (AAOS Standards)**:
  - Shoulder Abduction: Normative 0°–180°
  - Elbow Flexion (Bicep): Normative 165° down to 40°
  - Knee Flexion (Squat): Normative 175° down to 90°
  - Elbow Extension: Normative 75° up to 180°

### Pillar 3: Posture Engine (การทรงตัวและการโกงท่า)
- **Compensatory Mechanism Detection**: In physical therapy, patients with restricted mobility frequently compensate (cheat):
  - *Trunk Lean Compensation*: Leaning the torso laterally or forward to artificially elevate an arm. The Posture Engine continuously evaluates the spinal axis angle $\theta_{\text{spine}} \le 12^\circ$.
  - *Shoulder Hiking Compensation*: Elevating the trapezius to hike the shoulder joint rather than engaging the deltoid/rotator cuff ($\Delta \theta_{\text{shoulder}} \le 8^\circ$).
  - *Knee Valgus (Inward Collapse)*: Detecting dangerous knee caving during squats ($\text{Width}_{\text{knee}} < 0.75 \times \text{Width}_{\text{hip}}$).

### Pillar 4: Repetition Engine (ระบบนับรอบด้วย State Machine)
- Prevents double-counting, jitter, and partial repetitions via a 5-stage automaton with hysteresis:
  1. `START`: Awaiting setup in frame.
  2. `READY`: Calibrated in neutral resting position.
  3. `CONCENTRIC` (`UP` / `DOWN`): Active movement towards target angle.
  4. `APEX_HOLD`: Enforces clinical hold (e.g. 600ms isometric contraction in target zone).
  5. `ECCENTRIC`: Controlled elongation returning to baseline.
  6. `COMPLETE`: Rep registered, metric logged, reset to `READY`.

### Pillar 5: Movement Quality Engine (การประเมินคุณภาพการเคลื่อนไหว)
- **Smoothness Index (Angular Jerk & Tremor)**:
  Measures time derivative of angular acceleration:
  $$\text{Jerk} = \frac{d^3 \theta}{dt^3}$$
  Low jerk indicates fluid motor coordination; high jerk signals muscle fatigue, neuromuscular spasticity, tremor, or hesitation from pain.
- **Cadence & Tempo Ratio**:
  Compares eccentric phase duration to concentric phase duration:
  $$\text{Ratio} = \frac{T_{\text{eccentric}}}{T_{\text{concentric}}}$$
  Patients who abruptly drop their arm during the return phase are flagged for poor eccentric control.
- **Composite Form Integrity Score (0–100%)**:
  $$\text{Score} = 0.35 \cdot \text{ROM} + 0.25 \cdot \text{Posture} + 0.20 \cdot \text{Smoothness} + 0.20 \cdot \text{Tempo}$$

---

## 4. Layered Data Flow

```
Camera (Webcam)
   │
   ▼ Frame (60 FPS)
Pose Engine (MediaPipe Tasks Vision WASM)
   │
   ▼ 33 3D Landmarks (x, y, z, visibility)
Biomechanics Engine (In-Memory Kinematics)
   │
   ├──▶ Real-time HUD (React UI): Angle Arc, Skeleton Overlay, Voice/Chime Feedback
   │
   ▼ (On Repetition Complete & Session Completion)
PHP 8 REST API (XAMPP PDO)
   │
   ▼ SQL Transaction
MySQL / MariaDB (Database)
   ├── patients
   ├── exercises
   ├── sessions
   └── session_results (rep-by-rep kinematics, ROM deficit, smoothness score)
```

---

## 5. Offline Guarantees

1. **No Cloud Calls**: Zero external API endpoints, zero telemetry tracking.
2. **Local Model Artifacts**: Model task weights (`pose_landmarker_lite.task`) and WebAssembly modules (`vision_wasm_internal.wasm`) are bundled in `frontend/public/models/pose/`.
3. **Synthetic Audio**: Audio chimes and cues generated natively via the Web Audio API without loading MP3/WAV files.
4. **Local Database**: MySQL / MariaDB on localhost XAMPP with fallback to SQLite if needed.
