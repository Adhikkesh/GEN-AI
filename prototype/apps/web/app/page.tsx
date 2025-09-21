'use client';

import { useState } from 'react';
import UserInfoForm from '../components/UserInfoForm';
import QuizSection from '../components/QuizSection';
import SkillsSection from '../components/SkillsSection';
import JobsSection from '../components/JobsSection';

interface UserInfo {
  firstName: string;
  lastName: string;
  qualification: string;
  skills: string;
}

export default function Home() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  const handleUserSubmit = (info: UserInfo) => {
    setUserInfo(info);
  };

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setQuizCompleted(true);
    setActiveSection(1); // Move to skills section after quiz
  };
  
  const sections = [
    <QuizSection onQuizComplete={handleQuizComplete} />,
    <SkillsSection userInfo={userInfo} quizScore={quizScore} />,
    <JobsSection userInfo={userInfo} />,
  ];

  if (!userInfo) {
    return <UserInfoForm onSubmit={handleUserSubmit} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome, {userInfo.firstName}!</h1>
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-center mb-4 border-b">
                <button onClick={() => setActiveSection(0)} className={`px-4 py-2 text-lg font-medium ${activeSection === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Quiz</button>
                <button onClick={() => setActiveSection(1)} disabled={!quizCompleted} className={`px-4 py-2 text-lg font-medium ${activeSection === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'} ${!quizCompleted ? 'cursor-not-allowed' : ''}`}>Skills</button>
                <button onClick={() => setActiveSection(2)} disabled={!quizCompleted} className={`px-4 py-2 text-lg font-medium ${activeSection === 2 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'} ${!quizCompleted ? 'cursor-not-allowed' : ''}`}>Jobs</button>
            </div>
            <div className="overflow-hidden relative h-[500px]">
                 {sections.map((section, index) => (
                    <div key={index} className={`absolute w-full h-full transition-transform duration-500 ease-in-out ${activeSection === index ? 'translate-x-0' : (index < activeSection ? '-translate-x-full' : 'translate-x-full')}`}>
                        {section}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

