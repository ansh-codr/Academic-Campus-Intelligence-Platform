# SolveSphere audit of main

The audit started from `cf4d984` on main. The review branch is `fix/audit-all`. All Firebase writes in this audit targeted a demo project. Review the code and test output in [PR #7](https://github.com/ansh-codr/Academic-Campus-Intelligence-Platform/pull/7).

## 1. Findings and evidence

The proof column uses the command names below. Some results establish runtime behavior and some establish source or packaging properties. The historical handover documents describe earlier releases.

| ID | Severity | File | Finding | Status | Proof and observed result |
|---|---|---|---|---|---|
| A1 | High | `.github/workflows/ui-checks.yml` | CI skipped changes outside a narrow PR filter and targeted an obsolete push branch. It omitted Functions and emulator coverage. | Fixed | CI ran build and emulator jobs on PR #7. Source triggers all PRs and pushes to main. |
| A2 | High | `package.json`, `apps/api/`, `apps/web/vite.config.ts` | Root tasks failed on the unused Express/Prisma workspace. Node targets and build order differed between environments. | Fixed | Build and Typecheck went from TS2307 to exit 0. Node 22 is configured in both CI and Functions. |
| A3 | High | `functions/package.json`, `firebase.json`, `scripts/bundle-functions.mjs` | A Functions-only install depended on an unpublished workspace. A clean deploy had no guaranteed entrypoint. | Fixed | Package loaded all 20 exports after an isolated production dependency install. Predeploy builds shared and Functions in order. |
| A4 | High | `package-lock.json`, `functions/package-lock.json` | npm reported high and moderate advisories. Automated update tracking was absent. | Fixed | Audit reported 0 in root, web and Functions. Dependabot configuration added. |
| A5 | High | Historical `apps/web/.env.production` and examples | Firebase key-shaped strings remain discoverable in Git history. Ownership, privileges, usage and restrictions need confirmation. | Needs owner action | History identified production configuration in `2cfe102` and `a403392`, and example/test matches in `0993931`, `44a2445`, `5064615`, `c446531`, `cf75660`. Values omitted. |
| B1 | High | `apps/web/src/hooks/useAuth.tsx`, `firestore.rules` | Profile creation and enrollment submission could disagree with protected-field rules. Async profile loading could race with sign-out. | Fixed | Browser registered a student, submitted a pending enrollment, signed out and signed back in. Emulator 53–60 exercised profile ownership, approvals, rejection and duplicate student IDs. The stale-listener guard was checked in source. |
| B2 | High | `functions/src/complaints.ts`, `apps/web/src/pages/student/ReportIssuePage.tsx` | The ticket function bound an unused Gemini secret. Pending students lacked an actionable rejection. The browser sent an invalid attachment value when the file list was empty. | Fixed | Unit verified no bound secret. Browser initially displayed “Invalid complaint payload [400]”, then passed the same submission with a link to the enrollment form. Emulator 26, 54 and 57 confirmed callable behavior, reference and timeline. |
| B3 | High | `apps/web/src/pages/student/ReportIssuePage.tsx`, `apps/web/src/services/campusService.ts` | Attachment upload failures blocked ticket submission and deployment/network failures lacked guidance. | Fixed | Browser submitted a ticket after Storage rejected the file and displayed both the success and omitted-file warning. The unreachable-service message was checked in source. |
| B4 | High | `functions/src/complaints.ts`, `packages/shared/src/schemas/ticket.schema.ts` | Attachment count and location lengths lacked bounds, claim checks could race, and ticket submission lacked a daily limit. | Fixed | Unit verified bounds. Emulator 26 checked bucket, ownership, type, traversal and reuse. Source shows transactional claims and the 50-ticket daily limit. Individual races and quota boundaries were not all driven to failure. |
| B5 | High | `functions/src/complaints.ts` | Secret binding prevented a clean location-only clustering deployment. | Fixed | Package verified unbound trigger in default configuration. Emulator 27 and 43–50 exercised location grouping, idempotency and lease recovery. |
| C1 | High | `firestore.rules`, `functions/src/campusCare.ts` | Student identity/progress fields and callable-owned conversation data needed stronger write and ownership restrictions. | Fixed | Emulator 12, 15, 18, 20–23, 34, 37 and 53–58 exercised ownership and forgery denials. Source checks the current conversation owner inside the write transaction. |
| C2 | High | `functions/src/callable.ts`, `functions/src/admin.ts`, `functions/src/academic.ts` | Callable endpoints lacked consistent authentication budgets, payload bounds and validated identifiers. | Fixed | Build and Typecheck passed. Emulator exercised anonymous calls, forbidden roles, validation and AI quotas. The shared wrapper enforces a 256 KiB body cap and 120 calls per authenticated user per minute. Its exact thresholds were checked in source. |
| C3 | High | `functions/src/academic.ts`, `apps/web/src/pages/student/PracticeQuizzesPage.tsx`, `firestore.rules` | Quiz retries could duplicate attempts. Draft metadata, client-sent fields and stale saved questions needed tighter handling. | Fixed | Emulator 10–11, 14 and 51–52 checked protected answers, scoring, replay and draft access. Build passed. |
| C4 | Medium | `apps/web/src/lib/firebase.ts`, `functions/src/callable.ts`, `firebase.json` | App Check lacked client setup and callables allowed arbitrary origins. Hosting needed compatible Firebase and reCAPTCHA origins. | Fixed | Build passed. Browser called Functions from the emulator origin. Production origins, reCAPTCHA tokens and CSP enforcement require a deployed client. |
| C5 | High | `scripts/bootstrap-admin.js`, `tests/firebase.test.js` | A validation error included the supplied password. Tests reused fixed credentials. | Fixed | Unit regression failed before the change and passed after. Browser provisioned a generated-password demo administrator. Bundle scan found no server-secret markers. |
| C6 | Medium | `apps/web/src/services/campusService.ts`, `apps/web/src/lib/utils.ts` | Private attachment reads needed authenticated SDK access and legacy link handling needed scheme checks. | Fixed | Build passed. Emulator 26 and 33 exercised object ownership and isolation. Browser failure recovery passed. Production bucket CORS and any outstanding old download tokens need owner review. |
| C7 | Medium | `apps/web/src/pages/student/CampusDashboardPage.tsx`, `StudentOverviewPage.tsx`, `services/academicService.ts`, `services/campusCareService.ts` | Student reads could use the wrong scope. Several read failures appeared as empty results and resource deletion could report misleading success. | Fixed | Browser opened dashboards, timeline, practice and chat. Emulator 4 and 30 checked ticket and notification isolation. Typecheck passed. Offline/error paths were also inspected, without fault-injecting each one. |
| C8 | Medium | `firestore.indexes.json` | Composite query definitions were missing, including combinations used for resources and published quizzes. | Fixed | Query definitions compared with index configuration. Emulator read paths passed. Only a deployed Firestore instance can confirm required indexes have finished building. |
| C9 | Medium | `apps/web/src/App.tsx`, auth pages, admin anonymous reports page, portal navigation and docs | A profile route lacked an authentication guard. Anonymous-report navigation and release guidance misrepresented available behavior. Navigation included a fixed subject count. | Fixed | Browser opened all 29 authenticated routes including anonymous concerns. Owner guide includes the tested routes and current service dependencies. |
| P1 | High | `functions/src/campusCare.ts` | Campus Care includes the student UID and ticket-derived content in its model system instruction. Stored or user-authored text can influence that instruction. | Not fixed | Source inspection of `systemInstruction`. The audit scope preserves Gemini logic. Keep live Campus Care disabled pending data minimization and prompt isolation. |
| P2 | High | Speak Freely page, `firestore.rules` | The promised independent zero-knowledge privacy certification is pending. | Needs owner action | Browser opened the closed page. Emulator 34 rejected direct student writes. Submit stays disabled until independent review. |
| P3 | Low | `apps/web/src/pages/student/SettingsPage.tsx` | Optional SMS, topic notification preferences and a weekly digest are displayed as future features. | Not fixed | Browser opened Settings. Source shows disabled preferences and no delivery implementation for these options. Emulator 30 checked existing in-app ticket notifications. |

### Commands and baseline

| Check | Command | Before | After |
|---|---|---|---|
| Install | `npm ci` | exit 0 | exit 0 |
| Shared | `npm run build --workspace=@solvesphere/shared` | exit 0 | exit 0 |
| Web | `npm run typecheck --workspace=@solvesphere/web` and `npm run build --workspace=@solvesphere/web` | both exit 0 | both exit 0 |
| Functions | `npm run build --workspace=@solvesphere/functions` | exit 0 | exit 0 |
| Build / Typecheck | `npm run build` and `npm run typecheck` | both exit 2, missing Prisma import | both exit 0 |
| Unit | `npm run test:unit` | launcher failed opening a restricted Unix socket. Alternate Node loader ran all 39 original tests. | 42 passed, 0 failed |
| Audit | `npm audit`, repeated with `--workspace=@solvesphere/web` and `--workspace=@solvesphere/functions` | root 18 (6 high), web 9 (6 high), Functions 10 (1 high) | each reported 0 vulnerabilities |
| Emulator | `firebase emulators:exec --project demo-solvesphere --only auth,firestore,functions,storage 'node tests/firebase.test.js'` | local Firestore trigger registration stopped before assertions | exit 0. Sixty numbered scenarios plus 16b, 20b and 20c. The final two share a log line. |
| Browser | Same emulator command with `'bash tests/browser-emulator.sh'` | ticket form returned HTTP 400 during browser testing | exit 0. Email verification, enrollment rejection, approval, verified submission, omitted-file warning and 29 authenticated route loads |
| New regressions | `node --import tsx --test tests/audit.test.js` | 3 failed on the original implementation | 3 passed |
| Package | Copy only `functions/{lib,package.json,package-lock.json}` into an empty directory, then run `npm ci --omit=dev` and import `./lib/index.js` in Node | local workspace dependency was present in manifest | 20 exports loaded. Ticket creation and default location clustering had no secret binding. |
| History | `git log --all -G'AIza[[:alnum:]_-]{30,}' --format=%h --name-only` | matches in reachable history | historical paths recorded above. No matching full-length key in the checked-out source. |
| Bundle | Emulator test 19 inspects web distribution assets. Additional scan used `rg -l -- 'BEGIN .*PRIVATE KEY|GEMINI_API_KEY|ADMIN_PASSWORD|GOOGLE_APPLICATION_CREDENTIALS' apps/web/dist/assets` | not measured | zero matching assets |

The browser test checks route rendering and uncaught page errors. Integration fixtures include Admin SDK setup, real emulator rules and callables, direct helper tests and simulated AI responses. The count is a scenario count, not a count of independent browser journeys. The original local environment required a loopback TCP adaptation for the CLI worker transport. GitHub Actions ran its unmodified Firebase CLI.

## 2. Outstanding functionality

Live AI needs a server secret and a separate review of P1. Billing, cloud provisioning and project configuration gate the hosted backend. Speak Freely remains closed by the owner's privacy requirement. The three notification preferences described under P3 are existing roadmap items.

## 3. Owner steps

Follow the [ordered setup and deployment commands](AUDIT_OPERATIONS.md). They cover historical key review, billing and budgets, Auth providers, bucket CORS, indexes and non-AI deployment, administrator provisioning, App Check, and deferred Gemini setup.

## 4. NOT VERIFIED

- Production billing, IAM, project ownership, real admin privileges, live deployment, deployed index readiness, Cloud Scheduler delivery and production limits.
- Real Google OAuth, email delivery to an external inbox, browser behavior under the deployed CSP, production App Check tokens, bucket CORS and access through any old download tokens.
- GitHub Secret Scanning alert contents, whether each historical key is active or restricted, and historical API usage.
- Live Gemini output, prompt resistance, provider retention, actual spend and semantic quality. The independent zero-knowledge privacy certification is pending.
- Every UI operation, every possible race, HTTP failure or dependency advisory outside npm's database. Only the explicitly identified failures received independent before-and-after reproductions.
