import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
// This will automatically use the GOOGLE_APPLICATION_CREDENTIALS
// environment variable if you're running in a GCP environment
// or you can set it manually.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const auth = admin.auth();
export const db = admin.firestore();

console.log('Firebase Admin SDK Initialized');