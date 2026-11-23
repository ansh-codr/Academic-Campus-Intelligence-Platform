# SolveSphere AI — Administrator Account Provisioning Runbook

Admin accounts possess privileged authority across curricula, continuous assessment banks, department triage, and incident clustering. They must **never** be created through public registration.

---

## 1. Security Requirements

- **Privileged Tooling Only:** Provisioning must only be executed through `scripts/bootstrap-admin.js` via the Firebase Admin SDK.
- **Explicit Project Identification:** Requires an explicit `GCLOUD_PROJECT` or `FIREBASE_PROJECT_ID` targeting the verified environment.
- **Production Guard Flag:** Live execution strictly requires `CONFIRM_PROD_ADMIN_BOOTSTRAP="true"`.
- **High-Entropy Password Policy:** Live passwords must be at least 12 characters and contain uppercase, lowercase, numbers, and symbols. Banned or known dictionary passwords are rejected automatically.
- **Audit Logging:** Every bootstrap operation records an entry in the `adminAuditLogs` collection in Firestore.

---

## 2. Local Emulator Mode

When testing locally against the Firebase Emulator Suite:

```bash
# Start emulators in terminal 1
firebase emulators:start --project demo-solvesphere --only auth,firestore,functions,storage

# Point terminal 2 to the same demo project as the emulators.
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export GCLOUD_PROJECT=demo-solvesphere ADMIN_EMAIL=admin@example.test
read -rs -p "Local password: " ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run admin:bootstrap
```

This provisions the supplied email in the Auth Emulator with `{ role: 'ADMIN' }` claims.

---

## 3. Live Staging / Production Provisioning

To provision an authorized institutional administrator against a live Firebase project:

```bash
# 1. Set environment variables
export CONFIRM_PROD_ADMIN_BOOTSTRAP="true"
export GCLOUD_PROJECT="your-production-firebase-project-id"
export ADMIN_EMAIL="verified-admin@institution.edu"
export ADMIN_NAME="Prof. Executive Name"
read -rs -p "Administrator password: " ADMIN_PASSWORD
export ADMIN_PASSWORD

# 2. Run bootstrap script with Node.js
node scripts/bootstrap-admin.js
```

### Password Rotation on Existing Accounts
If the account already exists in Firebase Auth, `scripts/bootstrap-admin.js` preserves the existing password by default. To explicitly update the password, set:

```bash
export OVERWRITE_EXISTING_ADMIN_PASSWORD="true"
```

---

## 4. Verification

1. Log into the administrative portal at `/auth/admin-login` with the provisioned credentials.
2. Confirm access to `/admin/dashboard`, `/admin/departments`, `/admin/clubs`, and `/admin/subjects`.
3. Inspect `adminAuditLogs` collection in Firestore to verify the audit trail.
