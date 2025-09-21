import { promises as fs } from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { QuizModule } from './src/data/quiz-modules.types';

// This is the local path to your service account key within the 'api' project
const SERVICE_ACCOUNT_PATH = './src/config/gen-ai-adhikkesh-firebase-adminsdk-fbsvc-829a3aff1d.json';
const MODULE_TO_SEED = 'tech_quiz_modules.json';
const DOCUMENT_ID = 'tech'; // The ID for the new quiz module in Firestore

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Initialize Firebase Admin SDK directly in this script
    if (getApps().length === 0) {
      console.log('Firebase app not initialized. Initializing now...');
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized.');
    } else {
      console.log('Firebase app already initialized.');
    }

    const db = getFirestore();

    // 2. Define the path to your JSON data file
    const filePath = path.join(__dirname, 'src/data', MODULE_TO_SEED);
    console.log(`🔍 Reading quiz data from: ${filePath}`);

    // 3. Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const quizData: QuizModule = JSON.parse(fileContent);
    console.log('📄 Quiz data successfully read and parsed.');

    // 4. Upload the data to Firestore
    const collectionRef = db.collection('quiz_modules');
    const docRef = collectionRef.doc(DOCUMENT_ID);

    console.log(`⬆️  Uploading '${DOCUMENT_ID}' module to Firestore...`);
    await docRef.set(quizData);

    console.log(`🚀 Seeding complete! The "${DOCUMENT_ID}" quiz module has been uploaded.`);

  } catch (error) {
    console.error('🔥 An error occurred during database seeding:', error);
    process.exit(1); // Exit with an error code
  }
}

// Run the seeding function
seedDatabase();