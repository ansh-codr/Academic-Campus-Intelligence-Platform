# SolveSphere AI — Ownership and Operations Handover

## Transfer goal
The receiving owner can operate this repository using **their own** GitHub permissions, Firebase/GCP project, billing account and Gemini credentials. No personal laptop path, account, password or API key of the original developer may be required.

## Handover package
Read in this order:
1. `README.md` — development overview (legacy seed instructions require real-data migration before production).
2. `docs/BACKEND_ARCHITECTURE.md` — trusted services and boundaries.
3. `docs/FIRESTORE_DATA_MODEL.md` — collections, Storage and access rules.
4. `docs/REAL_DATA_ONBOARDING.md` — retire fixtures and enter authentic institutional data.
5. `docs/DEPLOYMENT_RUNBOOK.md` — staging, verification, release and rollback.
6. `docs/FRIEND_HANDOVER.md` — owner signoff.

## Accounts and responsibility
- Repository: invite/transfer to receiving owner through GitHub's own permission and ownership flow, only after explicit approval.
- Firebase: receiving owner creates or is granted owner access to **their** target project(s); select the correct project alias and verify project ID before any operation.
- Billing: receiving owner approves supported Firebase/GCP billing setup and configures alerts, which are **not** hard spending caps.
- Secrets: receiving owner provisions a Gemini key in Google Secret Manager. Never send a key in chat, README or source files.
- Admin bootstrap: receiving owner explicitly authorizes a privileged initial account, uses a unique strong credential and verifies claims.
- Organization: designate a technical contact, a campus administrator, a data protection contact and an emergency incident contact.

## Handover checklist
- [ ] Receiver has repository administrator access and knows how to revoke it.
- [ ] Receiver controls verified Firebase project(s), billing, auth provider/domain and Hosting settings.
- [ ] Firebase rules, indexes, Storage rules and Functions deployed to the **intended** target.
- [ ] `GEMINI_API_KEY` provisioned and live inference verified (or explicitly noted as not verified).
- [ ] Scheduled Functions, quotas, alerting and cost assumptions reviewed.
- [ ] Security review passed for student-student and student-admin isolation.
- [ ] Real data populated by authorized faculty/administrators; fixtures absent from production.
- [ ] Account/privacy policy, retention, backup/export and incident response approved.
- [ ] Owner knows rollback procedures and recovery contact.
- [ ] Source transfer and any existing live data transfer separately authorized and documented.

## Current state
As of Phase 8 completion, real Firestore-backed services, dedicated admin management interfaces (`/admin/departments`, `/admin/clubs`, `/admin/academic`), assessment publication integrity & draft protection, read-only sample auditing, and 52 automated emulator integration/security tests exist and pass. However, **no live production deployment to Google Cloud/Firebase, live Gemini inference against production billing quotas, or receiving-owner project provisioning has been independently executed**. Do not mark handover complete before those operational steps are carried out on the receiving owner's GCP project.
