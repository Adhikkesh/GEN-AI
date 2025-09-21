'use client';

import { useState, useEffect } from 'react';
import { quizService } from '../services/quiz.service';
import { QuizQuestion, RecommendedPath, Job } from '../types/api';

interface Props {
  interests: string[];
  onQuizComplete: (recommendedPath: RecommendedPath, jobs: Job[]) => void;
}

export default function QuizSection({ interests, onQuizComplete }: Props) {
  const [quizSessionId, setQuizSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(1);

  useEffect(() => {
    startQuiz();
  }, [interests]);

  const startQuiz = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await quizService.startQuiz(interests);
      setQuizSessionId(response.quizSessionId);
      setCurrentQuestion(response.question);
      setQuestionCount(1);
    } catch (err) {
      setError('Failed to start quiz. Please try again.');
      console.error('Quiz start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer || !currentQuestion || !quizSessionId) return;

    try {
      setIsLoading(true);
      setError('');
      
      const response = await quizService.nextQuestion(
        quizSessionId,
        currentQuestion.id,
        selectedAnswer
      );

      if (response.isComplete && response.recommendedPath) {
        setIsFinished(true);
        onQuizComplete(response.recommendedPath, response.jobPostings);
      } else if (response.question) {
        setCurrentQuestion(response.question);
        setSelectedAnswer('');
        setQuestionCount(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to process answer. Please try again.');
      console.error('Quiz next error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setIsFinished(false);
    setQuestionCount(1);
    setQuizSessionId('');
    startQuiz();
  };

  if (error) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-transparent text-slate-800 rounded-b-lg">
        <h3 className="text-2xl font-bold mb-4 text-red-600">Oops!</h3>
        <p className="text-lg mb-6">{error}</p>
        <button 
          onClick={handleRestart} 
          className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-lg shadow-orange-500/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading && !currentQuestion) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-transparent text-slate-800 rounded-b-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-lg">Preparing your personalized quiz...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-transparent text-slate-800 rounded-b-lg">
        <h3 className="text-3xl font-bold mb-4">Quiz Completed!</h3>
        <p className="text-xl mb-6">We've analyzed your responses and created a personalized career roadmap for you!</p>
        <button onClick={handleRestart} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-lg shadow-orange-500/20">
            Take Quiz Again
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-transparent text-slate-800 rounded-b-lg">
        <p className="text-lg">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 h-full flex flex-col justify-between bg-transparent text-slate-800 rounded-b-lg">
      <div>
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm text-slate-500">
                <span>Question {questionCount}</span>
                <span>Based on: {interests.join(', ')}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 animate-pulse"></div>
            </div>
        </div>
        <h3 className="text-xl font-semibold mb-6 text-balance">{currentQuestion.text}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedAnswer(option.id)}
              disabled={isLoading}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${
                selectedAnswer === option.id 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-white border-slate-200 hover:border-orange-400'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
      <button 
        onClick={handleNext} 
        disabled={!selectedAnswer || isLoading} 
        className="w-full mt-6 btn-primary disabled:bg-slate-300 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          'Next Question'
        )}
      </button>
    </div>
  );
}

