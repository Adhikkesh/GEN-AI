export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  next_question: Record<string, string>; 
  interest_tags: Record<string, string[]>; 
}

export interface QuizModule {
  start_question_id: string;
  questions: Record<string, QuizQuestion>;
}

export interface QuizSession {
  id: string;
  moduleId: string;
  currentQuestionId: string;
  interests: string[];
  answers: Record<string, string>; 
}

export interface StartQuizRequest {
  interests: string[];
}

export interface NextQuestionRequest {
  quizSessionId: string;
  questionId: string;
  answerId: string;
}

export interface Job {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobBoardUrl: string;
  dateCreation: string;
}

export interface QuizResponse {
  quizSessionId: string;
  question?: QuizQuestion;
  isComplete?: boolean;
  recommendedPath?: any; 
  jobPostings: Job[];
} 