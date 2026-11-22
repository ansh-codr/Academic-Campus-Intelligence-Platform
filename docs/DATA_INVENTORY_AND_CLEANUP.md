# SolveSphere AI — Data Inventory & Safe Handover Review

**Document ID:** `SOLVESPHERE-OPS-008`  
**Version:** 1.1.0  
**Target Environment:** Firebase Firestore (Emulator, Staging, Production)  
**Strict Policy:** **Zero Deletion of Live Production Records**

---

## 1. Executive Policy & Non-Destructive Standard

Under Phase 8 real-data handover, SolveSphere AI enforces that:
1. **The inventory tool (`scripts/inventory-sample-data.js`) is strictly read-only.** It contains zero deletion logic, performs zero mutations, and refuses destructive flags.
2. **Ambiguous provenance is separated from explicit sample data.** A document with `[DEMO]` in its title is never automatically classified as disposable; human inspection is required to avoid deleting genuine university test-pilot courses or student clubs.
3. **Candidate sample documents require explicit provenance tags**, such as `isSampleData: true` or `isDemoFixture: true`.
4. **Live database records are never purged automatically** by test suites, deployment scripts, or CI/CD pipelines.
5. **Zero data deletion in production:** Production deployments begin with empty Firestore collections displaying authentic Empty States, rather than mock records.

---

## 2. Sample Data vs. Production Data Classification

| Classification | Determining Condition | Handover Action |
| :--- | :--- | :--- |
| **Explicit Sample Data** | `isSampleData: true`, `isDemoFixture: true`, or `sampleRecord: true` | Cataloged in audit inventory as safe candidate for developer removal in emulator/sandbox environments. |
| **Ambiguous Provenance** | Contains `[DEMO]` in title/name without explicit `isSampleData` flag | Reported in a distinct category for manual institutional administrator review. Never auto-deleted. |
| **Production Data** | Real university records created by authenticated users | Retained permanently. Zero mutations. |

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

## 3. Running the Read-Only Inventory Tool

The repository provides `scripts/inventory-sample-data.js`, which inspects all target collections without executing any write or delete operations.

### Local Emulator Inspection
```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/inventory-sample-data.js
```

### Production / Staging Project Dry-Run
```bash
GCLOUD_PROJECT=your-institution-firebase-project node scripts/inventory-sample-data.js
```

The script produces:
1. A categorized breakdown of total documents, explicit sample documents, ambiguous documents, and genuine production records.
2. A machine-readable audit report saved to `./sample-data-inventory-report.json`.
3. Guarantees zero mutations or deletions to the database.

---

## 4. Owner-Authorized Future Cleanup Procedure

If university stakeholders review `./sample-data-inventory-report.json` and grant explicit authorization to remove sample records from a pre-production or staging project, the following protocol must be observed:

1. **Perform a Full Firestore Export Backup**:
   ```bash
   gcloud firestore export gs://[YOUR_BACKUP_BUCKET]/pre-cleanup-backup --project=[YOUR_PROJECT_ID]
   ```

2. **Manually Review Document IDs**:
   Inspect `./sample-data-inventory-report.json` to verify that every document ID slated for removal is an acknowledged demo document. Ambiguous documents must be individually verified by the institution administrator.

3. **Targeted Non-Recursive Deletion**:
   Execute deletions only against an explicit allowlist of approved document IDs. Never delete recursively or drop entire collections.

4. **Re-Run Inventory Verification**:
   Re-run `scripts/inventory-sample-data.js` to confirm the explicit sample count is 0 and all production records remain intact.
