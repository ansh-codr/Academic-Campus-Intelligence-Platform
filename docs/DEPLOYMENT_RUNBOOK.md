# SolveSphere AI — Firebase Staging/Production Runbook

**Do not deploy without written authorization from the project owner.** This document is operational guidance, not a deployment record.

## Before deployment
- Obtain real Firebase project IDs for staging and production. Replace placeholder aliases in `.firebaserc` with the receiver's actual project IDs. Avoid assuming that the example `solvesphere-ai-*` projects exist.
- Confirm Firebase Authentication providers, authorized domains, Firestore database, Storage bucket, required Google APIs, Firebase Functions support, and Blaze billing readiness.
- Confirm `GEMINI_API_KEY` Secret Manager access. Keep client Firebase *web configuration* distinct from private server credentials.
- Confirm required indexes in `firestore.indexes.json`, Hosting CSP/connect endpoints, Functions region, scheduled worker cost and monitoring.
- Confirm no sample data, no hardcoded demo logins, and no production fixture fallback.
- Use recent backups and a known rollback revision where applicable.

## Local check
```bash
npm ci
npm run typecheck
npm run build
npm run test:ui
npm run test:unit
npm run test:smoke-ai   # Default must say NOT VERIFIED for live provider
```
Run the full Firebase emulator test command as defined by the repo's current test setup; do not count a skipped test as live verification.

## Controlled staging release (owner authorized only)
```bash
firebase login
firebase projects:list
firebase use staging
# Confirm the resolved target project before doing anything else.
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting --project YOUR_STAGING_PROJECT_ID
```
Build web assets with the correct staging Vite configuration before deploying Hosting. Provision server secrets using the Firebase CLI **for the intended project only**. Never paste secrets into commands checked into shell history or source control.

## Staging acceptance
Check sign-up/sign-in, authorized admin access, subject/topic CRUD, protected quiz submission, StudyMate and Campus Care (real calls only when separately approved), upload permissions, complaint status transitions, worker clustering, public-incident sanitization, mobile SPA deep links and security headers.

## Production release
Require a distinct written approval and a second confirmation of project ID, Secret Manager binding, billing and live-data provenance. Deploy the reviewed commit only after staging is accepted. Record revision IDs, function versions and test evidence.

## Rollback and incidents
- Hosting: use Firebase Hosting release history/rollbacks as supported.
- Functions: redeploy a verified prior source revision; do not assume instant rollback for database migrations.
- Firestore/Storage: restore only from verified, scoped backups after impact assessment; restoring may overwrite newer data.
- Rules rollback: redeploy the last verified rules and indexes if compatible with schema.
- Disable/limit expensive scheduled or AI operations if cost anomalies occur.

## Never automate
Do not automatically grant ADMIN claims, overwrite a live project's quiz data, run `npm run seed` on production, bulk-delete old records, or transfer ownership without separate permission.
