// Service to manage careers and active users
import admin from 'firebase-admin';
import { Career, User, ActiveCareer } from '../types/career.types';
import { ApiResponse } from '../types/common.types';

export class CareerService {
  private db = admin.firestore();

  async getActiveCareers(): Promise<ApiResponse<ActiveCareer[]>> {
    try {
      // Get all users and their chosen careers
      const usersSnapshot = await this.db.collection('users').get();
      const careerMap = new Map<string, number>();

      usersSnapshot.docs.forEach((doc) => {
        const user = doc.data() as User;
        if (user.chosenCareerId) {
          careerMap.set(user.chosenCareerId, (careerMap.get(user.chosenCareerId) || 0) + 1);
        }
      });

      // Fetch full career details for active ones
      const activeCareers: ActiveCareer[] = [];
      for (const [id, userCount] of careerMap) {
        const careerDoc = await this.db.collection('careers').doc(id).get();
        if (careerDoc.exists) {
          const career = careerDoc.data() as Career;
          activeCareers.push({ ...career, id, userCount });
        }
      }

      return { success: true, data: activeCareers };
    } catch (error) {
      console.error('CareerService Error:', error);
      return { success: false, error: 'Failed to get active careers' };
    }
  }
}