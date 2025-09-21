import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/firebase'; 
import { findBestMatchingModule } from '../data/modules.data';
import { aiService } from './ai.service';
import { 
  QuizModule, 
  QuizSession, 
  StartQuizRequest,
  NextQuestionRequest,
  QuizResponse
} from '../data/quiz-modules.types';
import { jobService } from './job.service';


const getQuizModule = async (moduleId: string): Promise<QuizModule> => {
  const db = await getDb();
  const docRef = db.collection('quiz_modules').doc(moduleId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error(`Module ${moduleId} not found in Firestore`);
  return doc.data() as QuizModule;
};

const getSession = async (sessionId: string): Promise<QuizSession> => {
  const db = await getDb();
  const docRef = db.collection('quiz_sessions').doc(sessionId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error(`Session ${sessionId} not found`);
  return doc.data() as QuizSession;
};


export async function startQuiz(request: StartQuizRequest): Promise<QuizResponse> {
  const db = await getDb();
  const { interests } = request;
  const moduleId = findBestMatchingModule(interests);
  const module = await getQuizModule(moduleId);
  const sessionId = uuidv4();
  const startQuestionId = module.start_question_id;
  const newSession: QuizSession = {
    id: sessionId,
    moduleId,
    currentQuestionId: startQuestionId,
    interests: [...interests],
    answers: {}
  };
  await db.collection('quiz_sessions').doc(sessionId).set(newSession);
  return {
    quizSessionId: sessionId,
    question: module.questions[startQuestionId],
    jobPostings: [] 
  };
}

export async function processNextQuestion(request: NextQuestionRequest): Promise<QuizResponse> {
  const db = await getDb();
  const { quizSessionId, questionId, answerId } = request;
  const session = await getSession(quizSessionId);
  const module = await getQuizModule(session.moduleId);
  const currentQuestion = module.questions[questionId];

  if (!currentQuestion) {
    throw new Error(`Question ${questionId} not found in module ${session.moduleId}`);
  }

  session.answers[questionId] = answerId;
  const newInterestTags = currentQuestion.interest_tags?.[answerId] || [];
  session.interests = [...new Set([...(session.interests || []), ...newInterestTags])];
  const nextQuestionId = currentQuestion.next_question?.[answerId];

  if (nextQuestionId === "END") {
    const careerAnalysis = await aiService.generateCareerAnalysis(session.interests);
    const jobPostings = await jobService.findJobPostings(
      careerAnalysis.recommendedCareer,
      careerAnalysis.skillGapAnalysis.requiredTechnicalSkills
    );
    await db.collection('quiz_sessions').doc(quizSessionId).delete(); 
    return {
      quizSessionId,
      isComplete: true,
      recommendedPath: careerAnalysis,
      jobPostings: jobPostings.map(job => ({
        ...job,
        jobId: String(job.jobId)
      })),
    };
  }

  if (!nextQuestionId) {
    throw new Error('Next question ID is undefined');
  }

  session.currentQuestionId = nextQuestionId as string;
  await db.collection('quiz_sessions').doc(quizSessionId).update({
    currentQuestionId: session.currentQuestionId,
    interests: session.interests,
    answers: session.answers
  });

  return {
    quizSessionId,
    question: module.questions[nextQuestionId],
    jobPostings: [] 
  };
}