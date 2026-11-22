# SolveSphere AI — Authentication & Security Checklist

This checklist verifies that production authentication and authorization standards are satisfied before deployment.

---

## Access Control & RBAC
- [x] Public registration and Google Sign-In only grant `{ role: 'STUDENT' }`.
- [x] Google accounts never automatically receive administrative authority; custom claims required.
- [x] Client cannot self-assign `{ role: 'ADMIN' }` on registration or profile update.
- [x] Administrative authority relies strictly on cryptographically verified custom claims (`request.auth.token.role == 'ADMIN'`).
- [x] Student profiles in `users/{uid}` cannot be modified by other students (`isOwner(userId)`).
- [x] Sensitive fields (`id`, `role`, `email`, `emailVerified`) are immutable by client writes.
- [x] Student ID can only be set once during initial profile completion (`!('studentId' in resource.data)`); immutable once set.
- [x] Route guards (`<RequireAuth>`, `<RequireAdmin>`) prevent unauthenticated and unauthorized access.

## Credential & Data Protection
- [x] Zero hardcoded passwords or API secrets in production browser bundles.
- [x] One-click demo sign-in buttons removed from production login and registration views.
- [x] Password reset responses do not reveal account existence (anti-enumeration).
- [x] Error messages provide actionable guidance without leaking internal system traces.
- [x] Secret server keys (e.g. `GEMINI_API_KEY`) managed via Google Secret Manager, not client `VITE_*` variables.

## Project & Environment Configuration
- [x] Client fail visibly if required Firebase web config is missing or placeholder in production.
- [x] Hot-module reload emulator connection guarded to prevent duplicate connections.
- [x] Production Content Security Policy (CSP) restricts script, connect, and frame origins strictly to authorized Google and Firebase domains.
- [x] Non-destructive data inventory script prevents accidental data deletion during onboarding.

## Audit & Compliance
- [x] Administrator provisioning operations logged to `adminAuditLogs`.
- [x] Student maintenance ticket status changes logged with timestamped lifecycle audit events.
- [x] Answer keys and quiz explanations protected in server-side question subcollections and stripped prior to grading.
