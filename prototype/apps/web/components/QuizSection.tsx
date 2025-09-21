'use client';

import { useState } from 'react';

interface Props {
  onQuizComplete: (score: number) => void;
}

const questions = [
    { question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], answer: "Paris" },
    { question: "Which language is primarily used for Android app development?", options: ["Swift", "Kotlin", "Java", "Both Kotlin and Java"], answer: "Both Kotlin and Java" },
    { question: "What does HTML stand for?", options: ["Hyper Trainer Marking Language", "Hyper Text Marketing Language", "Hyper Text Markup Language", "Hyperlink and Text Markup Language"], answer: "Hyper Text Markup Language" },
    { question: "Which company developed the React library?", options: ["Google", "Facebook", "Twitter", "Microsoft"], answer: "Facebook" },
    { question: "What is the purpose of CSS?", options: ["To structure a web page", "To style a web page", "To add interactivity to a web page", "To manage databases"], answer: "To style a web page" },
    { question: "Which of the following is a NoSQL database?", options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], answer: "MongoDB" },
    { question: "What is the latest version of ECMAScript (as of late 2023)?", options: ["ES6", "ES2015", "ES2022", "ES2023"], answer: "ES2023" },
    { question: "What does API stand for?", options: ["Application Programming Interface", "Application Protocol Interface", "Apple Pie Interface", "Application Programming Instruction"], answer: "Application Programming Interface" },
    { question: "Which git command is used to upload your local changes to a remote repository?", options: ["git commit", "git push", "git pull", "git fetch"], answer: "git push" },
    { question: "What is the time complexity of a binary search algorithm?", options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], answer: "O(log n)" },
];

export default function QuizSection({ onQuizComplete }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleNext = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion]?.answer;
    if (isCorrect) setScore(score + 1);
    setSelectedAnswer('');
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsFinished(true);
      onQuizComplete(score + (isCorrect ? 1 : 0));
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setScore(0);
    setIsFinished(false);
  }

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  if (isFinished) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center bg-transparent text-slate-800 rounded-b-lg">
        <h3 className="text-3xl font-bold mb-4">Quiz Completed!</h3>
        <p className="text-xl mb-6">Your score: <span className="text-orange-600 font-bold">{score} / {questions.length}</span></p>
        <button onClick={handleRestart} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-lg shadow-orange-500/20">
            Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 h-full flex flex-col justify-between bg-transparent text-slate-800 rounded-b-lg">
      <div>
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm text-slate-500">
                <span>Progress</span>
                <span>Question {currentQuestion + 1}/{questions.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>
        <h3 className="text-xl font-semibold mb-6 text-balance">{questions[currentQuestion]?.question}</h3>
        <div className="space-y-3">
          {questions[currentQuestion]?.options?.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedAnswer(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${selectedAnswer === option ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 hover:border-orange-400'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <button 
        onClick={handleNext} 
        disabled={!selectedAnswer} 
        className="w-full mt-6 btn-primary disabled:bg-slate-300 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
      >
        {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
      </button>
    </div>
  );
}

