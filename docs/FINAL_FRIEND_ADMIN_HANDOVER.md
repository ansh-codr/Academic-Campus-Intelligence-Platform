# SolveSphere AI — Final Friend & Administrator Handover

**Release label:** Development hosting handover — NOT full production deployment
**Prepared:** 22 November 2026
**Application:** SolveSphere AI — *Your Problems. Our Smart Solutions.*
**Repository:** https://github.com/ansh-codr/Academic-Campus-Intelligence-Platform
**Web app:** https://solvesphere-ai-dev-2026.web.app
**Administrator login:** https://solvesphere-ai-dev-2026.web.app/auth/admin-login
**Student login:** https://solvesphere-ai-dev-2026.web.app/auth/login
**Firebase project:** `solvesphere-ai-dev-2026` (development / Spark, reported)
**Firebase console:** https://console.firebase.google.com/project/solvesphere-ai-dev-2026/overview

> **Do not send a password, API secret, service-account file, or administrator recovery code with this document.** This guide includes no valid live administrator credentials. Live administrator provisioning and project ownership transfer must be expressly approved by the current owner.

## 1. What the receiver actually gets

- A hosted React/Vite web frontend connected to the development Firebase project.
- Firebase Authentication flows for Email/Password and Google sign-in; student onboarding and enrollment-approval screens.
- Firestore-backed academic/campus data models and reviewed Firestore rules/index configurations.
- Trusted Cloud Functions code for enrollment approval, grading, complaints, admin tools, clustering and Gemini AI, with emulator tests.
- Backend architecture, Firebase setup, admin/student guides, data model, real-data onboarding and deployment/rollback instructions in `docs/`.

**Operational limitation:** Live Cloud Functions, Storage and Gemini inference are NOT confirmed deployed to the Spark project. Therefore admin enrollment approvals, server-graded quiz submission, official complaint submission, Gemini AI, and private file uploads should be considered unavailable on the hosted site until the required services are deployed and tested. The live website itself is not proof of end-to-end backend readiness.

## 2. How an authorized friend logs in as administrator

1. The owner confirms whether the friend will operate this **existing development Firebase project** or their own institution-controlled project. GitHub access and Firebase access are separate.
2. The owner invites the friend to GitHub with an appropriate role; Firebase Console access requires separate Google Cloud/Firebase IAM permissions. Grant least privilege.
3. The owner or a duly authorized Firebase project administrator provisions a dedicated Firebase Authentication account with a **trusted custom claim** `{ role: 'ADMIN' }` using the reviewed `scripts/bootstrap-admin.js` and [ADMIN_ACCOUNT_PROVISIONING.md](ADMIN_ACCOUNT_PROVISIONING.md), or a vetted equivalent privileged process. This operation is **not** performed merely by sharing this handover.
4. Before executing a live bootstrap, confirm the target project ID exactly, obtain explicit authorization, use a new unique strong password through a secure input method and verify that emulator host variables are unset. Do not reuse sample credentials.
5. The account holder visits the [Admin login](https://solvesphere-ai-dev-2026.web.app/auth/admin-login), signs in, refreshes their Firebase session/token after custom-claim provisioning, and opens `/admin/dashboard`.
6. If the dashboard denies access, verify Firebase user identity, custom claim, disabled-user status, email verification requirements and profile synchronization. **A Firestore `role: 'ADMIN'` field alone does not grant admin access.**
7. Deliver the initial password or password-reset invitation through an appropriate *separate secure channel*. Require password rotation and review administrator access after ownership transfer.

**Never use demo credentials from tests or emulators for live login.** No working admin login is claimed in this document because a live admin account/claim has not been independently verified in this review.

## 3. First login: administrator's checklist

1. Check `/admin/dashboard` loads real operational metrics without fictional records.
2. Review `/admin/enrollments`; compare each request with independently authorized institutional records before approval. The server must reserve a unique roll number transactionally.
3. Inspect `/admin/students`; never mark a user verified simply because they own a Google account.
4. Register authentic departments at `/admin/departments` and clubs at `/admin/clubs`.
5. Add real subjects, topics, official resources and reviewed quizzes through `/admin/subjects`, `/admin/topic-updates` and `/admin/resources`.
6. Use `/admin/complaints` and `/admin/clusters` only when deployed backend functions are available.
7. Review `/admin/analytics` and `/admin/settings`, keeping cost and authorization status visible.
8. Verify a separate non-admin student cannot open any administrator page or read private data.

Do not bulk-seed a real institution project from `scripts/seed-firebase.js`.

## 4. Student onboarding and approval

1. Student opens [Student login](https://solvesphere-ai-dev-2026.web.app/auth/login) and authenticates with Google or Email/Password.
2. Student completes `/auth/complete-profile` with a **claimed** enrollment number, department and semester.
3. The claim is submitted as `PENDING` in `enrollmentRequests/{uid}`. It is not verified merely because a form was submitted.
4. An authorized administrator checks the student's identity against genuine institution records.
5. When the trusted Cloud Function is deployed, admin approval marks `users/{uid}.enrollmentStatus = VERIFIED` and creates a transactional unique enrollment reservation.
6. Rejected requests show a reason and may be corrected. **Already verified status must not be casually revoked by the rejection workflow.**
7. A verified student can use protected complaints and official grading only when their live backend services exist and pass testing.

## 5. Development deployment and production migration

**Development web frontend:** Firebase Hosting deployment has been reported for `solvesphere-ai-dev-2026`. The most recent source-only cleanup commits have **not** been verified as newly redeployed.

For an authorized web-only deployment from a clean working copy:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run test:ui
npm run build:web
firebase projects:list
firebase deploy --only hosting --project solvesphere-ai-dev-2026
```

Before building, configure the Vite `apps/web/.env.production` **locally with the actual public Firebase Web App configuration**; do not commit Gemini/server secrets. Review OAuth authorized domains and CSP. This command deploys **Hosting only**.

For full institutional services: receiving owner must explicitly approve required Firebase Blaze billing, Cloud Storage, Cloud Functions, Secret Manager and Gemini credentials. Verify indexes and Storage Security Rules; deploy each resource to an explicitly confirmed project and test scheduled clustering, protected grading, complaint lifecycle, real inference and attachments. Never assume a budget alert automatically stops spending.

**Recommended ownership:** use an institution/friend-controlled Firebase production project distinct from this development project. Do not transfer private student data without separate authorization and a documented migration plan.

## 6. Security and recovery

- GitHub Secret Scanning previously detected a Firebase Web App API key in repository history. It was removed from current test code and example configuration; **the historical alert still requires correct GitHub classification/review**. Firebase Web API keys are client identifiers, but should have suitable restrictions.
- Never commit a Google Cloud service-account private key, Gemini API key, administrator password, or raw OAuth token.
- Authenticate privileged actions with Firebase Auth custom claims on a trusted backend. Firestore Rules are the live authority for direct browser reads/writes.
- Keep private student profiles, complaints, quiz answers, incident cluster raw data and uploaded attachments access-restricted.
- Back up Firestore/Storage and test restoration **before** destructive migrations; do not delete unknown seeded data.
- On an incident: disable compromised accounts, rotate affected privileged secrets, inspect audit logs, constrain AI/scheduled execution and restore last verified code/rules.

## 7. Verification before accepting handover

| Check | Acceptance criterion |
|---|---|
| Hosted website | Correct URL loads; SPA routes reload; no console errors |
| Google/Email Auth | Real owner-approved account login/logout and recovery verified |
| Enrollment | PENDING → trusted ADMIN approval → VERIFIED tested in the target environment |
| Privilege isolation | Student denied ADMIN routes, roster and other private records |
| Backend | All intended Cloud Functions deployed and working, or limitation explicitly accepted |
| Academic | Real subject, topic, draft/published quiz, server-graded attempt tested |
| Campus | Department/club, ticket lifecycle, alerts, incident review tested |
| AI | Real Gemini StudyMate/Campus Care calls verified with approved billing and secret |
| Storage | Valid attachments upload privately; unauthorized access denied |
| Operations | Billing, backups, alerts, rollback and access ownership documented |
| GitHub | PR merged, checks green, secret-scanning alerts reviewed |
| Credentials | Friend has own authorized ADMIN account and secure password reset/recovery |

Do not claim **production verified** until every required full-system item above has passed.

## 8. Handover signoff

- **Original owner:** ____________________  Date: __________
- **Receiving technical owner:** ____________________  Date: __________
- **Receiving campus administrator:** ____________________
- **Exact project transferred:** ____________________
- **Backend deployment status:** Development only / Full backend verified (circle one)
- **Billing authorization:** No / Yes (circle one)
- **Secret scanning alert disposition:** ____________________
- **Known outstanding issues:** ____________________

**Additional references:** `docs/BACKEND_ARCHITECTURE.md`, `docs/FIRESTORE_DATA_MODEL.md`, `docs/AUTHENTICATION_ARCHITECTURE.md`, `docs/ADMIN_ACCOUNT_PROVISIONING.md`, `docs/REAL_DATA_ONBOARDING.md`, `docs/DEPLOYMENT_RUNBOOK.md` and `docs/FRIEND_HANDOVER.md`.
