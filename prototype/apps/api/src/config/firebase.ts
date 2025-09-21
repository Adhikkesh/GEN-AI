import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { config } from './index';

let db: Firestore;

export const getDb = async (): Promise<Firestore> => {
  if (db) {
    return db;
  }
  
  if (getApps().length === 0) {
    console.log("Initializing Firebase app...");
    
    try {
      if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_CLOUD_PROJECT) {
        console.log("Using Application Default Credentials for Firebase...");
        initializeApp({
          projectId: config.gcp.projectId,
        });
      } 
      else if (config.auth.credentialsPath) {
        console.log("Using service account credentials for Firebase...");
        const serviceAccount = require(config.auth.credentialsPath) as ServiceAccount;
        initializeApp({
          credential: cert(serviceAccount),
          projectId: config.gcp.projectId,
        });
      } 
      else {
        console.log("Using default Firebase initialization...");
        initializeApp({
          projectId: config.gcp.projectId,
        });
      }
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      initializeApp({
        projectId: config.gcp.projectId,
      });
    }
  }

  db = getFirestore();
  console.log("Firestore has been initialized successfully.");
  return db;
};