import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export let db: Firestore;

export const getDb = async (): Promise<Firestore> => {
  if (db) {
    return db;
  }

  if (getApps().length === 0) {
    console.log("Initializing Firebase app...");

    if (process.env.K_SERVICE) {
        console.log("Running in Cloud Run. Fetching credentials from Secret Manager...");
        const secretClient = new SecretManagerServiceClient();
        const [version] = await secretClient.accessSecretVersion({
            name: 'projects/gen-ai-adhikkesh/secrets/skar-firebase-service-account/versions/latest',
        });
        const payload = version.payload?.data?.toString();
        if (!payload) {
            throw new Error('Could not load Firebase service account from Secret Manager.');
        }
        const serviceAccount: ServiceAccount = JSON.parse(payload);
        initializeApp({ credential: cert(serviceAccount) });

    } else {
        console.log("Running locally. Initializing with local credentials file...");
        const serviceAccount = require('./gen-ai-adhikkesh-firebase-adminsdk-fbsvc-829a3aff1d.json');
        initializeApp({ credential: cert(serviceAccount) });
    }
  }

  db = getFirestore();
  return db;
};