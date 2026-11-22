# SolveSphere AI — Authentication & RBAC Architecture

This document outlines the authentication lifecycle, Role-Based Access Control (RBAC) model, session persistence, and security controls in SolveSphere AI.

---

## 1. Authentication Foundation

SolveSphere AI authenticates users using **Firebase Authentication** backed by Cloud Firestore profiles.

```
+-----------------------------------------------------------+
|                   Client Browser (SPA)                    |
|  - Registration / Login / Password Reset Forms            |
|  - useAuth Hook (AuthContext Provider)                    |
|  - onAuthStateChanged Listener                            |
|  - JWT ID Token inspection (custom claims)                |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
|                 Google Firebase Auth                      |
|  - Cryptographically signed JWT ID tokens                 |
|  - Custom Claims: { role: 'ADMIN' }                       |
|  - Email Verification dispatch (sendEmailVerification)    |
|  - Password Reset dispatch (sendPasswordResetEmail)       |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
|                   Cloud Firestore                         |
|  - users/{uid}: Profile metadata & non-privileged details |
|  - firestore.rules: RBAC & field immutability guards      |
|  - adminAuditLogs: Privacy-safe administrative log trail  |
+-----------------------------------------------------------+
```

---

## 2. Roles & Privilege Separation

| Role | Provisioning Path | Custom Claim | Firestore Authorization |
|---|---|---|---|
| **STUDENT** | Public self-registration | Default (`claims.role == null` or `'STUDENT'`) | Can read and edit their own non-privileged profile; read approved courses, syllabi, resources; take published quizzes; create complaints via Cloud Functions; read own tickets. |
| **ADMIN** | Server-side trusted bootstrap (`scripts/bootstrap-admin.js`) | `{ role: 'ADMIN' }` verified cryptographically | Full administrative authority; manage courses, syllabi, continuous assessment question banks, campus departments, campus clubs; triage all tickets and clusters. |

### Role Verification Principle
- `users/{uid}.role` in Firestore is purely informative for UI display.
- **Backend security rules and Cloud Functions never trust `users/{uid}.role` for authorization.**
- Authorization strictly inspects `request.auth.token.role == 'ADMIN'`.

---

## 3. Institutional Enrollment Verification Lifecycle

SolveSphere AI separates authentic authentication from institutional student verification. Self-asserted enrollment numbers are never blindly trusted as authoritative.

### Lifecycle States
1. **`INCOMPLETE`**: User authenticated (via Google or Email/Password), but has not yet submitted an institutional enrollment request.
2. **`PENDING`**: Student submitted their enrollment claim. An `enrollmentRequests/{uid}` document is created with `status: 'PENDING'`. Protected university features (complaint creation, official assessment grading) remain locked pending admin review.
3. **`VERIFIED`**: An authorized administrator reviews the submission against institutional records on `/admin/enrollments`. The enrollment number is transactionally reserved in `enrollmentNumbers/{studentId}` (guaranteeing uniqueness), and the student profile is updated with verified status and roll number.
4. **`REJECTED`**: The administrator records a mandatory rejection reason (e.g. roll number mismatch or batch discrepancy). The student receives the explanation and can resubmit corrected details.

### Firestore Collections for Verification
- `users/{uid}`: Holds user profile and server-controlled `enrollmentStatus`. Students cannot directly assign authoritative `studentId` or `enrollmentStatus: 'VERIFIED'`.
- `enrollmentRequests/{uid}`: Tracks submission, audit timestamps, reviewing admin ID, and rejection reasons.
- `enrollmentNumbers/{studentId}`: Transactional reservation registry ensuring two accounts cannot hold the same verified enrollment number.
- `universityRoster/{recordId}`: Official institution roll records (completely shielded from student reads or writes).

---

## 4. Student Registration Flow

1. Student enters full name, university email, initial enrollment number, and password.
2. Frontend validates payload using `StudentRegisterSchema` (`packages/shared/src/schemas/auth.schema.ts`).
3. `createUserWithEmailAndPassword(auth, email, password)` provisions Firebase Auth account.
4. `updateProfile(user, { displayName })` registers display name.
5. `sendEmailVerification(user)` dispatches official verification link with 60-second cooldown protection.
6. Initial user profile created in `users/{uid}` with `enrollmentStatus: 'PENDING'`.
7. Formal enrollment claim recorded in `enrollmentRequests/{uid}` for administrative verification.

---

## 5. Google Sign-In & Student Onboarding

SolveSphere AI supports **Continue with Google** via the Firebase JavaScript SDK (`GoogleAuthProvider`):

1. **Authentication Dispatch**:
   - `signInWithPopup(auth, provider)` initiates the OAuth prompt.
   - If popup is blocked by the browser, the client gracefully falls back to `signInWithRedirect(auth, provider)`.
   - On redirect return, `getRedirectResult(auth)` completes session hydration without lost state.
2. **First-Time Provisioning**:
   - If no profile exists in `users/{uid}`, an initial minimal profile is created with `role: 'STUDENT'`, verified Google email, display name, avatar URL, and `enrollmentStatus: 'INCOMPLETE'`.
   - No fictitious or synthetic enrollment IDs are generated.
3. **Profile Completion (`/auth/complete-profile`)**:
   - If a student signs in via Google without a verified enrollment, they are guided to `/auth/complete-profile`.
   - Wording explicitly instructs: *"Enter your official enrollment number. Your university must verify this information before approval."*
   - Submitting routes the request to `enrollmentRequests/{uid}` with `status: 'PENDING'`.
4. **Student ID Immutability & Protection**:
   - `firestore.rules` prevents direct client assignment of authoritative `studentId` in `updateProfile`.
   - Students cannot self-elevate `enrollmentStatus` to `VERIFIED` on create or update.
   - Client writes to `enrollmentNumbers` registry are strictly blocked (`allow write: if false;`).
   - Only authorized administrators invoking trusted callable Cloud Functions (`adminApproveEnrollment`, `adminRejectEnrollment`) can confirm or reject verification via atomic transactions.
   - Student resubmissions preserve all previous administrative review audit fields (`reviewedBy`, `reviewedAt`, `rejectionReason`).
   - Student-facing Cloud Functions (`createComplaint`, `submitQuiz`) enforce verified student enrollment before permitting official submissions.
5. **Admin Privilege Isolation**:
   - Google Sign-In **never** confers administrative authority.
   - Administrative command requires trusted, cryptographically signed custom claim `{ role: 'ADMIN' }` provisioned via server-side Admin SDK (`scripts/bootstrap-admin.js`).
   - Email address or institutional domain matching never escalates privileges.

---

## 5. Email Verification

- Verification links are dispatched via Firebase Authentication upon registration and on demand via the user's Profile page.
- Status is tracked via `user.emailVerified` directly from the authenticated Firebase User record.
- Students with pending verification receive a non-intrusive reminder banner in their portal header with options to resend the link or refresh status.

---

## 5. Session Restoration & Route Protection

- Firebase Auth uses `browserLocalPersistence` by default, maintaining sessions across browser tabs and page reloads.
- `<RequireAuth>` waits for `isLoading === false` before deciding route access, preventing redirect flickers.
- `<RequireAdmin>` inspects `role === 'ADMIN'` from the decoded JWT claims; non-admin users attempting to navigate to `/admin/*` receive an immediate `403 Forbidden` screen.

---

## 6. Password Reset & Account Recovery

- Password reset requests trigger `sendPasswordResetEmail(auth, email.trim())`.
- Returns a uniform, neutral success response to prevent account enumeration vulnerabilities.
