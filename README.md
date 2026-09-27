# Smart Grievance Portal

A complete, production-grade full-stack institutional grievance management and resolution platform engineered for universities and colleges. Built with **React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui design patterns, Node.js, Express, MongoDB, Mongoose, Passport.js, and OpenAI**.

---

## 🌟 System Highlights & Key Features

### 1. Three Authoritative Institutional Roles
- **STUDENT**: Self-registers only via pre-approved institutional student records (e.g. `MU0321282938`), files grievances with real-time AI assistance, tracks live 48-hour SLA timers, engages in discussion with assigned faculty, confirms resolution or reopens cases, and submits 1–5 star resolution feedback.
- **TEACHER (Faculty)**: Investigates assigned departmental cases, views priority queues, updates status to `IN_PROGRESS` and `RESOLVED` (with required action documentation), posts public updates or staff-only internal notes, and monitors SLA deadlines.
- **ADMINISTRATOR**: Institutional executive dashboard with live MongoDB analytics (no hardcoded metrics), Recharts trend charts, faculty workload balancing, 48-hour escalation oversight, campus-wide incident clustering (Common Issues), category & SLA policy management, approved whitelist management, and immutable compliance audit logs.

### 2. Authoritative 48-Hour SLA Automatic Escalation Engine
- Every applicable grievance records `createdAt` and a calculated `dueAt` (48 hours).
- A scheduled backend cron worker (`node-cron`) periodically evaluates active grievances. If `dueAt` breaches without resolution, the engine **atomically escalates the ticket to `ESCALATED`**, records `escalatedAt`, notifies the student, faculty officer, and university administrators, and writes a tamper-evident audit record.
- Reactive UI countdown displays **On Track**, **Approaching SLA Deadline**, **Overdue**, and **Escalated** states.

### 3. Institutional Whitelist & Approved Identity Verification
- Open public self-registration is strictly blocked.
- Student registrations are cryptographically checked against pre-approved institutional records (`ApprovedStudent`) verifying Student ID, Name, Email, Department, Year, and Division.
- Faculty registrations are verified against the approved staff directory (`ApprovedTeacher`).
- Admin accounts are strictly provisioned and cannot be self-registered from the public web.

### 4. AI-Powered Assistant & Semantic Duplicate Detection
- **OpenAI Draft Assistant**: Suggests refined titles, categories, priorities, extracts locations, provides concise summaries, and flags missing critical information before submission.
- **Student-In-Control UX**: AI never makes irreversible decisions. Students can preview, apply, edit, or ignore suggestions.
- **Same-Student Duplicate Prevention**: Compares title, description, location, and status using semantic similarity to prevent identical active complaints from cluttering the queue.
- **Campus-Wide Incident Clustering (Common Issues)**: Detects when multiple different students report the same physical outage (e.g., *WiFi down in Lab 3*) and links them under a unified campus incident with live affected student counts.
- **AI Case Summarization**: On-demand executive summaries for complex grievances with long message histories.
- **AI Administrative Insights**: Interprets real MongoDB metrics to highlight operational bottlenecks, repeated facility issues, and satisfaction scores.
- **Resilient Fallback Engine**: If an OpenAI API key is not configured or offline, the platform automatically falls back to an intelligent keyword/TF-IDF heuristic engine without throwing errors.

---

## 🏗️ Architecture & Technology Stack

```
smart-grievance-portal/
├── client/                      # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # ProtectedRoute
│   │   │   └── ui/              # Badges, Buttons, Cards, Inputs, Modals, SLACountdown
│   │   ├── context/             # AuthContext (Passport session state)
│   │   ├── layouts/             # AppLayout (Responsive sidebar, navbar, notif dropdown)
│   │   ├── pages/
│   │   │   ├── auth/            # LoginPage, RegisterPage (with 1-click test credentials)
│   │   │   ├── student/         # StudentDashboard, Directory, Submission, Details
│   │   │   ├── teacher/         # TeacherDashboard, Queue, Case Investigation Details
│   │   │   ├── admin/           # AdminDashboard, Directory, CommonIssues, Users, Categories, Analytics, AuditLogs
│   │   │   └── shared/          # NotificationsPage, ProfilePage
│   │   ├── services/            # Axios API client with credentials
│   │   ├── store/               # Zustand ThemeStore (Light / Dark mode)
│   │   ├── types/               # TypeScript interfaces & API contracts
│   │   └── utils/               # Classnames (cn) merging helper
├── server/                      # Node.js + Express REST API Backend
│   ├── src/
│   │   ├── config/              # MongoDB connection & Passport configuration
│   │   ├── controllers/         # Auth, Grievance, Message, Feedback, Notification, CommonIssue, Category, Admin, AI, User
│   │   ├── jobs/                # 48h SLA Escalation Sweep Worker (node-cron)
│   │   ├── middleware/          # Session auth, RBAC guards, centralized error handler
│   │   ├── models/              # User, ApprovedStudent, ApprovedTeacher, Grievance, Message, Notification, Feedback, AuditLog, Category, CommonIssue
│   │   ├── routes/              # RESTful API route definitions
│   │   ├── services/            # AI service, duplicateService, auditService, notificationService
│   │   ├── utils/               # File upload (Cloudinary + local), seed.js, asyncHandler
│   │   ├── app.js               # Express application builder
│   │   └── server.js            # Server entrypoint
│   └── tests/                   # Automated Node.js test suite (node --test)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Pre-Seeded Demonstration Credentials

The seed script (`npm run seed`) populates realistic test data and accounts:

| Role | Name | Institutional Email | University / Staff ID | Password | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Dr. Aris Thorne (Dean) | `admin@university.edu` | `ADMIN001` | `Password123!` | System-wide analytics & control |
| **TEACHER** | Prof. Rajesh Verma | `rajesh.verma@faculty.university.edu` | `FAC1042` | `Password123!` | Computer Science Associate Professor |
| **TEACHER** | Dr. Sunita Rao | `sunita.rao@faculty.university.edu` | `FAC1043` | `Password123!` | IT Services Faculty Head |
| **STUDENT** | Aarav Sharma | `aarav.sharma@student.university.edu` | `MU0321282938` | `Password123!` | 3rd Year CS Student (Pre-registered) |
| **STUDENT** | Priya Patel | `priya.patel@student.university.edu` | `MU0321282939` | `Password123!` | 2nd Year CS Student (Pre-registered) |
| **UNCLAIMED STUDENT** | Rohan Gupta | `rohan.gupta@student.university.edu` | `MU0321282940` | *Set on registration* | Ready for fresh test registration |
| **UNCLAIMED STUDENT** | Ananya Iyer | `ananya.iyer@student.university.edu` | `MU0321282941` | *Set on registration* | Ready for fresh test registration |
| **UNCLAIMED FACULTY** | Prof. Vikram Malhotra | `vikram.malhotra@faculty.university.edu` | `FAC1044` | *Set on registration* | Ready for fresh faculty registration |

> 💡 **Quick Login Tip**: The login page provides **1-Click Role Demonstration buttons** for Student, Faculty, and Admin to immediately test without manual typing.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB Server running on `127.0.0.1:27017` or MongoDB Atlas URI

### 1. Clone & Configure Environment
In the `server/` directory, copy `.env.example` to `.env`:
```bash
cd server
copy .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/smart_grievance_portal
SESSION_SECRET=dev_session_secret_grievance_portal_2026_secured
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SLA_HOURS=48
SLA_CHECK_CRON=*/15 * * * *
```
*(Optional: supply your `OPENAI_API_KEY` for OpenAI features. If left blank, the portal runs its built-in heuristic AI engine seamlessly.)*

### 2. Seed Database
From the root directory:
```bash
npm run seed
```
This initializes all 11 grievance categories, approved rosters, demo accounts, sample grievances with SLA timers, discussion threads, and common campus issues.

### 3. Run Automated Tests
```bash
npm run test
```
Executes all 13 backend unit and integration tests verifying session auth, institutional roster checks, RBAC restrictions, 48h SLA sweep, and duplicate detection.

### 4. Start the Application
Run server and client concurrently or in separate terminals:

**Terminal 1 (Backend Server)**:
```bash
npm run server:dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
npm run client
# Running on http://localhost:5173
```

Navigate your browser to: **`http://localhost:5173`**

---

## 🔒 Security & Privacy Implementation

- **Session Security**: Express sessions stored in MongoDB via `connect-mongo` with `httpOnly: true`, customizable `sameSite` policy, and `secure: true` in production.
- **Passwords**: Salted and hashed using `passport-local-mongoose` (PBKDF2 SHA-512).
- **Backend Role-Based Access Control**: Sensitive routes verify authentication, role validity, and resource ownership before executing any database mutation.
- **Privacy Masking**: Students can only access their own submissions. Teachers can only access assigned cases. Staff internal notes are stripped from student responses on the backend.
- **Rate Limiting**: Applied to `/api/auth` (brute force mitigation) and `/api/ai` endpoints.
- **Audit Logging**: Every status update, teacher assignment, reopen action, feedback submission, and SLA automated escalation is logged into `AuditLog` for compliance.

---

## 📑 API Architecture Overview

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register approved student or faculty ID |
| `/api/auth/login` | `POST` | Public | Authenticate and create persistent session |
| `/api/auth/logout` | `POST` | Authenticated | Destroy session and clear cookie |
| `/api/auth/me` | `GET` | Authenticated | Return currently logged-in user profile |
| `/api/grievances` | `GET` | Authenticated | Paginated, filtered, role-scoped grievances |
| `/api/grievances` | `POST` | Student | Submit new complaint with attachments & SLA |
| `/api/grievances/check-duplicates` | `POST` | Student | Pre-submission duplicate check |
| `/api/grievances/:id` | `GET` | Scoped | Grievance details with visual timeline |
| `/api/grievances/:id/status` | `PATCH` | Teacher/Admin | Transition status (`IN_PROGRESS`, `RESOLVED`) |
| `/api/grievances/:id/assign` | `PATCH` | Admin | Assign or reassign faculty officer |
| `/api/grievances/:id/close` | `POST` | Student | Confirm resolution and close ticket |
| `/api/grievances/:id/reopen` | `POST` | Student | Reopen unresolved ticket with reason |
| `/api/messages/grievance/:id` | `GET` | Scoped | Conversation thread & internal staff notes |
| `/api/messages/grievance/:id` | `POST` | Scoped | Send reply or log private staff note |
| `/api/feedback` | `POST` | Student | Rate resolution experience (1–5 stars) |
| `/api/notifications` | `GET` | Authenticated | User notifications with unread counts |
| `/api/common-issues` | `GET` | Authenticated | View campus-wide clustered incidents |
| `/api/common-issues` | `POST` | Admin | Declare incident and link student grievances |
| `/api/admin/analytics` | `GET` | Admin | System statistics, resolution speed & trends |
| `/api/admin/ai-insights` | `GET` | Admin | AI pattern observations across real data |
| `/api/admin/audit-logs` | `GET` | Admin | Paginated compliance audit records |
| `/api/admin/approved-records` | `GET`/`POST` | Admin | Manage institutional roster whitelist |
| `/api/ai/assist-draft` | `POST` | Authenticated | AI suggestions for title, category, priority |
| `/api/ai/summarize-grievance` | `POST` | Scoped | AI executive summary of discussion file |
| `/api/ai/chat-assistant` | `POST` | Student | Contextual student assistant chat |

---

## 💻 Production Deployment

1. **Frontend Production Build**:
   ```bash
   npm run build
   ```
   Outputs minified, tree-shaken static assets into `client/dist/`.
2. **Reverse Proxy (Nginx / Cloudflare)**:
   Serve `client/dist` statically and proxy `/api` and `/uploads` requests to the Node.js server.
3. **Environment**:
   Set `NODE_ENV=production`, configure a strong `SESSION_SECRET`, provide a cloud `MONGODB_URI` (MongoDB Atlas), and configure Cloudinary credentials for cloud file storage.
