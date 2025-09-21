import express from 'express';
import cors from 'cors';
import { getQuizController, analyzeQuizController } from './controllers/quiz.controller';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SKAR AI Advisor API is running' });
});


app.get('/api/quiz', getQuizController);    
app.post('/api/analyze', analyzeQuizController); 
app.post('/api/generate-roadmap', analyzeQuizController);

app.listen(port, () => {
  console.log(`SKAR AI Advisor API is running at http://localhost:${port}`);
  console.log(`Quiz endpoint: GET http://localhost:${port}/api/quiz`);
  console.log(`Analysis endpoint: POST http://localhost:${port}/api/analyze`);
});