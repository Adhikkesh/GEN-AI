'use client';

import { Job } from '../types/api';

interface Props {
  userInfo: {
    skills: string[];
    interests: string[];
    firstName: string;
    [key: string]: any;
  } | null;
  jobs: Job[];
}

export default function JobsSection({ userInfo, jobs }: Props) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getCompanyLogo = (companyName: string) => {
    // Simple logo mapping - in a real app, you'd use actual company logos
    const logoMap: { [key: string]: string } = {
      'google': '🌐',
      'microsoft': '🔷',
      'amazon': '📦',
      'meta': '👥',
      'apple': '🍎',
      'netflix': '🎬',
      'tesla': '⚡',
      'uber': '🚗',
      'airbnb': '🏠',
      'spotify': '🎵',
    };
    
    const company = companyName.toLowerCase();
    for (const [key, logo] of Object.entries(logoMap)) {
      if (company.includes(key)) return logo;
    }
    
    return '🏢'; // Default office building emoji
  };

  return (
    <div className="p-3 sm:p-6 h-full bg-transparent text-slate-800 rounded-b-lg">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">Job Recommendations</h3>
        <p className="text-sm sm:text-base text-slate-500">
          {jobs.length > 0 
            ? `Found ${jobs.length} relevant opportunities based on your profile.`
            : 'Complete the quiz to get personalized job recommendations.'
          }
        </p>
      </div>
      
      <div className="space-y-3 sm:space-y-4 h-[450px] sm:h-[400px] overflow-y-auto pr-1 sm:pr-2">
        {jobs.length > 0 ? jobs.map((job, index) => (
          <div key={job.jobId || index} className="card p-3 sm:p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-orange-500/20">
            {/* Mobile Layout: Stack vertically */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Logo and Main Info Container */}
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl sm:text-3xl bg-slate-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  {getCompanyLogo(job.companyName)}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-base sm:text-lg text-slate-800 line-clamp-2 sm:line-clamp-1 leading-tight">
                    {job.jobTitle}
                  </h4>
                  <p className="text-slate-600 text-sm mt-1">
                    <span className="font-medium">{job.companyName}</span>
                    <span className="mx-1">•</span>
                    <span className="text-slate-400">{job.location}</span>
                  </p>
                  
                  {/* Meta info - Stack on mobile, inline on desktop */}
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <span className="text-slate-400 mr-1">📅</span>
                      Posted: {formatDate(job.dateCreation)}
                    </span>
                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium text-xs inline-block w-fit">
                      ID: {job.jobId}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Apply Button - Full width on mobile, fixed width on desktop */}
              <div className="flex-shrink-0">
                <a 
                  href={job.jobBoardUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full sm:w-auto bg-orange-500 text-white font-semibold py-2.5 sm:py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 text-center text-sm sm:text-base block sm:inline-block whitespace-nowrap"
                >
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 sm:py-10 card">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎯</div>
            <h4 className="text-lg sm:text-xl font-semibold mb-2">No Jobs Yet</h4>
            <p className="text-slate-500 mb-4 text-sm sm:text-base px-2">
              Complete the quiz to discover job opportunities tailored to your interests and skills.
            </p>
            {userInfo && (
              <div className="text-xs sm:text-sm text-slate-400 space-y-1 px-2">
                <p className="break-words">
                  <span className="font-medium text-slate-500">Interests:</span> {userInfo.interests.join(', ')}
                </p>
                <p className="break-words">
                  <span className="font-medium text-slate-500">Skills:</span> {userInfo.skills.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

