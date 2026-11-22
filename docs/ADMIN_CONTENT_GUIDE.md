# SolveSphere AI — How Real Data Enters the Backend

## Who feeds what
- **Students**: register with Firebase Authentication, maintain their permitted profile fields, submit their own complaints, answer server-graded quizzes, track study progress and ask AI questions.
- **Academic administrators/faculty**: authorize and maintain subjects, syllabus topics, study resources and published quizzes using administrative controls.
- **Campus administrators**: register official departments and clubs, review/assign complaints, verify incident clusters and publish sanitized public incident updates.
- **System Cloud Functions**: generate ticket references, timeline events, AI usage records, notification events, AI suggestions and background cluster state. Staff must not manually forge these.

## Existing UI entry points verified in source
- `/admin/subjects`, `/admin/topic-updates`, `/admin/resources` route to `AdminAcademicManagementPage`. Check what forms are implemented before relying on all CRUD actions.
- `/admin/complaints`, `/admin/clusters`, `/admin/assignments` route to `AdminComplaintsClustersPage`.
- **Important current gap:** `/admin/departments`, `/admin/clubs`, `/admin/students` and `/admin/settings` currently route to the generic `AdminDashboardPage`. Their dedicated administration interfaces are not yet independently verified. The backend has callable department and club management methods, but do not claim end-to-end admin CRUD until real forms are implemented and tested.
- `/portal/subjects`, `/portal/timeline`, `/portal/resources`, `/portal/practice`, `/portal/campus`, `/portal/tickets`, `/portal/clubs` are student reading/participation routes.

## Source of truth and quality rules
1. Provision a separate institution-owned Firebase project, Auth, Firestore, Storage and trusted admin role.
2. Confirm admin forms write to the current collections through authorized operations, with validation and audit.
3. Enter real academic-year subjects and topic records, then upload vetted resources and quizzes.
4. Populate official department and club records using verified contact details; no fabricated membership counts.
5. Let actual students create their own tickets and progress. Do not insert sample identities.
6. Use zero-data empty states until the institution supplies content.
7. Run emulator authorization tests, staging E2E tests and a data provenance review before release.

## Known implementation gaps to close before completion
- Dedicated admin department/club content-entry screens need explicit UI verification or implementation.
- Academic administration requires a complete form-by-form validation pass for subject/topic/resource/quiz CRUD.
- An authenticated club membership backend is not implemented by the directory page; the demo join toggle has been removed.
- Existing stored sample documents need an owner-approved inventory/backup/cleanup procedure; source changes do not erase them.
- Production-ready error display for all real-time Firestore subscriptions and metrics should be checked under permission/network failures.

## Safe import pattern
For official institution-provided CSV/JSON content, use a separate dry-run importer with schema validation, preview, provenance, project-ID check, and explicit confirmation. Do not repurpose `scripts/seed-firebase.js` as a cloud importer.
