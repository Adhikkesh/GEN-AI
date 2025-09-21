import express from 'express';
import cors from 'cors';
import { startQuizController, nextQuestionController } from './controllers/quiz-module.controller';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SKAR AI Advisor API is running' });
});

app.post('/api/quiz/start', startQuizController);
app.post('/api/quiz/next', nextQuestionController);

app.listen(port, () => {
  console.log(`SKAR AI Advisor API is running at http://localhost:${port}`);
});