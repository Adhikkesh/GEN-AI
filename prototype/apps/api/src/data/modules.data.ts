export const modules = {
  tech: ['programming', 'ai', 'robotics', 'software', 'data', 'cloud', 'cse'],
  creative: ['design', 'art', 'media', 'ui', 'ux', 'writing', 'video'],
  business: ['finance', 'management', 'marketing', 'analytics', 'economics']
};

export function findBestMatchingModule(userInterests: string[]): string {
  let bestMatch = '';
  let highestScore = 0;

  const normalizedInterests = userInterests.map(interest => interest.toLowerCase());
  
  for (const [moduleName, keywords] of Object.entries(modules)) {
    let score = 0;
    
    for (const interest of normalizedInterests) {
      if (keywords.includes(interest)) {
        score += 2;
        continue;
      }
      
      for (const keyword of keywords) {
        if (interest.includes(keyword) || keyword.includes(interest)) {
          score += 1;
          break;
        }
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = moduleName;
    }
  }
  
  return bestMatch || 'tech';
} 