# SolveSphere AI — Firebase Project Setup Guide

This document describes how an institution owner or administrator provisions and connects their genuine Google Cloud / Firebase project for SolveSphere AI.

---

## 1. Prerequisites

- A dedicated Google Cloud / Firebase account owned by your institution or organization (e.g. `admin@institution.edu`).
- Firebase CLI installed (`npm install -g firebase-tools` or Homebrew).
- Antigravity IDE with Firebase MCP Server (optional, for IDE-native project management).

---

## 2. Project Creation (Console or CLI)

### Via Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**.
3. Set your project name (e.g. `solvesphere-ai-prod` or `solvesphere-ai-staging`).
4. Google Analytics can be enabled if permitted by your institution's data governance policy.
5. Once created, note your **Project ID**.

### Via Firebase CLI
```bash
firebase login
firebase projects:create solvesphere-ai-prod --display-name "SolveSphere AI Production"
```

---

## 3. Enable Required Firebase Services

SolveSphere AI requires the following core services in your Firebase project:

1. **Firebase Authentication**:
   - In Console: Build &rarr; Authentication &rarr; Get Started.
   - Sign-in method: Enable **Email/Password**.
   - Under Settings &rarr; Authorized domains, add your production domain (e.g. `solvesphere.institution.edu`) and Firebase hosting domain (`<project-id>.firebaseapp.com`).
2. **Cloud Firestore**:
   - In Console: Build &rarr; Firestore Database &rarr; Create Database.
   - Select production location (e.g. `us-central1` or your institution's geographic region).
   - Rules: Start in production mode.
3. **Cloud Storage for Firebase**:
   - In Console: Build &rarr; Storage &rarr; Get Started.
   - Same region as Firestore.
4. **Cloud Functions**:
   - Requires Blaze (Pay-as-you-go) plan for outbound Google Gemini API inference.
   - Note: Set budget alerts in Google Cloud Billing to prevent unexpected charges.

---

## 4. Register Firebase Web App & Obtain Public Configuration

1. In Project Overview &rarr; Project Settings, click the **Web icon (`</>`)** to add a Web App.
2. Enter App nickname (e.g. `SolveSphere Web Client`).
3. Copy the Firebase configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "<project-id>.firebaseapp.com",
     projectId: "<project-id>",
     storageBucket: "<project-id>.appspot.com",
     messagingSenderId: "...",
     appId: "1:...:web:..."
   };
   ```

---

## 5. Local Environment Configuration

Copy `.env.production.example` to `.env.production.local` (or supply via CI/CD secrets):

```bash
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="<project-id>.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="<project-id>"
VITE_FIREBASE_STORAGE_BUCKET="<project-id>.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="1:...:web:..."
VITE_USE_FIREBASE_EMULATOR="false"
```

> **Security Note:** Vite frontend variables (`VITE_*`) are embedded into the client distribution bundle and serve only as Firebase project identifiers. Secret credentials (such as `GEMINI_API_KEY`) must **never** be placed in `VITE_*` variables; they are managed exclusively on the backend via Google Secret Manager.

---

## 6. Update Project Aliases in `.firebaserc`

Associate your newly created project with the project alias:

```bash
firebase use --add <project-id>
```

Or edit [.firebaserc](file:///Users/havocerebus/Documents/Current_Project_Working/Academic%20&%20Campus%20Intelligence%20Platform/.firebaserc):

```json
{
  "projects": {
    "default": "solvesphere-ai-dev-2026",
    "development": "solvesphere-ai-dev-2026",
    "staging": "<YOUR_STAGING_FIREBASE_PROJECT_ID>",
    "production": "<YOUR_PRODUCTION_FIREBASE_PROJECT_ID>"
  }
}
```

---

## 7. Verified Development Project Details

The development project is verified and actively linked via the Antigravity Firebase MCP Server and Firebase CLI:

| Property | Value |
|---|---|
| **Project Display Name** | `SolveSphere AI Dev` |
| **Firebase Project ID** | `solvesphere-ai-dev-2026` |
| **Google Cloud Project Number** | `445610047961` |
| **Pricing Plan** | **Spark** (Free tier, billing disabled) |
| **Firestore Database Mode** | `FIRESTORE_NATIVE` |
| **Firestore Region** | `asia-south1` (Mumbai) |
| **Registered Web App** | `SolveSphere AI Web Dev` |
| **Web App ID** | `1:445610047961:web:068cf60c3d2d01c16e81c8` |
| **Console URL** | [console.firebase.google.com/project/solvesphere-ai-dev-2026/overview](https://console.firebase.google.com/project/solvesphere-ai-dev-2026/overview) |

### Initializing Firebase Authentication in Console

When accessing Firebase Authentication for a newly created project via API or SDK before the provider is initialized, Firebase returns `400 CONFIGURATION_NOT_FOUND`. To enable authentication:

1. Open [Firebase Console Authentication](https://console.firebase.google.com/project/solvesphere-ai-dev-2026/authentication).
2. Click **Get Started**.
3. Under **Sign-in method**, select **Email/Password**.
4. Enable **Email/Password** (leave Email link / passwordless disabled unless required).
5. Click **Save**.
6. Under **Authorized domains**, verify `localhost` and `solvesphere-ai-dev-2026.firebaseapp.com` are listed.

---

## 8. Deploying Rules and Functions

When authorized to deploy to your verified project:

```bash
# Verify active project
firebase use production

# Deploy Security Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes,storage

# Deploy Functions (Requires Blaze plan)
firebase deploy --only functions
```
