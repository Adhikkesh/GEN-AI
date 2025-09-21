export interface CareerAnalysis {
    recommendedCareer: string;
    careerOverview: string;
    skillGapAnalysis: {
      requiredTechnicalSkills: string[];
      requiredSoftSkills: string[];
      userCurrentStrengths: string[]; 
    };
    careerRoadmap: {
      entryLevel: {
        title: string;
        description: string;
        skillsToAcquire: string[];
      };
      midLevel: {
        title: string;
        description: string;
        skillsToAcquire: string[];
      };
      seniorLevel: {
        title: string;
        description: string;
        skillsToAcquire: string[];
      };
    };
    learningResources: {
      courses: string[];
      certifications: string[];
      booksOrArticles: string[];
    };
  }