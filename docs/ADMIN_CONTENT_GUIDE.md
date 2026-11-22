# SolveSphere AI — How Real Data Enters the Backend

## Who feeds what
- **Students**: register with Firebase Authentication, maintain their permitted profile fields, submit their own complaints, answer server-graded quizzes, track study progress and ask AI questions.
- **Academic administrators/faculty**: authorize and maintain subjects, syllabus topics, study resources and published quizzes using administrative controls.
- **Campus administrators**: register official departments and clubs, review/assign complaints, verify incident clusters and publish sanitized public incident updates.
- **System Cloud Functions**: generate ticket references, timeline events, AI usage records, notification events, AI suggestions and background cluster state. Staff must not manually forge these.

## Dedicated UI entry points verified in source
- `/admin/subjects`, `/admin/topic-updates`, `/admin/resources` route to `AdminAcademicManagementPage`. Full CRUD operations for accredited subjects, syllabus topics, study resources, and multiple-choice quizzes are supported with backend validation.
- `/admin/departments` routes to `AdminDepartmentsPage`. Real Firestore subscription, create/edit modal with field allowlist validation (`adminManageDepartment`), active/inactive status toggle, and genuine EmptyState.
- `/admin/clubs` routes to `AdminClubsPage`. Real Firestore subscription, create/edit modal with field allowlist validation (`adminManageClub`), archive action, and genuine EmptyState.
- `/admin/complaints`, `/admin/clusters`, `/admin/assignments` route to `AdminComplaintsClustersPage`.
- `/portal/subjects`, `/portal/timeline`, `/portal/resources`, `/portal/practice`, `/portal/campus`, `/portal/tickets`, `/portal/clubs` are student reading/participation routes.

## Source of truth and quality rules
1. Provision a separate institution-owned Firebase project, Auth, Firestore, Storage and trusted admin role.
2. Confirm admin forms write to the current collections through authorized operations, with validation and audit.
3. Enter real academic-year subjects and topic records, then upload vetted resources and quizzes.
4. Populate official department and club records using verified contact details; no fabricated membership counts.
5. Let actual students create their own tickets and progress. Do not insert sample identities.
6. Use zero-data empty states until the institution supplies content.
7. Run emulator authorization tests, staging E2E tests and a data provenance review before release.

## Safe Data Administration Standards
- **Zero-Deletion Policy**: Live database records are never purged automatically by deployment scripts.
- **Dry-Run Audit**: Run `scripts/inventory-sample-data.js` to inspect and catalog any legacy sample/demo documents without performing writes or deletes.
- **Owner-Approved Cleanup**: Follow [docs/DATA_INVENTORY_AND_CLEANUP.md](DATA_INVENTORY_AND_CLEANUP.md) for multi-step authorized sample record cleanup if needed on staging or pre-production environments.
- **Subscription Reliability**: All student and admin Firestore subscriptions include error callbacks rendering visible `role="alert"` banners when permissions or network access fail.

## Safe import pattern
For official institution-provided CSV/JSON content, use a separate dry-run importer with schema validation, preview, provenance, project-ID check, and explicit confirmation. Do not repurpose `scripts/seed-firebase.js` as a cloud importer.
