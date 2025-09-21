'use client';

import { RecommendedPath } from '../types/api';

interface Props {
  userInfo: {
    skills: string[];
    interests: string[];
    firstName: string;
    [key: string]: any;
  } | null;
  recommendedPath: RecommendedPath | null;
}

export default function SkillsSection({ userInfo, recommendedPath }: Props) {
    if (!recommendedPath) {
        return (
            <div className="p-2 sm:p-6 h-full bg-transparent text-slate-800 rounded-b-lg flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">Complete the Quiz First</h3>
                    <p className="text-slate-500">Take the quiz to get your personalized career recommendations!</p>
                </div>
            </div>
        );
    }

    const { skillGapAnalysis, careerRoadmap } = recommendedPath;

    return (
        <div className="p-2 sm:p-6 h-full bg-transparent text-slate-800 rounded-b-lg space-y-6 overflow-y-auto">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-orange-600">{recommendedPath.recommendedCareer}</h3>
                <p className="text-slate-600 mt-2">Your Personalized Career Path</p>
            </div>
            
            <div className="card p-4 border-l-4 border-blue-500">
                <h4 className="text-xl font-semibold mb-3">Career Overview</h4>
                <p className="text-slate-600 text-balance leading-relaxed">{recommendedPath.careerOverview}</p>
            </div>

            <div className="card p-4 border-l-4 border-green-500">
                <h4 className="text-xl font-semibold mb-3">Your Current Strengths</h4>
                {skillGapAnalysis.userCurrentStrengths.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {skillGapAnalysis.userCurrentStrengths.map((strength, index) => (
                            <span key={index} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {strength}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">Building your strengths...</p>
                )}
            </div>

            <div className="card p-4 border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold mb-3">Technical Skills to Develop</h4>
                {skillGapAnalysis.requiredTechnicalSkills.length > 0 ? (
                    <div className="space-y-2">
                        {skillGapAnalysis.requiredTechnicalSkills.map((skill, index) => (
                            <div key={index} className="flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                <span className="text-slate-700">{skill}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">No specific technical skills identified.</p>
                )}
            </div>

            <div className="card p-4 border-l-4 border-purple-500">
                <h4 className="text-xl font-semibold mb-3">Soft Skills to Develop</h4>
                {skillGapAnalysis.requiredSoftSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {skillGapAnalysis.requiredSoftSkills.map((skill, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">No specific soft skills identified.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-emerald-500">
                    <h5 className="font-semibold text-emerald-700 mb-2">Entry Level</h5>
                    <h6 className="font-medium text-sm mb-2">{careerRoadmap.entryLevel.title}</h6>
                    <p className="text-xs text-slate-600 mb-2">{careerRoadmap.entryLevel.description}</p>
                    <div className="text-xs">
                        <strong>Skills to acquire:</strong>
                        <ul className="list-disc list-inside mt-1 text-slate-600">
                            {careerRoadmap.entryLevel.skillsToAcquire.map((skill, index) => (
                                <li key={index}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="card p-4 border-l-4 border-yellow-500">
                    <h5 className="font-semibold text-yellow-700 mb-2">Mid Level</h5>
                    <h6 className="font-medium text-sm mb-2">{careerRoadmap.midLevel.title}</h6>
                    <p className="text-xs text-slate-600 mb-2">{careerRoadmap.midLevel.description}</p>
                    <div className="text-xs">
                        <strong>Skills to acquire:</strong>
                        <ul className="list-disc list-inside mt-1 text-slate-600">
                            {careerRoadmap.midLevel.skillsToAcquire.map((skill, index) => (
                                <li key={index}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="card p-4 border-l-4 border-red-500">
                    <h5 className="font-semibold text-red-700 mb-2">Senior Level</h5>
                    <h6 className="font-medium text-sm mb-2">{careerRoadmap.seniorLevel.title}</h6>
                    <p className="text-xs text-slate-600 mb-2">{careerRoadmap.seniorLevel.description}</p>
                    <div className="text-xs">
                        <strong>Skills to acquire:</strong>
                        <ul className="list-disc list-inside mt-1 text-slate-600">
                            {careerRoadmap.seniorLevel.skillsToAcquire.map((skill, index) => (
                                <li key={index}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

