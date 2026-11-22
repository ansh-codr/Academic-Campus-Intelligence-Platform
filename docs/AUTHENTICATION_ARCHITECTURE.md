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

## 3. Student Registration Flow

1. Student enters full name, university email, student ID, and password.
2. Frontend validates payload using `StudentRegisterSchema` (`packages/shared/src/schemas/auth.schema.ts`).
3. `createUserWithEmailAndPassword(auth, email, password)` provisions Firebase Auth account.
4. `updateProfile(user, { displayName })` registers display name.
5. `sendEmailVerification(user)` dispatches official verification link.
6. A genuine profile is created in `users/{uid}` via Firestore client SDK with:
   - `id`: matching Auth UID
   - `email`: verified email
   - `fullName`: student's full name
   - `studentId`: student's enrollment identifier
   - `role`: `'STUDENT'` (immutable by client)
   - `emailVerified`: false
   - `createdAt`: ISO 8601 timestamp
7. Profile document write: The Firestore client SDK creates the initial profile in `users/{uid}`. If initial profile synchronization encounters a transient network issue, authentication errors (`authError`) and profile synchronization errors (`profileError`) are cleanly isolated. The user's genuine Auth identity is safely retained, and a dedicated retry mechanism is provided without deleting the Auth account on ambiguous network conditions.

---

## 4. Email Verification

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
