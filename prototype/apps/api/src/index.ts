import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { getDb } from './config/firebase'; // Import the new initializer
import { startQuizController, nextQuestionController } from './controllers/quiz-module.controller';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const startServer = async () => {
  try {
    await getDb();

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
      console.log(`SKAR AI Advisor API is listening on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); 
  }
};

startServer();