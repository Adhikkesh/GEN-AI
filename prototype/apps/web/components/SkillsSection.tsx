'use client';

interface Props {
  userInfo: {
    skills: string;
    [key: string]: any;
  } | null;
  quizScore: number;
}

const skillPlatforms = {
    'JavaScript': ['freeCodeCamp', 'Codecademy', 'Udemy'],
    'React': ['Official React Docs', 'Scrimba', 'Udemy'],
    'Python': ['Coursera', 'DataCamp', 'Udemy'],
    'Node.js': ['Official Node.js Docs', 'Udemy', 'Pluralsight'],
    'Java': ['Coursera', 'Udemy', 'Oracle University'],
    'default': ['Udemy', 'Coursera', 'Pluralsight', 'LinkedIn Learning']
};

export default function SkillsSection({ userInfo, quizScore }: Props) {
    const userSkills = userInfo?.skills.split(', ').filter(s => s) || [];

    const getRecommendations = () => {
        if (quizScore < 5) return "Based on your quiz score, we recommend brushing up on your fundamentals. Check out platforms like freeCodeCamp or Codecademy to strengthen your core knowledge.";
        if (userSkills.length === 0) return "You haven't listed any skills yet. Based on your quiz performance, you might enjoy learning a versatile language like Python or JavaScript. Platforms like Coursera or Udemy are great starting points.";
        return "You have a solid foundation. To take your skills to the next level, consider advanced courses on platforms like Pluralsight or specialized tutorials on the official documentation for your chosen technologies.";
    };
    
    const getPlatformLinks = (skill: string) => {
        // @ts-ignore
        const platforms = skillPlatforms[skill] || skillPlatforms['default'];
        return platforms.map((p: string) => <a key={p} href={`https://www.${p.toLowerCase().replace(/\s+/g, '')}.com`} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-500 font-medium underline mr-4">{p}</a>);
    }

    return (
        <div className="p-2 sm:p-6 h-full bg-transparent text-slate-800 rounded-b-lg space-y-6">
            <h3 className="text-2xl font-bold">Your Skills Dashboard</h3>
            
            <div className="card p-4 border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold mb-3">Current Skills</h4>
                {userSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {userSkills.map(skill => <span key={skill} className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">{skill}</span>)}
                    </div>
                ) : ( <p className="text-slate-500">No skills listed yet. Add some in your profile!</p> )}
            </div>

            <div className="card p-4 border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold mb-2">Quiz Performance</h4>
                <p className="text-lg">Your Score: <span className="font-bold text-orange-600">{quizScore} / 10</span></p>
            </div>

            <div className="card p-4 border-l-4 border-orange-500">
                <h4 className="text-xl font-semibold mb-2">Recommendations</h4>
                <p className="text-slate-600 text-balance mb-4">{getRecommendations()}</p>
                <div>
                    <h5 className="font-semibold mb-2 text-slate-700">Suggested Learning Platforms:</h5>
                    {getPlatformLinks(userSkills[0] || 'default')}
                </div>
            </div>
        </div>
    );
}

