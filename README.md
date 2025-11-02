# SKAR AI Advisor - Career Guidance Platform

## Overview
SKAR AI Advisor is a sophisticated career guidance platform that leverages artificial intelligence to help students and young professionals navigate their career paths. The platform provides personalized career recommendations, intelligent skill assessments, and comprehensive learning roadmaps using advanced AI technologies.

## Live Demo
- **Frontend (Vercel)**: [SKAR AI Career Platform](https://gen-ai-blush.vercel.app/)
- **Backend API (Cloud Run)**: [SKAR AI Advisor API](https://genai-quiz-api-222073691466.us-central1.run.app/health)
- **Repository**: [GitHub Repo](https://github.com/Adhikkesh/GEN-AI)
- **Demo Video**: [Demo Video](https://drive.google.com/file/d/14t9x5uX0mVXkzwBSFvqwi-CYp5RsA2Rp/view?usp=sharing)

## Team ZeroDay
- **Leader**: Darshan R
- **Members**:
  - Adhikkesh S K
  - Varun S
  - Kavin Karthic M
  - Aswath Siddharth

## Problem Statement
The modern job market presents a complex maze for students and young professionals. Many struggle to:
- Identify career paths aligned with their skills and interests
- Understand their current skill gaps and development needs
- Prepare effectively for evolving job market demands
- Create clear, actionable roadmaps for career progression
- Access personalized guidance at scale

## API Endpoints

### Health Check
```
GET /health
```
**Response:**
```json
{
    "status": "OK",
    "message": "SKAR AI Advisor API is running"
}
```

### Start Career Assessment Quiz
```
POST /api/quiz/start
```
**Request Body:**
```json
{
    "interests": ["software development", "ai", "machine learning"]
}
```

**Response:**
```json
{
    "quizSessionId": "8f0f38bd-6bc9-4283-a668-0cf5d4dfee7b",
    "question": {
        "id": "q1",
        "text": "Which area interests you most?",
        "options": [
            {
                "id": "A",
                "text": "Creating intelligent systems that learn and adapt"
            },
            {
                "id": "B", 
                "text": "Building the technology that powers websites and apps"
            },
            {
                "id": "C",
                "text": "Working with numbers and data to find insights"
            }
        ],
        "next_question": {
            "A": "q2", "B": "q2", "C": "q2"
        },
        "interest_tags": {
            "A": ["ai", "machine learning"],
            "B": ["full-stack", "software development"],
            "C": ["data analysis", "business intelligence"]
        }
    },
    "jobPostings": []
}
```

### Submit Quiz Answer & Get Next Question
```
POST /api/quiz/next
```
**Request Body:**
```json
{
    "quizSessionId": "540794fd-80ac-4dbe-b00e-138e707adc96",
    "questionId": "q10",
    "answerId": "B"
}
```

**Final Response (Quiz Complete):**
```json
{
    "quizSessionId": "540794fd-80ac-4dbe-b00e-138e707adc96",
    "isComplete": true,
    "recommendedPath": {
        "recommendedCareer": "AI/Machine Learning Engineer",
        "careerOverview": "An AI/Machine Learning Engineer builds systems that can learn from data and make autonomous decisions...",
        "skillGapAnalysis": {
            "requiredTechnicalSkills": [...],
            "requiredSoftSkills": [...],
            "userCurrentStrengths": [...]
        },
        "careerRoadmap": {
            "entryLevel": {...},
            "midLevel": {...}, 
            "seniorLevel": {...}
        },
        "learningResources": {...}
    },
    "jobPostings": []
}
```

## Technical Architecture

### Frontend (Next.js)
- Built with Next.js 13+ for optimal performance and SEO
- Tailwind CSS for responsive, modern design
- TypeScript for enhanced type safety and developer experience
- Component-based architecture in `/apps/web`
- Key features:
  - Interactive Quiz Module
  - Skills Assessment Dashboard
  - Personalized Job Recommendations
  - User Profile Management
  - Career Roadmap Visualization

### Backend (Node.js/TypeScript)
- RESTful API built with Express.js
- TypeScript for robust type checking and maintainability
- Modular architecture in `/apps/api`
- Core services:
  - Quiz session management
  - User profile handling
  - AI service integration
  - Career matching algorithms
  - Real-time recommendations

### AI & Machine Learning Stack
- **Vertex AI Integration**: 
  - Powers intelligent career recommendations
  - Natural language processing for skill analysis
  - Advanced matching algorithms
  
- **RAG (Retrieval Augmented Generation)**:
  - Vector database for efficient knowledge retrieval
  - Enhanced context-aware responses
  - Intelligent content generation
  - Located in `/vector-db-initialize`

### Cloud Infrastructure
- **Google Cloud Run**:
  - Containerized deployment for scalability
  - Auto-scaling capabilities
  - Cost-effective serverless architecture
  - High availability and performance

- **Firebase/Firestore**:
  - Secure user data management
  - Real-time updates and synchronization
  - Authentication and authorization
  - Configuration in `/apps/api/src/config/firebase.ts`

## Architecture Diagram
<img width="1096" height="793" alt="SKAR AI Architecture" src="https://github.com/user-attachments/assets/22f870be-e2e2-4454-b302-6dcf805e55c9" />

## Comprehensive Knowledge Base
Our extensive career information database covers:
- **AI/Machine Learning** - Algorithms, models, deployment
- **Blockchain** - Smart contracts, DeFi, Web3
- **Cloud/DevOps** - Infrastructure, automation, monitoring
- **Cybersecurity** - Threat analysis, security architecture
- **Data Science** - Analytics, visualization, big data
- **Full Stack Development** - Frontend, backend, databases
- **Product Management** - Strategy, roadmaps, user experience
- **UI/UX Design** - User research, prototyping, design systems
- **Robotics** - Automation, control systems, sensors

## Project Structure
```bash
skar-ai-advisor/
├── apps/
│   ├── api/                 # Backend services & API endpoints
│   │   ├── src/
│   │   │   ├── controllers/ # Quiz & recommendation logic
│   │   │   ├── config/      # Firebase & AI configurations
│   │   │   └── services/    # Core business logic
│   │   └── package.json
│   └── web/                 # Frontend Next.js application
│       ├── components/      # Reusable UI components
│       ├── pages/          # Route components
│       └── styles/         # Tailwind configurations
├── packages/
│   ├── eslint-config/       # Shared linting rules
│   ├── typescript-config/   # Shared TypeScript settings
│   └── ui/                  # Shared component library
├── knowledge_base/          # Career path information & data
├── vector-db-initialize/    # RAG setup & vector database
└── prototype/              # Development prototypes
```

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm package manager
- Python 3.8+ (for Vector DB initialization)
- Google Cloud account (for API services)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Adhikkesh/GEN-AI.git
cd GEN-AI

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development servers
pnpm dev

# Initialize vector database (optional)
cd vector-db-initialize
python setup.py
```

### Environment Variables
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Google Cloud
GOOGLE_CLOUD_PROJECT=your_gcp_project
VERTEX_AI_LOCATION=us-central1

# API Configuration
API_BASE_URL=https://genai-quiz-api-222073691466.us-central1.run.app
PORT=8080
```

## Key Features

### 1. **Intelligent Career Assessment**
- AI-powered skill evaluation using advanced algorithms
- Personalized career path recommendations
- Comprehensive skill gap analysis
- Interest-based matching system

### 2. **Interactive Learning Roadmap**
- Customized learning paths for each career
- Progress tracking and milestone management
- Curated resource recommendations
- Industry-specific skill development

### 3. **Real-time Job Market Intelligence**
- Live job market trends analysis
- Skill demand forecasting
- Industry growth insights
- Salary benchmarking

### 4. **AI-Powered Guidance**
- Contextual career advice using RAG
- Personalized recommendations engine
- Continuous learning path optimization
- Smart content curation

## Technology Stack
- **Frontend**: Next.js 13+, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **AI/ML**: Google Vertex AI, RAG, Vector Database
- **Database**: Google Firestore
- **Cloud**: Google Cloud Run, Firebase
- **Development**: Turbo Repo, pnpm workspaces
- **Tools**: ESLint, Prettier, Husky

## Contributing
We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## API Testing
```bash
# Test health endpoint
curl https://genai-quiz-api-222073691466.us-central1.run.app/health

# Start a quiz session
curl -X POST https://genai-quiz-api-222073691466.us-central1.run.app/api/quiz/start \
  -H "Content-Type: application/json" \
  -d '{"interests": ["software development", "ai", "machine learning"]}'

# Submit quiz answer
curl -X POST https://genai-quiz-api-222073691466.us-central1.run.app/api/quiz/next \
  -H "Content-Type: application/json" \
  -d '{"quizSessionId": "your_session_id", "questionId": "q1", "answerId": "A"}'
```

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

**SKAR AI Advisor** - Empowering careers through intelligent guidance 
