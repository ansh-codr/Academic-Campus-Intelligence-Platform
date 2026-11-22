# SolveSphere AI — Administrator Guide

## Access
Authenticate with the institution-approved administrator account and verify the Firebase custom claim `role: 'ADMIN'`. The client-side route guard alone is not authorization; the backend validates claims again.

## Student Enrollment Verification
The dedicated route `/admin/enrollments` (`AdminEnrollmentsPage`) provides real-time review of student enrollment requests.
- **Review Queue**: Review pending claims submitted by students during registration or Google profile onboarding.
- **Approval Workflow**: Click "Approve" to transactionally reserve the enrollment number in `enrollmentNumbers/{studentId}` and update the student's profile to `VERIFIED`. The reservation strictly prevents duplicate claims across accounts.
- **Rejection Workflow**: If roll numbers do not match institutional records, click "Reject" and record a mandatory explanation (e.g. "Roll number CS26019 is not on the active Computer Science 2026 roll"). The student is informed and can resubmit corrected details.
- **Student Directory**: The `/admin/students` (`AdminStudentsPage`) displays all registered student accounts with their verification status, academic department, and registration timestamp.
- **Institutional Analytics & System Settings**: `/admin/analytics` and `/admin/settings` provide live metrics and infrastructure transparency without mock placeholders.

## Academic administration
The routes `/admin/subjects`, `/admin/topic-updates` and `/admin/resources` are wired to `AdminAcademicManagementPage`. Use approved institution course names, semester, topic status and vetted resource links. Never enter fictional profiles or pre-award quiz scores. Publish quiz questions only through the protected question-bank workflow.

## Campus service desk
Use `/admin/complaints` and `/admin/clusters` to triage actual submitted tickets, assign existing active departments, record lifecycle transitions and verify incident grouping. AI duplicate suggestions are not official resolutions. Students must retain ownership of their individual tickets. Review audit timelines before closing.

## Departments and clubs
Dedicated management interfaces are fully operational at `/admin/departments` (`AdminDepartmentsPage`) and `/admin/clubs` (`AdminClubsPage`).
- `/admin/departments`: Create and edit maintenance departments, assign category specialties (e.g. Electrical, HVAC, Sanitation, General Infrastructure), specify faculty/staff heads and official contact emails, and toggle active triage routing status.
- `/admin/clubs`: Register student organizations, update descriptions, assign student leads, record meeting schedules, and archive discontinued clubs.
All changes commit directly to Firestore via authenticated `adminManageDepartment` and `adminManageClub` Cloud Functions enforcing custom claim `role === 'ADMIN'`.

## Sensitive reports
The Speak Freely direct submission workflow is disabled. Do not imply anonymity or manually bypass its privacy guard.

## Daily operations
Check errors in Functions logs without leaking complaint/AI personal content; review scheduler, quota and billing alerts; check incident queues, failed clustering attempts and department accuracy. Do not run emulator sample seeding against live Firestore.

## Architecture and Infrastructure Constraints
- The platform is strictly built upon Google Cloud / Firebase infrastructure (Firebase Authentication, Cloud Firestore, Cloud Functions TypeScript LTS, Firebase Cloud Storage) and Google Gemini AI.
- No third-party backend substitutes (AWS, Supabase, MongoDB, Prisma) are permitted.
- Live deployment to Google Cloud and live Gemini API quota validation are to be verified per the handover protocol; testing is verified through the Firebase Emulator Suite.

## Before publication
Confirm every course, department, club and administrator profile with authorized institution staff. Record changes and rollback choices. See `docs/REAL_DATA_ONBOARDING.md` and `docs/DEPLOYMENT_RUNBOOK.md`.
