# SolveSphere AI — Technical Architecture

**Tagline:** "Your Problems. Our Smart Solutions."

SolveSphere AI is an integrated Academic and Campus Intelligence Platform designed for first-year university cohorts, faculty, and campus administrators.

---

## 1. System Topology

```
                  +-------------------------------------------------------+
                  |             Client Web Application (SPA)              |
                  |     React 18 + TypeScript + Vite + Tailwind CSS       |
                  |          Framer Motion + TanStack Query               |
                  +---------------------------+---------------------------+
                                              |
                        +---------------------+---------------------+
                        |                     |                     |
                        v                     v                     v
            +-----------------------+  +---------------+  +------------------+
            | Firebase Auth (Client)|  |Cloud Firestore|  | Cloud Functions  |
            | Role Claims & Session |  | Real-Time Sync|  | Atomic Sequencing|
            +-----------------------+  +---------------+  +------------------+
                        ^                     ^                     ^
                        |                     |                     |
                        +---------------------+---------------------+
                                              |
                                              v
                              +-------------------------------+
                              |    Firebase Admin SDK         |
                              |  (Privileged Role Provisioning|
                              |   & Audit Trail Enforcement)  |
                              +-------------------------------+
```

---

## 2. Cloud Firestore Data Model

### Collections Overview

1. **`users/{uid}`**:
   - `id`: Firebase Auth User UID
   - `email`: University email
   - `fullName`: Student or staff full name
   - `studentId`: Student ID / Staff ID (e.g. `CS26019`, `ADM-8802`)
   - `role`: `'STUDENT'` | `'ADMIN'` (validated against Firebase custom claims)
   - `department`: Program / branch
   - `semester`: Current academic semester
   - `avatarUrl`: Profile image URL
   - `createdAt`, `updatedAt`: ISO timestamps

2. **`complaints/{ticketId}`**:
   - `id`: Document ID
   - `referenceNumber`: Unique atomic reference (e.g. `SS-2026-0850`)
   - `title`: Complaint summary
   - `category`: `AC_HVAC` | `WIFI_NETWORK` | `ELECTRICAL` | `HOSTEL` | `WATER_SUPPLY` | `SANITATION` | `GENERAL_INFRASTRUCTURE`
   - `building`, `floor`, `room`: Precise coordinates
   - `description`: Detailed issue description
   - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT`
   - `status`: `SUBMITTED` | `UNDER_REVIEW` | `ASSIGNED` | `IN_PROGRESS` | `RESOLVED` | `CLOSED` | `REOPENED`
   - `assignedDepartment`: Destination facility unit
   - `submittedById`: UID of student creator
   - `submittedBy`: Submitter display name
   - `submittedAt`, `updatedAt`: ISO timestamps
   - **Subcollection `timeline/{eventId}`**:
     - `id`, `ticketId`, `status`, `note`, `updatedBy`, `timestamp`

3. **`systemCounters/complaints`**:
   - `currentSequence`: Atomic monotonic counter for `SS-2026-XXXX` references.

4. **`subjects/{subjectId}`**:
   - `id`, `code`, `name`, `instructor`, `credits`, `category`, `description`, `totalTopics`, `completedTopics`, `currentTopic`, `nextTopic`, `progressPercentage`

5. **`syllabusTopics/{topicId}`**:
   - `id`, `subjectId`, `unit`, `title`, `description`, `status` (`COMPLETED` | `ONGOING` | `UPCOMING`), `order`, `estimatedHours`, `completedAt`

6. **`resources/{resourceId}`**:
   - `id`, `subjectId`, `topicId`, `title`, `description`, `scope` (`WITHIN_SYLLABUS` | `OUTSIDE_SYLLABUS`), `type` (`PDF` | `VIDEO` | `SLIDES` | `NOTE` | `PRACTICE_SHEET`), `facultyApproved`, `authorFaculty`, `downloadCount`

7. **`departments/{departmentId}`**:
   - `id`, `name`, `code`, `active`

8. **`campusClubs/{clubId}`**:
   - `id`, `name`, `category`, `leadName`, `description`, `memberCount`, `meetingSchedule`, `tags`, `recentActivities`

9. **`issueClusters/{clusterId}`**:
   - `id`, `title`, `category`, `affectedArea`, `ticketCount`, `ticketIds`, `confidenceScore`, `status`, `suggestedAction`

10. **`anonymousReports/{reportId}`**:
    - `id`, `trackingCode`, `category`, `description`, `status`, `submittedAt`, `privacyLevel`

---

## 3. Security & Access Control

### Firestore Security Rules (`firestore.rules`)
- **Deny-by-default**: Root match rule denies all unauthorized access.
- **User Profiles (`/users/{uid}`)**:
  - Read: Owner (`request.auth.uid == userId`) or Admin (`request.auth.token.role == 'ADMIN'`).
  - Create: Must be own profile with default `role == 'STUDENT'`.
  - Update: Owner can only modify non-privileged fields; role escalation is blocked.
- **Complaints (`/complaints/{ticketId}`)**:
  - Read: Scoped to owner (`resource.data.submittedById == request.auth.uid`) or Admin.
  - Create: Authenticated student, `submittedById` strictly equals caller UID, initial status must be `SUBMITTED`.
  - Update: Restricted to Admin custom claims (status transitions and department assignments).
- **Academic Collections (`/subjects`, `/syllabusTopics`, `/resources`)**:
  - Read: Authenticated users.
  - Write: Restricted to verified Admin custom claims.

### Storage Security Rules (`storage.rules`)
- **Attachments (`/attachments/{userId}/{ticketId}/{fileName}`)**:
  - Read: Owner or Admin.
  - Write: File size < 10MB, restricted MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
