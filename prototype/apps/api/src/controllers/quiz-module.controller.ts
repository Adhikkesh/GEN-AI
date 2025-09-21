import { Request, Response } from 'express';
import { startQuiz, processNextQuestion } from '../services/quiz-module.service';
import { StartQuizRequest, NextQuestionRequest } from '../data/quiz-modules.types';

export const startQuizController = async (req: Request, res: Response) => {
  try {
    const startRequest = req.body as StartQuizRequest;
    if (!startRequest.interests || !Array.isArray(startRequest.interests) || startRequest.interests.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Please provide an array of interests.' });
    }
    
    const result = await startQuiz(startRequest);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'An error occurred while starting the quiz.' });
  }
};

export const nextQuestionController = async (req: Request, res: Response) => {
  try {
    const nextRequest = req.body as NextQuestionRequest;
    if (!nextRequest.quizSessionId || !nextRequest.questionId || !nextRequest.answerId) {
      return res.status(400).json({ error: 'Invalid request. Please provide quizSessionId, questionId, and answerId.' });
    }
    
    const result = await processNextQuestion(nextRequest); 
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing next question:', error);
    res.status(500).json({ error: 'An error occurred while processing the next question.' });
  }
};