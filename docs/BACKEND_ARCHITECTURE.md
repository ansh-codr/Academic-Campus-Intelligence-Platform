# SolveSphere AI — Backend Architecture

**Status:** Source-based architecture reference. This is not proof of a live deployment.

## Stack and source of truth
- Firebase Authentication manages identity; administrator authorization is the Firebase custom claim `role: 'ADMIN'`, not a client-supplied profile role.
- Cloud Firestore is the application record store; Storage holds authorized complaint attachments and academic assets.
- Firebase Cloud Functions (source: `functions/src/`) perform trusted operations. Firebase Security Rules (`firestore.rules`, `storage.rules`) protect direct client access.
- Gemini runs server-side in `functions/src/studymate.ts` and `functions/src/campusCare.ts`; `GEMINI_API_KEY` is bound through Secret Manager.
- The web client uses `apps/web/src/lib/firebase.ts` and services under `apps/web/src/services/`. Never place secret keys or Admin SDK credentials in Vite variables.

## Function entry points
`functions/src/index.ts` exports callable complaints creation/reopen, administrator status/assignment/department/club/cluster operations, academic quiz and topic operations, StudyMate AI and Campus Care AI. Complaint-clustering also uses a Firestore document-created trigger and a scheduled lease-recovery worker.

### Complaint lifecycle
1. Signed-in student calls `createComplaint`. Trusted function validates input, stamps `submittedById`, allocates a reference number transactionally, and creates initial timeline.
2. Student reads only their ticket; admins can review all tickets.
3. Admin actions use custom-claim authorization and write status/assignment plus timeline events.
4. The background clustering trigger compares bounded candidate tickets, uses a lease and coordination documents, and produces *suggested* incident clusters; administrator verification is separate.
5. Notifications are stored in `notifications`; event-based IDs guard duplicate delivery.
6. Sensitive `anonymousReports` direct writes remain disabled pending a reviewed privacy design.

### Academic lifecycle
- Admin-managed Firestore subjects, syllabus topics, study resources, quizzes and protected question subcollections are authoritative.
- Quiz questions and server-side grading flow through trusted Functions; students should not read protected answer keys.
- `studentStudyProgress`, `quizAttempts`, `enrollments` and AI conversations have user-scoped authorization.
- Student progress, quiz results, and teacher-provided materials must come from real authorized inputs, not fictional preset documents.

## Operational data domains
See `docs/FIRESTORE_DATA_MODEL.md` for the collection inventory and permissions. Verify actual fields against TypeScript contracts and Firebase Rules before schema migrations.

## Important boundaries
- AI recommendations never independently submit tickets, assign official departments, or resolve incidents.
- The emulator's deterministic mock inference is not real Gemini inference.
- Cloud Functions Admin SDK bypasses Firestore client rules, so function authorization, validation and logging are mandatory.
- Firestore indexes, Secret Manager bindings, staging/production projects, billing and actual deployed endpoints must be verified by the owner.

## Source map
- Functions: `functions/src/{complaints,admin,academic,studymate,campusCare,notifications}.ts`
- Web services: `apps/web/src/services/{campusService,adminService,academicService,campusCareService,studyMateService}.ts`
- Type contracts: `packages/shared/src/`
- Rules: `firestore.rules`, `storage.rules`
- Deployment: `firebase.json`, `.firebaserc`
- Tests: `tests/firebase.test.js` and related test scripts
