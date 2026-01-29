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

