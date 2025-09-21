import { db } from './src/config/firebase';
import techModuleData from './src/data/tech_quiz_modules.json';

async function seedDatabase() {
  try {
    console.log('Starting to seed the database...');

    const techModuleRef = db.collection('quiz_modules').doc('tech');
    
    await techModuleRef.set(techModuleData);

    console.log('Successfully seeded the "tech" quiz module.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();