import express from 'express';
import cors from 'cors';
import { generateRoadmapController } from './controllers/advisor.controller';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// API Route
app.post('/api/generate-roadmap', generateRoadmapController);

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});