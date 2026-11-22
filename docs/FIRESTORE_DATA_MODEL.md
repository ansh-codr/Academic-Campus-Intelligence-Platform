# SolveSphere AI — Firestore and Storage Knowledge Base

This inventory is derived from the repository's existing rules and services. **Collection names are authoritative references; example records are not real institutional data.** Validate field sets and indexes against the current shared types before changing documents.

| Collection / path | Meaning | Student access | Authorized writer |
|---|---|---|---|
| `users/{uid}` | identity-linked profile | own profile | restricted self-profile fields or admin |
| `subjects/{id}` | course catalog | signed-in readers | admin |
| `syllabusTopics/{id}` | syllabus and topic progression | signed-in readers | admin / trusted functions |
| `resources/{id}` | vetted learning resources | signed-in readers | admin |
| `quizzes/{id}` | assessment metadata | signed-in readers | admin |
| `quizzes/{id}/questions/{id}` | private question bank and keys | no direct student read | admin / trusted functions |
| `quizAttempts/{id}` | trusted grading result | owner or admin | trusted functions / admin |
| `studentStudyProgress/{id}` | student topic progress | owner or admin | constrained owner or trusted functions |
| `enrollments/{id}` | academic enrollment | owner or admin | admin |
| `complaints/{id}` | official student ticket | owner or admin | create through callable; admin transitions |
| `complaints/{id}/timeline/{id}` | audit trail | ticket owner or admin | trusted functions / admin |
| `ticketEvents/{id}` | additional audit records | owner or admin per rules | admin / trusted functions |
| `departments/{id}` | official campus maintenance directory | signed-in readers | admin |
| `campusClubs/{id}` | official club directory | signed-in readers | admin |
| `issueClusters/{id}` | raw incident suggestions including related ticket IDs | admin only | trusted functions / admin |
| `clusterCoordination/{id}` | internal concurrency coordination | admin read | trusted functions only |
| `complaintEmbeddings/{id}` | provider vectors, fingerprints and source metadata | admin only | trusted functions / admin |
| `publicIncidents/{id}` | sanitized admin-verified public incidents | signed-in readers | trusted functions / admin |
| `notifications/{id}` | per-user alerts | owner only | trusted functions; owner can mark read |
| `studyMateConversations/{id}` | academic AI chat | owner or admin per rules | trusted functions; restricted client metadata |
| `campusCareConversations/{id}` | campus AI chat | owner or admin per rules | trusted functions; restricted client metadata |
| `aiUsage/{uid}` | rate limits and quota | owner or admin | trusted functions |
| `anonymousReports/{id}` | disabled sensitive-reporting channel | admin read only | no direct client writes |
| `systemCounters/complaints` | transactional ticket sequence | no direct student access | trusted functions |

### Cloud Storage
- `attachments/{userId}/{ticketId}/{fileName}`: user-owned complaint upload; rules restrict file type/size and owner access. Trusted backend additionally validates storage object metadata and correct binding.
- `academic-resources/{subjectId}/{fileName}`: protected author uploads, authenticated reads as allowed by Storage Rules.
- Do not copy tokenized download URLs into unrestricted public incident documents.

### Real-data conventions
- Every real subject must have an approved course code, academic year, department, instructor or responsible staff, and actual content.
- Every real syllabus topic should reference a real subject and reflect authorized instructor progress.
- Every quiz must be reviewed before publication; protect answers in question subcollections.
- Every department/club should have an authorized owner and current contact details.
- A newly provisioned institution may have **zero records**. Show useful empty states instead of fictional reports.
- Never write fake student tickets, personal names, grades, usage metrics, incident counts or timestamps to a real Firebase project.

### Access-control caveat
This document summarizes intended behavior. The live authority remains the deployed Security Rules and trusted Cloud Functions. Re-run cross-user negative tests for every rules change.
