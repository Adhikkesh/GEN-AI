'use client';

interface Props {
  userInfo: {
    skills: string;
    [key: string]: any;
  } | null;
}

const jobRecommendations: { [key: string]: { title: string; company: string; location: string; link: string; tags: string[]; logo: string }[] } = {
  'javascript': [
    { title: 'Frontend Developer', company: 'PixelPerfect Inc.', location: 'Remote', link: '#', tags: ['UI', 'Web'], logo: '💻' },
    { title: 'Full Stack Engineer', company: 'Innovate Solutions', location: 'Bengaluru', link: '#', tags: ['Full Stack', 'Cloud'], logo: '🚀' },
  ],
  'react': [
    { title: 'React Developer', company: 'Creative Minds Agency', location: 'Pune', link: '#', tags: ['Frontend', 'UI/UX'], logo: '🎨' },
    { title: 'UI Engineer (React)', company: 'WebWeavers', location: 'Remote', link: '#', tags: ['Design', 'Frontend'], logo: '🕸️' },
  ],
  'next.js': [
    { title: 'Next.js Developer', company: 'Vercel', location: 'Remote', link: '#', tags: ['Full Stack', 'Performance'], logo: '▲' },
    { title: 'Senior Frontend Engineer', company: 'Paytm', location: 'Noida', link: '#', tags: ['Fintech', 'React'], logo: '🅿️' },
  ],
  'python': [
    { title: 'Data Scientist', company: 'DataDriven Corp.', location: 'Hyderabad', link: '#', tags: ['ML', 'Analytics'], logo: '📊' },
    { title: 'Backend Developer', company: 'ServerSide Ltd.', location: 'Chennai', link: '#', tags: ['API', 'Backend'], logo: '🐍' },
  ],
  'java': [
      { title: 'Java Software Engineer', company: 'Enterprise Systems', location: 'Mumbai', link: '#', tags: ['Backend', 'Enterprise'], logo: '☕'},
      { title: 'Android Developer', company: 'MobileFirst Apps', location: 'Remote', link: '#', tags: ['Mobile', 'Android'], logo: '🤖'}
  ],
  'default': [
    { title: 'Software Engineer', company: 'Tech Mahindra', location: 'Multiple Locations', link: '#', tags: ['General'], logo: '🧑‍💻' },
    { title: 'Web Developer', company: 'TCS', location: 'Multiple Locations', link: '#', tags: ['Web', 'General'], logo: '🌐' },
  ]
};

export default function JobsSection({ userInfo }: Props) {
  const userSkills = userInfo?.skills.toLowerCase().split(', ').filter(s => s) || [];
  
  const getJobs = () => {
    const jobs = new Map<string, { title: string; company: string; location: string; link: string; tags: string[], logo: string }>();
    userSkills.forEach(skill => {
        const skillKey = skill.replace(/\s+/g, '').toLowerCase();
        // @ts-ignore
        const matchedJobs = jobRecommendations[skillKey] || [];
        matchedJobs.forEach(job => jobs.set(job.title + job.company, job));
    });
    if(jobs.size === 0) {
        jobRecommendations['default']?.forEach(job => jobs.set(job.title + job.company, job));
    }
    return Array.from(jobs.values());
  }

  const recommendedJobs = getJobs();

  return (
    <div className="p-2 sm:p-6 h-full bg-transparent text-slate-800 rounded-b-lg">
      <h3 className="text-2xl font-bold mb-4">Job Recommendations</h3>
      <p className="text-slate-500 mb-6">Based on your skills, here are some roles you might be interested in.</p>
      
      <div className="space-y-4 h-[400px] overflow-y-auto pr-2">
        {recommendedJobs.length > 0 ? recommendedJobs.map((job, index) => (
          <div key={index} className="card p-4 flex items-center gap-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-orange-500/20">
            <div className="text-3xl bg-slate-100 p-3 rounded-lg">{job.logo}</div>
            <div className="flex-grow">
              <h4 className="font-bold text-lg text-slate-800">{job.title}</h4>
              <p className="text-slate-600 text-sm">{job.company} - <span className="text-slate-400">{job.location}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </div>
            <a href={job.link} target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 whitespace-nowrap text-center">
              View
            </a>
          </div>
        )) : (
          <div className="text-center py-10 card">
            <p className="text-slate-500">No specific job recommendations found for your skills yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

