'use client';

import { useState } from 'react';
import UserInfoForm from '../components/UserInfoForm';
import QuizSection from '../components/QuizSection';
import SkillsSection from '../components/SkillsSection';
import JobsSection from '../components/JobsSection';
import { RecommendedPath, Job } from '../types/api';

interface UserInfo {
  firstName: string;
  lastName: string;
  userType: 'student' | 'employee';
  skills: string[];
  interests: string[];
  qualification?: string;
  degree?: string;
  course?: string;
  college?: string;
  year?: string;
  experience?: string;
  jobRole?: string;
  company?: string;
}

export default function Home() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [recommendedPath, setRecommendedPath] = useState<RecommendedPath | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const handleUserSubmit = (info: UserInfo) => {
    setUserInfo(info);
  };

  const handleQuizComplete = (path: RecommendedPath, jobPostings: Job[]) => {
    setRecommendedPath(path);
    setJobs(jobPostings);
    setQuizCompleted(true);
    setActiveSection(1); // Move to skills section after quiz
  };
  
  const sections = [
    {
      id: 'quiz',
      label: 'Quiz',
      component: userInfo ? (
        <QuizSection 
          interests={userInfo.interests} 
          onQuizComplete={handleQuizComplete} 
        />
      ) : null,
      disabled: false
    },
    {
      id: 'skills',
      label: 'Career Path',
      component: (
        <SkillsSection 
          userInfo={userInfo} 
          recommendedPath={recommendedPath}
        />
      ),
      disabled: !quizCompleted
    },
    {
      id: 'jobs',
      label: 'Jobs',
      component: (
        <JobsSection 
          userInfo={userInfo} 
          jobs={jobs}
        />
      ),
      disabled: !quizCompleted
    },
  ];

  if (!userInfo) {
    return <UserInfoForm onSubmit={handleUserSubmit} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            Welcome, {userInfo.firstName}!
          </h1>
          <p className="text-lg text-gray-600">
            Let's discover your perfect career path
          </p>
          {/* {userInfo.interests.length > 0 && (
            <div className="mt-2 flex justify-center flex-wrap gap-2">
              {userInfo.interests.map((interest, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {interest}
                </span>
              ))}
            </div>
          )} */}
        </div>

        <div className="w-full max-w-6xl mx-auto">
            <div className="flex justify-center mb-6 border-b bg-white rounded-t-lg shadow-sm">
                {sections.map((section, index) => (
                  <button 
                    key={section.id}
                    onClick={() => !section.disabled && setActiveSection(index)} 
                    disabled={section.disabled}
                    className={`px-6 py-4 text-lg font-medium transition-all duration-200 relative ${
                      activeSection === index 
                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' 
                        : section.disabled 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    {section.label}
                    {section.disabled && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 rounded-full"></div>
                    )}
                    {activeSection === index && (
                      <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-orange-600 rounded-full"></div>
                    )}
                  </button>
                ))}
            </div>
            
            <div className="bg-white rounded-b-lg shadow-lg overflow-hidden">
              <div className="relative h-[600px]">
                   {sections.map((section, index) => (
                      <div 
                        key={section.id} 
                        className={`absolute w-full h-full transition-all duration-500 ease-in-out transform ${
                          activeSection === index 
                            ? 'translate-x-0 opacity-100' 
                            : index < activeSection 
                              ? '-translate-x-full opacity-0' 
                              : 'translate-x-full opacity-0'
                        }`}
                      >
                          {section.component}
                      </div>
                  ))}
              </div>
            </div>

            {quizCompleted && recommendedPath && (
              <div className="mt-6 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <span className="text-xl">✅</span>
                    <span className="font-medium">
                      Career path discovered: {recommendedPath.recommendedCareer}
                    </span>
                  </div>
                  {jobs.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {jobs.length} relevant job opportunities found
                    </p>
                  )}
                </div>
              </div>
            )}
        </div>
    </div>
  );
}

