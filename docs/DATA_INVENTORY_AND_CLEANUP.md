# SolveSphere AI — Data Inventory & Safe Cleanup Plan

**Document ID:** `SOLVESPHERE-OPS-008`  
**Version:** 1.0.0  
**Target Environment:** Firebase Firestore (Emulator, Staging, Production)  
**Strict Policy:** **Zero Deletion of Live Production Records**

---

## 1. Executive Policy

Under Phase 8 real-data handover, SolveSphere AI mandates that:
1. **Live database records are never deleted automatically** by migration scripts, tests, or deployment triggers.
2. Production applications display genuine empty states when a university department or academic registry is empty, rather than synthesizing mock records.
3. Development seed scripts (`scripts/seed-firebase.js`) are strictly blocked from running against live Firebase projects unless multi-step environment flags are set.
4. Any cleanup of legacy demonstration records must run in a dry-run audit mode first, generating an inventory for university administrator approval.

---

## 2. Sample Data vs. Production Data Contract

All documents in Firestore collections adhere to the following contract:

| Field | Production Data | Demonstration / Sample Data |
| :--- | :--- | :--- |
| `isSampleData` | `false` or absent | `true` |
| `submittedById` / `uploadedById` | Valid Firebase Auth UID | `demo-*` or `seed-*` |
| Authoritative Source | University Faculty / Facilities Admin | `scripts/seed-firebase.js` / test fixtures |

### Monitored Collections
- `subjects`: Accredited university courses.
- `syllabusTopics`: Curricular units with live pacing status (`COMPLETED`, `ONGOING`, `UPCOMING`).
- `resources`: Faculty-approved slides, practice sheets, and documents.
- `quizzes`: Continuous assessments and question banks.
- `departments`: Campus facilities and maintenance teams.
- `campusClubs`: Student organizations and societies.
- `complaints`: Infrastructure maintenance tickets.
- `issueClusters`: Semantic clusters of campus issues.
- `publicIncidents`: Sanitized student-safe maintenance advisories.

---

## 3. Running the Dry-Run Inventory Tool

The repository provides `scripts/inventory-sample-data.js`, which inspects all target collections without executing any write or delete operations.

### Local Emulator Verification
```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/inventory-sample-data.js
```

### Production / Staging Project Dry-Run
```bash
GCLOUD_PROJECT=your-institution-firebase-project node scripts/inventory-sample-data.js
```

The script produces:
1. Console breakdown of total documents, sample documents, and genuine production documents per collection.
2. A machine-readable audit report saved to `./sample-data-inventory-report.json`.
3. Zero mutations to the database.

---

## 4. Multi-Step Owner-Approved Cleanup Procedure

If university stakeholders review `./sample-data-inventory-report.json` and grant explicit authorization to remove sample records from a pre-production or staging project:

1. **Perform a Firestore Export Backup**:
   ```bash
   gcloud firestore export gs://[YOUR_BACKUP_BUCKET]/pre-cleanup-backup --project=[YOUR_PROJECT_ID]
   ```

2. **Execute Authorized Cleanup**:
   ```bash
   GCLOUD_PROJECT=[YOUR_PROJECT_ID] \
   CONFIRM_CLEANUP_PROJECT_ID=[YOUR_PROJECT_ID] \
   EXECUTE_SAMPLE_CLEANUP=true \
   node scripts/inventory-sample-data.js
   ```

3. **Verify Integrity**:
   Re-run the inventory script in dry-run mode to confirm sample count is 0 and production records remain unchanged.
