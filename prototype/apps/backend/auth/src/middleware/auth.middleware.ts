import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase'; // Import your admin auth instance
import type { DecodedIdToken } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken'; // Add this import for decoding custom token payloads

// Extend the Express Request type to include our user property
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

/**
 * Verifies the Firebase ID Token OR Custom Token from the Authorization header.
 * - Prefers ID token verification (standard for client auth).
 * - Falls back to custom token verification via session cookie creation (for server-generated custom tokens).
 * If valid, attaches the decoded token to `req.user`.
 * 
 * Note: Add "jsonwebtoken": "^9.0.2" to dependencies and "@types/jsonwebtoken": "^9.0.7" to devDependencies.
 */
export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).send({ error: 'Unauthorized: No token provided' });
  }

  try {
    // First, try to verify as ID token (standard client flow)
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (idTokenError) {
    // If ID token fails, try as custom token (server-generated)
    try {
      // Verify custom token by attempting to create a session cookie (throws if invalid)
      // This uses Firebase SDK to check signature/claims without returning the cookie
      await auth.createSessionCookie(token, { expiresIn: 5 * 60 * 1000 }); // 5 minutes in milliseconds

      // If verification succeeds, safely decode the payload for UID (custom tokens have uid claim)
      const payload = jwt.decode(token) as any;
      if (!payload || typeof payload.uid !== 'string') {
        throw new Error('Invalid custom token: No UID found');
      }

      // Mock a DecodedIdToken with essential fields (add more from payload if needed, e.g., email)
      const mockDecoded: DecodedIdToken = {
        uid: payload.uid,
        email: payload.email || null,
        // Add other fields like iss, sub, iat, etc., if required by your controllers
        iss: payload.iss,
        sub: payload.sub,
        iat: payload.iat,
        exp: payload.exp,
        aud: payload.aud,
        auth_time: typeof payload.iat === 'number' ? payload.iat : Math.floor(Date.now() / 1000),
        firebase: payload.firebase || {
          identities: {},
          sign_in_provider: 'custom'
        },
        // ... extend as needed
      };

      req.user = mockDecoded;
      return next();
    } catch (customTokenError) {
      console.error('Error verifying token (ID or Custom):', customTokenError);
      return res.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
  }
};