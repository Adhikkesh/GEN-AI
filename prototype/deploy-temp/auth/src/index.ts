import express, { Express } from 'express';
import cors from 'cors';
import './firebase';  // Side-effect import for init (already fixed)
import { authRouter } from './routes/auth.routes';

const app: Express = express();

// --- Middleware ---
app.use(cors({ origin: true }));
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRouter);
app.get('/', (req, res) => {  // Health check
  res.status(200).send('Auth Service is running!');
});

// --- EXPORT FOR CLOUD FUNCTIONS GEN 2 ---
// Handler function: Framework calls this per request
export const authService = async (req: any, res: any) => {
  app(req, res);  // Manually invoke Express
};

// --- NO app.listen() HERE ---
// The Functions Framework handles port binding and request routing
// Add error handling if needed:
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  process.exit(1);
});