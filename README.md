<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Checkmaster

A lightweight checklist app with Google authentication and Firestore persistence.

## Features
- Google Sign-In (Firebase Auth)
- Personal checklists per user
- Tasks stored securely in Firestore
- Local JSON import/export for manual backups
- Optimized writes using debouncing

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   npm install
2. Create a `.env.local` file with your Firebase config:
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

3. Run the app:
npm run dev

## Deployment
This app can be deployed using GitHub Pages or any static hosting provider.

// redeploy

## Firestore Security

All Firestore access is protected by server-side Security Rules.
Clients may only read/write documents under:

users/{uid}/checklists/*

where `{uid}` must match `request.auth.uid`.

Client-side checks are not relied upon for authorization.

## Gemini AI

Gemini API is currently disabled in client builds.
No API keys are shipped to the browser.

Future AI features will be implemented via a secure backend
(e.g. Firebase Cloud Functions).

## APP.tsx

JSON imports are validated with strict structural checks and enforced limits on file size, number of lists, and number of tasks. Invalid or oversized imports are rejected entirely to prevent malformed or excessive data from entering application state.

Limit per element:

File size	   1 MB
Lists	         100
Tasks per list	500
Task text	   500 chars
List name	   200 chars

## Firestore Service

All Firestore writes are scoped to the authenticated user's UID and rely on Firestore Security Rules as the final authority. The client does not attempt to bypass or replicate authorization logic, and write failures due to rule enforcement are surfaced rather than suppressed.