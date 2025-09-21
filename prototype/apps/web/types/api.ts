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

export interface Job {
  jobId: string | number;
  jobTitle: string;
  companyName: string;
  location: string;
  jobBoardUrl: string;
  dateCreation: string;
}

export interface SkillGapAnalysis {
  requiredTechnicalSkills: string[];
  requiredSoftSkills: string[];
  userCurrentStrengths: string[];
}

export interface CareerLevel {
  title: string;
  description: string;
  skillsToAcquire: string[];
}

export interface CareerRoadmap {
  entryLevel: CareerLevel;
  midLevel: CareerLevel;
  seniorLevel: CareerLevel;
}

export interface LearningResources {
  courses: string[];
  certifications: string[];
  booksOrArticles: string[];
}

export interface RecommendedPath {
  recommendedCareer: string;
  careerOverview: string;
  skillGapAnalysis: SkillGapAnalysis;
  careerRoadmap: CareerRoadmap;
  learningResources: LearningResources;
}

export interface QuizStartResponse {
  quizSessionId: string;
  question: QuizQuestion;
  jobPostings: Job[];
}

export interface QuizNextResponse {
  quizSessionId: string;
  isComplete: boolean;
  question?: QuizQuestion;
  recommendedPath?: RecommendedPath;
  jobPostings: Job[];
}

export interface QuizStartRequest {
  interests: string[];
}

export interface QuizNextRequest {
  quizSessionId: string;
  questionId: string;
  answerId: string;
} 