import { Request, Response } from 'express';
import { QUIZ_QUESTIONS, ANSWER_TO_INTERESTS_MAP } from '../data/quiz.data';
import { aiService } from '../services/ai.service';
import { Firestore } from '@google-cloud/firestore';
import { config } from '../config';

export const getQuizController = async (req: Request, res: Response) => {
  try {
    const firestore = new Firestore({
      projectId: config.gcp.projectId,
      databaseId: config.firestore.databaseId,
    });
    const snapshot = await firestore.collection('quiz-questions').get();

    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);

    try {
      res.status(200).json(QUIZ_QUESTIONS);
      return;
    } catch (_) {
      res.status(500).json({ error: 'An internal server error occurred while fetching quiz questions.' });
    }
  }
};

export const analyzeQuizController = async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid input. "answers" object is required with question IDs as keys and option IDs as values.' 
      });
    }

    const expectedQuestionIds = QUIZ_QUESTIONS.map(q => q.id);
    const providedQuestionIds = Object.keys(answers);
    
    const missingQuestions = expectedQuestionIds.filter(id => !providedQuestionIds.includes(id));
    if (missingQuestions.length > 0) {
      return res.status(400).json({ 
        error: `Missing answers for questions: ${missingQuestions.join(', ')}` 
      });
    }

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer !== 'string' || !['A', 'B', 'C', 'D'].includes(answer)) {
        return res.status(400).json({ 
          error: `Invalid answer "${answer}" for question "${questionId}". Expected A, B, C, or D.` 
        });
      }
    }

    console.log('Processing quiz answers:', answers);

    const mindMap = await aiService.generateCareerMindMap(answers as Record<string, string>);
    
    res.status(200).json(mindMap);

  } catch (error) {
    console.error('Error analyzing quiz:', error);
    res.status(500).json({ error: 'An internal server error occurred while analyzing the quiz.' });
  }
}; 