# Owner setup

1. In GitHub, open the repository's Security tab and review Secret scanning alerts, including closed alerts. Compare the project identifiers for the historical Firebase web configuration against your Firebase projects. In Google Cloud Console → APIs & Services → Credentials, restrict the web key to your hosting origins and required Firebase APIs. Create a replacement restricted key, update the hosting build's public web configuration, verify Auth and data access, and retire the old key. Keep Gemini on a separate server-side credential. See [Firebase API keys](https://firebase.google.com/docs/projects/api-keys).
2. In Firebase Console, select the intended project and link a billing account to upgrade to Blaze. In Google Cloud Billing → Budgets & alerts, create a project-scoped budget, set thresholds and confirm recipients. Budget notifications alert you to spending and do not cap charges. See [Firebase billing guidance](https://firebase.google.com/docs/projects/billing/avoid-surprise-bills).
3. Register the web app. Enable Email/Password and Google in Authentication, add the hosting domains to Authorized domains, create Firestore and a Storage bucket, and copy the actual Firebase web config into the web build environment. Supply the exact bucket name. For browser attachment downloads, configure Cloud Storage bucket CORS to allow GET from the exact hosting origin. Existing download tokens can be revoked in Storage if previously shared. Use `VITE_USE_FIREBASE_EMULATOR=false` for hosting. Select the target explicitly for every deployment.
4. Use an authorized local Firebase CLI session. Install dependencies, build, deploy rules and indexes, and wait for indexes to finish building. Use the following release commands from the repository root, substituting your own project ID. The Functions predeploy hooks build shared contracts and bundle the Functions entrypoint.

```sh
PROJECT_ID=your-firebase-project-id
npm ci
npm run build
firebase deploy --project "$PROJECT_ID" --only firestore:rules,firestore:indexes,storage,hosting
firebase deploy --project "$PROJECT_ID" --only functions:createComplaint,functions:reopenTicket,functions:updateTicketStatus,functions:assignTicketDepartment,functions:adminManageDepartment,functions:adminManageClub,functions:adminReviewCluster,functions:adminApproveEnrollment,functions:adminRejectEnrollment,functions:getQuizQuestions,functions:submitQuiz,functions:adminSaveQuiz,functions:adminDeleteQuiz,functions:adminUpdateTopicStatus,functions:toggleStudentTopicProgress,functions:onComplaintCreatedClustering,functions:recoverStaleComplaintLeases
```

5. Provision a real institutional administrator with authorized Application Default Credentials for the selected project. Use the production section of the provisioning guide. Confirm the project and email, enter the password privately, and sign in again to refresh claims. Check that a student cannot open the admin workspace. [Administrator provisioning](ADMIN_ACCOUNT_PROVISIONING.md).
6. Register the web app in Firebase App Check with reCAPTCHA v3, provide the public site key to the web build as `VITE_APP_CHECK_SITE_KEY`, rebuild and deploy Hosting. Check token metrics on the deployed origin. Set `ENFORCE_APP_CHECK=true` in the project-specific Functions environment and redeploy callables after valid production clients are sending tokens. [Web setup](https://firebase.google.com/docs/app-check/web/recaptcha-provider) and [callable enforcement](https://firebase.google.com/docs/app-check/cloud-functions).
7. When ready for live AI, review the model-bound fields and retention policy first. Run the following from a trusted terminal. The first command prompts for the value. For semantic clustering, set `ENABLE_GEMINI_CLUSTERING=true` in the Functions project environment before redeploying the trigger and scheduler.

```sh
firebase functions:secrets:set GEMINI_API_KEY --project "$PROJECT_ID"
firebase deploy --project "$PROJECT_ID" --only functions:askStudyMateAi,functions:askCampusCareAi,functions:aiAssistComplaint,functions:onComplaintCreatedClustering,functions:recoverStaleComplaintLeases
```

8. Verify a real student can sign in with Google, verify email, complete enrollment, get approved by a real administrator, submit a ticket with and without a file, read its timeline, and attempt a published quiz on the hosting origin. Check scheduled recovery in Cloud Scheduler. Keep Speak Freely closed until the independent privacy review is complete.

## Run the browser regression locally

With Node 22, Java 21, Firebase CLI 15.37.0 and Python 3 available, run these commands from a fresh checkout. The script provisions an administrator only inside the demo emulators and uses generated passwords. It starts a local preview on port 5173 and checks both roles in Chromium.

```sh
npm ci
npm run build
python3 -m venv /tmp/solvesphere-browser
. /tmp/solvesphere-browser/bin/activate
python3 -m pip install playwright==1.62.0
python3 -m playwright install chromium
firebase emulators:exec --project demo-solvesphere --only auth,firestore,functions,storage 'bash tests/browser-emulator.sh'
```
