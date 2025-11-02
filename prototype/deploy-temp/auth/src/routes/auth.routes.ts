import { Router } from 'express';
import { signup, getMe } from '../controllers/auth.controller';
import { checkAuth } from '../middleware/auth.middleware';

const router: Router = Router();

// --- Public Routes ---
// POST /api/auth/signup
router.post('/signup', signup);

// --- Protected Routes ---
// GET /api/auth/getme
// The 'checkAuth' middleware runs first. If the token is valid,
// it calls the 'getMe' controller.
router.get('/getme', checkAuth, getMe);

export { router as authRouter };