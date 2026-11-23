# SolveSphere AI — Transition from Demo Fixtures to Real Institutional Data

## Goal
**Real data comes from authenticated students and authorized institutional administrators**, not from code-shipped fixture arrays or automatic cloud seeding. The target for production is an empty, trustworthy Firestore database until staff enter approved content.

## Confirmed legacy demo dependencies found on main (Phase 7)
- `apps/web/src/services/academicService.ts` imports academic fixtures and falls back to them for subject listings, syllabus, resources, quizzes and some grading paths.
- `apps/web/src/services/campusService.ts` imports campus fixtures and uses them when reads fail or return no data.
- `apps/web/src/services/adminService.ts` imports fixture dashboard KPIs, activity and workload; a few privileged operations still contain direct-Firestore fallbacks after callable failures.
- `apps/web/src/pages/student/CampusClubsPage.tsx` initializes a pre-joined demo club ID.
- `scripts/seed-firebase.js` loads sample subjects, quizzes, departments, clubs and ticket examples; it has safety guards but is **not** a production content onboarding path.
- `apps/web/src/fixtures/` contains static demonstration records.

**Do not delete fixtures until all production imports and regression tests have been migrated.** Keep test-only fixtures in `tests/fixtures/` where needed.

## Required implementation steps
1. Remove production imports of `FIXTURE_*` in all web services, pages and layouts. Replace with typed Firestore reads and listeners; empty collection -> empty state, permission error -> visible actionable error; no silent fabricated fallback.
2. Remove client-side mock quiz scores and synthetic question banks. Only trusted quiz functions can return official questions/results. Error state must not look like a completed attempt.
3. Remove direct client write fallback for any official ticket status, administrator assignment, admin academic change or cluster verification. Show callable error instead.
4. Replace sample KPIs with server-authorized Firestore aggregates (or bounded queries), including loading, error and zero-data states.
5. Ensure admin forms for subject, syllabus topic, resource, quiz, department and club can create/edit actual records. If any workflow is missing, implement it instead of relying on a seed script. Record required validation, ownership and role policies.
6. Replace hardcoded membership, activities, and incident banners with actual authorized records. Club joins require a real membership model and backend authorization; until implemented, show 'not available' rather than recording an imaginary join.
7. Remove all demo seed execution from startup, build, deploy, and CI paths. Keep emulator-only fixture generation separate from real content onboarding.
8. Add negative tests: empty Firestore must return no fabricated records; Firestore unavailable must surface an error; unauthorized user cannot add official data; old fixture references must not appear in production bundles.
9. Verify staging via two genuine student accounts and an administrator, with institution-approved test data, before production launch.

## Real onboarding order (no fixtures)
1. Owner provisions independent Firebase project and grants scoped admin access.
2. Administrator navigates to dedicated admin interfaces to enter genuine institutional data:
   - `/admin/departments` (`AdminDepartmentsPage`): Enter campus maintenance departments, contact emails, category tags, and operational dispatch settings.
   - `/admin/subjects` (`AdminAcademicManagementPage`): Enter verified subjects, semester metadata, course codes, and syllabus topics.
   - `/admin/resources`: Attach faculty-approved curriculum resources and vetted study materials.
   - Quiz Management modal on `/admin/subjects`: Draft or validate and publish protected assessments with mandatory non-empty options and explanations. Answer keys are securely stored in protected subcollections.
   - `/admin/clubs` (`AdminClubsPage`): Register recognized student organizations, faculty contacts, and meeting schedules.
3. Students register their own accounts (`role: 'STUDENT'`), view active course syllabi, take published assessments graded server-side, and submit campus maintenance complaints.
4. Campus triage administrators manage lifecycle transitions and inspect semantic incident clusters at `/admin/complaints` and `/admin/clusters`.
5. AI summarizes and suggests, but never invents official incidents or marks them verified.

## Architecture and Current Environment Limitations
- **GCP & Firebase Infrastructure**: SolveSphere AI exclusively targets Google Cloud / Firebase (Authentication, Cloud Firestore, Cloud Storage, TypeScript Cloud Functions) and Google Gemini AI. Alternative backends (e.g. AWS, Supabase, Prisma) are prohibited.
- **Verification Status**: In-depth automated integration, AI accuracy, security rules, and client build tests pass 100% under the local Firebase Emulator Suite. However, **live production deployment to a live Google Cloud / Firebase project and live Gemini inference quota** have not yet been performed and must be verified by the receiving organization following `docs/DEPLOYMENT_RUNBOOK.md` and `docs/FRIEND_HANDOVER.md`.

## Existing sample data in Firestore
Changing code **does not delete documents already seeded in a database**. Before considering removal:
- Identify affected project, collection, document ID and `isSampleData` provenance.
- Export/backup and review each record with the owner.
- Never perform bulk deletion or infer sample status from a human name or title alone.
- Use an explicit dry-run report and a separately approved, reversible migration when deletion is necessary.
- Do not purge test or production records in this documentation/handover phase.

## Acceptance gate
Release blocked until a fresh empty Firebase emulator/staging data store displays zero fictional content, all real content entry works with role checks, quiz scores remain server-trusted, and positive/negative tests pass.
