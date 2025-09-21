import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const generateRoadmapController = async (req: Request, res: Response) => {
  try {
    const { interests, query } = req.body;

    if (!interests || !Array.isArray(interests) || !query) {
      return res.status(400).json({ error: 'Invalid input. "interests" (array) and "query" (string) are required.' });
    }

    const answers = interests.reduce((acc: Record<string, string>, interest: string, index: number) => {
      acc[`q${index + 1}`] = 'A'; 
      return acc;
    }, {});
    
    const roadmap = await aiService.generateCareerMindMap(answers);
    
    res.status(200).json({ roadmap });

  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};