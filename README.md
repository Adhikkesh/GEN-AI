# Gen-AI Career Guidance Platform

## Overview
A sophisticated career guidance platform that leverages AI to help students and young professionals navigate their career paths. The platform provides personalized career recommendations, skill assessments, and learning roadmaps using advanced AI technologies.

## Live Demo
- Frontend: [Gen-AI Career Platform](https://gen-ai-two-ochre.vercel.app/)
- Backend API: [Gen-AI Quiz API](https://genai-quiz-api-222073691466.us-central1.run.app)
- Repository: [GitHub Repo](https://github.com/Adhikkesh/GEN-AI)
- Demo Video: [Coming Soon]

## Team ZeroDay
- **Leader**: Darshan R
- **Members**:
  - Adhikkesh S K
  - Varun S
  - Kavin Karthic M
  - Aswath Siddharth

## Problem Statement
The modern job market presents a complex maze for students and young professionals. Many struggle to:
- Identify career paths aligned with their skills
- Understand their skill gaps
- Prepare for evolving job market demands
- Create clear roadmaps for career progression

## Technical Architecture

### Frontend (Next.js)
- Built with Next.js 13+ for optimal performance and SEO
- Tailwind CSS for responsive design
- TypeScript for type safety
- Component-based architecture in `/apps/web`
- Key sections:
  - Quiz Module
  - Skills Assessment
  - Job Recommendations
  - User Profile Management

### Backend (Node.js/TypeScript)
- RESTful API built with Express.js
- TypeScript for robust type checking
- Modular architecture in `/apps/api`
- Key features:
  - Quiz management
  - User profile handling
  - AI service integration
  - Job matching algorithms

### AI & Machine Learning
- **Vertex AI Integration**: 
  - Powers intelligent career recommendations
  - Natural language processing for skill analysis
  
- **RAG (Retrieval Augmented Generation)**:
  - Vector database for efficient knowledge retrieval
  - Enhanced context-aware responses
  - Located in `/vector-db-initialize`

### Cloud Infrastructure
- **Google Cloud Run**:
  - Containerized deployment
  - Auto-scaling capabilities
  - Cost-effective serverless architecture

- **Firebase/Firestore**:
  - User data management
  - Real-time updates
  - Secure authentication
  - Configuration in `/apps/api/src/config/firebase.ts`

## Knowledge Base
Comprehensive career information stored in `/knowledge_base/` covering:
- AI/Machine Learning
- Blockchain
- Cloud/DevOps
- Cybersecurity
- Data Science
- Full Stack Development
- Product Management
- UI/UX Design
- Robotics

## Project Structure
```bash
prototype/
├── apps/
│   ├── api/         # Backend services
│   └── web/         # Frontend application
├── packages/
│   ├── eslint-config/    # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/              # Shared UI components
└── knowledge_base/      # Career path information
```

## Getting Started

### Prerequisites
- Node.js 16+
- pnpm
- Python 3.8+ (for Vector DB)

### Installation
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Features
1. **Personalized Career Assessment**
   - AI-powered skill evaluation
   - Career path recommendations
   - Skill gap analysis

2. **Interactive Learning Roadmap**
   - Customized learning paths
   - Progress tracking
   - Resource recommendations

3. **Job Market Intelligence**
   - Real-time job market trends
   - Skill demand analysis
   - Industry insights

4. **AI-Powered Guidance**
   - Contextual career advice
   - Personalized recommendations
   - Continuous learning suggestions

## Technology Stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- AI: Google Vertex AI, RAG
- Database: Firestore
- Cloud: Google Cloud Run
- Vector Database: (Implementation in Python)
- Development Tools: Turbo Repo, pnpm workspaces

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details