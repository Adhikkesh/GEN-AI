export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "Which type of tasks energize you the most?",
    options: [
      { id: "A", text: "Solving complex analytical problems" },
      { id: "B", text: "Creating and designing new things" },
      { id: "C", text: "Leading teams and managing projects" },
      { id: "D", text: "Helping and supporting others" }
    ]
  },
  {
    id: "q2",
    text: "In your free time, you prefer to:",
    options: [
      { id: "A", text: "Read technical articles or research papers" },
      { id: "B", text: "Work on creative projects or hobbies" },
      { id: "C", text: "Network and attend professional events" },
      { id: "D", text: "Volunteer or participate in community service" }
    ]
  },
  {
    id: "q3",
    text: "When working on a project, you tend to focus on:",
    options: [
      { id: "A", text: "Data analysis and finding patterns" },
      { id: "B", text: "User experience and visual design" },
      { id: "C", text: "Strategy and business outcomes" },
      { id: "D", text: "Team collaboration and communication" }
    ]
  },
  {
    id: "q4",
    text: "Which work environment appeals to you most?",
    options: [
      { id: "A", text: "Research labs or tech companies" },
      { id: "B", text: "Design studios or creative agencies" },
      { id: "C", text: "Corporate offices or consulting firms" },
      { id: "D", text: "Non-profits or educational institutions" }
    ]
  },
  {
    id: "q5",
    text: "Your ideal project would involve:",
    options: [
      { id: "A", text: "Building algorithms or data models" },
      { id: "B", text: "Designing user interfaces or experiences" },
      { id: "C", text: "Planning business strategies" },
      { id: "D", text: "Training or mentoring others" }
    ]
  },
  {
    id: "q6",
    text: "Which skill would you most like to develop?",
    options: [
      { id: "A", text: "Machine learning and AI" },
      { id: "B", text: "Digital design and creativity" },
      { id: "C", text: "Leadership and management" },
      { id: "D", text: "Communication and interpersonal skills" }
    ]
  },
  {
    id: "q7",
    text: "When facing a challenge, you first:",
    options: [
      { id: "A", text: "Research and analyze the problem thoroughly" },
      { id: "B", text: "Brainstorm creative solutions" },
      { id: "C", text: "Create a strategic action plan" },
      { id: "D", text: "Seek input from others and collaborate" }
    ]
  },
  {
    id: "q8",
    text: "Your motivation comes from:",
    options: [
      { id: "A", text: "Discovering new knowledge and insights" },
      { id: "B", text: "Creating something unique and innovative" },
      { id: "C", text: "Achieving business goals and success" },
      { id: "D", text: "Making a positive impact on people's lives" }
    ]
  },
  {
    id: "q9",
    text: "In a team setting, you naturally:",
    options: [
      { id: "A", text: "Become the technical expert and problem solver" },
      { id: "B", text: "Generate ideas and think outside the box" },
      { id: "C", text: "Take charge and coordinate activities" },
      { id: "D", text: "Facilitate communication and support team members" }
    ]
  },
  {
    id: "q10",
    text: "Which technology trend excites you most?",
    options: [
      { id: "A", text: "Artificial Intelligence and Data Science" },
      { id: "B", text: "Virtual Reality and Interactive Media" },
      { id: "C", text: "Fintech and Digital Transformation" },
      { id: "D", text: "EdTech and Social Impact Technology" }
    ]
  }
];

export const ANSWER_TO_INTERESTS_MAP: Record<string, string[]> = {
  'A': ['analytical', 'technical', 'problem-solving', 'research-oriented', 'data-driven'],
  'B': ['creative', 'innovative', 'design-focused', 'artistic', 'user-experience'],
  'C': ['leadership', 'strategic', 'business-oriented', 'management', 'goal-driven'],
  'D': ['collaborative', 'people-focused', 'communication', 'social-impact', 'mentoring']
}; 