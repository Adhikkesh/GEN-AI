import { 
  QuizStartRequest, 
  QuizStartResponse, 
  QuizNextRequest, 
  QuizNextResponse 
} from '../types/api';

const API_BASE_URL = 'https://genai-quiz-api-222073691466.us-central1.run.app/api/quiz';

class QuizService {
  async startQuiz(interests: string[]): Promise<QuizStartResponse> {
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests } as QuizStartRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to start quiz: ${response.statusText}`);
    }

    return response.json();
  }

  async nextQuestion(quizSessionId: string, questionId: string, answerId: string): Promise<QuizNextResponse> {
    const response = await fetch(`${API_BASE_URL}/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        quizSessionId, 
        questionId, 
        answerId 
      } as QuizNextRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to get next question: ${response.statusText}`);
    }

    return response.json();
  }
}

export const quizService = new QuizService(); 