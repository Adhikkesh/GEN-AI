'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (info: any) => void;
}

const predefinedSkills = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
  'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure',
  'Git', 'CI/CD', 'Jest', 'Cypress'
];

export default function UserInfoForm({ onSubmit }: Props) {
  const [userType, setUserType] = useState<'student' | 'employee'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [degree, setDegree] = useState('');
  const [course, setCourse] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('');
  const [experience, setExperience] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) setSkills([...skills, skill]);
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => setSkills(skills.filter(skill => skill !== skillToRemove));
  
  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
    setShowSkillSuggestions(true);
  }

  const filteredSkills = predefinedSkills.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = { firstName, lastName, skills: skills.join(', ') };
    const userData = userType === 'student'
      ? { ...commonData, userType, degree, course, college, year, qualification: `${degree} in ${course}, ${year}` }
      : { ...commonData, userType, experience, jobRole, company, qualification: `${experience} years as ${jobRole}` };
    onSubmit(userData);
  };
  
  const getYearsForDegree = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    const yearCount = (degree.toLowerCase().includes('master') || degree.toLowerCase().includes('mtech')) ? 2 : 4;
    for (let i = 0; i <= yearCount + 2; i++) years.push(currentYear + i);
    return years;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="card p-8 w-full max-w-lg transition-all duration-300 animate-fade-in-up">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Let's Get Started</h2>
            <p className="text-slate-500 mt-2">Create your career profile.</p>
        </div>
        
        <div className="flex justify-center bg-slate-100 rounded-lg p-1 mb-8">
          <button onClick={() => setUserType('student')} className={`w-1/2 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${userType === 'student' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-600 hover:text-slate-800'}`}>
            Student
          </button>
          <button onClick={() => setUserType('employee')} className={`w-1/2 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${userType === 'employee' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-600 hover:text-slate-800'}`}>
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="form-input" />
            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="form-input" />
          </div>

          <div className="transition-all duration-500 ease-in-out">
              {userType === 'student' ? (
                <div className="space-y-4 animate-fade-in">
                  <input type="text" placeholder="Degree (e.g., B.Tech)" value={degree} onChange={e => setDegree(e.target.value)} required className="form-input" />
                  <input type="text" placeholder="Course (e.g., Computer Science)" value={course} onChange={e => setCourse(e.target.value)} required className="form-input" />
                  <input type="text" placeholder="College/University" value={college} onChange={e => setCollege(e.target.value)} required className="form-input" />
                  <select value={year} onChange={e => setYear(e.target.value)} required className="form-input appearance-none">
                      <option value="" disabled>Graduation Year</option>
                      {getYearsForDegree().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <input type="number" placeholder="Years of Experience" value={experience} onChange={e => setExperience(e.target.value)} required className="form-input" />
                  <input type="text" placeholder="Job Role" value={jobRole} onChange={e => setJobRole(e.target.value)} required className="form-input" />
                  <input type="text" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} required className="form-input" />
                </div>
              )}
          </div>

          <div className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-slate-100">
                  {skills.map(skill => (
                      <div key={skill} className="flex items-center bg-orange-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                          <span>{skill}</span>
                          <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 text-orange-200 hover:text-white">&times;</button>
                      </div>
                  ))}
                  <input type="text" value={skillInput} onChange={handleSkillInputChange} onFocus={() => setShowSkillSuggestions(true)} onKeyDown={(e) => e.key === 'Enter' && skillInput && (e.preventDefault(), handleAddSkill(skillInput))} placeholder="Type a skill..." className="flex-grow bg-transparent text-slate-800 focus:outline-none p-1" />
              </div>
              {showSkillSuggestions && filteredSkills.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {filteredSkills.map(skill => (<li key={skill} onClick={() => handleAddSkill(skill)} className="px-4 py-2 text-slate-700 cursor-pointer hover:bg-slate-100">{skill}</li>))}
                  </ul>
              )}
          </div>

          <button type="submit" className="btn-primary">
            Build My Path
          </button>
        </form>
      </div>
       <style jsx>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
            .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        `}</style>
    </div>
  );
}

