// seed.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load service account
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));

// Optional: Replace with your project ID (for clarity)
const projectId = serviceAccount.project_id;
console.log(`🚀 Connecting to Firestore Project: ${projectId}`);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

// Get Firestore reference
const db = getFirestore();

// Load careers data
const careersData = JSON.parse(readFileSync('./careers.json', 'utf8'));

async function seedCareers() {
  console.log(`\n📁 Uploading ${careersData.length} careers to Firestore...\n`);
  const collectionRef = db.collection('careers');
  const batch = db.batch();

  for (const career of careersData) {
    const { id, ...data } = career;
    const docRef = collectionRef.doc(id);
    batch.set(docRef, data);
    console.log(`✅ Queued: ${career.displayName}`);
  }

  await batch.commit();
  console.log(`\n🎉 Successfully uploaded all careers to Firestore!\n`);
}

seedCareers().catch((err) => {
  console.error('❌ Error seeding Firestore:', err);
});
