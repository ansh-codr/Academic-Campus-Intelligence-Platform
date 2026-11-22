> **Phase 8 real-data transition:** Production services must use genuine Firestore records instead of demonstration fixture fallbacks. The demo seed script is for local emulator/testing only. See [backend architecture](docs/BACKEND_ARCHITECTURE.md), [data model](docs/FIRESTORE_DATA_MODEL.md), [real-data onboarding](docs/REAL_DATA_ONBOARDING.md), [deployment runbook](docs/DEPLOYMENT_RUNBOOK.md), and [friend handover](docs/FRIEND_HANDOVER.md). Do not seed or purge a live Firebase database without explicit approval.\n\n# SolveSphere AI — Academic & Campus Intelligence Platform

> **"Your Problems. Our Smart Solutions."**
>
> A production-oriented Academic & Campus Intelligence Platform engineered for first-year university cohorts, faculty instructors, and campus administrators.

---

## 1. Overview & Platform Architecture

SolveSphere AI bridges two essential university systems into a single, cohesive experience:

- **Module A: Academic Intelligence**: Keeps first-year students aligned with active classroom teaching. Features live topic timelines (Completed &rarr; Ongoing &rarr; Upcoming), 6 first-year curricula, syllabus-aware resource discovery (Within vs Outside syllabus), StudyMate AI tutor interface, and practice assessment simulations.
- **Module B: Campus Intelligence**: Streamlines student issue reporting for HVAC, Wi-Fi, electrical, and hostel infrastructure. Features transparent ticket lifecycle auditing, semantic AI issue clustering (grouping duplicate complaints into single root-cause work orders), privacy-first sensitive concerns (Speak Freely), and campus club directories.
- **Administrative Command**: Centralized oversight for department workload triage, cluster reviews, topic progression approvals, and enrollment metrics.

### Backend Platform Migration (Phase 2)
The backend architecture runs on **Google Firebase**:
- **Firebase Authentication**: Email/password authentication, session management, and cryptographically verified custom claims (`{ role: 'ADMIN' }`).
- **Cloud Firestore**: Real-time NoSQL database with strict Security Rules, denormalized collections, and atomic transactional sequence generation (`SS-2026-XXXX`).
- **Firebase Cloud Storage**: Secure object storage for ticket attachments with type and size enforcement.
- **Cloud Functions for Firebase (TypeScript, Node 20 LTS)**: Privileged server-side ticket creation, status validation, and department dispatch.
- **Firebase Emulator Suite**: Complete local development and test environment running Auth, Firestore, Functions, and Storage.

---

## 2. Technology Stack & Versions

- **Frontend (`apps/web`)**:
  - React `18.3.1`
  - TypeScript `5.4.5`
  - Vite `5.2.12`
  - Tailwind CSS `3.4.3`
  - Firebase Client SDK `12.x`
  - Framer Motion `11.2.10`
  - React Router DOM `6.23.1`
  - Lucide React `0.383.0`
  - TanStack Query `5.40.0`
  - React Hook Form `7.51.5`
  - Zod `3.23.8`
- **Cloud Functions (`functions`)**:
  - Node.js `20 LTS`
  - Firebase Functions `5.0.0`
  - Firebase Admin SDK `12.1.0`
  - TypeScript `5.4.5`
- **Shared Contracts (`packages/shared`)**:
  - Domain types, DTOs, and isomorphic Zod validation schemas

---

## 3. Local Development & Emulator Instructions

### Prerequisites
- Node.js `20.x` or higher
- npm `10.x` or higher
- Firebase CLI (`npm install -g firebase-tools` or Homebrew)
- Java Runtime (OpenJDK 17 or higher) for the Firebase Emulator Suite

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Shared Packages & Functions
```bash
npm run build --workspace=@solvesphere/shared
npm run build --workspace=@solvesphere/functions
```

### Step 3: Start Firebase Emulators
In one terminal, start the local Firebase Emulator Suite:
```bash
npm run emulators
```
This starts:
- Auth Emulator: `http://127.0.0.1:9099`
- Firestore Emulator: `http://127.0.0.1:8080`
- Functions Emulator: `http://127.0.0.1:5001`
- Storage Emulator: `http://127.0.0.1:9199`
- Emulator UI: `http://127.0.0.1:4000`

### Step 4: Seed Database & Bootstrap Admin (One-time)
In a second terminal:
```bash
# Seed **local emulator-only** sample subjects, topics, resources, departments and tickets (NEVER live production):
npm run seed

# Provision the default Administrator account with custom claim { role: 'ADMIN' }:
npm run admin:bootstrap
```

### Step 5: Start the Frontend Application
```bash
npm run dev:web
```
Access the application at `http://localhost:5173`.

---

## 4. Default Test Credentials (Emulator Mode)

| Role | Email | Password | Display Name | Permissions |
|---|---|---|---|---|
| **Student** | `student.demo@campus.edu` | `Student@2026` | Test Student | Student Portal, Issue Reporting, My Tickets, Study Resources |
| **Admin** | `admin@campus.edu` | `SolveSphereAdmin@2026` | Test Administrator | Full Administrative Command, Triage, Status Changes, Assignments |

*Note: In production builds, login forms use genuine email/password authentication via Firebase Auth with email verification. One-click demo fill buttons and hardcoded credentials have been completely eradicated from production client bundles.*

---

## 5. Security & Access Control Implementation

### 1. Custom Claims Role Verification
Public registration only creates accounts with `role: 'STUDENT'`. Admin accounts can only be provisioned using trusted tooling (`scripts/bootstrap-admin.js` via Admin SDK). See [Admin Provisioning Runbook](docs/ADMIN_ACCOUNT_PROVISIONING.md).

### 2. Client-Side Route Protection (`apps/web/src/App.tsx`)
- `<RequireAuth>`: Intercepts unauthenticated visits to `/portal/*` and redirects to `/auth/login`.
- `<RequireAdmin>`: Intercepts visits to `/admin/*`, verifies user is authenticated and possesses verified custom claim `role === 'ADMIN'`. Non-admin students receive a `403 Forbidden` screen.

### 3. Server-Side Security Rules (`firestore.rules`)
- **Strict Ownership**: Students can only query and read their own complaints (`submittedById == request.auth.uid`).
- **Profile Immutability**: Students cannot alter their own `role`, `id`, `studentId`, or add `customClaims`.
- **Privilege Separation**: Only Admins can modify complaint status and department assignment.
- **Resource Integrity**: Academic courses, topics, and verified resources are read-only for students.

---

## 6. Automated Integration Tests

A comprehensive integration test suite verifies the complete platform:
```bash
firebase emulators:exec --only auth,firestore,functions,storage "node tests/firebase.test.js"
```

**Verified Test Scenarios (53 automated test suites):**
1. Student Account Registration in Firebase Auth and Cloud Firestore.
2. Privilege Escalation Prevention (Public users cannot self-assign ADMIN role).
3. Admin Account Provisioning with verified `{ role: 'ADMIN' }` custom claims.
4. Persistent Complaint Creation with Atomic `SS-2026-XXXX` reference sequencing and initial lifecycle event subcollection.
5. Student Ownership Isolation (Students only see their own tickets).
6. Admin Ticket Status Transitions (`SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED`).
7. Department Assignment with auditable timeline event logs.
8. Database Seeding for academic subjects, topics, and resources.
9. Campus Care AI Semantic Clustering with lease fences and idempotency.
10. Protected Question Bank Provisioning and Server-Side Quiz Grading.
11. Dedicated Admin Real Data Management (`/admin/departments`, `/admin/clubs`, `/admin/academic`).
12. Assessment Publication Validation & Unpublished Draft Isolation (Drafts protected from student access).
13. Read-Only Sample Data Inventory & Safety Auditing.
14. Production Authentication Workflows (Student Registration, Email Verification Dispatch, Profile Immutability, Password Reset, and Admin RBAC).

---

## 7. Operational Handover & Infrastructure Constraints

- **Backend Architecture**: SolveSphere AI strictly utilizes Google Cloud / Firebase (Firebase Authentication, Cloud Firestore, Cloud Functions TypeScript LTS, Firebase Cloud Storage) and Google Gemini AI. No other backend services are used.
- **Dedicated Administrative Command Interfaces**:
  - `/admin/academic`, `/admin/subjects`, `/admin/topic-updates`, `/admin/resources`: Manage accredited subjects, syllabus progression, and curriculum resources.
  - Quiz Manager: Draft or validate and publish assessments with protected answer keys and server-side grading.
  - `/admin/departments`: Manage campus maintenance departments, contact channels, and triage dispatch routes.
  - `/admin/clubs`: Register student campus clubs and activity schedules.
  - `/admin/complaints` & `/admin/clusters`: Triage student tickets, review semantic clusters, and monitor lifecycle audits.
- **Production Status & Operational Boundaries**: All automated verification suites (typecheck, unit, UI, Firebase Emulator integration) pass locally. **Live deployment to Google Cloud and live Gemini API quota inference** are not yet executed in a production environment and remain the responsibility of the receiving owner per `docs/DEPLOYMENT_RUNBOOK.md` and `docs/FRIEND_HANDOVER.md`.
