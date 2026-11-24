# SolveSphere AI

SolveSphere connects student enrollment, academic resources and practice assessments with campus maintenance tickets. The React app uses Firebase Authentication, Firestore, Storage and TypeScript callable Functions. The browser and backend share validation contracts in `packages/shared`.

## Run locally

Use Node 22, Java 21 and Firebase CLI 15.37.0. From the repository root run:

```sh
npm ci
npm run build
firebase emulators:start --project demo-solvesphere --only auth,firestore,functions,storage
```

In another terminal start the web client:

```sh
VITE_USE_FIREBASE_EMULATOR=true VITE_FIREBASE_PROJECT_ID=demo-solvesphere \
VITE_FIREBASE_STORAGE_BUCKET=demo-solvesphere.appspot.com npm run dev:web
```

Register a student, complete the institutional profile, and follow the email verification link in the Auth emulator output. An administrator reviews the enrollment request. Verified students can submit a ticket without an attachment or an AI key. Ticket creation writes the reference number and initial timeline event together. The background trigger groups related tickets by location and category. StudyMate and Campus Care use test responses in the emulator.

To provision an emulator administrator, set `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `GCLOUD_PROJECT=demo-solvesphere`, `ADMIN_EMAIL` and a local `ADMIN_PASSWORD` in the same shell, then run `npm run admin:bootstrap`.

## Verification

```sh
npm run typecheck
npm run build
npm run test:unit
npm audit --audit-level=high
firebase emulators:exec --project demo-solvesphere --only auth,firestore,functions,storage 'node tests/firebase.test.js'
```

The integration script uses the Auth, Firestore, Functions and Storage emulators. It combines Admin SDK fixture setup, client SDK requests, callable invocations, and direct checks of clustering helpers. The audit report distinguishes browser checks, emulator scenarios and live verification.

## Production services

| Capability | Requirements |
|---|---|
| Hosting, email/password or Google sign-in, course browsing | Configured Firebase web app and authorized domains. Hosting, Authentication and Firestore have usage limits on Spark. |
| Enrollment review, official tickets and quiz grading | Deployed callable Functions, Firestore rules and indexes, and Blaze billing. |
| Ticket attachments and academic file uploads | Configured Cloud Storage bucket, Storage rules and Blaze billing. |
| Background ticket clustering | Deployed Firestore trigger and scheduled recovery. Location matching is available without Gemini. |
| StudyMate, Campus Care and AI complaint enhancement | Deployed Functions and a Gemini secret. Optional semantic clustering uses the same secret. |
| Speak Freely | Submissions stay closed pending independent zero-knowledge privacy certification. |

[Owner setup and deployment](docs/AUDIT_OPERATIONS.md) · [Audit findings and verification](docs/AUDIT_RESULTS.md) · [Data model](docs/FIRESTORE_DATA_MODEL.md)
