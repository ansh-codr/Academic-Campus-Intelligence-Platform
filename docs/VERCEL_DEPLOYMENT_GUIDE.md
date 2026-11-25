# SolveSphere AI — Vercel Deployment & Free Serverless Architecture Guide

This guide details how to deploy **SolveSphere AI** to **Vercel** with **100% Free Hosting, Serverless Functions, Firebase Auth & Firestore (Spark Tier)** without requiring a credit card or upgrading to the Firebase Blaze plan.

---

## 🏛️ System Architecture Overview

```
                                  +------------------------------------------+
                                  |                 CLIENT                   |
                                  |     Browser (React 18 / Vite SPA)        |
                                  +--------------------+---------------------+
                                                       |
                             +-------------------------+-------------------------+
                             |                                                   |
                             v                                                   v
                  [ Client Auth & Reads ]                               [ Backend Mutations & AI ]
                             |                                                   |
                             |                                                   v
                             |                                  +---------------------------------+
                             |                                  |        VERCEL SERVERLESS        |
                             |                                  |          (/api/[fn].ts)         |
                             |                                  |   - adminApproveEnrollment      |
                             |                                  |   - createComplaint             |
                             |                                  |   - askStudyMateAi (Gemini)     |
                             |                                  |   - askCampusCareAi (Gemini)    |
                             |                                  +----------------+----------------+
                             |                                                   |
                             +-------------------------+-------------------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     |          FIREBASE CLOUD           |
                                     |       (Spark Plan - Free)         |
                                     |  - Firebase Authentication        |
                                     |  - Cloud Firestore                |
                                     |  - Storage Rules                  |
                                     +-----------------------------------+
```

---

## 🔑 Required Credentials Checklist

### 1. Firebase Web SDK Configuration (Frontend)
These are public configuration identifiers for the browser client:
* `VITE_FIREBASE_API_KEY`: Web API Key
* `VITE_FIREBASE_AUTH_DOMAIN`: `solvesphere-ai-dev-2026.firebaseapp.com`
* `VITE_FIREBASE_PROJECT_ID`: `solvesphere-ai-dev-2026`
* `VITE_FIREBASE_STORAGE_BUCKET`: `solvesphere-ai-dev-2026.appspot.com`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`: `901460592868`
* `VITE_FIREBASE_APP_ID`: `1:901460592868:web:75ffc90be6704997abf679`

### 2. Firebase Admin SDK Service Account (Backend Serverless)
Used securely inside Vercel Serverless Functions to verify admin roles, reserve roll numbers, and perform transactions in Firestore:
* `FIREBASE_PROJECT_ID`: `solvesphere-ai-dev-2026`
* `FIREBASE_SERVICE_ACCOUNT_KEY`: The complete JSON string of your Firebase Service Account Private Key.
  > **Where to get it:**
  > 1. Open [Firebase Console &rarr; Service Accounts](https://console.firebase.google.com/project/solvesphere-ai-dev-2026/settings/serviceaccounts/adminsdk)
  > 2. Click **"Generate new private key"**.
  > 3. Open the downloaded `.json` file in a text editor, copy its entire contents, and paste it as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`.

### 3. Google Gemini API Key (AI Features)
Powers StudyMate AI and Campus Care AI:
* `GEMINI_API_KEY`: Free key from Google AI Studio.
  > **Where to get it:**
  > 1. Visit [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
  > 2. Sign in with your Google account and click **"Create API key"**.
  > 3. Copy the key and add it to Vercel.

---

## 🚀 Step-by-Step Vercel Deployment

### Step 1: Push Code to GitHub
Push your latest commits on `main` to GitHub:
```bash
git add .
git commit -m "feat(vercel): configure Vercel SPA hosting and serverless functions"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..." &rarr; "Project"**.
3. Select your repository: `ansh-codr/Academic-Campus-Intelligence-Platform`.
4. Configure Build and Output Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`

### Step 3: Add Environment Variables in Vercel
In the Vercel project configuration page, expand **Environment Variables** and add:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Public Firebase Web Key | Frontend Auth & Firestore |
| `VITE_FIREBASE_AUTH_DOMAIN` | `solvesphere-ai-dev-2026.firebaseapp.com` | Frontend Domain |
| `VITE_FIREBASE_PROJECT_ID` | `solvesphere-ai-dev-2026` | Frontend Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `solvesphere-ai-dev-2026.appspot.com` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `901460592868` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:901460592868:web:75ffc90be6704997abf679` | Web App ID |
| `FIREBASE_PROJECT_ID` | `solvesphere-ai-dev-2026` | Backend Admin SDK |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | Backend Admin Key (JSON) |
| `GEMINI_API_KEY` | `AIzaSy...` | Gemini AI Features |

### Step 4: Authorize Vercel Domain in Firebase Auth
Once deployed, Vercel will assign a URL like `https://solvesphere-ai.vercel.app`.
To allow Google Sign-In on this URL:
1. Go to [Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains](https://console.firebase.google.com/project/solvesphere-ai-dev-2026/authentication/settings)
2. Click **"Add domain"**.
3. Enter your Vercel deployment domain (e.g. `solvesphere-ai.vercel.app`).
4. Click **Save**.

---

## 🧪 Testing the Live Deployment

1. **Health Check Endpoint**:
   Visit `https://<your-project>.vercel.app/api` to verify the Serverless API is online. You should receive:
   ```json
   {
     "status": "online",
     "platform": "SolveSphere AI — Vercel Serverless Gateway"
   }
   ```
2. **Student Onboarding**:
   Go to `/auth/login`, sign in with Google or email, submit enrollment profile.
3. **Admin Verification**:
   Log in at `/auth/admin-login` with `admin@campus.edu` / `CampusAdmin@2026!`.
   Navigate to `/admin/enrollments` and click **"Approve"**.
   The request will route through `/api/adminApproveEnrollment`, verify the admin claim, lock the roll number in Firestore, and display the green approval confirmation banner.
