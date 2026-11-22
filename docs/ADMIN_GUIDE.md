# SolveSphere AI — Administrator Guide

## Access
Authenticate with the institution-approved administrator account and verify the Firebase custom claim `role: 'ADMIN'`. The client-side route guard alone is not authorization; the backend validates claims again.

## Academic administration
The routes `/admin/subjects`, `/admin/topic-updates` and `/admin/resources` are wired to `AdminAcademicManagementPage`. Use approved institution course names, semester, topic status and vetted resource links. Never enter fictional profiles or pre-award quiz scores. Publish quiz questions only through the protected question-bank workflow.

## Campus service desk
Use `/admin/complaints` and `/admin/clusters` to triage actual submitted tickets, assign existing active departments, record lifecycle transitions and verify incident grouping. AI duplicate suggestions are not official resolutions. Students must retain ownership of their individual tickets. Review audit timelines before closing.

## Departments and clubs
The service layer offers trusted `adminManageDepartment` and `adminManageClub` operations. **Known UI gap:** `/admin/departments` and `/admin/clubs` currently route to the generic admin dashboard; add and verify dedicated forms before calling these flows complete.

## Sensitive reports
The Speak Freely direct submission workflow is disabled. Do not imply anonymity or manually bypass its privacy guard.

## Daily operations
Check errors in Functions logs without leaking complaint/AI personal content; review scheduler, quota and billing alerts; check incident queues, failed clustering attempts and department accuracy. Do not run emulator sample seeding against live Firestore.

## Before publication
Confirm every course, department, club and administrator profile with authorized institution staff. Record changes and rollback choices. See `docs/REAL_DATA_ONBOARDING.md` and `docs/DEPLOYMENT_RUNBOOK.md`.
